/**
 * API client stub.
 *
 * The whole app runs on local mock data for the prototype. This client mirrors
 * the documented API surface so each mock call can later be swapped 1:1 with a
 * real HTTP request without touching the screens.
 */
import {wait} from '../utils/helpers';

const BASE_URL = 'https://api.bharatsuperapp.example'; // replace in production

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  latencyMs?: number;
}

/**
 * Simulates a network request. In production, replace the body with a real
 * fetch() to `${BASE_URL}${path}` including the session token header.
 */
export async function apiRequest<T>(
  path: string,
  resolver: () => T,
  options: ApiOptions = {},
): Promise<T> {
  await wait(options.latencyMs ?? 600);
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[api] ${options.method ?? 'GET'} ${BASE_URL}${path}`);
  }
  return resolver();
}
