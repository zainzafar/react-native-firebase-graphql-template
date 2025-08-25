import { auth as firebaseAuth } from 'firebase-admin';
import { verifyIdTokenSafe } from '../../../services/firebaseAdmin';
import { signAppJwt } from '../../../services/appJwt';
import { User } from '@prisma/client';

export default {
  loginWithIdToken: async (
    _parent: unknown,
    args: { idToken: string; },
    ctx: any
  ) => {
    const { idToken } = args;
    const decoded = await verifyIdTokenSafe(idToken);
    if (!decoded) {
      throw new Error('Invalid ID token');
    }
    const userRecord: firebaseAuth.UserRecord = await firebaseAuth().getUser(decoded.uid);

    // Persist or update user in DB
    const prisma = ctx?.prisma as any | undefined;
    let dbUser: User | null = null;
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

    // For JWT, we encode our DB user id only
    const accessToken = dbUser ? signAppJwt({ id: dbUser.id }, 60 * 60 * 24 * 7) : undefined;
    return { user: dbUser, accessToken };
  },
};




