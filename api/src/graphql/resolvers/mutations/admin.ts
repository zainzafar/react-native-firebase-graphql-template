import type { PrismaClient, User } from '@prisma/client';
import { Permission } from '@prisma/client';
import { getFirebaseAuth, AuthContextUser } from '../../../services/firebaseAdmin';
import { requirePermission } from '../../rbac';

export default {
  adminUpdateUser: async (
    _parent: unknown,
    args: { uid: string; input: { email?: string; emailVerified?: boolean; phoneNumber?: string; password?: string; displayName?: string; photoURL?: string; disabled?: boolean } },
    ctx: { prisma: PrismaClient; user: AuthContextUser }
  ) => {
    const prisma = ctx.prisma;
    await requirePermission({ user: ctx.user, prisma }, Permission.ADMIN_USERS_EDIT);

    // First update Firebase Auth so it's the source of truth
    try {
      await getFirebaseAuth().updateUser(args.uid, {
        email: args.input.email ?? undefined,
        emailVerified: args.input.emailVerified ?? undefined,
        phoneNumber:
          args.input.phoneNumber !== undefined
            ? (args.input.phoneNumber?.trim() === '' ? (null as any) : args.input.phoneNumber)
            : undefined,
        password: args.input.password ?? undefined,
        displayName: args.input.displayName ?? undefined,
        photoURL: args.input.photoURL ?? undefined,
        disabled: args.input.disabled ?? undefined,
      });
    } catch (e: any) {
      // Bubble up the error so the client can react and DB stays unchanged
      throw new Error(e?.message || 'Failed to update authentication profile');
    }

    // Only after Firebase succeeds, persist to DB
    const updated = await prisma.user.update({
      where: { uid: args.uid },
      data: {
        email: args.input.email ?? undefined,
        emailVerified: args.input.emailVerified ?? undefined,
        phoneNumber: args.input.phoneNumber ?? undefined,
        displayName: args.input.displayName ?? undefined,
        photoURL: args.input.photoURL ?? undefined,
      },
      include: { roles: true, identities: true },
    });

    return updated;
  },

  adminDeleteUser: async (
    _parent: unknown,
    args: { uid: string },
    ctx: { prisma: PrismaClient; user: AuthContextUser }
  ) => {
    const prisma = ctx.prisma;
    await requirePermission({ user: ctx.user, prisma }, Permission.ADMIN_USERS_DELETE);

    // First delete from Firebase Auth
    try {
      await getFirebaseAuth().deleteUser(args.uid);
    } catch (e: any) {
      throw new Error(e?.message || 'Failed to delete user from authentication');
    }

    // Only after Firebase succeeds, delete from DB
    await prisma.user.delete({ where: { uid: args.uid } });
    return true;
  },

  adminResetPassword: async (
    _parent: unknown,
    args: { uid: string },
    ctx: { prisma: PrismaClient; user: AuthContextUser }
  ) => {
    const prisma = ctx.prisma;
    await requirePermission({ user: ctx.user, prisma }, Permission.ADMIN_USERS_EDIT);

    try {
      await getFirebaseAuth().generatePasswordResetLink(args.uid);
      return true;
    } catch (e: any) {
      throw new Error(e?.message || 'Failed to generate password reset link');
    }
  }
};


