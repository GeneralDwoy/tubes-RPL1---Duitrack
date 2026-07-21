import type { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';

import { apiFormRequest, apiRequest } from '@/lib/api';

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

export async function updateUserProfilePhoto(asset: ImagePickerAsset) {
  const formData = new FormData();
  const fileName = asset.fileName || `foto-profil-${Date.now()}.jpg`;
  const mimeType = asset.mimeType || 'image/jpeg';

  if (Platform.OS === 'web' && asset.file) {
    formData.append('photo', asset.file, fileName);
  } else {
    formData.append(
      'photo',
      { name: fileName, type: mimeType, uri: asset.uri } as unknown as Blob,
    );
  }

  const data = await apiFormRequest<{ user: ApiUser }>('/auth/photo', formData, 'PUT');
  return {
    email: data.user.email,
    name: data.user.nama,
    photoUrl: data.user.fotoProfil,
  } satisfies UserProfile;
}

export async function removeUserProfilePhoto() {
  const data = await apiRequest<{ user: ApiUser }>('/auth/photo', { method: 'DELETE' });
  return {
    email: data.user.email,
    name: data.user.nama,
    photoUrl: data.user.fotoProfil,
  } satisfies UserProfile;
}

export async function updateUserPassword(password: string) {
  await apiRequest('/auth/password', {
    body: { password },
    method: 'PUT',
  });
}
