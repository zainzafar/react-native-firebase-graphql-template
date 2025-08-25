// no-op
import { getApp } from '@react-native-firebase/app';
import { getAuth, signOut as firebaseSignOut, getIdToken } from '@react-native-firebase/auth';
import { apolloClient, resetApollo } from '../graphql/client';
import { MUTATION_LOGIN_WITH_ID_TOKEN } from '../graphql/operations';
import { clearAccessToken, saveAccessToken } from './tokenStorage';

export async function refreshAppToken(): Promise<boolean> {
  try {
    const app = getApp();
    const auth = getAuth(app);
    const idToken = auth.currentUser ? await getIdToken(auth.currentUser, true) : undefined;
    if (!idToken) throw new Error('No Firebase ID token');
    const { data } = await apolloClient.mutate({ mutation: MUTATION_LOGIN_WITH_ID_TOKEN, variables: { idToken } });
    const accessToken = (data as any)?.loginWithIdToken?.accessToken as string | undefined;
    if (!accessToken) throw new Error('No access token from backend');
    await saveAccessToken(accessToken);
    return true;
  } catch {
    await handleHardSignOut();
    return false;
  }
}

export async function handleHardSignOut(): Promise<void> {
  try {
    const app = getApp();
    const auth = getAuth(app);
    await firebaseSignOut(auth);
  } catch {}
  await clearAccessToken();
  await resetApollo();
}



