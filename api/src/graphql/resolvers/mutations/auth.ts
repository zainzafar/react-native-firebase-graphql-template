import { auth as firebaseAuth } from 'firebase-admin';
import { verifyIdTokenSafe } from '../../../services/firebaseAdmin';
import { signAppJwt } from '../../../services/appJwt';

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
    let dbUser: any | null = null;
    if (!prisma) {
      console.warn('[auth] prisma not available in context; skipping DB upsert');
    } else {
      dbUser = await prisma.user.upsert({
        where: { uid: userRecord.uid },
        create: {
          uid: userRecord.uid,
          email: userRecord.email ?? null,
          emailVerified: userRecord.emailVerified ?? false,
          displayName: userRecord.displayName ?? null,
          photoURL: userRecord.photoURL ?? null,
          phoneNumber: userRecord.phoneNumber ?? null,
          providerId: userRecord.providerData?.[0]?.providerId ?? 'firebase',
        },
        update: {
          email: userRecord.email ?? null,
          emailVerified: userRecord.emailVerified ?? false,
          displayName: userRecord.displayName ?? null,
          photoURL: userRecord.photoURL ?? null,
          phoneNumber: userRecord.phoneNumber ?? null,
          providerId: userRecord.providerData?.[0]?.providerId ?? 'firebase',
        },
      });
      console.log('[auth] upserted user in DB uid=', dbUser?.uid);
    }

    // For JWT, we encode our DB user id only
    const accessToken = dbUser ? signAppJwt({ id: dbUser.id }, 60 * 60 * 24 * 7) : undefined;
    return { user: dbUser, accessToken };
  },
};




