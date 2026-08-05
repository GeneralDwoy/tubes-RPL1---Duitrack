import { useNavigate } from 'react-router-dom';
import { ChartPie, LogIn, ReceiptText, Target, UserPlus } from 'lucide-react';
import { AppButton } from '@/components/app-button';
import { AuthLayout } from '@/components/auth-layout';
import { colors, layout } from '@/constants/theme';

const benefits = [
  { icon: ReceiptText, label: 'Catat pemasukan dan pengeluaran' },
  { icon: Target, label: 'Jaga anggaran tetap pada jalurnya' },
  { icon: ChartPie, label: 'Lihat pola keuangan setiap bulan' },
];

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      eyebrow="Selamat datang"
      subtitle="Mulai dengan pencatatan sederhana, lalu biarkan ringkasan DuiTrack membantu melihat gambaran besarnya."
      title="Keuanganmu, lebih mudah dipahami."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {benefits.map(({ icon: Icon, label }) => (
          <div
            key={label}
            style={{
              alignItems: 'center',
              backgroundColor: colors.surfaceMuted,
              borderRadius: layout.radius,
              display: 'flex',
              flexDirection: 'row',
              gap: 12,
              minHeight: 50,
              padding: '9px 13px',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                alignItems: 'center',
                backgroundColor: colors.primarySoft,
                borderRadius: layout.radius,
                display: 'flex',
                height: 34,
                justifyContent: 'center',
                width: 34,
                flexShrink: 0,
              }}
            >
              <Icon color={colors.primaryDark} size={19} strokeWidth={2.2} />
            </div>
            <span style={{ color: colors.ink, flex: 1, fontSize: 14, fontWeight: '600', lineHeight: '20px' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 24 }}>
        <AppButton icon={LogIn} label="Masuk" onClick={() => navigate('/login')} />
        <AppButton
          icon={UserPlus}
          label="Buat akun"
          onClick={() => navigate('/register')}
          variant="secondary"
        />
      </div>
      <p style={{ color: colors.muted, fontSize: 12, lineHeight: '18px', marginTop: 18, textAlign: 'center' }}>
        Satu akun untuk akses DuiTrack di ponsel dan web.
      </p>
    </AuthLayout>
  );
}
