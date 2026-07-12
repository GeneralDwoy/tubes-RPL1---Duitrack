import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { LockKeyhole, Mail, UserPlus, UserRound } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { AppButton } from '@/components/app-button';
import { AuthLayout } from '@/components/auth-layout';
import { FormField } from '@/components/form-field';
import { colors } from '@/constants/theme';

const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Nama wajib diisi').min(3, 'Nama minimal 3 karakter'),
    email: z.string().trim().min(1, 'Email wajib diisi').email('Format email belum benar'),
    password: z.string().min(8, 'Gunakan minimal 8 karakter'),
    confirmPassword: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Kata sandi tidak sama',
    path: ['confirmPassword'],
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    defaultValues: { confirmPassword: '', email: '', name: '', password: '' },
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = () => {
    router.replace({ pathname: '/login', params: { registered: '1' } });
  };

  return (
    <AuthLayout
      eyebrow="Akun baru"
      footer={
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Sudah punya akun?</Text>
          <Pressable onPress={() => router.replace('/login')}>
            <Text style={styles.footerLink}>Masuk</Text>
          </Pressable>
        </View>
      }
      showBack
      subtitle="Gunakan email aktif agar akunmu siap disambungkan ke seluruh perangkat."
      title="Buat akun DuiTrack">
      <View style={styles.form}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormField
              autoCapitalize="words"
              autoComplete="name"
              error={errors.name?.message}
              icon={UserRound}
              label="Nama lengkap"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Nama lengkap"
              value={value}
            />
          )}
        />
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
              autoComplete="new-password"
              error={errors.password?.message}
              icon={LockKeyhole}
              label="Kata sandi"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Minimal 8 karakter"
              secureTextEntry
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormField
              autoCapitalize="none"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              icon={LockKeyhole}
              label="Ulangi kata sandi"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Ketik ulang kata sandi"
              secureTextEntry
              value={value}
            />
          )}
        />
        <Text style={styles.terms}>
          Dengan membuat akun, kamu menyetujui ketentuan penggunaan dan kebijakan privasi DuiTrack.
        </Text>
        <AppButton
          icon={UserPlus}
          label="Buat akun"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 17,
  },
  terms: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 19,
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
