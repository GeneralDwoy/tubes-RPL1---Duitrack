import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { colors, layout } from '@/constants/theme';

export function ScreenHeader({ action, backHref, subtitle, title }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backHref) {
      navigate(backHref);
      return;
    }
    navigate(-1);
  };

  const headerStyle = {
    alignItems: 'center',
    borderBottom: `1px solid ${colors.line}`,
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    minHeight: 76,
    paddingTop: 12,
    paddingBottom: 12,
    width: '100%',
  };

  const backButtonStyle = {
    alignItems: 'center',
    backgroundColor: colors.surface,
    border: `1px solid ${colors.line}`,
    borderRadius: layout.radius,
    cursor: 'pointer',
    display: 'flex',
    height: 40,
    justifyContent: 'center',
    width: 40,
    flexShrink: 0,
    transition: 'opacity 0.15s ease',
  };

  return (
    <div style={headerStyle}>
      <button aria-label="Kembali" onClick={handleBack} style={backButtonStyle} type="button">
        <ArrowLeft color={colors.ink} size={21} />
      </button>
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 2 }}>
        <h1 style={{ color: colors.ink, fontSize: 20, fontWeight: '800', margin: 0 }}>{title}</h1>
        {subtitle ? (
          <p style={{ color: colors.muted, fontSize: 12, lineHeight: '17px', margin: 0 }}>{subtitle}</p>
        ) : null}
      </div>
      {action ? <div style={{ alignItems: 'flex-end', display: 'flex' }}>{action}</div> : <div style={{ width: 40 }} />}
    </div>
  );
}
