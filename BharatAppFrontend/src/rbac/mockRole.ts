import {Role} from './types';

/**
 * MOCK ROLE — the temporary role source used before the backend was connected.
 *
 * ✅ NOW LIVE: USE_MOCK_ROLE is false, so the role comes from the backend login
 * (the user's `role.name` in the verify-otp / profile response). A Medicine
 * officer lands on the Medicine dashboard, a citizen on the citizen tabs, etc.
 *
 * Set USE_MOCK_ROLE = true again only if you want to demo dashboards without a
 * backend (the DevRoleSwitcher then drives the role).
 */
export const USE_MOCK_ROLE = false;

/** Fallback role used only when USE_MOCK_ROLE is true. */
export const MOCK_ROLE: Role = 'PUBLIC_USER';
