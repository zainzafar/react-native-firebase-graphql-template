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

export function signAppJwtWithFirebaseExpiry(payload: AppJwtPayload, firebaseTokenExp: number): string {
  const secret = getSecret();
  
  const now = Math.floor(Date.now() / 1000);
  const appTtlSec = 30 * 60;        // 30 minutes
  const skewSec = 180;              // 3 minutes safety buffer
  const firebaseExp = firebaseTokenExp;
  
  const exp = Math.min(now + appTtlSec, firebaseExp - skewSec);
  const expiresIn = exp - now;
  
  // Ensure minimum expiration time
  const minExpiration = 60; // 1 minute minimum
  const finalExpiration = Math.max(expiresIn, minExpiration);
  
  return jwt.sign(payload as any, secret, { 
    expiresIn: finalExpiration,
    algorithm: 'HS256'
  });
}

export function verifyAppJwt(token: string): AppJwtPayload | null {
  try {
    const secret = getSecret();
    return jwt.verify(token, secret, { algorithms: ['HS256'] }) as AppJwtPayload;
  } catch {
    return null;
  }
}


