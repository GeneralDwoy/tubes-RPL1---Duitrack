import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { colors, layout } from '@/constants/theme';

export function FormField({
  error,
  icon: Icon,
  label,
  onBlur,
  onFocus,
  onChangeText,
  onChange,
  secureTextEntry,
  value,
  placeholder,
  type,
  autoComplete,
  autoCapitalize,
  maxLength,
  disabled,
  editable = true,
  ...inputProps
}) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isSecure = Boolean(secureTextEntry);

  const inputType = isSecure ? (revealed ? 'text' : 'password') : type || 'text';

  const handleChange = (e) => {
    if (onChangeText) onChangeText(e.target.value);
    if (onChange) onChange(e);
  };

  const shellStyle = {
    alignItems: 'center',
    backgroundColor: editable ? colors.surface : colors.surfaceMuted,
    borderColor: error ? colors.coral : focused ? colors.primary : colors.line,
    borderRadius: layout.radius,
    borderWidth: focused ? 2 : 1,
    borderStyle: 'solid',
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    paddingLeft: focused ? 13 : 14,
    paddingRight: focused ? 13 : 14,
    boxSizing: 'border-box',
    width: '100%',
    transition: 'border-color 0.15s ease',
  };

  const inputStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    minWidth: 0,
    outline: 'none',
    padding: '12px 0',
    width: '100%',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%' }}>
      <label style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>{label}</label>
      <div style={shellStyle}>
        {Icon ? <Icon color={focused ? colors.primary : colors.muted} size={19} strokeWidth={2} /> : null}
        <input
          {...inputProps}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          disabled={disabled || !editable}
          maxLength={maxLength}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          onChange={handleChange}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          placeholder={placeholder}
          style={inputStyle}
          type={inputType}
          value={value ?? ''}
        />
        {isSecure ? (
          <button
            aria-label={revealed ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            onClick={() => setRevealed((current) => !current)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
            type="button"
          >
            {revealed ? (
              <EyeOff color={colors.muted} size={19} />
            ) : (
              <Eye color={colors.muted} size={19} />
            )}
          </button>
        ) : null}
      </div>
      {error ? <span style={{ color: colors.coral, fontSize: 13, lineHeight: '18px' }}>{error}</span> : null}
    </div>
  );
}
