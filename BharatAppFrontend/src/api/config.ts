import {Platform} from 'react-native';

const DEV_HOST = Platform.select({
  android: 'http://localhost:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

export const API_BASE_URL = `${DEV_HOST}/api`;

export const API_TIMEOUT = 15000;