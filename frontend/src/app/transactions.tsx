import { useRouter } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Pencil,
  ReceiptText,
  Search,
  Trash2,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { colors, layout } from '@/constants/theme';
import {
  deleteTransaction,
  type FinanceTransaction,
  formatCurrency,
  listRecentTransactions,
} from '@/lib/finance';
import { useAuth } from '@/providers/auth-provider';

type TransactionFilter = 'all' | 'income' | 'expense';
type PeriodFilter = 'all' | 'date' | 'month' | 'year';

const filters: { label: string; value: TransactionFilter }[] = [
  { label: 'Semua', value: 'all' },
  { label: 'Pemasukan', value: 'income' },
  { label: 'Pengeluaran', value: 'expense' },
];

const periodFilters: { label: string; value: PeriodFilter }[] = [
  { label: 'Semua', value: 'all' },
  { label: 'Tanggal', value: 'date' },
  { label: 'Bulan', value: 'month' },
  { label: 'Tahun', value: 'year' },
];

function getDefaultPeriodValue(filter: PeriodFilter) {
  const date = new Date();
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  if (filter === 'date') return `${year}-${month}-${day}`;
  if (filter === 'month') return `${year}-${month}`;
  if (filter === 'year') return year;
  return '';
}

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
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [periodValue, setPeriodValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !session) router.replace('/welcome');
  }, [authLoading, router, session]);

  useEffect(() => {
    if (!session) return;
    listRecentTransactions(1000)
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

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase('id-ID');
  const visibleTransactions = transactions.filter((transaction) => {
    const matchesType = filter === 'all' || transaction.type === filter;
    const matchesPeriod =
      periodFilter === 'all' ||
      Boolean(
        periodValue &&
          ((periodFilter === 'date' && transaction.date === periodValue) ||
            (periodFilter === 'month' && transaction.date.startsWith(periodValue)) ||
            (periodFilter === 'year' && transaction.date.startsWith(periodValue))),
      );
    const searchableText = [
      transaction.title,
      transaction.categoryName,
      transaction.description,
      formatCurrency(transaction.amount),
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('id-ID');
    const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
    return matchesType && matchesPeriod && matchesSearch;
  });

  const selectPeriodFilter = (nextFilter: PeriodFilter) => {
    setPeriodFilter(nextFilter);
    setPeriodValue(getDefaultPeriodValue(nextFilter));
  };

  const confirmDelete = (transaction: FinanceTransaction) => {
    Alert.alert(
      'Hapus transaksi?',
      `${transaction.title} senilai ${formatCurrency(transaction.amount)} akan dihapus.`,
      [
        { style: 'cancel', text: 'Batal' },
        {
          onPress: async () => {
            setDeletingId(transaction.id);
            try {
              await deleteTransaction(transaction.type, transaction.id);
              setTransactions((current) =>
                current.filter(
                  (item) => item.id !== transaction.id || item.type !== transaction.type,
                ),
              );
            } catch (error) {
              Alert.alert(
                'Transaksi tidak dapat dihapus',
                error instanceof Error ? error.message : 'Silakan coba kembali.',
              );
            } finally {
              setDeletingId(null);
            }
          },
          style: 'destructive',
          text: 'Hapus',
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
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

        <View style={styles.filterArea}>
          <View style={styles.searchShell}>
            <Search color={colors.muted} size={18} />
            <TextInput
              accessibilityLabel="Cari transaksi"
              onChangeText={setSearchQuery}
              placeholder="Cari transaksi atau kategori"
              placeholderTextColor="#8A9A96"
              style={styles.searchInput}
              value={searchQuery}
            />
          </View>

          <View style={styles.periodSegmented}>
            {periodFilters.map((item) => (
              <Pressable
                accessibilityRole="button"
                key={item.value}
                onPress={() => selectPeriodFilter(item.value)}
                style={[
                  styles.periodSegment,
                  periodFilter === item.value && styles.periodSegmentActive,
                ]}>
                <Text
                  style={[
                    styles.periodSegmentText,
                    periodFilter === item.value && styles.periodSegmentTextActive,
                  ]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {periodFilter !== 'all' ? (
            <View style={styles.periodInputShell}>
              <CalendarDays color={colors.muted} size={18} />
              <TextInput
                accessibilityLabel={`Filter ${periodFilter}`}
                maxLength={periodFilter === 'date' ? 10 : periodFilter === 'month' ? 7 : 4}
                onChangeText={setPeriodValue}
                placeholder={
                  periodFilter === 'date'
                    ? 'YYYY-MM-DD'
                    : periodFilter === 'month'
                      ? 'YYYY-MM'
                      : 'YYYY'
                }
                placeholderTextColor="#8A9A96"
                style={styles.periodInput}
                value={periodValue}
              />
            </View>
          ) : null}

          {!loading ? (
            <Text style={styles.resultCount}>{visibleTransactions.length} transaksi ditemukan</Text>
          ) : null}
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
          ) : visibleTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <ReceiptText color={colors.primary} size={30} />
              <Text style={styles.emptyTitle}>Belum ada transaksi</Text>
              <Text style={styles.emptyText}>
                {transactions.length
                  ? 'Tidak ada transaksi yang sesuai dengan pencarian atau filter.'
                  : 'Transaksi yang tersimpan akan tampil di sini.'}
              </Text>
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
                  <View style={styles.transactionRight}>
                    <Text
                      adjustsFontSizeToFit
                      numberOfLines={1}
                      style={[styles.amount, income ? styles.incomeAmount : styles.expenseAmount]}>
                      {income ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </Text>
                    <View style={styles.rowActions}>
                      <Pressable
                        accessibilityLabel={`Ubah ${transaction.title}`}
                        accessibilityRole="button"
                        onPress={() =>
                          router.push({
                            pathname: '/add-transaction',
                            params: { id: transaction.id, type: transaction.type },
                          })
                        }
                        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                        <Pencil color={colors.ink} size={16} />
                      </Pressable>
                      <Pressable
                        accessibilityLabel={`Hapus ${transaction.title}`}
                        accessibilityRole="button"
                        disabled={deletingId === transaction.id}
                        onPress={() => confirmDelete(transaction)}
                        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                        {deletingId === transaction.id ? (
                          <ActivityIndicator color={colors.coral} size="small" />
                        ) : (
                          <Trash2 color={colors.coral} size={16} />
                        )}
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })
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
  filterArea: { gap: 10, marginTop: 12 },
  searchShell: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    minHeight: 46,
    paddingHorizontal: 13,
  },
  searchInput: {
    borderWidth: 0,
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    minWidth: 0,
    outlineWidth: 0,
    paddingVertical: 10,
  },
  periodSegmented: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: layout.radius,
    flexDirection: 'row',
    padding: 4,
  },
  periodSegment: { alignItems: 'center', borderRadius: 6, flex: 1, minHeight: 34, justifyContent: 'center' },
  periodSegmentActive: { backgroundColor: colors.surface },
  periodSegmentText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  periodSegmentTextActive: { color: colors.primaryDark },
  periodInputShell: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    minHeight: 44,
    paddingHorizontal: 13,
  },
  periodInput: {
    borderWidth: 0,
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    outlineWidth: 0,
    paddingVertical: 9,
  },
  resultCount: { color: colors.muted, fontSize: 11 },
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
  transactionRight: { alignItems: 'flex-end', gap: 8, maxWidth: '42%', minWidth: 88 },
  amount: { fontSize: 13, fontWeight: '800', maxWidth: '100%', textAlign: 'right' },
  rowActions: { flexDirection: 'row', gap: 6 },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 6,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  incomeAmount: { color: colors.primary },
  expenseAmount: { color: colors.coral },
  emptyState: { alignItems: 'center', gap: 8, paddingVertical: 70 },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  emptyText: { color: colors.muted, fontSize: 13, textAlign: 'center' },
});
