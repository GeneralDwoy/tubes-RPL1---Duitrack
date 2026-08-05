import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { CircleCheck, LockKeyhole, Save } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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

export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [updated, setUpdated] = useState(false);
  const [serverError, setServerError] = useState(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { confirmPassword: '', password: '' },
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmit = async ({ password }) => {
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
      title="Atur kata sandi baru"
    >
      {updated ? (
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center' }}>
          <div
            style={{
              alignItems: 'center',
              backgroundColor: colors.primarySoft,
              borderRadius: layout.radius,
              display: 'flex',
              height: 56,
              justifyContent: 'center',
              width: 56,
            }}
          >
            <CircleCheck color={colors.success} size={29} />
          </div>
          <h3 style={{ color: colors.ink, fontSize: 20, fontWeight: '800', margin: 0 }}>Kata sandi berhasil diperbarui</h3>
          <p style={{ color: colors.muted, fontSize: 14, lineHeight: '22px', margin: '0 0 8px 0' }}>
            Akunmu sudah dapat digunakan dengan kata sandi baru.
          </p>
          <AppButton label="Lanjut ke dashboard" onClick={() => navigate('/dashboard', { replace: true })} />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
            type="submit"
          />
        </form>
      )}
    </AuthLayout>
  );
}
