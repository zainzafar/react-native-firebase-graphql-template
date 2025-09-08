/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar, Platform } from 'react-native';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { AuthProvider } from './src/auth/AuthProvider';
import RootNavigator from './src/navigation/RootNavigator';
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from './src/graphql/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from './src/store';
import { UpdateBottomSheet, useAppUpdateGate } from './src/update';
import { useNetworkStatus } from './src/hooks/useNetworkStatus';

function AppContent() {
  const { colors } = useTheme();

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar 
          barStyle={colors.statusBarContent} 
          backgroundColor={Platform.OS === 'android' ? colors.background : undefined}
          translucent={false}
        />
        <NavigationContainer>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <ApolloProvider client={apolloClient}>
                <AuthProvider>
                  <AppWithNetworkStatus />
                </AuthProvider>
                <AppUpdateGate />
              </ApolloProvider>
            </PersistGate>
          </Provider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppWithNetworkStatus() {
  // Initialize network status monitoring inside Redux Provider
  useNetworkStatus();

  return <RootNavigator />;
}

function AppUpdateGate() {
  const { gate, openStore, snoozeSoft, skip } = useAppUpdateGate();

  return (
    <UpdateBottomSheet
      visible={gate.hard || gate.soft}
      hard={gate.hard}
      message={gate.message}
      canSkip={gate.canSkip}
      onUpdate={openStore}
      onLater={!gate.hard ? snoozeSoft : undefined}
      onSkip={gate.canSkip ? skip : undefined}
      onClose={!gate.hard ? snoozeSoft : undefined}
    />
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = {
  container: { flex: 1 },
};

export default App;

