import { useRouter } from 'expo-router';
import { ChartPie, LogIn, ReceiptText, Target, UserPlus } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AuthLayout } from '@/components/auth-layout';
import { colors, layout } from '@/constants/theme';

const benefits = [
  { icon: ReceiptText, label: 'Catat pemasukan dan pengeluaran' },
  { icon: Target, label: 'Jaga anggaran tetap pada jalurnya' },
  { icon: ChartPie, label: 'Lihat pola keuangan setiap bulan' },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <AuthLayout
      eyebrow="Selamat datang"
      subtitle="Mulai dengan pencatatan sederhana, lalu biarkan ringkasan DuiTrack membantu melihat gambaran besarnya."
      title="Keuanganmu, lebih mudah dipahami.">
      <View style={styles.benefitList}>
        {benefits.map(({ icon: Icon, label }) => (
          <View key={label} style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <Icon color={colors.primaryDark} size={19} strokeWidth={2.2} />
            </View>
            <Text style={styles.benefitText}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.actions}>
        <AppButton icon={LogIn} label="Masuk" onPress={() => router.push('/login')} />
        <AppButton
          icon={UserPlus}
          label="Buat akun"
          onPress={() => router.push('/register')}
          variant="secondary"
        />
      </View>
      <Text style={styles.note}>Satu akun untuk akses DuiTrack di ponsel dan web.</Text>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  benefitList: {
    gap: 12,
  },
  benefitRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: layout.radius,
    flexDirection: 'row',
    gap: 12,
    minHeight: 50,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  benefitIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: layout.radius,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  benefitText: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  actions: {
    gap: 11,
    marginTop: 24,
  },
  note: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 18,
    textAlign: 'center',
  },
});
