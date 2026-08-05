import { usePathname, useRouter } from 'expo-router';
import { ChartNoAxesCombined, House, ReceiptText, UserRound } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

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
    <View style={styles.shell} pointerEvents="box-none">
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
              <Icon color={active ? colors.white : '#94A3B8'} size={18} />
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
    alignItems: 'center',
    bottom: 16,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 100,
  },
  nav: {
    alignItems: 'center',
    backgroundColor: '#0F523E',
    borderRadius: 32,
    elevation: 10,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
    maxWidth: 440,
    paddingHorizontal: 10,
    paddingVertical: 7,
    shadowColor: '#073527',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    width: '90%',
  },
  item: {
    alignItems: 'center',
    borderRadius: 24,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    height: 42,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  itemActive: {
    backgroundColor: '#22C55E',
  },
  label: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.white,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
  },
});
