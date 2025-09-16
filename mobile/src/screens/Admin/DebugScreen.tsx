import React, { useEffect, useMemo, useState } from 'react';
import { Platform, View, Pressable, Alert, StyleSheet, Text, Animated, ActivityIndicator, Switch, ScrollView } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Config from 'react-native-config';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getApp } from '@react-native-firebase/app';
import { getAuth, getIdToken } from '@react-native-firebase/auth';
import { Card, Screen } from '../../components';
import Clipboard from '@react-native-clipboard/clipboard';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { QUERY_ME } from '../../graphql/operations';
import { getAccessToken, saveAccessToken } from '../../auth/tokenStorage';
import { jwtDecode } from 'jwt-decode';
import { apolloClient } from '../../graphql/client';
import { MUTATION_LOGIN_WITH_ID_TOKEN } from '../../graphql/operations';
import { useAppSelector } from '../../store/hooks';
import { selectAuth } from '../../features/auth/selectors';
import { useTheme } from '../../theme/ThemeProvider';
import { useQuery } from '@apollo/client/react';
import { testUtils } from '../../hooks/useNetworkStatus';
import { selectIsOnline } from '../../store/offlineSlice';
import { PlistToJsonConverter } from '../../native';

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
  const [plistData, setPlistData] = useState<{ [key: string]: Record<string, unknown> }>({});
  const [activePlistFile, setActivePlistFile] = useState<string | null>(null);
  
  const authState = useAppSelector(selectAuth);
  const isOnline = useAppSelector(selectIsOnline);
  const { colors, borderRadius } = useTheme();

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

  const envInfo = useMemo(() => {
    const configEntries: { [key: string]: string } = {};
    for (const key in Config) {
      if (typeof Config[key] === 'function') continue;
      configEntries[key] = Config[key] || '(not set)';
    }
    return configEntries;
  }, []);

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
      const accessToken = (data as { loginWithIdToken?: { accessToken?: string } })?.loginWithIdToken?.accessToken;
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

  const onReadPlistFile = async (fileName: string) => {
    setActivePlistFile(fileName);
    
    try {
      const data = await PlistToJsonConverter.convertPlistToJson(fileName);
      setPlistData({ [fileName]: data });
    } catch (error) {
      setPlistData({ 
        [fileName]: { 
          error: true, 
          message: error instanceof Error ? error.message : String(error),
          fileName 
        } 
      });
      Alert.alert('Error', `Failed to read ${fileName}: ${error}`);
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
      id: 'offline',
      title: 'Offline Testing',
      content: (
        <>
          <InfoRow label="Network Status" value={isOnline ? 'Online' : 'Offline'} />
          <View style={styles.toggleContainer}>
            <Text style={[{ color: colors.text }, styles.toggleLabel]}>
              Simulate Offline Mode
            </Text>
            <Switch
              value={!isOnline}
              onValueChange={(value) => {
                testUtils?.setOfflineMode?.(value);
              }}
            />
          </View>
        </>
      ),
    },
    {
      id: 'env',
      title: 'Environment',
      content: (
        <>
          {Object.entries(envInfo).map(([key, value]) => (
            <InfoRow key={key} label={key} value={value} />
          ))}
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
          <View style={[{ backgroundColor: colors.border }, styles.horizontalRule]} />
          <Pressable style={[{ borderRadius: borderRadius.sm }, styles.fetchButton]} onPress={onFetchReduxState}>
            <Text style={styles.fetchButtonText}>Fetch State</Text>
          </Pressable>
          {showReduxState && reduxState && (
            <View style={[{ backgroundColor: colors.card, borderRadius: borderRadius.sm }, styles.jsonContainer]}>
              <View style={styles.jsonHeader}>
                <Text style={[{ color: colors.text }, styles.jsonText]}>Redux State JSON</Text>
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
              <ScrollView style={[{ backgroundColor: colors.background }, styles.jsonScrollView]} showsVerticalScrollIndicator={true}>
                <Text style={[{ color: colors.text }, styles.jsonText]}>{reduxState}</Text>
              </ScrollView>
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
            <Text style={[{ color: colors.mutedText }, styles.note]}>Sign in to fetch user info from GraphQL.</Text>
          )}
          {!tokenInfo.present && firebaseUser.uid && (
            <Pressable style={[{ borderRadius: borderRadius.sm }, styles.fetchButton]} onPress={onFetchAppToken}>
              <Text style={styles.fetchButtonText}>Fetch app token</Text>
            </Pressable>
          )}
        </>
      ),
    },
    ...(Platform.OS === 'ios' ? [{
      id: 'plist',
      title: 'Plist Files',
      content: (
        <>
          <View style={styles.pillContainer}>
            <Pressable 
              style={[
                styles.pill,
                activePlistFile === 'Info.plist' && styles.pillActive
              ]} 
              onPress={() => onReadPlistFile('Info.plist')}
            >
              <Text style={[
                styles.pillText,
                activePlistFile === 'Info.plist' && styles.pillTextActive
              ]}>Info.plist</Text>
            </Pressable>
            <Pressable 
              style={[
                styles.pill,
                activePlistFile === 'GoogleService-Info.plist' && styles.pillActive
              ]} 
              onPress={() => onReadPlistFile('GoogleService-Info.plist')}
            >
              <Text style={[
                styles.pillText,
                activePlistFile === 'GoogleService-Info.plist' && styles.pillTextActive
              ]}>GoogleService-Info.plist</Text>
            </Pressable>
          </View>
          {Object.entries(plistData).map(([fileName, data]) => (
              <View key={fileName} style={[{ backgroundColor: colors.card, borderRadius: borderRadius.sm }, styles.jsonContainer]}>
                <View style={styles.jsonHeader}>
                  <Text style={[{ color: colors.text }, styles.jsonText]}>{fileName}</Text>
                  <Pressable 
                    style={styles.iconButton} 
                    onPress={() => { 
                      Clipboard.setString(JSON.stringify(data, null, 2)); 
                      Alert.alert('Copied', `${fileName} copied to clipboard`); 
                    }} 
                    accessibilityLabel={`Copy ${fileName}`} 
                    hitSlop={10}
                  >
                    <FontAwesome6 name="copy" iconStyle="solid" size={16} color="#0a84ff" />
                  </Pressable>
                </View>
                <ScrollView style={[{ backgroundColor: colors.background }, styles.jsonScrollView]} showsVerticalScrollIndicator={true}>
                  {data && typeof data === 'object' && 'error' in data ? (
                    <Text style={[styles.errorText, styles.jsonText]}>
                      Error: {String(data.message)}
                    </Text>
                  ) : (
                    <Text style={[{ color: colors.text }, styles.jsonText]}>{JSON.stringify(data, null, 2)}</Text>
                  )}
                </ScrollView>
              </View>
          ))}
        </>
      ),
    }] : []),
  ];

  return (
    <Screen scroll={true}>
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
      <Text style={[{ color: colors.mutedText }, styles.label]}>{label}:</Text>
      <View style={styles.valueRow}>
        <Text style={[{ color: colors.text }, styles.value]} numberOfLines={1} ellipsizeMode="tail">{value}</Text>
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
          <Text style={[{ color: colors.text }, styles.accordionTitle]}>{title}</Text>
        </View>
        {rightElement}
      </Pressable>
      <Animated.View style={[
        styles.animatedContainer,
        {
          opacity: heightAnim,
          maxHeight: heightAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1000],
          }),
        }
      ]}>
        <View style={styles.contentContainer}>
          {children}
        </View>
      </Animated.View>
    </Card>
  );
}

function CompactMeInfo() {
  const { colors } = useTheme();
  const { data, loading, error } = useQuery<{ me?: unknown }>(QUERY_ME, {
    fetchPolicy: 'network-only',
  });
  
  const me = data?.me as { uid?: string; email?: string; displayName?: string; identities?: { providerId: string }[]; lastLoginProvider?: string } | undefined;
  
  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color={colors.text} />
      <Text style={[{ color: colors.mutedText }, styles.loadingText]}>Loading user…</Text>
    </View>
  );
  if (error) return <Text style={[{ color: colors.mutedText }, styles.note]}>Error: {error.message}</Text>;
  if (!me) return <Text style={[{ color: colors.mutedText }, styles.note]}>No user info returned.</Text>;
  
  return (
    <>
      <InfoRow label="GraphQL UID" value={me?.uid || '(none)'} />
      <InfoRow label="Email" value={me?.email || '(none)'} />
      <InfoRow label="Name" value={me?.displayName || '(none)'} />
      <InfoRow label="Providers" value={Array.isArray(me?.identities) && me.identities!.length > 0 ? me.identities!.map((p: { providerId: string }) => p.providerId).join(', ') : '(none)'} />
      <InfoRow label="Last Login Provider" value={me?.lastLoginProvider || '(not set)'} />
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
  jsonContainer: { 
    padding: 12, 
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 8,
  },
  jsonHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  jsonScrollView: { 
    maxHeight: 200,
    borderRadius: 6,
    padding: 8,
  },
  jsonText: { fontSize: 12, fontFamily: 'monospace' },
  errorText: { color: '#ff3b30' },
  card: { padding: 20, margin: 0, gap: 0 },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 0 },
  accordionTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  accordionTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
  animatedContainer: { overflow: 'hidden' },
  fetchButton: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  fetchButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '500' },
  contentContainer: { paddingVertical: 0, paddingTop: 12 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  loadingText: { fontSize: 14, marginLeft: 8 },
  toggleContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 12,
    paddingVertical: 8,
  },
  toggleLabel: { 
    fontSize: 14, 
    fontWeight: '500',
    flex: 1,
  },
  pillContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
  },
  pillActive: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  pillText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#ffffff',
  },
});


