import React, {createContext, useContext, useEffect, useMemo, useState, useCallback} from 'react';
import {translations, Translation} from '../localization';
import {storage} from '../utils/storage';
import {STORAGE_KEYS} from '../constants/config';
import {LanguageCode} from '../types';

interface LanguageContextValue {
  language: LanguageCode;
  t: Translation;
  setLanguage: (code: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    storage.get<LanguageCode>(STORAGE_KEYS.language).then(saved => {
      if (saved) setLanguageState(saved);
    });
  }, []);

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    storage.set(STORAGE_KEYS.language, code);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({language, t: translations[language], setLanguage}),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};
