import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, getApiToken, setApiToken } from '@/lib/api';

const SESSION_KEY = 'duitrack.auth.session';

const AuthContext = createContext(undefined);

function createSession(user) {
  return {
    user: {
      email: user.email,
      id: String(user.idUser),
      user_metadata: { avatar_url: user.fotoProfil, full_name: user.nama },
    },
  };
}

async function persistSession(token, session) {
  await setApiToken(token);
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const token = await getApiToken();
        const storedSession = localStorage.getItem(SESSION_KEY);

        if (!token || !storedSession) return;
        const data = await apiRequest('/auth/me');
        const nextSession = createSession(data.user);
        localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
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

  const signIn = useCallback(async (email, password) => {
    const data = await apiRequest('/auth/login', {
      auth: false,
      body: { email, password },
      method: 'POST',
    });
    const nextSession = createSession(data.user);
    await persistSession(data.token, nextSession);
    setSession(nextSession);
  }, []);

  const signUp = useCallback(async ({ email, name, password }) => {
    const data = await apiRequest('/auth/register', {
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
    const data = await apiRequest('/auth/me');
    const nextSession = createSession(data.user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  }, []);

  const resetPassword = useCallback(async () => {
    throw new Error(
      'Pemulihan otomatis melalui email belum dikonfigurasi. Hubungi administrator DuiTrack untuk mereset akun.',
    );
  }, []);

  const updatePassword = useCallback(async (password) => {
    await apiRequest('/auth/password', { body: { password }, method: 'PUT' });
  }, []);

  const value = useMemo(
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
