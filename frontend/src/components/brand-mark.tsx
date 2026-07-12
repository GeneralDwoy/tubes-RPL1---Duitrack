import { WalletCards } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, layout } from '@/constants/theme';

type BrandMarkProps = {
  inverse?: boolean;
  showName?: boolean;
  size?: 'small' | 'large';
};

export function BrandMark({ inverse = false, showName = true, size = 'small' }: BrandMarkProps) {
  const isLarge = size === 'large';
  const iconSize = isLarge ? 38 : 24;

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.iconBox,
          isLarge && styles.iconBoxLarge,
          inverse ? styles.iconBoxInverse : styles.iconBoxDefault,
        ]}>
        <WalletCards color={inverse ? colors.primaryDark : colors.white} size={iconSize} strokeWidth={2.2} />
        <View style={[styles.accent, isLarge && styles.accentLarge]} />
      </View>
      {showName ? (
        <Text style={[styles.name, isLarge && styles.nameLarge, inverse && styles.nameInverse]}>
          DuiTrack
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  iconBox: {
    alignItems: 'center',
    borderRadius: layout.radius,
    height: 42,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: 42,
  },
  iconBoxLarge: {
    height: 68,
    width: 68,
  },
  iconBoxDefault: {
    backgroundColor: colors.primary,
  },
  iconBoxInverse: {
    backgroundColor: colors.white,
  },
  accent: {
    backgroundColor: colors.amber,
    bottom: 0,
    height: 5,
    position: 'absolute',
    right: 0,
    width: 14,
  },
  accentLarge: {
    height: 7,
    width: 22,
  },
  name: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: '800',
  },
  nameLarge: {
    fontSize: 32,
  },
  nameInverse: {
    color: colors.white,
  },
});
