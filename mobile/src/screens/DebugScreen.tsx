import React, { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, View, Pressable, Alert, StyleSheet } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Config from 'react-native-config';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getApp } from '@react-native-firebase/app';
import { getAuth, getIdToken } from '@react-native-firebase/auth';
import { Body, Button, Card, Heading, ScreenContainer } from '../components/ui';
import Clipboard from '@react-native-clipboard/clipboard';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { QUERY_ME } from '../graphql/operations';
import { getAccessToken, saveAccessToken } from '../auth/tokenStorage';
import { jwtDecode } from 'jwt-decode';
import { apolloClient } from '../graphql/client';
import { MUTATION_LOGIN_WITH_ID_TOKEN } from '../graphql/operations';

type TokenInfo = {
  present: boolean;
  exp?: number;
  raw?: string;
};

export default function DebugScreen() {
  const [googleHasPlayServices, setGoogleHasPlayServices] = useState<boolean | null>(null);
  const [googleUserPresent, setGoogleUserPresent] = useState<boolean | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({ present: false });
  const [firebaseUser, setFirebaseUser] = useState<{ uid: string | null; email: string | null }>({ uid: null, email: null });

  useEffect(() => {
    const run = async () => {
      try {
        const has = await GoogleSignin.hasPlayServices();
        setGoogleHasPlayServices(has);
      } catch {
        setGoogleHasPlayServices(false);
      }
      try {
        const gUser = await GoogleSignin.getCurrentUser();
        setGoogleUserPresent(!!gUser);
      } catch {
        setGoogleUserPresent(false);
      }
      const app = getApp();
      const auth = getAuth(app);
      const u = auth.currentUser;
      setFirebaseUser({ uid: u?.uid ?? null, email: u?.email ?? null });

      const tok = await getAccessToken();
      if (tok) {
        try {
          const payload = jwtDecode<{ exp?: number }>(tok);
          setTokenInfo({ present: true, exp: payload?.exp, raw: tok });
        } catch {
          setTokenInfo({ present: true, raw: tok });
        }
      } else {
        setTokenInfo({ present: false });
      }
    };
    run();
  }, []);

  const envInfo = useMemo(() => ({
    GRAPHQL_API_URL: Config.GRAPHQL_API_URL,
    GOOGLE_WEB_CLIENT_ID: Config.GOOGLE_WEB_CLIENT_ID,
  }), []);

  const appInfo = useMemo(() => ({
    platform: Platform.OS,
    bundleId: DeviceInfo.getBundleId(),
    version: DeviceInfo.getVersion(),
    buildNumber: DeviceInfo.getBuildNumber(),
    appName: Config.APP_NAME || Config.APP_DISPLAY_NAME || DeviceInfo.getApplicationName(),
    deviceId: DeviceInfo.getDeviceId(),
    systemVersion: DeviceInfo.getSystemVersion(),
  }), []);

  // no-op: sign-out and clear token actions removed from debug screen

  const onFetchAppToken = async () => {
    try {
      const app = getApp();
      const auth = getAuth(app);
      const freshIdToken = auth.currentUser ? await getIdToken(auth.currentUser, true) : undefined;
      if (!freshIdToken) return;
      const { data } = await apolloClient.mutate({
        mutation: MUTATION_LOGIN_WITH_ID_TOKEN,
        variables: { idToken: freshIdToken },
      });
      const accessToken = (data as any)?.loginWithIdToken?.accessToken as string | undefined;
      if (accessToken) {
        await saveAccessToken(accessToken);
        try {
          const payload = jwtDecode<{ exp?: number }>(accessToken);
          setTokenInfo({ present: true, exp: payload?.exp, raw: accessToken });
        } catch {
          setTokenInfo({ present: true, raw: accessToken });
        }
      }
    } catch (e) {
      console.log('[Debug] Fetch app token failed', e);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView>
        <Card>
          <Heading>App</Heading>
          <Body>Platform: {appInfo.platform}</Body>
          <Body>Bundle ID: {appInfo.bundleId}</Body>
          <Body>Version: {appInfo.version} ({appInfo.buildNumber})</Body>
          <Body>App Name: {appInfo.appName}</Body>
          <Body>Device: {appInfo.deviceId}</Body>
          <Body>System: {appInfo.systemVersion}</Body>
        </Card>

        <View style={styles.spacer12} />

        <Card>
          <Heading>Env</Heading>
          <Body>GRAPHQL_API_URL: {envInfo.GRAPHQL_API_URL || '(not set)'}</Body>
          <Body>GOOGLE_WEB_CLIENT_ID: {envInfo.GOOGLE_WEB_CLIENT_ID ? 'set' : '(not set)'}</Body>
        </Card>

        <View style={styles.spacer12} />

        <Card>
          <Heading>Google</Heading>
          <Body>Play Services: {googleHasPlayServices === null ? '...' : googleHasPlayServices ? 'available' : 'unavailable'}</Body>
          <Body>Signed in: {googleUserPresent === null ? '...' : googleUserPresent ? 'yes' : 'no'}</Body>
        </Card>

        <View style={styles.spacer12} />

        <Card>
          <View style={styles.headerRow}>
            <Heading>Firebase User</Heading>
            {firebaseUser.uid ? (
              <Pressable style={styles.iconButton} onPress={() => { Clipboard.setString(firebaseUser.uid!); Alert.alert('Copied', 'Firebase UID copied to clipboard'); }} accessibilityLabel="Copy Firebase UID" hitSlop={10}>
                <FontAwesome6 name="copy" iconStyle="solid" size={18} color="#0a84ff" />
              </Pressable>
            ) : null}
          </View>
          <Body>Firebase UID: {firebaseUser.uid || '(none)'}</Body>
          <Body>Email: {firebaseUser.email || '(none)'}</Body>
        </Card>

        <View style={styles.spacer12} />

        <Card>
          <View style={styles.headerRow}>
            <Heading>Token</Heading>
            {tokenInfo.present ? (
              <Pressable style={styles.iconButton} onPress={() => { if (tokenInfo.raw) { Clipboard.setString(tokenInfo.raw); Alert.alert('Copied', 'JWT copied to clipboard'); } }} accessibilityLabel="Copy JWT" hitSlop={10}>
                <FontAwesome6 name="copy" iconStyle="solid" size={18} color="#0a84ff" />
              </Pressable>
            ) : null}
          </View>
          <Body>Present: {tokenInfo.present ? 'yes' : 'no'}</Body>
          <Body>Expires: {tokenInfo.exp ? new Date(tokenInfo.exp * 1000).toISOString() : '(unknown)'}</Body>
          <View style={styles.spacer8} />
          {/* GraphQL me info */}
          {tokenInfo.present ? (
            <MeInfo />
          ) : (
            <Body>Sign in to fetch user info from GraphQL.</Body>
          )}
          <View style={styles.spacer8} />
          {!tokenInfo.present ? (
            <>
              {firebaseUser.uid ? (
                <Button title="Fetch app token" onPress={onFetchAppToken} />
              ) : null}
            </>
          ) : null}
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

function MeInfo() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [me, setMe] = React.useState<any | null>(null);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await apolloClient.query({ query: QUERY_ME, fetchPolicy: 'network-only' });
        if (!alive) return;
        setMe((data as any)?.me ?? null);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);
  if (loading) return <Body>Loading user…</Body>;
  if (error) return <Body>Error fetching user: {error}</Body>;
  if (!me) return <Body>No user info returned.</Body>;
  return (
    <>
      <Heading>GraphQL Me</Heading>
      <Body>UID: {me.uid}</Body>
      <Body>Email: {me.email || '(none)'}</Body>
      <Body>Name: {me.displayName || '(none)'}</Body>
      <Body>Provider: {me.lastLoginProvider || '(none)'}</Body>
      <Body>Email Verified: {me.emailVerified ? 'yes' : 'no'}</Body>
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { paddingHorizontal: 8, paddingVertical: 6 },
  spacer12: { height: 12 },
  spacer8: { height: 8 },
});


