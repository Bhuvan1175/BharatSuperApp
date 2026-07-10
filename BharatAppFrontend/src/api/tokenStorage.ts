import {storage} from '../utils/storage';
import {STORAGE_KEYS} from '../constants/config';

/**
 * Reusable helpers for persisting the JWT access & refresh tokens.
 * Built on the existing AsyncStorage wrapper (src/utils/storage.ts).
 */
export const tokenStorage = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      storage.set(STORAGE_KEYS.accessToken, accessToken),
      storage.set(STORAGE_KEYS.refreshToken, refreshToken),
    ]);
  },

  getAccessToken(): Promise<string | null> {
    return storage.get<string>(STORAGE_KEYS.accessToken);
  },

  getRefreshToken(): Promise<string | null> {
    return storage.get<string>(STORAGE_KEYS.refreshToken);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      storage.remove(STORAGE_KEYS.accessToken),
      storage.remove(STORAGE_KEYS.refreshToken),
    ]);
  },
};
