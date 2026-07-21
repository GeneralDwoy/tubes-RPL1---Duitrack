import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const TOKEN_KEY = 'duitrack.auth.token';

function resolveApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  if (Platform.OS === 'web') return 'http://localhost:3000';

  const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
  return expoHost ? `http://${expoHost}:3000` : 'http://localhost:3000';
}

export const apiBaseUrl = resolveApiBaseUrl();

export function resolveApiAssetUrl(value: string | null) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${apiBaseUrl}${value.startsWith('/') ? '' : '/'}${value}`;
}

export class ApiError extends Error {
  code?: string;
  data?: Record<string, unknown>;
  status: number;

  constructor(
    message: string,
    status = 0,
    code?: string,
    data?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

export async function setApiToken(token: string | null) {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export async function getApiToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

type ApiOptions = {
  auth?: boolean;
  body?: unknown;
  method?: 'DELETE' | 'GET' | 'POST' | 'PUT';
};

type ApiEnvelope<T> = {
  code?: string;
  data?: T;
  message?: string;
  status: string;
};

export async function apiRequest<T>(path: string, options: ApiOptions = {}) {
  const { auth = true, body, method = 'GET' } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = await getApiToken();
    if (!token) throw new ApiError('Sesi pengguna tidak ditemukan. Silakan masuk kembali.', 401);
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api${path}`, {
      body: body === undefined ? undefined : JSON.stringify(body),
      headers,
      method,
    });
    const text = await response.text();
    const payload = text ? (JSON.parse(text) as ApiEnvelope<T>) : ({ status: 'success' } as ApiEnvelope<T>);

    if (!response.ok) {
      throw new ApiError(
        payload.message || 'Permintaan ke server gagal.',
        response.status,
        payload.code,
        payload.data as Record<string, unknown> | undefined,
      );
    }

    return payload.data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      `Tidak dapat terhubung ke backend DuiTrack di ${apiBaseUrl}. Pastikan backend sudah dinyalakan.`,
    );
  }
}

export async function apiFormRequest<T>(path: string, body: FormData, method: 'POST' | 'PUT') {
  const token = await getApiToken();
  if (!token) throw new ApiError('Sesi pengguna tidak ditemukan. Silakan masuk kembali.', 401);

  try {
    const response = await fetch(`${apiBaseUrl}/api${path}`, {
      body,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      method,
    });
    const text = await response.text();
    const payload = text ? (JSON.parse(text) as ApiEnvelope<T>) : ({ status: 'success' } as ApiEnvelope<T>);

    if (!response.ok) {
      throw new ApiError(
        payload.message || 'Permintaan ke server gagal.',
        response.status,
        payload.code,
        payload.data as Record<string, unknown> | undefined,
      );
    }

    return payload.data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      `Tidak dapat terhubung ke backend DuiTrack di ${apiBaseUrl}. Pastikan backend sudah dinyalakan.`,
    );
  }
}
