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
    }

    return {
      user: normalizeUser(userRecord),
      sessionCookie,
    };
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


