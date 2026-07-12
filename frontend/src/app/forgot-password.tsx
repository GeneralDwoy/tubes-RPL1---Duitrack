import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { ArrowLeft, CircleCheck, Mail, Send } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { AppButton } from '@/components/app-button';
import { AuthLayout } from '@/components/auth-layout';
import { FormField } from '@/components/form-field';
import { colors, layout } from '@/constants/theme';

const resetSchema = z.object({
  email: z.string().trim().min(1, 'Email wajib diisi').email('Format email belum benar'),
});

type ResetValues = z.infer<typeof resetSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    defaultValues: { email: '' },
    resolver: zodResolver(resetSchema),
  });

  return (
    <AuthLayout
      eyebrow="Pemulihan akun"
      showBack
      subtitle="Masukkan email yang digunakan saat mendaftar."
      title="Lupa kata sandi?">
      {sent ? (
        <View style={styles.sentBlock}>
          <View style={styles.sentIcon}>
            <CircleCheck color={colors.success} size={28} />
          </View>
          <Text style={styles.sentTitle}>Periksa emailmu</Text>
          <Text style={styles.sentText}>
            Petunjuk pengaturan ulang kata sandi telah disiapkan untuk alamat tersebut.
          </Text>
          <AppButton
            icon={ArrowLeft}
            label="Kembali ke login"
            onPress={() => router.replace('/login')}
            variant="secondary"
          />
        </View>
      ) : (
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
          <AppButton
            icon={Send}
            label="Kirim petunjuk"
            loading={isSubmitting}
            onPress={handleSubmit(() => setSent(true))}
          />
        </View>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 20,
  },
  sentBlock: {
    alignItems: 'center',
    gap: 12,
  },
  sentIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: layout.radius,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  sentTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  sentText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
    maxWidth: 350,
    textAlign: 'center',
  },
});
