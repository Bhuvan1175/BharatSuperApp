import React, {createContext, useContext, useEffect, useMemo, useState, useCallback} from 'react';
import {storage} from '../utils/storage';
import {STORAGE_KEYS, APP_CONFIG} from '../constants/config';
import {RecentSearch, SavedItems} from '../types';
import {uid} from '../utils/helpers';

type SavedKey = keyof SavedItems;

interface AppDataContextValue {
  recents: RecentSearch[];
  addRecent: (query: string) => void;
  clearRecents: () => void;
  saved: SavedItems;
  toggleSaved: (key: SavedKey, value: string) => void;
  isSaved: (key: SavedKey, value: string) => boolean;
}

const emptySaved: SavedItems = {medicines: [], areas: [], routes: [], schemes: []};

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export const AppDataProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [recents, setRecents] = useState<RecentSearch[]>([]);
  const [saved, setSaved] = useState<SavedItems>({
    medicines: ['Dolo 650'],
    areas: ['Baner, Pune'],
    routes: ['Mumbai → Goa'],
    schemes: ['PM Awas Yojana'],
  });

  useEffect(() => {
    storage.get<RecentSearch[]>(STORAGE_KEYS.recents).then(r => r && setRecents(r));
    storage.get<SavedItems>(STORAGE_KEYS.savedItems).then(s => s && setSaved(s));
  }, []);

  const addRecent = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecents(prev => {
      const filtered = prev.filter(r => r.query.toLowerCase() !== trimmed.toLowerCase());
      const next = [{id: uid('recent'), query: trimmed, at: Date.now()}, ...filtered].slice(
        0,
        APP_CONFIG.maxRecentSearches,
      );
      storage.set(STORAGE_KEYS.recents, next);
      return next;
    });
  }, []);

  const clearRecents = useCallback(() => {
    setRecents([]);
    storage.set(STORAGE_KEYS.recents, []);
  }, []);

  const toggleSaved = useCallback((key: SavedKey, value: string) => {
    setSaved(prev => {
      const list = prev[key];
      const exists = list.includes(value);
      const nextList = exists ? list.filter(v => v !== value) : [...list, value];
      const next = {...prev, [key]: nextList};
      storage.set(STORAGE_KEYS.savedItems, next);
      return next;
    });
  }, []);

  const isSaved = useCallback(
    (key: SavedKey, value: string) => saved[key].includes(value),
    [saved],
  );

  const value = useMemo<AppDataContextValue>(
    () => ({recents, addRecent, clearRecents, saved, toggleSaved, isSaved}),
    [recents, addRecent, clearRecents, saved, toggleSaved, isSaved],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = (): AppDataContextValue => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within an AppDataProvider');
  return ctx;
};

export {emptySaved};
