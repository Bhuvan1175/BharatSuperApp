import axios from 'axios';

/**
 * Turns any thrown error (axios or otherwise) into a short, user-friendly
 * message. Centralised here so every screen shows consistent errors.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (axios.isAxiosError(error)) {
    // Timeout
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please check your connection and try again.';
    }
    // No response at all → network / server unreachable
    if (!error.response) {
      return 'Network error. Please check your internet connection.';
    }

    // Prefer the backend's own message when present.
    const data = error.response.data as {message?: string | string[]} | undefined;
    const msg = data?.message;
    if (Array.isArray(msg) && msg.length) return msg[0];
    if (typeof msg === 'string' && msg.trim()) return msg;

    // Fall back to a status-based message.
    switch (error.response.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Session expired. Please log in again.';
      case 403:
        return 'You are not allowed to perform this action.';
      case 404:
        return 'Not found.';
      case 409:
        return 'This value is already in use.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return fallback;
    }
  }

  return fallback;
}
