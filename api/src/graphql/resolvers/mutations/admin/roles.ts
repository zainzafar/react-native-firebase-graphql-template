import type { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { AuthContextUser } from '../../../../services/firebaseAdmin';
import { requirePermission, canManageRoleDelegationMatrix, requireAssignPermission, requireRevokePermission, isRoleWildcardRoleManager, countOtherWildcardRoleManagerRoles, actorHoldsRole, POLICY_REVOKE_PERMISSION_DEFAULT } from '../../../rbac';

type AdminContext = { prisma: PrismaClient; user: AuthContextUser };

export default {
  adminCreateRole: async (
    _parent: unknown,
    args: { input: { name: string; description?: string; permissionIds?: string[] } },
    ctx: AdminContext
  ) => {
    const { prisma, user } = ctx;
    requirePermission(user, 'ADMIN_ROLES_CREATE');

    const nameRaw = args.input.name ?? '';
    const name = nameRaw.trim();
    if (!name) throw new GraphQLError('Role name is required');

    const requestedPermIds = Array.from(new Set(args.input.permissionIds ?? []));

    return prisma.$transaction(async (tx) => {
      // Case-insensitive name check
      const existingRole = await tx.role.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } },
        select: { id: true },
      });
      if (existingRole) throw new GraphQLError('Role with this name already exists');

      // Load permissions (and verify all exist)
      const perms = requestedPermIds.length
        ? await tx.permission.findMany({ 
            where: { id: { in: requestedPermIds } }, 
            select: { id: true, name: true } 
          })
        : [];
      if (perms.length !== requestedPermIds.length) {
        throw new GraphQLError('One or more permissions not found');
      }

      // Validate each requested permission using unified delegation + possession check
      for (const p of perms) {
        await requireAssignPermission(tx, user.id, p.id);
      }

      // Get user's role for the grant rule
      const userRole = await tx.userRole.findFirst({
        where: { userId: user.id },
        select: { roleId: true },
      });

      // Create role and attach permissions
      const role = await tx.role.create({
        data: {
          name,
          description: args.input.description,
          createdByUserId: user.id, // Set the creator as owner
          permissions: perms.length
            ? { createMany: { data: perms.map(p => ({ permissionId: p.id })), skipDuplicates: true } }
            : undefined,
          // Automatically create a grant rule where this new role is the grantee
          // The user's role will be the granter (managing this new role)
          canBeGrantedByRolesRules: userRole ? {
            create: {
              granterRoleId: userRole.roleId, // User's role grants permissions
              scope: 'ROLE',
              canAssign: true,
              canRevoke: true,
              canManage: true,
            }
          } : undefined,
        },
        include: {
          permissions: { include: { permission: true } },
        },
      });

      return role;
    });
  },

  adminUpdateRole: async (
    _parent: unknown,
    args: { id: string; input: { name?: string; description?: string } },
    ctx: AdminContext
  ) => {
    const { prisma, user } = ctx;
    requirePermission(user, 'ADMIN_ROLES_UPDATE');

    const name = args.input.name?.trim();
    if (args.input.name !== undefined && !name) {
      throw new GraphQLError('Role name cannot be empty');
    }

    return prisma.$transaction(async (tx) => {
      // Check if role exists
      const existingRole = await tx.role.findUnique({
        where: { id: args.id },
      });

      if (!existingRole) {
        throw new GraphQLError('Role not found');
      }

      // Governance check - user must control this role
      const controls = await canManageRoleDelegationMatrix(tx, user.id, args.id);
      if (!controls) {
        throw new GraphQLError('You do not control this role and cannot update it');
      }

      // Check if new name conflicts with existing role
      if (name && name !== existingRole.name) {
        const nameConflict = await tx.role.findFirst({
          where: { 
            name: { equals: name, mode: 'insensitive' },
            id: { not: args.id }
          },
        });

        if (nameConflict) {
          throw new GraphQLError('Role with this name already exists');
        }
      }

      const updatedRole = await tx.role.update({
        where: { id: args.id },
        data: {
          name: name ?? undefined,
          description: args.input.description ?? undefined,
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      return updatedRole;
    });
  },

  adminDeleteRole: async (
    _parent: unknown,
    args: { id: string },
    ctx: AdminContext
  ) => {
    const { prisma, user } = ctx;
    requirePermission(user, 'ADMIN_ROLES_DELETE');

    return await prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({
        where: { id: args.id },
        include: { _count: { select: { users: true, permissions: true } } }
      });
      if (!role) {
        throw new GraphQLError('Role not found');
      }

      // Governance over THIS role (not grant power)
      const controls = await canManageRoleDelegationMatrix(tx, user.id, role.id);
      if (!controls) {
        throw new GraphQLError('You do not control this role and cannot delete it');
      }

      // Safety check 1: Prevent global lockout
      // If this role is a wildcard manager (ALL+canManage), ensure at least one other wildcard manager will remain
      const isWildcardManager = await isRoleWildcardRoleManager(tx, role.id);
      if (isWildcardManager) {
        const otherWildcardManagers = await countOtherWildcardRoleManagerRoles(tx, role.id);
        if (otherWildcardManagers === 0) {
          throw new GraphQLError(
            'Cannot delete this role: it is the last role providing global role management (ALL+canManage). Hand off first.',
            { extensions: { code: 'FORBIDDEN' } }
          );
        }
      }

      // Safety check 2: Self-harm protection
      // If the actor holds this role and it's their only wildcard-manager source, prevent deletion
      const actorHolds = await actorHoldsRole(tx, user.id, role.id);
      if (actorHolds && isWildcardManager) {
        const otherWildcardManagers = await countOtherWildcardRoleManagerRoles(tx, role.id);
        if (otherWildcardManagers === 0) {
          throw new GraphQLError(
            'Deleting this role would remove your own global management path. Hand off first.',
            { extensions: { code: 'FORBIDDEN' } }
          );
        }
      }

      await tx.role.delete({ where: { id: role.id } });
      return true;
    });
  },

  adminSetRolePermission: async (
    _parent: unknown,
    args: { roleId: string; permissionId: string; enabled: boolean; forceSyncGranterRoles?: boolean },
    ctx: AdminContext
  ) => {
    const { prisma, user } = ctx;
    requirePermission(user, 'ADMIN_ROLES_UPDATE');

    return prisma.$transaction(async (tx) => {
      // Load role
      const role = await tx.role.findUnique({ 
        where: { id: args.roleId }, 
        select: { id: true, name: true, createdByUserId: true } 
      });
      if (!role) throw new GraphQLError('Role not found');

      // Governance over THIS role
      const controls = await canManageRoleDelegationMatrix(tx, user.id, role.id);
      if (!controls) {
        throw new GraphQLError('You do not control this role');
      }

      // Load permission
      const permission = await tx.permission.findUnique({ 
        where: { id: args.permissionId }, 
        select: { id: true, name: true } 
      });
      if (!permission) throw new GraphQLError('Permission not found');

      if (args.enabled) {
        // TURNING ON: unified delegation + possession check
        await requireAssignPermission(tx, user.id, permission.id);

        // Optional: Protect existing role delegation rules to this role
        const delegators = await tx.roleGrantRule.findMany({
          where: { granteeRoleId: role.id, canAssign: true, scope: 'ROLE' },
          select: { id: true, granterRoleId: true }
        });

        if (delegators.length > 0) {
          // Which granter roles do NOT already include this permission?
          const granterRoleIds = Array.from(new Set(delegators.map(d => d.granterRoleId)));
          const granterWithPerm = await tx.rolePermission.findMany({
            where: { roleId: { in: granterRoleIds }, permissionId: permission.id },
            select: { roleId: true }
          });
          const granterWithPermSet = new Set(granterWithPerm.map(x => x.roleId));
          const conflicts = granterRoleIds.filter(id => !granterWithPermSet.has(id));

          if (conflicts.length) {
            if (args.forceSyncGranterRoles) {
              // Try to auto-sync: add this permission to each conflicting granter role,
              // but only if the actor is allowed to add it there (reuse same checks).
              for (const granterRoleId of conflicts) {
                // Must control the granter role too
                const canManageGranter = await canManageRoleDelegationMatrix(tx, user.id, granterRoleId);
                if (!canManageGranter) {
                  throw new GraphQLError(`Cannot sync granter role ${granterRoleId}: you do not control it`);
                }
                // Same delegation + possession checks apply
                await requireAssignPermission(tx, user.id, permission.id);
                await tx.rolePermission.upsert({
                  where: { roleId_permissionId: { roleId: granterRoleId, permissionId: permission.id } },
                  create: { roleId: granterRoleId, permissionId: permission.id },
                  update: {}
                });
              }
            } else {
              // Block with a precise message
              throw new GraphQLError(
                `Adding ${permission.name} would escalate existing delegation rules. ` +
                `Granter roles missing this permission: ${conflicts.join(', ')}. ` +
                `Either add this permission to those granter roles or use forceSyncGranterRoles.`
              );
            }
          }
        }

        // Finally attach the permission to the role
        await tx.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
          update: {},
          create: { roleId: role.id, permissionId: permission.id }
        });

      } else {
        // TURNING OFF: check if user can revoke this permission
        await requireRevokePermission(tx, user.id, permission.id, POLICY_REVOKE_PERMISSION_DEFAULT);
        
        // Remove permission from role
        await tx.rolePermission.deleteMany({
          where: { roleId: role.id, permissionId: permission.id }
        });
        // (Optional) If you want to also "de-sync" granter roles, you could remove it there too,
        // but usually we don't auto-remove — reducing power doesn't create escalation.
      }

      // Return the updated role with permissions
      return tx.role.findUnique({
        where: { id: role.id },
        include: { permissions: { include: { permission: true } } }
      });
    });
  },
};
