import { useRouter } from 'expo-router';
import { ArrowLeft, BarChart3, CircleDollarSign, ShieldCheck } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { BrandMark } from '@/components/brand-mark';
import { colors, layout } from '@/constants/theme';

type AuthLayoutProps = {
  children: ReactNode;
  eyebrow: string;
  footer?: ReactNode;
  showBack?: boolean;
  subtitle: string;
  title: string;
};

const highlights = [
  { icon: CircleDollarSign, text: 'Saldo dan transaksi dalam satu tempat' },
  { icon: BarChart3, text: 'Anggaran bulanan yang mudah dipantau' },
  { icon: ShieldCheck, text: 'Data keuangan tetap milikmu' },
];

export function AuthLayout({
  children,
  eyebrow,
  footer,
  showBack = false,
  subtitle,
  title,
}: AuthLayoutProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.shell, isWide && styles.shellWide]}>
            <View style={[styles.brandPanel, isWide ? styles.brandPanelWide : styles.brandPanelCompact]}>
              <BrandMark inverse />
              {isWide ? (
                <>
                  <View style={styles.brandCopy}>
                    <Text style={styles.brandTitle}>Pahami uangmu. Atur langkahmu.</Text>
                    <Text style={styles.brandSubtitle}>
                      Catatan keuangan yang rapi membantu keputusan kecil terasa lebih pasti.
                    </Text>
                  </View>
                  <View style={styles.highlightList}>
                    {highlights.map(({ icon: Icon, text }) => (
                      <View key={text} style={styles.highlightRow}>
                        <View style={styles.highlightIcon}>
                          <Icon color={colors.primaryDark} size={18} strokeWidth={2.2} />
                        </View>
                        <Text style={styles.highlightText}>{text}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}
            </View>

            <View style={[styles.formPane, isWide && styles.formPaneWide]}>
              <View style={styles.formInner}>
                {showBack ? (
                  <Pressable
                    accessibilityLabel="Kembali"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
                    <ArrowLeft color={colors.ink} size={21} />
                  </Pressable>
                ) : null}
                <View style={styles.headingBlock}>
                  <Text style={styles.eyebrow}>{eyebrow}</Text>
                  <Text style={styles.title}>{title}</Text>
                  <Text style={styles.subtitle}>{subtitle}</Text>
                </View>
                <View style={styles.content}>{children}</View>
                {footer ? <View style={styles.footer}>{footer}</View> : null}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  shell: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    minHeight: '100%',
    width: '100%',
  },
  shellWide: {
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: 24,
    marginVertical: 32,
    maxWidth: layout.pageMaxWidth,
    minHeight: 680,
    overflow: 'hidden',
    width: '94%',
  },
  brandPanel: {
    backgroundColor: colors.primaryDark,
  },
  brandPanelCompact: {
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  brandPanelWide: {
    padding: 42,
    width: '46%',
  },
  brandCopy: {
    gap: 14,
    marginTop: 54,
  },
  brandTitle: {
    color: colors.white,
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 46,
    maxWidth: 390,
  },
  brandSubtitle: {
    color: '#C7DED8',
    fontSize: 16,
    lineHeight: 25,
    maxWidth: 390,
  },
  highlightList: {
    gap: 14,
    marginTop: 28,
  },
  highlightRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  highlightIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: layout.radius,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  highlightText: {
    color: '#E7F1EE',
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  formPane: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    flex: 1,
    paddingHorizontal: 22,
    paddingVertical: 34,
  },
  formPaneWide: {
    justifyContent: 'center',
    paddingHorizontal: 56,
    paddingVertical: 48,
  },
  formInner: {
    maxWidth: layout.formMaxWidth,
    width: '100%',
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: layout.radius,
    height: 40,
    justifyContent: 'center',
    marginBottom: 28,
    width: 40,
  },
  pressed: {
    opacity: 0.7,
  },
  headingBlock: {
    gap: 8,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 38,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
  },
  content: {
    marginTop: 30,
  },
  footer: {
    marginTop: 26,
  },
});
