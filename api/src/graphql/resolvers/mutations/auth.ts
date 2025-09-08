import { verifyIdTokenSafe, getFirebaseAuth, AuthContextUser } from '../../../services/firebaseAdmin';
import type { auth as firebaseAuth } from 'firebase-admin';
import { signAppJwtWithFirebaseExpiry } from '../../../services/appJwt';
import type { PrismaClient, Prisma } from '@prisma/client';
import { requirePermission } from '../../rbac/core';

export default {
  loginWithIdToken: async (
    _parent: unknown,
    args: { idToken: string; },
    ctx: { prisma: PrismaClient }
  ) => {
    const { idToken } = args;
    const decoded = await verifyIdTokenSafe(idToken);
    if (!decoded) {
      throw new Error('Invalid ID token');
    }
    const userRecord: firebaseAuth.UserRecord = await getFirebaseAuth().getUser(decoded.uid);

    // Persist or update user in DB
    const prisma = ctx?.prisma as PrismaClient | undefined;
    let dbUser: Prisma.UserGetPayload<{ include: { identities: true } }> | null = null;
    if (!prisma) {
      console.warn('[auth] prisma not available in context; skipping DB upsert');
    } else {
      const currentProvider = (decoded.firebase as any)?.sign_in_provider || userRecord.providerData?.[0]?.providerId || null;

      dbUser = await prisma.user.upsert({
        where: { uid: userRecord.uid },
        create: {
          uid: userRecord.uid,
          email: userRecord.email ?? null,
          emailVerified: userRecord.emailVerified ?? false,
          displayName: userRecord.displayName ?? null,
          photoURL: userRecord.photoURL ?? null,
          phoneNumber: userRecord.phoneNumber ?? null,
          lastLoginProvider: currentProvider,
        },
        update: {
          email: userRecord.email ?? null,
          emailVerified: userRecord.emailVerified ?? false,
          displayName: userRecord.displayName ?? null,
          photoURL: userRecord.photoURL ?? null,
          phoneNumber: userRecord.phoneNumber ?? null,
          lastLoginProvider: currentProvider,
        },
        include: { identities: true },
      });

      // Upsert identities for all linked providers
      const providerDatas = Array.isArray(userRecord.providerData) ? userRecord.providerData : [];
      for (const p of providerDatas) {
        if (!p?.providerId || !p?.uid) continue;
        await prisma.userIdentity.upsert({
          where: { providerId_providerUid: { providerId: p.providerId, providerUid: p.uid } },
          create: { userId: dbUser!.id, providerId: p.providerId, providerUid: p.uid, lastUsedAt: currentProvider === p.providerId ? new Date() : null },
          update: { userId: dbUser!.id, lastUsedAt: currentProvider === p.providerId ? new Date() : undefined },
        });
      }
      console.log('[auth] upserted user in DB uid=', dbUser?.uid);
    }

    // For JWT, we encode our DB user id only with Firebase-aware expiration
    const accessToken = dbUser ? signAppJwtWithFirebaseExpiry({ id: dbUser.id }, decoded.exp!) : undefined;
    return { user: dbUser, accessToken };
  },

  updateProfile: async (
    _parent: unknown,
    args: { displayName?: string; photoURL?: string; },
    ctx: { user: AuthContextUser; prisma: PrismaClient }
  ) => {
    const user = ctx.user;
    const prisma = ctx.prisma;

    // Update Firebase Auth user profile
    try {
      await getFirebaseAuth().updateUser(user.uid, {
        displayName: args.displayName || user.displayName,
        photoURL: args.photoURL || user.photoURL,
      });
    } catch (error) {
      console.error('Firebase profile update error:', error);
      throw new Error('Failed to update profile in authentication service');
    }

    // Update database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: args.displayName || user.displayName,
        photoURL: args.photoURL || user.photoURL,
      },
      include: { identities: true },
    });

    return updatedUser;
  },

  startImpersonation: async (
    _parent: unknown,
    args: { userId: string; },
    ctx: { user: AuthContextUser; prisma: PrismaClient }
  ) => {
    const adminUser = ctx.user;
    const prisma = ctx.prisma;
    const { userId } = args;

    // Check if admin user has impersonation permission
    requirePermission(adminUser, 'ADMIN_USERS_IMPERSONATE');

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { identities: true }
    });

    if (!targetUser) {
      throw new Error('User not found');
    }

    // Generate JWT token for the target user
    const impersonationToken = signAppJwtWithFirebaseExpiry({ id: targetUser.id }, Math.floor(Date.now() / 1000) + 3600); // 1 hour expiry

    return {
      token: impersonationToken,
      user: targetUser
    };
  },

};




