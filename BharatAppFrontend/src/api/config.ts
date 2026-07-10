import {Platform} from 'react-native';

/**
 * Base host for the NestJS backend.
 *
 * The backend listens on port 3000 with a global "/api" prefix, so every
 * request goes to `<host>:3000/api/...`.
 *
 * Host differs per environment:
 *  - Android emulator: the host machine's localhost is reachable at 10.0.2.2
 *  - iOS simulator:    localhost works directly
 *  - Real device:      use your computer's LAN IP (phone + PC on same Wi-Fi),
 *                      e.g. 'http://192.168.1.5:3000'  <-- CHANGE THIS ONE
 */
const DEV_HOST = Platform.select({
  android: 'http://10.128.20.249:3000',
  ios: 'http://10.128.20.249:3000',
  default: 'http://10.128.20.249:3000',
});

export const API_BASE_URL = `${DEV_HOST}/api`;

/** Abort a request after this many ms (used for timeout handling). */
export const API_TIMEOUT = 15000;
