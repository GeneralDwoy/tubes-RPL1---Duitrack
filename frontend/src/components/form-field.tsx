import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { colors, layout } from '@/constants/theme';

type FormFieldProps = TextInputProps & {
  error?: string;
  icon: LucideIcon;
  label: string;
};

export function FormField({
  error,
  icon: Icon,
  label,
  onBlur,
  onFocus,
  secureTextEntry,
  ...inputProps
}: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isSecure = Boolean(secureTextEntry);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputShell, focused && styles.inputFocused, error && styles.inputError]}>
        <Icon color={focused ? colors.primary : colors.muted} size={19} strokeWidth={2} />
        <TextInput
          {...inputProps}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor="#8A9A96"
          secureTextEntry={isSecure && !revealed}
          style={styles.input}
        />
        {isSecure ? (
          <Pressable
            accessibilityLabel={revealed ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setRevealed((current) => !current)}>
            {revealed ? (
              <EyeOff color={colors.muted} size={19} />
            ) : (
              <Eye color={colors.muted} size={19} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 7,
    width: '100%',
  },
  label: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
    paddingHorizontal: 13,
  },
  inputError: {
    borderColor: colors.coral,
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    minWidth: 0,
    outlineWidth: 0,
    paddingVertical: 12,
  },
  error: {
    color: colors.coral,
    fontSize: 13,
    lineHeight: 18,
  },
});
