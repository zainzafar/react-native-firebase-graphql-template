import jwt from 'jsonwebtoken';

export type AppJwtPayload = {
  id: string; // local database user id
};

function getSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.APP_JWT_SECRET;
  if (!secret) {
    // For local dev fallback; recommend setting JWT_SECRET in production
    return 'insecure-dev-secret-change-me';
  }
  return secret;
}

export function signAppJwt(payload: AppJwtPayload, expiresInSeconds: number = 60 * 60 * 24 * 7): string {
  const secret = getSecret();
  return jwt.sign(payload as any, secret, { expiresIn: expiresInSeconds });
}

export function verifyAppJwt(token: string): AppJwtPayload | null {
  try {
    const secret = getSecret();
    return jwt.verify(token, secret, { algorithms: ['HS256'] }) as AppJwtPayload;
  } catch {
    return null;
  }
}


