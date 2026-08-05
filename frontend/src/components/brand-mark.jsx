import { WalletCards } from 'lucide-react';
import { colors, layout } from '@/constants/theme';

export function BrandMark({ inverse = false, showName = true, size = 'small' }) {
  const isLarge = size === 'large';
  const iconSize = isLarge ? 38 : 24;

  const iconBoxStyle = {
    alignItems: 'center',
    borderRadius: layout.radius,
    height: isLarge ? 68 : 42,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: isLarge ? 68 : 42,
    backgroundColor: inverse ? colors.white : colors.primary,
    display: 'flex',
    flexShrink: 0,
  };

  const accentStyle = {
    backgroundColor: colors.amber,
    bottom: 0,
    height: isLarge ? 7 : 5,
    position: 'absolute',
    right: 0,
    width: isLarge ? 22 : 14,
  };

  const nameStyle = {
    color: inverse ? colors.white : colors.ink,
    fontSize: isLarge ? 32 : 21,
    fontWeight: '800',
    letterSpacing: '-0.02em',
  };

  return (
    <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row', gap: 10 }}>
      <div style={iconBoxStyle}>
        <WalletCards color={inverse ? colors.primaryDark : colors.white} size={iconSize} strokeWidth={2.2} />
        <div style={accentStyle} />
      </div>
      {showName ? <span style={nameStyle}>DuiTrack</span> : null}
    </div>
  );
}
