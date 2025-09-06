import type { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { getFirebaseAuth, AuthContextUser } from '../../../../services/firebaseAdmin';
import { requirePermission, requireAssignRole, requireRevokeRole, requireAssignPermission, getWildcardRoleManagerRoleIds, requireRevokePermission, getUserRoleId } from '../../../rbac';

async function hasOtherGlobalRoleManagers(prisma: PrismaClient, excludingUserId: string): Promise<boolean> {
  // Get roles that confer global role management (scope=ALL, canManage=true)
  const criticalRoleIds = await getWildcardRoleManagerRoleIds(prisma);
  if (criticalRoleIds.length === 0) return true; // nothing to protect

  // Count users (excluding the provided user) who hold any of those roles
  const remaining = await prisma.userRole.count({
    where: { roleId: { in: criticalRoleIds }, userId: { not: excludingUserId } },
  });
  return remaining > 0;
}

async function targetIsGlobalRoleManager(prisma: PrismaClient, userId: string): Promise<boolean> {
  const roleId = await getUserRoleId(prisma, userId);
  if (!roleId) return false;
  const roleManager = !!(await prisma.roleGrantRule.findFirst({
    where: { granterRoleId: roleId, scope: 'ALL', canManage: true },
    select: { id: true },
  }));
  return roleManager;
}

type AdminContext = { prisma: PrismaClient; user: AuthContextUser };

export default {
  adminUpdateUser: async (
    _parent: unknown,
    args: { id: string; input: { email?: string; emailVerified?: boolean; phoneNumber?: string; displayName?: string; photoURL?: string; disabled?: boolean } },
    ctx: AdminContext
  ) => {
    const { prisma, user } = ctx;
    requirePermission(user, 'ADMIN_USERS_UPDATE_PROFILE');

    // Get user to find their uid for Firebase Auth
    const targetUser = await prisma.user.findUnique({ where: { id: args.id } });
    if (!targetUser) throw new GraphQLError('User not found', {
      extensions: { code: 'NOT_FOUND' }
    });

    // Normalize phone number once - convert empty string to null
    const normalizedPhoneNumber = args.input.phoneNumber !== undefined
      ? (args.input.phoneNumber?.trim() === '' ? null : args.input.phoneNumber)
      : undefined;

    // First update Firebase Auth so it's the source of truth
    try {
      await getFirebaseAuth().updateUser(targetUser.uid, {
        email: args.input.email ?? undefined,
        emailVerified: args.input.emailVerified ?? undefined,
        phoneNumber: normalizedPhoneNumber,
        displayName: args.input.displayName ?? undefined,
        photoURL: args.input.photoURL ?? undefined,
        disabled: args.input.disabled ?? undefined,
      });
    } catch (e: unknown) {
      // Bubble up the error so the client can react and DB stays unchanged
      const message = e instanceof Error ? e.message : 'Failed to update authentication profile';
      throw new GraphQLError(message, {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }

    // Only after Firebase succeeds, persist to DB
    const updated = await prisma.user.update({
      where: { id: args.id },
      data: {
        email: args.input.email ?? undefined,
        emailVerified: args.input.emailVerified ?? undefined,
        phoneNumber: normalizedPhoneNumber,
        displayName: args.input.displayName ?? undefined,
        photoURL: args.input.photoURL ?? undefined,
      },
      include: { role: { include: { role: true } }, identities: true },
    });

    return updated;
  },

  adminUpdateUserPassword: async (
    _parent: unknown,
    args: { id: string; input: { password: string } },
    ctx: AdminContext
  ) => {
    const { prisma, user } = ctx;
    requirePermission(user, 'ADMIN_USERS_UPDATE_PASSWORD');

    // Get user to find their uid for Firebase Auth
    const targetUser = await prisma.user.findUnique({ where: { id: args.id } });
    if (!targetUser) throw new GraphQLError('User not found', {
      extensions: { code: 'NOT_FOUND' }
    });

    // Update password in Firebase Auth
    try {
      await getFirebaseAuth().updateUser(targetUser.uid, {
        password: args.input.password,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update password';
      throw new GraphQLError(message, {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }

    // Return the user (no DB update needed for password)
    return await prisma.user.findUnique({
      where: { id: args.id },
      include: { role: { include: { role: true } }, identities: true },
    });
  },

  adminDeleteUser: async (
    _parent: unknown,
    args: { id: string },
    ctx: AdminContext
  ) => {
    const { prisma, user } = ctx;
    requirePermission(user, 'ADMIN_USERS_DELETE');

    // Get user to find their uid for Firebase Auth
    const targetUser = await prisma.user.findUnique({ where: { id: args.id } });
    if (!targetUser) throw new GraphQLError('User not found', {
      extensions: { code: 'NOT_FOUND' }
    });

    // Prevent self-deletion
    if (args.id === user.id) {
      throw new GraphQLError('You cannot delete your own account.', { extensions: { code: 'FORBIDDEN' } });
    }

    // If the target is a global manager (role and/or permissions), ensure at least one other remains
    const roleManager = await targetIsGlobalRoleManager(prisma, args.id);

    if (roleManager) {
      const ok = await hasOtherGlobalRoleManagers(prisma, args.id);
      if (!ok) {
        throw new GraphQLError('Cannot delete the last account with global role governance. Hand off global management first.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
    }

    // First delete from Firebase Auth
    try {
      await getFirebaseAuth().deleteUser(targetUser.uid);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to delete user from authentication';
      throw new GraphQLError(message, {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }

    // Only after Firebase succeeds, delete from DB
    await prisma.user.delete({
      where: { id: args.id },
    });

    return true;
  },


  adminSetUserRole: async (
    _parent: unknown,
    args: { id: string; roleId?: string },
    ctx: AdminContext
  ) => {
    const { prisma, user } = ctx;
    requirePermission(user, 'ADMIN_USERS_UPDATE_ROLES');

    const target = await prisma.user.findUnique({
      where: { id: args.id },
      include: { role: true },
    });

    if (!target) {
      throw new GraphQLError('User not found');
    }

    // If changing the target's role, ensure we don't remove the last global managers
    const targetIsRoleManager = await targetIsGlobalRoleManager(prisma, args.id);

    // Determine if the operation will remove the target's current role
    const removingRole = !args.roleId || (target.role && target.role.roleId !== args.roleId);

    if (removingRole && targetIsRoleManager) {
      // Simulate post-change state: target will no longer count as a global manager
      const roleOk = !targetIsRoleManager || (await hasOtherGlobalRoleManagers(prisma, args.id));

      if (!roleOk) {
        throw new GraphQLError('This change would remove the last account with global role governance. Hand off global management first.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      // Permission-level governance removal handled elsewhere; no permOk gate
    }

    // Optional: prevent removing your own role entirely (safer UX)
    if (!args.roleId && args.id === user.id) {
      throw new GraphQLError('You cannot remove your own role.', { extensions: { code: 'FORBIDDEN' } });
    }

    // Wrap all role operations in a transaction for atomicity
    await prisma.$transaction(async (tx) => {
      if (args.roleId) {
        // Check if user can grant this role
        await requireAssignRole(tx, user.id, args.roleId);

        // Update or create the user's role (one-to-one relationship)
        await tx.userRole.upsert({
          where: { userId: args.id },
          update: { roleId: args.roleId! },
          create: {
            userId: args.id,
            roleId: args.roleId!,
          },
        });
      } else {
        // Check if user can revoke the current role
        if (target.role) {
          await requireRevokeRole(tx, user.id, target.role.roleId);
        }

        // Remove the user's role
        await tx.userRole.deleteMany({
          where: { userId: args.id },
        });
      }
    });

    // Return updated user
    return await prisma.user.findUnique({
      where: { id: args.id },
      include: { role: { include: { role: true } }, identities: true },
    });
  },

  adminSetUserPermission: async (
    _parent: unknown,
    args: { id: string; permissionId: string; enabled: boolean },
    ctx: AdminContext
  ) => {
    const { prisma, user } = ctx;
    requirePermission(user, 'ADMIN_USERS_UPDATE_DIRECT_PERMISSIONS');

    const target = await prisma.user.findUnique({
      where: { id: args.id },
    });

    if (!target) {
      throw new GraphQLError('User not found');
    }

    if (args.enabled) {
      // Check if user can grant this permission - MANDATE possession check (no global bypass)
      await requireAssignPermission(prisma, user.id, args.permissionId);
    } else {
      // Check if user can revoke this permission - possession check OR global bypass)
      await requireRevokePermission(prisma, user.id, args.permissionId);
    }

    // Wrap the permission operations in a transaction for atomicity
    await prisma.$transaction(async (tx) => {
      if (args.enabled) {
        // Add permission to user
        await tx.userPermission.upsert({
          where: {
            userId_permissionId: {
              userId: args.id,
              permissionId: args.permissionId,
            },
          },
          update: {},
          create: {
            userId: args.id,
            permissionId: args.permissionId,
          },
        });
      } else {
        // Remove permission from user
        await tx.userPermission.deleteMany({
          where: {
            userId: args.id,
            permissionId: args.permissionId,
          },
        });
      }
    });

    // Return updated permissions
    const rows = await prisma.userPermission.findMany({
      where: { userId: target.id },
      include: { permission: true },
    });
    return rows.map((r) => r.permission.name);
  },
};
