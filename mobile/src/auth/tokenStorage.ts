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


