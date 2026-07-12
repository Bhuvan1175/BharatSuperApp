import {Platform} from 'react-native';

/**
 * Backend host for development.
 *
 * Android uses `localhost:3000`, which works for BOTH the emulator and a
 * USB-connected physical device provided you run once per session:
 *     adb reverse tcp:3000 tcp:3000
 * This tunnels the device's localhost:3000 → your PC's localhost:3000.
 *
 * iOS SIMULATOR can use localhost directly.
 *
 * Alternative (Wi-Fi, no adb): set the host to your PC's LAN IP, e.g.
 *     'http://192.168.1.5:3000'   (phone + PC on the same Wi-Fi network)
 */
const DEV_HOST = Platform.select({
  android: 'http://localhost:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

export const API_BASE_URL = `${DEV_HOST}/api`;

export const API_TIMEOUT = 15000;
