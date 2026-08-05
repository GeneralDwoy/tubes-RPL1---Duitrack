import { apiFormRequest, apiRequest } from '@/lib/api';

export async function getUserProfile() {
  const data = await apiRequest('/auth/me');
  return {
    email: data.user.email,
    name: data.user.nama,
    photoUrl: data.user.fotoProfil,
  };
}

export async function updateUserProfile(name) {
  await apiRequest('/auth/me', {
    body: { nama: name.trim() },
    method: 'PUT',
  });
}

export async function updateUserProfilePhoto(file) {
  const formData = new FormData();
  const fileName = file.name || `foto-profil-${Date.now()}.jpg`;

  formData.append('photo', file, fileName);

  const data = await apiFormRequest('/auth/photo', formData, 'PUT');
  return {
    email: data.user.email,
    name: data.user.nama,
    photoUrl: data.user.fotoProfil,
  };
}

export async function removeUserProfilePhoto() {
  const data = await apiRequest('/auth/photo', { method: 'DELETE' });
  return {
    email: data.user.email,
    name: data.user.nama,
    photoUrl: data.user.fotoProfil,
  };
}

export async function updateUserPassword(password) {
  await apiRequest('/auth/password', {
    body: { password },
    method: 'PUT',
  });
}
