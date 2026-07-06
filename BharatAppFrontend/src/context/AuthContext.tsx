import React, {createContext, useContext, useEffect, useMemo, useState, useCallback} from 'react';
import {storage} from '../utils/storage';
import {STORAGE_KEYS} from '../constants/config';
import {User, AIPersonality} from '../types';

interface Session {
  token: string;
  phone: string;
}

interface AuthContextValue {
  initializing: boolean;
  onboarded: boolean;
  session: Session | null;
  user: User | null;
  completeOnboarding: () => void;
  signIn: (phone: string) => void;
  signOut: () => void;
  setAiPersonality: (p: AIPersonality) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const demoUser = (phone: string): User => ({
  id: 'u_demo',
  name: 'Aarav Sharma',
  phone,
  location: 'Baner, Pune',
  language: 'en',
  theme: 'light',
  aiPersonality: 'friendly',
  savedItems: {
    medicines: ['Dolo 650', 'Azithromycin 500'],
    areas: ['Baner, Pune', 'Wakad, Pune'],
    routes: ['Mumbai → Goa'],
    schemes: ['PM Awas Yojana'],
  },
});

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [initializing, setInitializing] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    (async () => {
      const [done, savedSession] = await Promise.all([
        storage.get<boolean>(STORAGE_KEYS.onboardingDone),
        storage.get<Session>(STORAGE_KEYS.session),
      ]);
      if (done) setOnboarded(true);
      if (savedSession) {
        setSession(savedSession);
        setUser(demoUser(savedSession.phone));
      }
      setInitializing(false);
    })();
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboarded(true);
    storage.set(STORAGE_KEYS.onboardingDone, true);
  }, []);

  const signIn = useCallback((phone: string) => {
    const next: Session = {token: `tok_${Date.now()}`, phone};
    setSession(next);
    setUser(demoUser(phone));
    storage.set(STORAGE_KEYS.session, next);
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    setUser(null);
    storage.remove(STORAGE_KEYS.session);
  }, []);

  const setAiPersonality = useCallback((p: AIPersonality) => {
    setUser(prev => (prev ? {...prev, aiPersonality: p} : prev));
    storage.set(STORAGE_KEYS.aiPersonality, p);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({initializing, onboarded, session, user, completeOnboarding, signIn, signOut, setAiPersonality}),
    [initializing, onboarded, session, user, completeOnboarding, signIn, signOut, setAiPersonality],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
