import React, {createContext, useContext, useEffect, useMemo, useState, useCallback} from 'react';
import {useColorScheme} from 'react-native';
import {Theme, lightTheme, darkTheme} from '../theme';
import {storage} from '../utils/storage';
import {STORAGE_KEYS} from '../constants/config';
import {ThemeMode} from '../types';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(system === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    storage.get<ThemeMode>(STORAGE_KEYS.theme).then(saved => {
      if (saved) setModeState(saved);
    });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    storage.set(STORAGE_KEYS.theme, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      storage.set(STORAGE_KEYS.theme, next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: mode === 'dark' ? darkTheme : lightTheme,
      isDark: mode === 'dark',
      mode,
      toggleTheme,
      setMode,
    }),
    [mode, toggleTheme, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};
