import axios, {AxiosError, AxiosRequestConfig} from 'axios';
import {API_BASE_URL, API_TIMEOUT} from './config';
import {tokenStorage} from './tokenStorage';
import {RefreshResponse} from './types';

/**
 * Single reusable Axios instance for the whole app.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {'Content-Type': 'application/json'},
});

/**
 * The auth store (Step 12) registers its logout handler here so the
 * interceptor can force a logout when the refresh token is dead — without
 * this file importing the store (which would create a circular import).
 */
let onAuthLogout: (() => void) | null = null;
export const setOnAuthLogout = (fn: () => void) => {
  onAuthLogout = fn;
};

/* -------------------------------------------------------------------------- */
/* REQUEST: attach the access token to every call                             */
/* -------------------------------------------------------------------------- */
apiClient.interceptors.request.use(async config => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* -------------------------------------------------------------------------- */
/* RESPONSE: auto-refresh the access token on a 401, then retry the request    */
/* -------------------------------------------------------------------------- */
let isRefreshing = false;
let pendingQueue: {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}[] = [];

const flushQueue = (error: unknown, token: string | null) => {
  pendingQueue.forEach(p => (token ? p.resolve(token) : p.reject(error)));
  pendingQueue = [];
};

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only try to recover from 401s. Never retry the refresh call itself,
    // and never retry the same request twice.
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    // A refresh is already happening → queue this request until it finishes.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token: string) => {
            originalRequest.headers = originalRequest.headers ?? {};
            (originalRequest.headers as Record<string, string>).Authorization =
              `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Bare axios call so this bypasses our interceptors (no loops).
      const {data} = await axios.post<RefreshResponse>(
        `${API_BASE_URL}/auth/refresh`,
        {refreshToken},
        {timeout: API_TIMEOUT},
      );

      await tokenStorage.saveTokens(data.accessToken, data.refreshToken);
      flushQueue(null, data.accessToken);

      originalRequest.headers = originalRequest.headers ?? {};
      (originalRequest.headers as Record<string, string>).Authorization =
        `Bearer ${data.accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh token is expired/invalid → clear session and log the user out.
      flushQueue(refreshError, null);
      await tokenStorage.clearTokens();
      onAuthLogout?.();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
