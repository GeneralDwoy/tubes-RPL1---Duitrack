import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { apiRequest, getApiToken, setApiToken } from '@/lib/api';

const SESSION_KEY = 'duitrack.auth.session';

type ApiUser = {
  email: string;
  fotoProfil: string | null;
  idUser: number;
  nama: string;
};

export type AuthSession = {
  user: {
    email: string;
    id: string;
    user_metadata: { avatar_url: string | null; full_name: string };
  };
};

type SignUpInput = {
  email: string;
  name: string;
  password: string;
};

type AuthContextValue = {
  loading: boolean;
  refreshSession: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  session: AuthSession | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (input: SignUpInput) => Promise<{ sessionCreated: boolean }>;
  updatePassword: (password: string) => Promise<void>;
};

type AuthResponse = { token: string; user: ApiUser };
type MeResponse = { user: ApiUser };

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function createSession(user: ApiUser): AuthSession {
  return {
    user: {
      email: user.email,
      id: String(user.idUser),
      user_metadata: { avatar_url: user.fotoProfil, full_name: user.nama },
    },
  };
}

async function persistSession(token: string | null, session: AuthSession | null) {
  await setApiToken(token);
  if (session) {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    await AsyncStorage.removeItem(SESSION_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const [token, storedSession] = await Promise.all([
          getApiToken(),
          AsyncStorage.getItem(SESSION_KEY),
        ]);

        if (!token || !storedSession) return;
        const data = await apiRequest<MeResponse>('/auth/me');
        const nextSession = createSession(data.user);
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
        if (active) setSession(nextSession);
      } catch {
        await persistSession(null, null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await apiRequest<AuthResponse>('/auth/login', {
      auth: false,
      body: { email, password },
      method: 'POST',
    });
    const nextSession = createSession(data.user);
    await persistSession(data.token, nextSession);
    setSession(nextSession);
  }, []);

  const signUp = useCallback(async ({ email, name, password }: SignUpInput) => {
    const data = await apiRequest<AuthResponse>('/auth/register', {
      auth: false,
      body: { email, nama: name, password },
      method: 'POST',
    });
    const nextSession = createSession(data.user);
    await persistSession(data.token, nextSession);
    setSession(nextSession);
    return { sessionCreated: true };
  }, []);

  const signOut = useCallback(async () => {
    await persistSession(null, null);
    setSession(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const data = await apiRequest<MeResponse>('/auth/me');
    const nextSession = createSession(data.user);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  }, []);

  const resetPassword = useCallback(async (_email: string) => {
    throw new Error(
      'Pemulihan otomatis melalui email belum dikonfigurasi. Hubungi administrator DuiTrack untuk mereset akun.',
    );
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    await apiRequest('/auth/password', { body: { password }, method: 'PUT' });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      refreshSession,
      resetPassword,
      session,
      signIn,
      signOut,
      signUp,
      updatePassword,
    }),
    [loading, refreshSession, resetPassword, session, signIn, signOut, signUp, updatePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
