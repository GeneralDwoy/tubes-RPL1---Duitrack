import { apiRequest } from '@/lib/api';

export type UserProfile = {
  email: string;
  name: string;
  photoUrl: string | null;
};

type ApiUser = {
  email: string;
  fotoProfil: string | null;
  idUser: number;
  nama: string;
};

export async function getUserProfile() {
  const data = await apiRequest<{ user: ApiUser }>('/auth/me');
  return {
    email: data.user.email,
    name: data.user.nama,
    photoUrl: data.user.fotoProfil,
  } satisfies UserProfile;
}

export async function updateUserProfile(name: string) {
  await apiRequest('/auth/me', {
    body: { nama: name.trim() },
    method: 'PUT',
  });
}

export async function updateUserPassword(password: string) {
  await apiRequest('/auth/password', {
    body: { password },
    method: 'PUT',
  });
}
