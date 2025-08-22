import admin from 'firebase-admin';
import type { Request } from 'express';

let initialized = false;

function getServiceAccountFromEnv(): admin.ServiceAccount | null {
  const fromJson = process.env.FIREBASE_SERVICE_ACCOUNT
    ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, "base64").toString("utf8")
    : null;
  if (fromJson) {
    try {
      const parsed = JSON.parse(fromJson);
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: (parsed.private_key as string | undefined)?.replace(/\\n/g, '\n') ?? undefined,
      } as admin.ServiceAccount;
    } catch {}
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && privateKeyRaw) {
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
    return { projectId, clientEmail, privateKey } as admin.ServiceAccount;
  }
  return null;
}

export function ensureFirebaseInitialized(): void {
  if (initialized) return;
  const svc = getServiceAccountFromEnv();
  if (svc) {
    admin.initializeApp({ credential: admin.credential.cert(svc) });
  } else {
    // Fall back to application default credentials if available
    admin.initializeApp();
  }
  initialized = true;
}

export function getFirebaseAuth(): admin.auth.Auth {
  ensureFirebaseInitialized();
  return admin.auth();
}

export async function verifyIdTokenSafe(idToken: string): Promise<admin.auth.DecodedIdToken | null> {
  try {
    const auth = getFirebaseAuth();
    return await auth.verifyIdToken(idToken, true);
  } catch {
    return null;
  }
}

export async function verifySessionCookieSafe(cookie: string): Promise<admin.auth.DecodedIdToken | null> {
  try {
    const auth = getFirebaseAuth();
    return await auth.verifySessionCookie(cookie, true);
  } catch {
    return null;
  }
}

export async function createSessionCookieSafe(idToken: string, expiresInMs: number): Promise<string> {
  const auth = getFirebaseAuth();
  return auth.createSessionCookie(idToken, { expiresIn: expiresInMs });
}

function parseCookies(header: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header) return result;
  const parts = header.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) result[key] = decodeURIComponent(val);
  }
  return result;
}

const SESSION_COOKIE_NAME = 'session';

export async function getAuthFromRequest(req: Request): Promise<
  | { decoded: admin.auth.DecodedIdToken; user: any; tokenType: 'idToken' | 'sessionCookie'; raw: string }
  | null
> {
  ensureFirebaseInitialized();
  const auth = getFirebaseAuth();
  // Priority 1: Authorization header Bearer <idToken>
  const authz = req.headers['authorization'] || req.headers['Authorization' as any];
  if (typeof authz === 'string' && authz.toLowerCase().startsWith('bearer ')) {
    const token = authz.slice(7).trim();
    const decoded = await verifyIdTokenSafe(token);
    if (decoded) {
      const userRecord = await auth.getUser(decoded.uid);
      return { decoded, user: normalizeUser(userRecord), tokenType: 'idToken', raw: token };
    }
  }
  // Priority 2: Session cookie
  const cookies = parseCookies(req.headers['cookie'] as string | undefined);
  const session = cookies[SESSION_COOKIE_NAME];
  if (session) {
    const decoded = await verifySessionCookieSafe(session);
    if (decoded) {
      const userRecord = await auth.getUser(decoded.uid);
      return { decoded, user: normalizeUser(userRecord), tokenType: 'sessionCookie', raw: session };
    }
  }
  return null;
}

export function normalizeUser(user: admin.auth.UserRecord) {
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


