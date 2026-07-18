export function getAuthErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (message.includes('invalid login credentials') || message.includes('tidak sesuai')) {
    return 'Email atau kata sandi tidak cocok.';
  }

  if (message.includes('email not confirmed')) {
    return 'Email belum dikonfirmasi. Periksa kotak masuk emailmu.';
  }

  if (message.includes('user already registered') || message.includes('sudah terdaftar')) {
    return 'Email tersebut sudah terdaftar. Silakan masuk.';
  }

  if (message.includes('password should be')) {
    return 'Kata sandi belum memenuhi ketentuan keamanan.';
  }

  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba kembali.';
  }

  if (message.includes('auth session missing')) {
    return 'Tautan pemulihan tidak valid atau sudah kedaluwarsa.';
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('tidak dapat terhubung')) {
    return error instanceof Error ? error.message : 'Koneksi ke server gagal. Coba kembali.';
  }

  return error instanceof Error && error.message
    ? error.message
    : 'Terjadi kesalahan. Silakan coba kembali.';
}
