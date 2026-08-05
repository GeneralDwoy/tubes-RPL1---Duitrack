import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CircleCheck, LockKeyhole, LogIn, Mail } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const confirmation = searchParams.get('confirmation');
  const registered = searchParams.get('registered');

  const { signIn } = useAuth();
  const [serverError, setServerError] = useState(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async ({ email, password }) => {
    setServerError(null);
    try {
      await signIn(email, password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setServerError(getAuthErrorMessage(error));
    }
  };

  return (
    <AuthLayout
      eyebrow="Akses akun"
      footer={
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}>
          <span style={{ color: colors.muted, fontSize: 14 }}>Belum punya akun?</span>
          <button
            onClick={() => navigate('/register')}
            style={{ background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', fontSize: 14, fontWeight: '800', padding: 0 }}
            type="button"
          >
            Daftar sekarang
          </button>
        </div>
      }
      showBack
      subtitle="Masukkan akun DuiTrack untuk melanjutkan pencatatan keuanganmu."
      title="Masuk ke DuiTrack"
    >
      {registered === '1' ? (
        <div
          style={{
            alignItems: 'center',
            backgroundColor: colors.primarySoft,
            borderRadius: layout.radius,
            display: 'flex',
            flexDirection: 'row',
            gap: 9,
            marginBottom: 18,
            padding: 12,
          }}
        >
          <CircleCheck color={colors.success} size={19} />
          <span style={{ color: colors.primaryDark, flex: 1, fontSize: 13, fontWeight: '600', lineHeight: '19px' }}>
            {confirmation === '1'
              ? 'Akun berhasil dibuat. Konfirmasi emailmu sebelum masuk.'
              : 'Akun berhasil dibuat. Silakan masuk.'}
          </span>
        </div>
      ) : null}

      {serverError ? (
        <div
          style={{
            backgroundColor: colors.coralSoft,
            borderColor: '#E8B8B2',
            borderRadius: layout.radius,
            borderWidth: 1,
            borderStyle: 'solid',
            marginBottom: 18,
            padding: 12,
          }}
        >
          <span style={{ color: '#8A3932', fontSize: 13, fontWeight: '600', lineHeight: '19px' }}>{serverError}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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

        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => navigate('/forgot-password')}
            style={{ background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', fontSize: 14, fontWeight: '700', padding: 0 }}
            type="button"
          >
            Lupa kata sandi?
          </button>
        </div>

        <AppButton
          icon={LogIn}
          label="Masuk"
          loading={isSubmitting}
          type="submit"
        />
      </form>
    </AuthLayout>
  );
}
