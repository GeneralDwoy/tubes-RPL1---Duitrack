import { type Href, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, layout } from '@/constants/theme';

type ScreenHeaderProps = {
  action?: ReactNode;
  backHref?: Href;
  subtitle?: string;
  title: string;
};

export function ScreenHeader({ action, backHref, subtitle, title }: ScreenHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.replace(backHref);
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/dashboard');
  };

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="Kembali"
        accessibilityRole="button"
        hitSlop={8}
        onPress={handleBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
        <ArrowLeft color={colors.ink} size={21} />
      </Pressable>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 76,
    paddingVertical: 12,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  pressed: {
    opacity: 0.7,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  action: {
    alignItems: 'flex-end',
  },
  spacer: {
    width: 40,
  },
});
