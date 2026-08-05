const TOKEN_KEY = 'duitrack.auth.token';

function resolveApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');
  return 'http://localhost:3000';
}

export const apiBaseUrl = resolveApiBaseUrl();


export function resolveApiAssetUrl(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${apiBaseUrl}${value.startsWith('/') ? '' : '/'}${value}`;
}

export class ApiError extends Error {
  constructor(message, status = 0, code, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

export async function setApiToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function getApiToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export async function apiRequest(path, options = {}) {
  const { auth = true, body, method = 'GET' } = options;
  const headers = { Accept: 'application/json' };

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
    const payload = text ? JSON.parse(text) : { status: 'success' };

    if (!response.ok) {
      throw new ApiError(
        payload.message || 'Permintaan ke server gagal.',
        response.status,
        payload.code,
        payload.data,
      );
    }

    return payload.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      `Tidak dapat terhubung ke backend DuiTrack di ${apiBaseUrl}. Pastikan backend sudah dinyalakan.`,
    );
  }
}

export async function apiFormRequest(path, body, method = 'POST') {
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
    const payload = text ? JSON.parse(text) : { status: 'success' };

    if (!response.ok) {
      throw new ApiError(
        payload.message || 'Permintaan ke server gagal.',
        response.status,
        payload.code,
        payload.data,
      );
    }

    return payload.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      `Tidak dapat terhubung ke backend DuiTrack di ${apiBaseUrl}. Pastikan backend sudah dinyalakan.`,
    );
  }
}
