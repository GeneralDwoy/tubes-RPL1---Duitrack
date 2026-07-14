import { usePathname, useRouter } from 'expo-router';
import { ChartNoAxesCombined, House, ReceiptText, UserRound } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, layout } from '@/constants/theme';

const items = [
  { href: '/dashboard' as const, icon: House, label: 'Beranda' },
  { href: '/transactions' as const, icon: ReceiptText, label: 'Transaksi' },
  { href: '/reports' as const, icon: ChartNoAxesCombined, label: 'Laporan' },
  { href: '/profile' as const, icon: UserRound, label: 'Profil' },
];

export function AppBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.shell}>
      <View accessibilityRole="tablist" style={styles.nav}>
        {items.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              key={href}
              onPress={() => router.replace(href)}
              style={({ pressed }) => [
                styles.item,
                active && styles.itemActive,
                pressed && styles.pressed,
              ]}>
              <Icon color={active ? colors.primaryDark : colors.muted} size={19} />
              <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.surface,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  nav: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 4,
    maxWidth: 720,
    width: '100%',
  },
  item: {
    alignItems: 'center',
    borderRadius: layout.radius,
    flex: 1,
    gap: 3,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 4,
  },
  itemActive: { backgroundColor: colors.primarySoft },
  label: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  labelActive: { color: colors.primaryDark },
  pressed: { opacity: 0.7 },
});
