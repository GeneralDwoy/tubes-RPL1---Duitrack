import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail, UserPlus, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { AppButton } from '@/components/app-button';
import { AuthLayout } from '@/components/auth-layout';
import { FormField } from '@/components/form-field';
import { colors, layout } from '@/constants/theme';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { useAuth } from '@/providers/auth-provider';

const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Nama wajib diisi').min(3, 'Nama minimal 3 karakter').max(50, 'Nama maksimal 50 karakter'),
    email: z.string().trim().min(1, 'Email wajib diisi').email('Format email belum benar').max(30, 'Email maksimal 30 karakter'),
    password: z.string().min(8, 'Gunakan minimal 8 karakter'),
    confirmPassword: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Kata sandi tidak sama',
    path: ['confirmPassword'],
  });

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [serverError, setServerError] = useState(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { confirmPassword: '', email: '', name: '', password: '' },
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async ({ email, name, password }) => {
    setServerError(null);
    try {
      const { sessionCreated } = await signUp({ email, name, password });
      if (sessionCreated) {
        navigate('/dashboard', { replace: true });
        return;
      }
      navigate('/login?confirmation=1&registered=1', { replace: true });
    } catch (error) {
      setServerError(getAuthErrorMessage(error));
    }
  };

  return (
    <AuthLayout
      eyebrow="Akun baru"
      footer={
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}>
          <span style={{ color: colors.muted, fontSize: 14 }}>Sudah punya akun?</span>
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', fontSize: 14, fontWeight: '800', padding: 0 }}
            type="button"
          >
            Masuk
          </button>
        </div>
      }
      showBack
      subtitle="Gunakan email aktif agar akunmu siap disambungkan ke seluruh perangkat."
      title="Buat akun DuiTrack"
    >
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 17 }}>
        {serverError ? (
          <div
            style={{
              backgroundColor: colors.coralSoft,
              borderColor: '#E8B8B2',
              borderRadius: layout.radius,
              borderWidth: 1,
              borderStyle: 'solid',
              padding: 12,
            }}
          >
            <span style={{ color: '#8A3932', fontSize: 13, fontWeight: '600', lineHeight: '19px' }}>{serverError}</span>
          </div>
        ) : null}
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
              label="Email"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="nama@email.com"
              type="email"
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
        <p style={{ color: colors.muted, fontSize: 12, lineHeight: '19px', margin: 0 }}>
          Dengan membuat akun, kamu menyetujui ketentuan penggunaan dan kebijakan privasi DuiTrack.
        </p>
        <AppButton
          icon={UserPlus}
          label="Buat akun"
          loading={isSubmitting}
          type="submit"
        />
      </form>
    </AuthLayout>
  );
}
