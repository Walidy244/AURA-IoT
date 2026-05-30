import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_API_HOST = 'http://192.168.0.106:8080';
const DEFAULT_WEB_API_HOST = 'http://localhost:8080';

const getConfiguredApiHost = () => {
  const extraApiUrl =
    Constants.expoConfig?.extra?.apiUrl as string | undefined ||
    (Constants.manifest as any)?.extra?.apiUrl as string | undefined;

  if (extraApiUrl) {
    return extraApiUrl.replace(/\/$/, '');
  }

  const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envApiUrl) {
    return envApiUrl.replace(/\/$/, '');
  }

  if (Platform.OS === 'web') {
    return DEFAULT_WEB_API_HOST;
  }

  return DEFAULT_API_HOST;
};

export const getApiBase = () => {
  return `${getConfiguredApiHost()}/`;
};

export const getApiPath = (path: string) => {
  return `${getApiBase()}${path.replace(/^\//, '')}`;
};

export const getLogsApiUrl = () => getApiPath('api/logs/');

export type LedRgb = {
  r: number;
  g: number;
  b: number;
};

export const getLedStateApiUrl = () => getApiPath('api/led/state');

export const getLedColorApiUrl = () => getApiPath('api/led/color');

export const postLedColor = async ({ r, g, b }: LedRgb): Promise<LedRgb> => {
  const response = await fetch(getLedColorApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ r, g, b }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to set LED color (${response.status})`);
  }

  return response.json();
};
