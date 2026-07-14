import { supabase } from '@/lib/supabase';

export type UserProfile = {
  email: string;
  name: string;
  photoUrl: string | null;
};

export async function getUserProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw userError ?? new Error('Sesi pengguna tidak ditemukan.');

  const { data, error } = await supabase
    .from('profiles')
    .select('nama,foto_profil')
    .eq('id', user.id)
    .single();
  if (error) throw error;

  return {
    email: user.email ?? '',
    name: data.nama,
    photoUrl: data.foto_profil,
  } satisfies UserProfile;
}

export async function updateUserProfile(name: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw userError ?? new Error('Sesi pengguna tidak ditemukan.');

  const normalizedName = name.trim();
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ nama: normalizedName })
    .eq('id', user.id);
  if (profileError) throw profileError;

  const { error: authError } = await supabase.auth.updateUser({
    data: { ...user.user_metadata, full_name: normalizedName },
  });
  if (authError) throw authError;
}

export async function updateUserPassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
