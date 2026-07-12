import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { BrandMark } from '@/components/brand-mark';
import { colors } from '@/constants/theme';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/welcome'), 1400);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.center}>
        <BrandMark inverse size="large" />
        <Text style={styles.tagline}>Catat dengan tenang. Melangkah dengan terarah.</Text>
      </View>
      <View style={styles.loadingRow}>
        <ActivityIndicator color={colors.amber} size="small" />
        <Text style={styles.loadingText}>Menyiapkan ruang keuanganmu</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    flex: 1,
    justifyContent: 'center',
    minHeight: '100%',
    padding: 28,
  },
  center: {
    alignItems: 'center',
    gap: 20,
  },
  tagline: {
    color: '#C7DED8',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 330,
    textAlign: 'center',
  },
  loadingRow: {
    alignItems: 'center',
    bottom: 38,
    flexDirection: 'row',
    gap: 10,
    position: 'absolute',
  },
  loadingText: {
    color: '#C7DED8',
    fontSize: 13,
    fontWeight: '600',
  },
});
