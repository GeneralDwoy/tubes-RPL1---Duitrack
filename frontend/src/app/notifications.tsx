import { useRouter } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Info,
  Target,
  TriangleAlert,
  WalletCards,
} from 'lucide-react-native';
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

import { AppBottomNav } from '@/components/app-bottom-nav';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import {
  formatCurrency,
  getMonthlyReport,
  listRecentTransactions,
  type FinanceTransaction,
  type ReportCategory,
} from '@/lib/finance';
import { useAuth } from '@/providers/auth-provider';

type NotificationItem = {
  category?: string;
  date?: string;
  id: string;
  message: string;
  title: string;
  type: 'danger' | 'warning' | 'info' | 'success' | 'income' | 'expense';
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { loading: authLoading, session } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !session) router.replace('/welcome');
  }, [authLoading, router, session]);

  useEffect(() => {
    if (!session) return;

    Promise.all([getMonthlyReport(), listRecentTransactions(10)])
      .then(([report, recentTx]) => {
        const items: NotificationItem[] = [];

        // 1. Budget Notifications
        report.categories.forEach((cat) => {
          if (cat.budget > 0) {
            const pct = Math.round(cat.percentage);
            const remaining = Math.max(cat.budget - cat.spent, 0);

            if (pct >= 100) {
              items.push({
                id: `budget-danger-${cat.id}`,
                type: 'danger',
                title: `Anggaran ${cat.name} Sudah Habis!`,
                message: `Pemakaian mencapai ${pct}% dari anggaran ${formatCurrency(cat.budget)}.`,
              });
            } else if (pct >= 80) {
              items.push({
                id: `budget-warning-${cat.id}`,
                type: 'warning',
                title: `Anggaran ${cat.name} Mendekati Batas`,
                message: `${pct}% terpakai. Sisa anggaran: ${formatCurrency(remaining)}.`,
              });
            } else {
              items.push({
                id: `budget-info-${cat.id}`,
                type: 'info',
                title: `Anggaran ${cat.name} Aktif`,
                message: `${pct}% terpakai dari ${formatCurrency(cat.budget)}. Sisa ${formatCurrency(remaining)}.`,
              });
            }
          }
        });

        // 2. Transaction Notifications
        recentTx.forEach((tx) => {
          items.push({
            id: `tx-${tx.type}-${tx.id}`,
            type: tx.type === 'income' ? 'income' : 'expense',
            title: tx.type === 'income' ? 'Pemasukan Dicatat' : 'Pengeluaran Dicatat',
            message: `${tx.title} (${tx.categoryName || 'Umum'}) sebesar ${formatCurrency(tx.amount)}`,
            date: tx.date,
          });
        });

        // 3. System Welcome / Summary Notification
        items.push({
          id: 'sys-welcome',
          type: 'success',
          title: 'Sistem Keuangan Aktif',
          message: `Total saldo bersih Anda saat ini: ${formatCurrency(report.summary.balance)}.`,
        });

        setNotifications(items);
      })
      .catch((error) =>
        Alert.alert(
          'Gagal memuat notifikasi',
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

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'danger':
        return <TriangleAlert color="#DC2626" size={20} />;
      case 'warning':
        return <TriangleAlert color="#D97706" size={20} />;
      case 'income':
        return <ArrowDownLeft color="#16A34A" size={20} />;
      case 'expense':
        return <ArrowUpRight color="#DC2626" size={20} />;
      case 'success':
        return <CheckCircle2 color="#16A34A" size={20} />;
      default:
        return <Info color="#0284C7" size={20} />;
    }
  };

  const getBadgeStyle = (type: NotificationItem['type']) => {
    switch (type) {
      case 'danger':
        return { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' };
      case 'warning':
        return { backgroundColor: '#FEF3C7', borderColor: '#FDE047' };
      case 'income':
        return { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' };
      case 'expense':
        return { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' };
      case 'success':
        return { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' };
      default:
        return { backgroundColor: '#E0F2FE', borderColor: '#7DD3FC' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.page}>
          <ScreenHeader subtitle="Pemberitahuan aktivitas dan anggaran Anda" title="Notifikasi" />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
            ) : notifications.length ? (
              <View style={styles.list}>
                {notifications.map((item) => (
                  <View key={item.id} style={[styles.notificationRow, getBadgeStyle(item.type)]}>
                    <View style={styles.notificationIcon}>{getIcon(item.type)}</View>
                    <View style={styles.notificationCopy}>
                      <Text style={styles.notificationTitle}>{item.title}</Text>
                      <Text style={styles.notificationText}>{item.message}</Text>
                      {item.date ? <Text style={styles.notificationDate}>{item.date}</Text> : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Bell color={colors.primary} size={30} />
                </View>
                <Text style={styles.emptyTitle}>Belum ada pemberitahuan</Text>
                <Text style={styles.emptyText}>
                  Notifikasi otomatis muncul ketika ada transaksi baru atau anggaran kategori berubah.
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
  content: { paddingBottom: 120, paddingTop: 18 },
  loader: { marginTop: 50 },
  list: { gap: 11 },
  notificationRow: {
    alignItems: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  notificationIcon: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    marginTop: 2,
    width: 38,
  },
  notificationCopy: { flex: 1, minWidth: 0 },
  notificationTitle: { color: '#0F172A', fontSize: 14, fontWeight: '800' },
  notificationText: { color: '#475569', fontSize: 12, lineHeight: 18, marginTop: 3 },
  notificationDate: { color: '#94A3B8', fontSize: 11, marginTop: 4 },
  emptyState: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 70 },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', marginTop: 14 },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 380,
    textAlign: 'center',
  },
});
