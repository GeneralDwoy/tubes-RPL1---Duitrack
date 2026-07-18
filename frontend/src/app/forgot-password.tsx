import { useRouter } from 'expo-router';
import { ArrowLeft, ShieldAlert } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AuthLayout } from '@/components/auth-layout';
import { colors, layout } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  return (
    <AuthLayout
      eyebrow="Pemulihan akun"
      showBack
      subtitle="Pemulihan otomatis memerlukan layanan pengiriman email."
      title="Lupa kata sandi?">
      <View style={styles.notice}>
        <View style={styles.icon}>
          <ShieldAlert color={colors.amber} size={28} />
        </View>
        <Text style={styles.title}>Pemulihan email belum tersedia</Text>
        <Text style={styles.text}>
          Jika masih dapat masuk, ubah kata sandi melalui menu Profil. Jika akses akun hilang,
          mintalah administrator DuiTrack melakukan pemulihan akun.
        </Text>
        <AppButton
          icon={ArrowLeft}
          label="Kembali ke login"
          onPress={() => router.replace('/login')}
          variant="secondary"
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  notice: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.amberSoft,
    borderRadius: layout.radius,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  title: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  text: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
    textAlign: 'center',
  },
});
