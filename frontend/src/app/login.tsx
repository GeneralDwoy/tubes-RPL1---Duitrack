import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleCheck, LockKeyhole, LogIn, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { AppButton } from '@/components/app-button';
import { AuthLayout } from '@/components/auth-layout';
import { FormField } from '@/components/form-field';
import { colors, layout } from '@/constants/theme';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { useAuth } from '@/providers/auth-provider';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email wajib diisi').email('Format email belum benar'),
  password: z.string().min(1, 'Kata sandi wajib diisi').min(6, 'Gunakan minimal 6 karakter'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { confirmation, registered } = useLocalSearchParams<{
    confirmation?: string;
    registered?: string;
  }>();
  const { signIn } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async ({ email, password }: LoginValues) => {
    setServerError(null);
    try {
      await signIn(email, password);
      router.replace('/dashboard');
    } catch (error) {
      setServerError(getAuthErrorMessage(error));
    }
  };

  return (
    <AuthLayout
      eyebrow="Akses akun"
      footer={
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Belum punya akun?</Text>
          <Pressable onPress={() => router.push('/register')}>
            <Text style={styles.footerLink}>Daftar sekarang</Text>
          </Pressable>
        </View>
      }
      showBack
      subtitle="Masukkan akun DuiTrack untuk melanjutkan pencatatan keuanganmu."
      title="Masuk ke DuiTrack">
      {registered === '1' ? (
        <View style={styles.successBanner}>
          <CircleCheck color={colors.success} size={19} />
          <Text style={styles.successText}>
            {confirmation === '1'
              ? 'Akun berhasil dibuat. Konfirmasi emailmu sebelum masuk.'
              : 'Akun berhasil dibuat. Silakan masuk.'}
          </Text>
        </View>
      ) : null}

      {serverError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{serverError}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormField
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email?.message}
              icon={Mail}
              keyboardType="email-address"
              label="Email"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="nama@email.com"
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormField
              autoCapitalize="none"
              autoComplete="current-password"
              error={errors.password?.message}
              icon={LockKeyhole}
              label="Kata sandi"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Masukkan kata sandi"
              secureTextEntry
              value={value}
            />
          )}
        />

        <View style={styles.optionsRow}>
          <Pressable onPress={() => router.push('/forgot-password')}>
            <Text style={styles.forgotLink}>Lupa kata sandi?</Text>
          </Pressable>
        </View>

        <AppButton
          icon={LogIn}
          label="Masuk"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  successBanner: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: layout.radius,
    flexDirection: 'row',
    gap: 9,
    marginBottom: 18,
    padding: 12,
  },
  successText: {
    color: colors.primaryDark,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  errorBanner: {
    backgroundColor: colors.coralSoft,
    borderColor: '#E8B8B2',
    borderRadius: layout.radius,
    borderWidth: 1,
    marginBottom: 18,
    padding: 12,
  },
  errorBannerText: {
    color: '#8A3932',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  form: {
    gap: 18,
  },
  optionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-end',
  },
  forgotLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    justifyContent: 'center',
  },
  footerText: {
    color: colors.muted,
    fontSize: 14,
  },
  footerLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
});
