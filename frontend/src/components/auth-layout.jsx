import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { colors } from '@/constants/theme';

export function AuthLayout({
  children,
  eyebrow,
  footer,
  showBack = false,
  subtitle,
  title,
}) {
  const navigate = useNavigate();

  const containerStyle = {
    backgroundColor: '#0E4D3C',
    minHeight: '100vh',
    width: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    boxSizing: 'border-box',
    padding: '40px 20px',
  };

  const waveArcStyle = {
    alignSelf: 'center',
    backgroundColor: '#4ADE80',
    borderRadius: '800px',
    bottom: '-950px',
    height: '1400px',
    position: 'absolute',
    width: '1400px',
    pointerEvents: 'none',
    zIndex: 1,
  };

  const cardStyle = {
    backgroundColor: colors.surface,
    borderRadius: 24,
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.18)',
    maxWidth: 440,
    padding: 30,
    width: '100%',
    position: 'relative',
    zIndex: 2,
    boxSizing: 'border-box',
  };

  const backButtonStyle = {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    display: 'flex',
    height: 38,
    justifyContent: 'center',
    width: 38,
  };

  return (
    <div style={containerStyle}>
      <div style={waveArcStyle} />

      <div style={cardStyle}>
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <BrandMark />
          {showBack ? (
            <button aria-label="Kembali" onClick={() => navigate(-1)} style={backButtonStyle} type="button">
              <ArrowLeft color={colors.ink} size={20} />
            </button>
          ) : null}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {eyebrow ? (
            <span style={{ color: colors.primary, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }}>
              {eyebrow}
            </span>
          ) : null}
          <h1 style={{ color: colors.ink, fontSize: 26, fontWeight: '800', lineHeight: '34px', margin: 0 }}>
            {title}
          </h1>
          {subtitle ? (
            <p style={{ color: colors.muted, fontSize: 14, lineHeight: '21px', margin: '2px 0 0' }}>
              {subtitle}
            </p>
          ) : null}
        </div>

        <div style={{ marginTop: 22 }}>{children}</div>

        {footer ? <div style={{ marginTop: 22 }}>{footer}</div> : null}
      </div>
    </div>
  );
}
