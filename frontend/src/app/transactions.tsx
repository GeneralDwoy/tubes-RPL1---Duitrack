import { useRouter } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, ReceiptText } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { colors, layout } from '@/constants/theme';
import {
  type FinanceTransaction,
  formatCurrency,
  listRecentTransactions,
} from '@/lib/finance';
import { useAuth } from '@/providers/auth-provider';

type TransactionFilter = 'all' | 'income' | 'expense';

const filters: { label: string; value: TransactionFilter }[] = [
  { label: 'Semua', value: 'all' },
  { label: 'Pemasukan', value: 'income' },
  { label: 'Pengeluaran', value: 'expense' },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

export default function TransactionsScreen() {
  const router = useRouter();
  const { loading: authLoading, session } = useAuth();
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !session) router.replace('/welcome');
  }, [authLoading, router, session]);

  useEffect(() => {
    if (!session) return;
    listRecentTransactions(100)
      .then(setTransactions)
      .catch((error) => Alert.alert('Gagal memuat transaksi', error.message))
      .finally(() => setLoading(false));
  }, [session]);

  if (authLoading || !session) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const visibleTransactions = transactions.filter(
    (transaction) => filter === 'all' || transaction.type === filter,
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <ScreenHeader subtitle="Cari kembali catatan pemasukan dan pengeluaran" title="Riwayat transaksi" />

        <View style={styles.actionRow}>
          <Pressable
            onPress={() => router.push({ pathname: '/add-transaction', params: { type: 'income' } })}
            style={({ pressed }) => [styles.actionButton, styles.incomeButton, pressed && styles.pressed]}>
            <ArrowDownLeft color={colors.primaryDark} size={19} />
            <Text style={styles.incomeButtonText}>Pemasukan</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push({ pathname: '/add-transaction', params: { type: 'expense' } })}
            style={({ pressed }) => [styles.actionButton, styles.expenseButton, pressed && styles.pressed]}>
            <ArrowUpRight color={colors.coral} size={19} />
            <Text style={styles.expenseButtonText}>Pengeluaran</Text>
          </Pressable>
        </View>

        <View style={styles.segmented}>
          {filters.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setFilter(item.value)}
              style={[styles.segment, filter === item.value && styles.segmentActive]}>
              <Text style={[styles.segmentText, filter === item.value && styles.segmentTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
          ) : visibleTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <ReceiptText color={colors.primary} size={30} />
              <Text style={styles.emptyTitle}>Belum ada transaksi</Text>
              <Text style={styles.emptyText}>Transaksi yang tersimpan akan tampil di sini.</Text>
            </View>
          ) : (
            visibleTransactions.map((transaction) => {
              const income = transaction.type === 'income';
              return (
                <View key={`${transaction.type}-${transaction.id}`} style={styles.transactionRow}>
                  <View style={[styles.transactionIcon, income ? styles.incomeIcon : styles.expenseIcon]}>
                    {income ? (
                      <ArrowDownLeft color={colors.primaryDark} size={19} />
                    ) : (
                      <ArrowUpRight color={colors.coral} size={19} />
                    )}
                  </View>
                  <View style={styles.transactionCopy}>
                    <Text style={styles.transactionTitle} numberOfLines={1}>
                      {transaction.title}
                    </Text>
                    <Text style={styles.transactionMeta} numberOfLines={1}>
                      {[transaction.categoryName, transaction.description, formatDate(transaction.date)]
                        .filter(Boolean)
                        .join(' - ')}
                    </Text>
                  </View>
                  <Text
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    style={[styles.amount, income ? styles.incomeAmount : styles.expenseAmount]}>
                    {income ? '+' : '-'} {formatCurrency(transaction.amount)}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.canvas, flex: 1 },
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: colors.canvas,
    flex: 1,
    justifyContent: 'center',
  },
  page: {
    alignSelf: 'center',
    flex: 1,
    maxWidth: 900,
    paddingHorizontal: 20,
    width: '100%',
  },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  actionButton: {
    alignItems: 'center',
    borderRadius: layout.radius,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 12,
  },
  incomeButton: { backgroundColor: colors.primarySoft },
  expenseButton: { backgroundColor: colors.coralSoft },
  incomeButtonText: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  expenseButtonText: { color: colors.coral, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.72 },
  segmented: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: layout.radius,
    flexDirection: 'row',
    marginTop: 14,
    padding: 4,
  },
  segment: { alignItems: 'center', borderRadius: 6, flex: 1, minHeight: 38, justifyContent: 'center' },
  segmentActive: { backgroundColor: colors.surface },
  segmentText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  segmentTextActive: { color: colors.primaryDark },
  list: { gap: 9, paddingBottom: 40, paddingTop: 16 },
  loader: { marginTop: 40 },
  transactionRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    minHeight: 70,
    padding: 12,
  },
  transactionIcon: {
    alignItems: 'center',
    borderRadius: layout.radius,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  incomeIcon: { backgroundColor: colors.primarySoft },
  expenseIcon: { backgroundColor: colors.coralSoft },
  transactionCopy: { flex: 1, gap: 4, minWidth: 0 },
  transactionTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  transactionMeta: { color: colors.muted, fontSize: 11 },
  amount: { fontSize: 13, fontWeight: '800', maxWidth: '38%', textAlign: 'right' },
  incomeAmount: { color: colors.primary },
  expenseAmount: { color: colors.coral },
  emptyState: { alignItems: 'center', gap: 8, paddingVertical: 70 },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  emptyText: { color: colors.muted, fontSize: 13, textAlign: 'center' },
});
