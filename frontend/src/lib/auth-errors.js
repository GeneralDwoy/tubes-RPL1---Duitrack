export function getAuthErrorMessage(error) {
  if (!error) return 'Terjadi kesalahan. Silakan coba kembali.';

  const message = typeof error === 'string' ? error : error instanceof Error ? error.message : '';

  if (message.includes('Invalid login credentials') || message.includes('Email atau kata sandi')) {
    return 'Email atau kata sandi tidak cocok. Periksa kembali data akunmu.';
  }

  if (message.includes('User already registered') || message.includes('Email sudah terdaftar')) {
    return 'Email tersebut sudah terdaftar. Silakan masuk menggunakan akun tersebut.';
  }

  if (message.includes('Password should be at least')) {
    return 'Kata sandi terlalu pendek. Gunakan minimal 8 karakter.';
  }

  if (message.includes('rate limit')) {
    return 'Terlalu banyak percobaan. Tunggu beberapa saat sebelum mencoba kembali.';
  }

  if (message.includes('Tidak dapat terhubung')) {
    return message;
  }

  return message || 'Terjadi kesalahan pada layanan autentikasi. Silakan coba kembali.';
}
