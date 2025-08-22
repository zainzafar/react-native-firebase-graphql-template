import { auth as firebaseAuth } from 'firebase-admin';
import { verifyIdTokenSafe, createSessionCookieSafe } from '../../../services/firebaseAdmin';

const COOKIE_NAME = 'session';

export default {
  loginWithIdToken: async (
    _parent: unknown,
    args: { idToken: string; createSession?: boolean | null; sessionDays?: number | null },
    ctx: any
  ) => {
    const { idToken, createSession = false, sessionDays = 7 } = args;
    const decoded = await verifyIdTokenSafe(idToken);
    if (!decoded) {
      throw new Error('Invalid ID token');
    }
    const userRecord: firebaseAuth.UserRecord = await firebaseAuth().getUser(decoded.uid);

    let sessionCookie: string | null = null;
    if (createSession && ctx?.res) {
      const maxAgeMs = Math.max(1, sessionDays || 7) * 24 * 60 * 60 * 1000;
      sessionCookie = await createSessionCookieSafe(idToken, maxAgeMs);
      const isProd = process.env.NODE_ENV === 'production';
      ctx.res.setHeader('Set-Cookie', `${COOKIE_NAME}=${sessionCookie}; Max-Age=${Math.floor(maxAgeMs / 1000)}; Path=/; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}`);
      console.log('[auth] session cookie set, maxAgeMs=', maxAgeMs);
    }

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

    const userOut = dbUser ? normalizeDbUser(dbUser) : normalizeUser(userRecord);
    return { user: userOut, sessionCookie };
  },

  logout: async (_parent: unknown, _args: unknown, ctx: any) => {
    if (ctx?.res) {
      const isProd = process.env.NODE_ENV === 'production';
      ctx.res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}`);
    }
    return true;
  },
};

function normalizeUser(user: firebaseAuth.UserRecord) {
  const providerId = user.providerData?.[0]?.providerId ?? 'firebase';
  return {
    uid: user.uid,
    email: user.email ?? null,
    emailVerified: user.emailVerified ?? false,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    phoneNumber: user.phoneNumber ?? null,
    providerId,
  };
}

function normalizeDbUser(user: any) {
  return {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.displayName,
    photoURL: user.photoURL,
    phoneNumber: user.phoneNumber,
    providerId: user.providerId ?? 'firebase',
  };
}


