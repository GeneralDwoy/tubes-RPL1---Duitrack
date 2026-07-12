import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { CircleCheck, LockKeyhole, Save } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { AppButton } from '@/components/app-button';
import { AuthLayout } from '@/components/auth-layout';
import { FormField } from '@/components/form-field';
import { colors, layout } from '@/constants/theme';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { useAuth } from '@/providers/auth-provider';

const updatePasswordSchema = z
  .object({
    password: z.string().min(8, 'Gunakan minimal 8 karakter'),
    confirmPassword: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Kata sandi tidak sama',
    path: ['confirmPassword'],
  });

type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;

export default function UpdatePasswordScreen() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [updated, setUpdated] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordValues>({
    defaultValues: { confirmPassword: '', password: '' },
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmit = async ({ password }: UpdatePasswordValues) => {
    setServerError(null);
    try {
      await updatePassword(password);
      setUpdated(true);
    } catch (error) {
      setServerError(getAuthErrorMessage(error));
    }
  };

  return (
    <AuthLayout
      eyebrow="Keamanan akun"
      subtitle="Gunakan kata sandi baru yang tidak mudah ditebak."
      title="Atur kata sandi baru">
      {updated ? (
        <View style={styles.successBlock}>
          <View style={styles.successIcon}>
            <CircleCheck color={colors.success} size={29} />
          </View>
          <Text style={styles.successTitle}>Kata sandi berhasil diperbarui</Text>
          <Text style={styles.successText}>Akunmu sudah dapat digunakan dengan kata sandi baru.</Text>
          <AppButton label="Lanjut ke dashboard" onPress={() => router.replace('/dashboard')} />
        </View>
      ) : (
        <View style={styles.form}>
          {serverError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{serverError}</Text>
            </View>
          ) : null}
          <Controller
            control={control}
            name="password"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormField
                autoCapitalize="none"
                autoComplete="new-password"
                error={errors.password?.message}
                icon={LockKeyhole}
                label="Kata sandi baru"
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
                label="Ulangi kata sandi baru"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Ketik ulang kata sandi"
                secureTextEntry
                value={value}
              />
            )}
          />
          <AppButton
            icon={Save}
            label="Simpan kata sandi"
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 18,
  },
  errorBanner: {
    backgroundColor: colors.coralSoft,
    borderColor: '#E8B8B2',
    borderRadius: layout.radius,
    borderWidth: 1,
    padding: 12,
  },
  errorBannerText: {
    color: '#8A3932',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  successBlock: {
    alignItems: 'center',
    gap: 12,
  },
  successIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: layout.radius,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  successTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  successText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
});
