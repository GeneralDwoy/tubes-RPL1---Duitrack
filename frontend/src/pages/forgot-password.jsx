import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { AppButton } from '@/components/app-button';
import { AuthLayout } from '@/components/auth-layout';
import { colors, layout } from '@/constants/theme';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      eyebrow="Pemulihan akun"
      showBack
      subtitle="Pemulihan otomatis memerlukan layanan pengiriman email."
      title="Lupa kata sandi?"
    >
      <div
        style={{
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderColor: colors.line,
          borderRadius: layout.radius,
          borderWidth: 1,
          borderStyle: 'solid',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 20,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            backgroundColor: colors.amberSoft,
            borderRadius: layout.radius,
            display: 'flex',
            height: 54,
            justifyContent: 'center',
            width: 54,
          }}
        >
          <ShieldAlert color={colors.amber} size={28} />
        </div>
        <h3 style={{ color: colors.ink, fontSize: 18, fontWeight: '800', margin: 0 }}>
          Pemulihan email belum tersedia
        </h3>
        <p style={{ color: colors.muted, fontSize: 13, lineHeight: '20px', margin: '0 0 4px 0' }}>
          Jika masih dapat masuk, ubah kata sandi melalui menu Profil. Jika akses akun hilang,
          mintalah administrator DuiTrack melakukan pemulihan akun.
        </p>
        <AppButton
          icon={ArrowLeft}
          label="Kembali ke login"
          onClick={() => navigate('/login')}
          variant="secondary"
        />
      </div>
    </AuthLayout>
  );
}
