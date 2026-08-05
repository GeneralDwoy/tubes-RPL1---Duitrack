import { colors, layout } from '@/constants/theme';
import { Loader2 } from 'lucide-react';

export function AppButton({
  disabled = false,
  icon: Icon,
  label,
  loading = false,
  onPress,
  onClick,
  variant = 'primary',
  type = 'button',
}) {
  const isDisabled = disabled || loading;
  const foreground = variant === 'primary' ? colors.white : colors.primaryDark;
  const handleClick = onClick || onPress;

  const variantStyles = {
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.surface,
      borderColor: colors.line,
    },
    quiet: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primarySoft,
    },
  };

  const buttonStyle = {
    alignItems: 'center',
    borderRadius: layout.radius,
    borderWidth: 1,
    borderStyle: 'solid',
    justifyContent: 'center',
    minHeight: 52,
    paddingLeft: 18,
    paddingRight: 18,
    width: '100%',
    opacity: isDisabled ? 0.55 : 1,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
    boxSizing: 'border-box',
    display: 'flex',
    ...variantStyles[variant],
  };

  const contentStyle = {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    gap: 9,
    justifyContent: 'center',
  };

  const labelStyle = {
    color: foreground,
    fontSize: 16,
    fontWeight: '700',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  return (
    <button
      disabled={isDisabled}
      onClick={handleClick}
      style={buttonStyle}
      type={type}
    >
      <div style={contentStyle}>
        {loading ? (
          <Loader2 className="animate-spin" color={foreground} size={19} />
        ) : Icon ? (
          <Icon color={foreground} size={19} strokeWidth={2.3} />
        ) : null}
        <span style={labelStyle}>{label}</span>
      </div>
    </button>
  );
}
