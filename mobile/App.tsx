/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { AuthProvider } from './src/auth/AuthProvider';
import RootNavigator from './src/navigation/RootNavigator';
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from './src/graphql/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from './src/store';
import { UpdateBottomSheet, useAppUpdateGate } from './src/update';

function AppContent() {
  const { isDark } = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar 
          barStyle={isDark ? 'light-content' : 'dark-content'} 
          backgroundColor={isDark ? '#000000' : '#ffffff'}
          translucent={false}
        />
        <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <ApolloProvider client={apolloClient}>
                <AuthProvider>
                  <RootNavigator />
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
export default App;

