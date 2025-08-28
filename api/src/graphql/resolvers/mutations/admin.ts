import type { PrismaClient, User } from '@prisma/client';
import { Role } from '@prisma/client';
import { getFirebaseAuth, AuthContextUser } from '../../../services/firebaseAdmin';
import { requireRole } from '../../rbac';

export default {
  adminUpdateUser: async (
    _parent: unknown,
    args: { uid: string; input: { email?: string; emailVerified?: boolean; phoneNumber?: string; password?: string; displayName?: string; photoURL?: string; disabled?: boolean } },
    ctx: { prisma: PrismaClient; user: AuthContextUser }
  ) => {
    const prisma = ctx.prisma;
    await requireRole({ user: ctx.user, prisma }, Role.SUPER_ADMIN);

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
        phoneNumber:
          args.input.phoneNumber !== undefined
            ? (args.input.phoneNumber?.trim() === '' ? null : args.input.phoneNumber)
            : undefined,
        displayName: args.input.displayName ?? undefined,
        photoURL: args.input.photoURL ?? undefined,
        // Optionally mirror disabled if you add a DB field later
      },
      include: { identities: true, roles: true },
    });

    return updated;
  },

  adminDeleteUser: async (
    _parent: unknown,
    args: { uid: string },
    ctx: { prisma: PrismaClient; user: AuthContextUser }
  ) => {
    const prisma = ctx.prisma;
    await requireRole({ user: ctx.user, prisma }, Role.SUPER_ADMIN);

    const target = await prisma.user.findUnique({ where: { uid: args.uid } });
    if (!target) throw new Error('User not found');

    // Delete from Firebase Auth first
    try {
      await getFirebaseAuth().deleteUser(target.uid);
    } catch (e) {
      console.warn('[adminDeleteUser] Firebase delete warning:', e);
    }

    // Delete from our DB (cascade removes identities and roles)
    await prisma.user.delete({ where: { uid: args.uid } });
    return true;
  },

  adminResetPassword: async (
    _parent: unknown,
    args: { uid: string },
    ctx: { prisma: PrismaClient; user: AuthContextUser }
  ) => {
    const prisma = ctx.prisma;
    await requireRole({ user: ctx.user, prisma }, Role.SUPER_ADMIN);

    const target = await prisma.user.findUnique({ where: { uid: args.uid } });
    if (!target) throw new Error('User not found');
    if (!target.email) return false;

    try {
      const link = await getFirebaseAuth().generatePasswordResetLink(target.email);
      // In a template we rely on Firebase to send the email; link available for custom handlers
      console.log('[adminResetPassword] Generated password reset link:', link);
      return true;
    } catch (e) {
      console.error('[adminResetPassword] Failed generating reset link', e);
      return false;
    }
  },
};


