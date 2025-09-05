import React, { useEffect, useMemo, useState } from 'react';
import { Platform, View, Pressable, Alert, StyleSheet, Text, Animated, ActivityIndicator } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Config from 'react-native-config';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getApp } from '@react-native-firebase/app';
import { getAuth, getIdToken } from '@react-native-firebase/auth';
import { Card, Screen } from '../components';
import Clipboard from '@react-native-clipboard/clipboard';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { QUERY_ME } from '../graphql/operations';
import { getAccessToken, saveAccessToken } from '../auth/tokenStorage';
import { jwtDecode } from 'jwt-decode';
import { apolloClient } from '../graphql/client';
import { MUTATION_LOGIN_WITH_ID_TOKEN } from '../graphql/operations';
import { useAppSelector } from '../store/hooks';
import { selectAuth } from '../features/auth/selectors';
import { useTheme } from '../theme/ThemeProvider';
import { useQuery } from '@apollo/client/react';

type TokenInfo = {
  present: boolean;
  exp?: number;
  raw?: string;
};

export default function DebugScreen() {
  const [googleHasPlayServices, setGoogleHasPlayServices] = useState<boolean | null>(null);
  const [googleUserPresent, setGoogleUserPresent] = useState<boolean | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({ present: false });
  const [firebaseUser, setFirebaseUser] = useState<{ uid: string | null; email: string | null; providers: string[] }>({ uid: null, email: null, providers: [] });
  const [reduxState, setReduxState] = useState<string | null>(null);
  const [showReduxState, setShowReduxState] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['app'])); // Start with app expanded
  
  const authState = useAppSelector(selectAuth);
  const { colors } = useTheme();

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
      const providers = u?.providerData?.map(provider => {
        switch (provider.providerId) {
          case 'google.com': return 'Google';
          case 'apple.com': return 'Apple';
          case 'password': return 'Email/Password';
          case 'phone': return 'Phone';
          default: return provider.providerId;
        }
      }) || [];
      setFirebaseUser({ uid: u?.uid ?? null, email: u?.email ?? null, providers });

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
      console.log('[Debug] Fetching app token...');
      const app = getApp();
      const auth = getAuth(app);
      const freshIdToken = auth.currentUser ? await getIdToken(auth.currentUser, true) : undefined;
      if (!freshIdToken) {
        console.log('[Debug] No fresh ID token available');
        return;
      }
      console.log('[Debug] Got fresh ID token, calling GraphQL mutation...');
      const { data } = await apolloClient.mutate({
        mutation: MUTATION_LOGIN_WITH_ID_TOKEN,
        variables: { idToken: freshIdToken },
      });
      const accessToken = (data as any)?.loginWithIdToken?.accessToken as string | undefined;
      if (accessToken) {
        console.log('[Debug] Got access token, saving...');
        await saveAccessToken(accessToken);
        console.log('[Debug] Access token saved, refreshing token info...');
        await refreshTokenInfo();
      } else {
        console.log('[Debug] No access token in response');
      }
    } catch (e) {
      console.log('[Debug] Fetch app token failed', e);
    }
  };

  const onFetchReduxState = () => {
    const state = JSON.stringify(authState, null, 2);
    setReduxState(state);
    setShowReduxState(true);
  };

  const refreshTokenInfo = async () => {
    console.log('[Debug] Refreshing token info...');
    const tok = await getAccessToken();
    if (tok) {
      try {
        const payload = jwtDecode<{ exp?: number }>(tok);
        setTokenInfo({ present: true, exp: payload?.exp, raw: tok });
        console.log('[Debug] Token info refreshed: present=true');
      } catch {
        setTokenInfo({ present: true, raw: tok });
        console.log('[Debug] Token info refreshed: present=true (without exp)');
      }
    } else {
      setTokenInfo({ present: false });
      console.log('[Debug] Token info refreshed: present=false');
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const isExpanded = (sectionId: string) => expandedSections.has(sectionId);

  const sections: Array<{
    id: string;
    title: string;
    content: React.ReactNode;
    rightElement?: React.ReactNode;
  }> = [
    {
      id: 'app',
      title: 'App',
      content: (
        <>
          <InfoRow label="App Name" value={appInfo.appName} />
          <InfoRow label="Bundle ID" value={appInfo.bundleId} />
          <InfoRow label="Platform" value={appInfo.platform} />
          <InfoRow label="Version" value={`${appInfo.version} (${appInfo.buildNumber})`} />
          <InfoRow label="Device" value={appInfo.deviceId} />
        </>
      ),
    },
    {
      id: 'env',
      title: 'Environment',
      content: (
        <>
          <InfoRow label="GraphQL URL" value={envInfo.GRAPHQL_API_URL || '(not set)'} />
          <InfoRow label="Google Client ID" value={envInfo.GOOGLE_WEB_CLIENT_ID || '(not set)'} />
        </>
      ),
    },
    {
      id: 'google',
      title: 'Google Services',
      content: (
        <>
          <InfoRow label="Play Services" value={googleHasPlayServices === null ? '...' : googleHasPlayServices ? 'available' : 'unavailable'} />
          <InfoRow label="Signed in" value={googleUserPresent === null ? '...' : googleUserPresent ? 'yes' : 'no'} />
        </>
      ),
    },
    {
      id: 'firebase',
      title: 'Firebase User',
      content: (
        <>
          <InfoRow label="UID" value={firebaseUser.uid || '(none)'} />
          <InfoRow label="Email" value={firebaseUser.email || '(none)'} />
          <InfoRow label="Auth Providers" value={firebaseUser.providers.length > 0 ? firebaseUser.providers.join(', ') : '(none)'} />
        </>
      ),
    },
    {
      id: 'redux',
      title: 'Redux State',
      content: (
        <>
          <InfoRow label="Authenticated" value={authState.isAuthenticated ? 'yes' : 'no'} />
          <InfoRow label="Initialized" value={authState.initialized ? 'yes' : 'no'} />
          <InfoRow label="User ID" value={authState.user?.id || '(none)'} />
          <InfoRow label="Last Login Provider" value={authState.user?.lastLoginProvider || '(none)'} />
          <View style={[styles.horizontalRule, { backgroundColor: colors.border }]} />
          <Pressable style={styles.fetchButton} onPress={onFetchReduxState}>
            <Text style={styles.fetchButtonText}>Fetch State</Text>
          </Pressable>
          {showReduxState && reduxState && (
            <View style={[styles.jsonContainer, { backgroundColor: colors.card }]}>
              <View style={styles.jsonHeader}>
                <Text style={[styles.jsonText, { color: colors.text }]}>Redux State JSON</Text>
                <Pressable 
                  style={styles.iconButton} 
                  onPress={() => { 
                    Clipboard.setString(reduxState); 
                    Alert.alert('Copied', 'Redux state copied to clipboard'); 
                  }} 
                  accessibilityLabel="Copy Redux State" 
                  hitSlop={10}
                >
                  <FontAwesome6 name="copy" iconStyle="solid" size={16} color="#0a84ff" />
                </Pressable>
              </View>
              <Text style={[styles.jsonText, { color: colors.text }]}>{reduxState}</Text>
            </View>
          )}
        </>
      ),
    },
    {
      id: 'token',
      title: 'JWT Token',
      content: (
        <>
          <InfoRow label="Present" value={tokenInfo.present ? 'yes' : 'no'} />
          <InfoRow label="Expires" value={tokenInfo.exp ? new Date(tokenInfo.exp * 1000).toISOString() : '(unknown)'} />
          <InfoRow label="Last Login Provider" value={authState.user?.lastLoginProvider || '(not set)'} />
          {tokenInfo.present && tokenInfo.raw && (
            <InfoRow label="JWT Token" value={tokenInfo.raw} />
          )}
          {tokenInfo.present ? (
            <CompactMeInfo />
          ) : (
            <Text style={[styles.note, { color: colors.mutedText }]}>Sign in to fetch user info from GraphQL.</Text>
          )}
          {!tokenInfo.present && firebaseUser.uid && (
            <Pressable style={styles.fetchButton} onPress={onFetchAppToken}>
              <Text style={styles.fetchButtonText}>Fetch app token</Text>
            </Pressable>
          )}
        </>
      ),
    },
  ];

  return (
    <Screen>
      {sections.map((section, index) => (
        <View key={section.id} style={index > 0 ? styles.sectionSpacer : undefined}>
          <AccordionSection
            title={section.title}
            isExpanded={isExpanded(section.id)}
            onToggle={() => toggleSection(section.id)}
            rightElement={section.rightElement || undefined}
          >
            {section.content}
          </AccordionSection>
        </View>
      ))}
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.mutedText }]}>{label}:</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{value}</Text>
        <Pressable 
          style={styles.iconButton} 
          onPress={() => { 
            Clipboard.setString(value); 
            Alert.alert('Copied', `${label} copied to clipboard`); 
          }} 
          accessibilityLabel={`Copy ${label}`} 
          hitSlop={10}
        >
          <FontAwesome6 name="copy" iconStyle="solid" size={16} color="#0a84ff" />
        </Pressable>
      </View>
    </View>
  );
}

function AccordionSection({ 
  title, 
  children, 
  isExpanded, 
  onToggle, 
  rightElement 
}: { 
  title: string; 
  children: React.ReactNode; 
  isExpanded: boolean; 
  onToggle: () => void; 
  rightElement?: React.ReactNode; 
}) {
  const { colors } = useTheme();
  const rotateAnim = React.useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  const heightAnim = React.useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(heightAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isExpanded, rotateAnim, heightAnim]);

  return (
    <Card style={styles.card}>
      <Pressable style={styles.accordionHeader} onPress={onToggle}>
        <View style={styles.accordionTitleRow}>
          <Animated.View style={{
            transform: [{
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '90deg'],
              }),
            }],
          }}>
            <FontAwesome6 name="chevron-right" iconStyle="solid" size={14} color={colors.text} />
          </Animated.View>
          <Text style={[styles.accordionTitle, { color: colors.text }]}>{title}</Text>
        </View>
        {rightElement}
      </Pressable>
      <Animated.View style={{
        overflow: 'hidden',
        opacity: heightAnim,
        maxHeight: heightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1000],
        }),
      }}>
        <View style={styles.contentContainer}>
          {children}
        </View>
      </Animated.View>
    </Card>
  );
}

function CompactMeInfo() {
  const { colors } = useTheme();
  const { data, loading, error } = useQuery<{ me?: any }>(QUERY_ME, {
    fetchPolicy: 'network-only',
  });
  
  const me = data?.me;
  
  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color={colors.text} />
      <Text style={[styles.loadingText, { color: colors.mutedText }]}>Loading user…</Text>
    </View>
  );
  if (error) return <Text style={[styles.note, { color: colors.mutedText }]}>Error: {error.message}</Text>;
  if (!me) return <Text style={[styles.note, { color: colors.mutedText }]}>No user info returned.</Text>;
  
  return (
    <>
      <InfoRow label="GraphQL UID" value={me.uid} />
      <InfoRow label="Email" value={me.email || '(none)'} />
      <InfoRow label="Name" value={me.displayName || '(none)'} />
      <InfoRow label="Providers" value={Array.isArray(me.identities) && me.identities.length > 0 ? me.identities.map((p: any) => p.providerId).join(', ') : '(none)'} />
      <InfoRow label="Last Login Provider" value={me.lastLoginProvider || '(not set)'} />
    </>
  );
}

const styles = StyleSheet.create({
  iconButton: { paddingHorizontal: 8, paddingVertical: 0 },
  sectionSpacer: { marginTop: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 32, paddingVertical: 6 },
  label: { fontSize: 14, flex: 0, marginRight: 8 },
  valueRow: { flexDirection: 'row', alignItems: 'center', flex: 1, maxWidth: '60%' },
  value: { fontSize: 14, flex: 1, textAlign: 'right', marginRight: 8 },
  note: { fontSize: 14, fontStyle: 'italic', marginTop: 4 },
  horizontalRule: { height: 1, marginVertical: 12 },
  jsonContainer: { padding: 8, borderRadius: 4, marginTop: 8 },
  jsonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  jsonText: { fontSize: 12, fontFamily: 'monospace' },
  card: { padding: 20, margin: 0, gap: 0 },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 0 },
  accordionTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  accordionTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
  fetchButton: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, alignSelf: 'flex-start' },
  fetchButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '500' },
  contentContainer: { paddingVertical: 0, paddingTop: 12 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  loadingText: { fontSize: 14, marginLeft: 8 },
});


