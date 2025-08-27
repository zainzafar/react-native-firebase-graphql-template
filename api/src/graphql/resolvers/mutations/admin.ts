import type { PrismaClient, User } from '@prisma/client';
import { Role } from '@prisma/client';
import { getFirebaseAuth } from '../../../services/firebaseAdmin';
import { requireRole } from '../../rbac';

export default {
  adminUpdateUser: async (
    _parent: unknown,
    args: { id: string; input: { displayName?: string; photoURL?: string; phoneNumber?: string } },
    ctx: { prisma: PrismaClient; user: User }
  ) => {
    const prisma = ctx.prisma;
    await requireRole({ user: ctx.user, prisma }, Role.SUPER_ADMIN);

    const updated = await prisma.user.update({
      where: { id: args.id },
      data: {
        displayName: args.input.displayName ?? undefined,
        photoURL: args.input.photoURL ?? undefined,
        phoneNumber: args.input.phoneNumber ?? undefined,
      },
      include: { identities: true, roles: true },
    });

    // Mirror changes to Firebase where applicable
    try {
      await getFirebaseAuth().updateUser(updated.uid, {
        displayName: updated.displayName ?? undefined,
        photoURL: updated.photoURL ?? undefined,
        phoneNumber: updated.phoneNumber ?? undefined,
      });
    } catch (e) {
      console.warn('[adminUpdateUser] Firebase update warning:', e);
    }

    return updated
  },

  adminDeleteUser: async (
    _parent: unknown,
    args: { id: string; confirm: string },
    ctx: { prisma: PrismaClient; user: User }
  ) => {
    const prisma = ctx.prisma;
    await requireRole({ user: ctx.user, prisma }, Role.SUPER_ADMIN);

    const target = await prisma.user.findUnique({ where: { id: args.id } });
    if (!target) throw new Error('User not found');
    if (!target.email || target.email !== args.confirm) {
      throw new Error('Confirmation does not match user email');
    }

    // Delete from Firebase Auth first
    try {
      await getFirebaseAuth().deleteUser(target.uid);
    } catch (e) {
      console.warn('[adminDeleteUser] Firebase delete warning:', e);
    }

    // Delete from our DB (cascade removes identities and roles)
    await prisma.user.delete({ where: { id: args.id } });
    return true;
  },

  adminResetPassword: async (
    _parent: unknown,
    args: { id: string },
    ctx: { prisma: PrismaClient; user: User }
  ) => {
    const prisma = ctx.prisma;
    await requireRole({ user: ctx.user, prisma }, Role.SUPER_ADMIN);

    const target = await prisma.user.findUnique({ where: { id: args.id } });
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


