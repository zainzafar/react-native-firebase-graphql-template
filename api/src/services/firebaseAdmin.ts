import admin from 'firebase-admin';
import type { Request } from 'express';
import { verifyAppJwt } from './appJwt';
import { getPrisma } from './prisma';
import type { User as PrismaUser, UserIdentity, Role } from '@prisma/client';
import { resolveUserPermissions } from '../graphql/rbac';

export type AuthContextUser = PrismaUser & {
  role: Role | null;
  permissions: string[];
  identities: UserIdentity[];
};

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

export async function getAuthUserFromRequest(req: Request): Promise<AuthContextUser | null> {
  const authz = req.headers['authorization'] || (req.headers['Authorization' as any] as any);
  if (typeof authz === 'string' && authz.toLowerCase().startsWith('bearer ')) {
    const token = authz.slice(7).trim();
    const appPayload = verifyAppJwt(token);
    if (appPayload?.id) {
      const prisma = getPrisma();
      const dbUser = await prisma.user.findUnique({ 
        where: { id: appPayload.id }, 
        include: { 
          identities: true, 
          role: { include: { role: true } }
        } 
      });
      if (dbUser) {
        // Map role relation to role object for GraphQL convenience
        const roleObject = (dbUser as any).role?.role || null;
        
        // Resolve all permissions for this user
        const resolvedPermissions = await resolveUserPermissions(prisma, dbUser.id);
        
        return { 
          ...dbUser, 
          role: roleObject, 
          permissions: resolvedPermissions 
        } as AuthContextUser;
      }
    }
  }
  return null;
}