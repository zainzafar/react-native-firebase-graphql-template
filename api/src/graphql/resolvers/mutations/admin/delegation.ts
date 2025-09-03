import type { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { AuthContextUser } from '../../../../services/firebaseAdmin';
import { requirePermission, canManageRoleDelegationMatrix, actorHoldsRole, getUserRoleId, actorHasWildcardRoleManageDelegator, countOtherWildcardRoleManagerRoles } from '../../../rbac';


type AdminContext = { prisma: PrismaClient; user: AuthContextUser };

export default {
  adminCreateRoleGrantRule: async (
    _parent: unknown,
    args: { input: { granterRoleId: string; granteeRoleId?: string | null; scope: 'ROLE' | 'ALL'; canAssign: boolean; canRevoke: boolean; canManage?: boolean } },
    ctx: AdminContext
  ) => {
    const { prisma, user } = ctx;
    requirePermission(user, 'ADMIN_ROLE_GRANT_RULES_CREATE');

    const { granterRoleId, granteeRoleId, scope, canAssign, canRevoke, canManage = false } = args.input;

    // 1) Validate scope/grantee invariants
    if (scope === 'ALL' && granteeRoleId != null) {
      throw new GraphQLError('When scope is ALL, granteeRoleId must be null');
    }
    if (scope === 'ROLE' && !granteeRoleId) {
      throw new GraphQLError('When scope is ROLE, granteeRoleId is required');
    }

    // 2) Prevent self-referential rules (cycle guard)
    if (scope === 'ROLE' && granterRoleId === granteeRoleId) {
      throw new GraphQLError('A role cannot grant itself (would create a cycle)');
    }

    // 3) Prevent no-op grants
    if (!canAssign && !canRevoke && !canManage) {
      throw new GraphQLError('Grant rule must enable assign, revoke, and/or manage.');
    }

    return await prisma.$transaction(async (tx) => {
      // 4) Get role names for better error messages
      const granterRole = await tx.role.findUnique({
        where: { id: granterRoleId },
        select: { name: true }
      });
      const granteeRole = scope === 'ROLE' ? await tx.role.findUnique({
        where: { id: granteeRoleId! },
        select: { name: true }
      }) : null;

      // 5) Governance over the granter role
      const controlsGranter = await canManageRoleDelegationMatrix(tx, user.id, granterRoleId);
      if (!controlsGranter) {
        throw new GraphQLError(`You do not have governance rights over the granter role '${granterRole?.name || granterRoleId}'`, {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      // 6) Escalation/possession checks are enforced at assignment time.
      //    We intentionally do NOT require the actor to possess/assign the role when *authoring* grant rules.

      // 7) Insert with error handling for duplicates
      const rule = await tx.roleGrantRule.create({
        data: {
          granterRoleId,
          granteeRoleId: scope === 'ALL' ? null : granteeRoleId!,
          scope,
          canAssign,
          canRevoke,
          canManage,
        },
        include: {
          granterRole: true,
          granteeRole: true,
        },
      }).catch((e: unknown) => {
        if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
          const scopeText = scope === 'ALL' ? 'ALL roles' : `role '${granteeRole?.name || granteeRoleId}'`;
          throw new GraphQLError(`A role grant rule with granter role '${granterRole?.name || granterRoleId}' and scope '${scopeText}' already exists`, {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }
        throw e;
      });

      return rule;
    });
  },

  adminDeleteRoleGrantRule: async (
    _parent: unknown,
    args: { id: string },
    ctx: AdminContext
  ) => {
    const { prisma, user } = ctx;
    requirePermission(user, 'ADMIN_ROLE_GRANT_RULES_DELETE');

    await prisma.$transaction(async (tx) => {
      // Fetch the rule with related data
      const rule = await tx.roleGrantRule.findUnique({
        where: { id: args.id },
        include: { granterRole: true, granteeRole: true },
      });
      if (!rule) {
        throw new GraphQLError('Grant rule not found');
      }

      // Governance over the granter role
      const controls = await canManageRoleDelegationMatrix(tx, user.id, rule.granterRoleId);
      if (!controls) {
        throw new GraphQLError(`You do not have governance rights over the granter role '${rule.granterRole.name}'`, {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      // Deleting wildcard? require global governor and prevent lockout
      if (rule.scope === 'ALL') {
        const globalRoleManage = await actorHasWildcardRoleManageDelegator(tx, user.id);
        if (!globalRoleManage) {
          throw new GraphQLError('Deleting wildcard grants requires global delegation authority', {
            extensions: { code: 'FORBIDDEN' }
          });
        }
        
        // Prevent self-lockout: don't let user delete their only source of global authority
        const holdsGranter = await actorHoldsRole(tx, user.id, rule.granterRoleId);
        const myRoleId = await getUserRoleId(tx, user.id); // single-role model
        const otherWildcardForActor = myRoleId
          ? await tx.roleGrantRule.findFirst({
              where: {
                scope: 'ALL',
                id: { not: rule.id },
                granterRoleId: myRoleId,
                canManage: true,
              },
              select: { id: true },
            })
          : null;

        if (holdsGranter && !otherWildcardForActor) {
          throw new GraphQLError(
            'Deleting this wildcard would remove your only global governance path. Hand off first.',
            { extensions: { code: 'FORBIDDEN' } }
          );
        }

        // Prevent global lockout: ensure at least one wildcard remains
        const remainingWildcards = await tx.roleGrantRule.count({
          where: { scope: 'ALL', id: { not: rule.id }, canManage: true },
        });
        if (remainingWildcards === 0) {
          throw new GraphQLError('Cannot delete the last wildcard role grant; it would lock out governance', {
            extensions: { code: 'FORBIDDEN' }
          });
        }
      }

      await tx.roleGrantRule.delete({
        where: { id: args.id },
      });
    });

    return true;
  },

  adminCreatePermissionGrantRule: async (
    _parent: unknown,
    args: { input: { granterRoleId: string; permissionId?: string | null; scope: 'PERMISSION' | 'ALL'; canAssign: boolean; canRevoke: boolean; canManage?: boolean } },
    ctx: AdminContext
  ) => {
    const { prisma, user } = ctx;
    requirePermission(user, 'ADMIN_PERMISSION_GRANT_RULES_CREATE');

    const { granterRoleId, permissionId, scope, canAssign, canRevoke } = args.input;

    // 1) Validate scope/permission invariants
    if (scope === 'ALL' && permissionId != null) {
      throw new GraphQLError('When scope is ALL, permissionId must be null');
    }
    if (scope === 'PERMISSION' && !permissionId) {
      throw new GraphQLError('When scope is PERMISSION, permissionId is required');
    }

    // 3) Prevent no-op grants
    if (!canAssign && !canRevoke) {
      throw new GraphQLError('Grant rule must enable assign, revoke, and/or manage.');
    }

    return await prisma.$transaction(async (tx) => {
      // 4) Get role and permission names for better error messages
      const granterRole = await tx.role.findUnique({
        where: { id: granterRoleId },
        select: { name: true }
      });
      const permission = scope === 'PERMISSION' ? await tx.permission.findUnique({
        where: { id: permissionId! },
        select: { name: true }
      }) : null;

      // 5) Governance over the granter role
      const controlsGranter = await canManageRoleDelegationMatrix(tx, user.id, granterRoleId);
      if (!controlsGranter) {
        throw new GraphQLError(`You do not have governance rights over the granter role '${granterRole?.name || granterRoleId}'`, {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      // 6) Escalation/possession checks are enforced at assignment time.
      //    We intentionally do NOT require the actor to possess/assign the permission when *authoring* grant rules.

      // 7) Insert with error handling for duplicates
      const rule = await tx.permissionGrantRule.create({
        data: {
          granterRoleId,
          permissionId: scope === 'ALL' ? null : permissionId!,
          scope,
          canAssign,
          canRevoke,
        },
        include: {
          granterRole: true,
          permission: true,
        },
      }).catch((e: unknown) => {
        if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
          const scopeText = scope === 'ALL' ? 'ALL permissions' : `permission '${permission?.name || permissionId}'`;
          throw new GraphQLError(`A permission grant rule with granter role '${granterRole?.name || granterRoleId}' and scope '${scopeText}' already exists`, {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }
        throw e;
      });

      return rule;
    });
  },

  adminDeletePermissionGrantRule: async (
    _parent: unknown,
    args: { id: string },
    ctx: AdminContext
  ) => {
    const { prisma, user } = ctx;
    requirePermission(user, 'ADMIN_PERMISSION_GRANT_RULES_DELETE');

    await prisma.$transaction(async (tx) => {
      // Fetch the rule with related data
      const rule = await tx.permissionGrantRule.findUnique({
        where: { id: args.id },
        include: { granterRole: true, permission: true },
      });
      if (!rule) {
        throw new GraphQLError('Grant rule not found');
      }

      // Governance over the granter role
      const controls = await canManageRoleDelegationMatrix(tx, user.id, rule.granterRoleId);
      if (!controls) {
        throw new GraphQLError(`You do not have governance rights over the granter role '${rule.granterRole.name}'`, {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      await tx.permissionGrantRule.delete({
        where: { id: args.id },
      });
    });

    return true;
  },
};
