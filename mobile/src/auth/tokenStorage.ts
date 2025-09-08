import { secureGet, secureRemove, secureSet } from './secureStorage';

const SERVICE = 'app.accessToken';

export async function saveAccessToken(token: string): Promise<void> {
  await secureSet('token', token, { service: SERVICE });
}

export async function getAccessToken(): Promise<string | null> {
  try {
    return await secureGet('token', { service: SERVICE });
  } catch {
    return null;
  }
}

export async function clearAccessToken(): Promise<void> {
  try {
    await secureRemove('token', { service: SERVICE });
  } catch {}
}

// Impersonation token helpers
export async function saveImpersonationToken(token: string): Promise<void> {
  await secureSet('impersonationToken', token, { service: SERVICE });
}

export async function getImpersonationToken(): Promise<string | null> {
  try {
    return await secureGet('impersonationToken', { service: SERVICE });
  } catch {
    return null;
  }
}

export async function clearImpersonationToken(): Promise<void> {
  try {
    await secureRemove('impersonationToken', { service: SERVICE });
  } catch {}
}

// Get the effective token (impersonation token if present, otherwise admin token)
export async function getEffectiveToken(): Promise<string | null> {
  const impersonationToken = await getImpersonationToken();
  if (impersonationToken) {
    return impersonationToken;
  }
  return await getAccessToken();
}


