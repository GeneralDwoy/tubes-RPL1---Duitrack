import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BrandMark } from '@/components/brand-mark';
import { colors } from '@/constants/theme';

type AuthLayoutProps = {
  children: ReactNode;
  eyebrow?: string;
  footer?: ReactNode;
  showBack?: boolean;
  subtitle?: string;
  title: string;
};

export function AuthLayout({
  children,
  eyebrow,
  footer,
  showBack = false,
  subtitle,
  title,
}: AuthLayoutProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundContainer} pointerEvents="none">
        <View style={styles.bottomWaveArc} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.headerBar}>
              <BrandMark />
              {showBack ? (
                <Pressable
                  accessibilityLabel="Kembali"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => router.back()}
                  style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
                  <ArrowLeft color={colors.ink} size={20} />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.headingBlock}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>

            <View style={styles.content}>{children}</View>

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#0E4D3C',
    flex: 1,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: '#0E4D3C',
    overflow: 'hidden',
  },
  bottomWaveArc: {
    alignSelf: 'center',
    backgroundColor: '#4ADE80',
    borderRadius: 800,
    bottom: -950,
    height: 1400,
    position: 'absolute',
    width: 1400,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    elevation: 12,
    maxWidth: 440,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    width: '100%',
  },
  headerBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  pressed: {
    opacity: 0.7,
  },
  headingBlock: {
    gap: 6,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 2,
  },
  content: {
    marginTop: 22,
  },
  footer: {
    marginTop: 22,
  },
});
