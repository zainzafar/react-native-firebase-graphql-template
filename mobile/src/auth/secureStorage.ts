import * as Keychain from 'react-native-keychain';

type SecureStorageOptions = {
  service?: string;
};

export async function secureSet(key: string, value: string, options?: SecureStorageOptions): Promise<void> {
  const service = options?.service || key;
  await Keychain.setGenericPassword(key, value, { service });
}

export async function secureGet(key: string, options?: SecureStorageOptions): Promise<string | null> {
  const service = options?.service || key;
  const creds = await Keychain.getGenericPassword({ service });
  if (creds && creds.username === key) return creds.password;
  if (creds && !creds.username) return creds.password; // fallback
  return null;
}

export async function secureRemove(key: string, options?: SecureStorageOptions): Promise<void> {
  const service = options?.service || key;
  await Keychain.resetGenericPassword({ service });
}


