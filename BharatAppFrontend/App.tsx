/**
 * Bharat Super App
 * An AI-powered lifestyle super app for India.
 *
 * @format
 */
import React from 'react';
import {StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClientProvider} from '@tanstack/react-query';

import {ThemeProvider, useTheme} from '@context/ThemeContext';
import {LanguageProvider} from '@context/LanguageContext';
import {AuthProvider} from '@context/AuthContext';
import {AppDataProvider} from '@context/AppDataContext';
import {RemindersProvider} from '@context/RemindersContext';
import RootNavigator from '@navigation/RootNavigator';
import {queryClient} from '@/api/queryClient';

/**
 * Renders the status bar with colors bound to the active theme so it stays
 * correct when the user toggles dark mode at runtime.
 */
const ThemedStatusBar: React.FC = () => {
  const {theme, isDark} = useTheme();
  return (
    <StatusBar
      barStyle={isDark ? 'light-content' : 'dark-content'}
      backgroundColor={theme.colors.background}
      translucent={false}
    />
  );
};

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                <AppDataProvider>
                  <RemindersProvider>
                    <ThemedStatusBar />
                    <RootNavigator />
                  </RemindersProvider>
                </AppDataProvider>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
};

export default App;
