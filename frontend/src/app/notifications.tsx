import { useRouter } from 'expo-router';
import { Bell, CircleCheck, Target, TriangleAlert } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { colors, layout } from '@/constants/theme';
import { formatCurrency, getMonthlyReport, type ReportCategory } from '@/lib/finance';
import { useAuth } from '@/providers/auth-provider';

export default function NotificationsScreen() {
  const router = useRouter();
  const { loading: authLoading, session } = useAuth();
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !session) router.replace('/welcome');
  }, [authLoading, router, session]);

  useEffect(() => {
    if (!session) return;
    getMonthlyReport()
      .then((report) =>
        setCategories(
          report.categories
            .filter((category) => category.budget > 0 && category.percentage >= 80)
            .sort((a, b) => b.percentage - a.percentage),
        ),
      )
      .catch((error) =>
        Alert.alert(
          'Notifikasi belum dapat dimuat',
          error instanceof Error ? error.message : 'Silakan coba kembali.',
        ),
      )
      .finally(() => setLoading(false));
  }, [session]);

  if (authLoading || !session) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.page}>
          <ScreenHeader subtitle="Peringatan pemakaian anggaran bulan ini" title="Notifikasi" />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
          ) : categories.length ? (
            <View style={styles.list}>
              {categories.map((category) => {
                const exceeded = category.percentage >= 100;
                const remaining = Math.max(category.budget - category.spent, 0);
                return (
                  <View
                    key={category.id}
                    style={[styles.notificationRow, exceeded && styles.notificationRowDanger]}>
                    <View style={[styles.notificationIcon, exceeded && styles.notificationIconDanger]}>
                      {exceeded ? (
                        <TriangleAlert color={colors.coral} size={21} />
                      ) : (
                        <Bell color={colors.amber} size={21} />
                      )}
                    </View>
                    <View style={styles.notificationCopy}>
                      <Text style={styles.notificationTitle}>
                        {exceeded
                          ? `Anggaran ${category.name} sudah habis`
                          : `Anggaran ${category.name} mendekati batas`}
                      </Text>
                      <Text style={styles.notificationText}>
                        {Math.round(category.percentage)}% terpakai. Sisa {formatCurrency(remaining)}.
                      </Text>
                    </View>
                    <Target color={exceeded ? colors.coral : colors.muted} size={19} />
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <CircleCheck color={colors.primary} size={30} />
              </View>
              <Text style={styles.emptyTitle}>Anggaran masih aman</Text>
              <Text style={styles.emptyText}>
                Notifikasi muncul ketika pemakaian kategori mencapai 80% dari batas bulanan.
              </Text>
            </View>
          )}
          </ScrollView>
        </View>
        <AppBottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.canvas, flex: 1 },
  screen: { flex: 1 },
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: colors.canvas,
    flex: 1,
    justifyContent: 'center',
  },
  page: { alignSelf: 'center', flex: 1, maxWidth: 820, paddingHorizontal: 20, width: '100%' },
  content: { paddingBottom: 40, paddingTop: 20 },
  loader: { marginTop: 50 },
  list: { gap: 10 },
  notificationRow: {
    alignItems: 'center',
    backgroundColor: colors.amberSoft,
    borderColor: '#E9CF96',
    borderRadius: layout.radius,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 78,
    padding: 13,
  },
  notificationRowDanger: { backgroundColor: colors.coralSoft, borderColor: '#E8B8B2' },
  notificationIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: layout.radius,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  notificationIconDanger: { backgroundColor: '#FFF7F6' },
  notificationCopy: { flex: 1, minWidth: 0 },
  notificationTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  notificationText: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  emptyState: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 70 },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: layout.radius,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', marginTop: 14 },
  emptyText: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6, maxWidth: 380, textAlign: 'center' },
});
