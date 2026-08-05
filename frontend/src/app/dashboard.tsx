import { useRouter } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChartNoAxesCombined,
  FileChartColumn,
  LogOut,
  PiggyBank,
  Plus,
  ReceiptText,
  Target,
  UserRound,
  WalletCards,
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
  useWindowDimensions,
  View,
} from 'react-native';

import { BrandMark } from '@/components/brand-mark';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { colors, layout } from '@/constants/theme';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import {
  formatCurrency,
  getMonthlyReport,
  listRecentTransactions,
  type FinanceTransaction,
  type MonthlySummary,
  type ReportCategory,
} from '@/lib/finance';
import { useAuth } from '@/providers/auth-provider';

const quickActions = [
  { color: colors.primary, icon: ArrowDownLeft, label: 'Pemasukan' },
  { color: colors.coral, icon: ArrowUpRight, label: 'Pengeluaran' },
  { color: colors.amber, icon: Target, label: 'Kelola Kategori & Anggaran' },
  { color: '#5377A6', icon: FileChartColumn, label: 'Laporan' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { loading, session, signOut } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [summary, setSummary] = useState<MonthlySummary>({
    balance: 0,
    expense: 0,
    income: 0,
  });
  const [reportCategories, setReportCategories] = useState<ReportCategory[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const { width } = useWindowDimensions();
  const isWide = width >= 760;
  const metadataName = session?.user.user_metadata.full_name;
  const firstName =
    typeof metadataName === 'string' && metadataName.trim()
      ? metadataName.trim().split(/\s+/)[0]
      : 'Pengguna';
  const currentPeriod = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  useEffect(() => {
    if (!loading && !session) router.replace('/welcome');
  }, [loading, router, session]);

  useEffect(() => {
    if (!session) return;

    let active = true;

    Promise.all([getMonthlyReport(), listRecentTransactions(5)])
      .then(([monthlyReport, nextTransactions]) => {
        if (!active) return;
        setSummary(monthlyReport.summary);
        setReportCategories(monthlyReport.categories);
        setTransactions(nextTransactions);
      })
      .catch((error) => {
        if (active) Alert.alert('Data belum dapat dimuat', getAuthErrorMessage(error));
      })
      .finally(() => {
        if (active) setDataLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session]);

  const showNextPhase = (label: string) => {
    Alert.alert(label, 'Menu ini akan disambungkan pada tahap transaksi dan laporan.');
  };

  const handleQuickAction = (label: string) => {
    if (label === 'Pemasukan') {
      router.push({ pathname: '/add-transaction', params: { type: 'income' } });
      return;
    }

    if (label === 'Pengeluaran') {
      router.push({ pathname: '/add-transaction', params: { type: 'expense' } });
      return;
    }

    if (label === 'Kelola Kategori & Anggaran') {
      router.push('/categories');
      return;
    }

    if (label === 'Laporan') {
      router.push('/reports');
      return;
    }

    showNextPhase(label);
  };

  const formatTransactionDate = (date: string) =>
    new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(
      new Date(`${date}T00:00:00`),
    );

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/welcome');
    } catch (error) {
      Alert.alert('Gagal keluar', getAuthErrorMessage(error));
    }
  };

  if (loading || !session) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const budgetedCategories = reportCategories.filter((category) => category.budget > 0);
  const totalBudget = budgetedCategories.reduce((total, category) => total + category.budget, 0);
  const budgetSpending = budgetedCategories.reduce((total, category) => total + category.spent, 0);
  const remainingBudget = Math.max(totalBudget - budgetSpending, 0);
  const savingRate = summary.income > 0 ? (summary.balance / summary.income) * 100 : 0;
  const budgetUsage = totalBudget > 0 ? (budgetSpending / totalBudget) * 100 : 0;
  const topCategory = reportCategories.find((category) => category.spent > 0);
  const hasFinancialData = summary.income > 0 || summary.expense > 0;
  const highlights = [
    {
      color: summary.balance >= 0 ? colors.primary : colors.coral,
      icon: WalletCards,
      label: 'Saldo bersih',
      value: formatCurrency(summary.balance),
    },
    {
      color: colors.amber,
      icon: Target,
      label: 'Anggaran pengeluaran',
      value: totalBudget > 0 ? formatCurrency(totalBudget) : 'Belum diatur',
    },
    {
      color: remainingBudget > 0 ? colors.primary : colors.coral,
      icon: PiggyBank,
      label: 'Sisa anggaran',
      value: totalBudget > 0 ? formatCurrency(remainingBudget) : '-',
    },
    {
      color: '#5377A6',
      icon: ChartNoAxesCombined,
      label: 'Rasio tabungan',
      value: summary.income > 0 ? `${Math.round(savingRate)}%` : '-',
    },
  ];
  const insight = !hasFinancialData
    ? {
        danger: false,
        text: 'Mulai mencatat pemasukan dan pengeluaran untuk melihat pola bulan ini.',
        title: 'Ringkasan keuangan menunggumu',
      }
    : summary.balance < 0
      ? {
          danger: true,
          text: `Pengeluaran melebihi pemasukan sebesar ${formatCurrency(Math.abs(summary.balance))}.`,
          title: 'Arus kas bulan ini defisit',
        }
      : budgetUsage > 100
        ? {
            danger: true,
            text: `Pemakaian anggaran sudah ${Math.round(budgetUsage)}%. Periksa kategori pengeluaranmu.`,
            title: 'Anggaran melewati batas',
          }
        : {
            danger: false,
            text: topCategory
              ? `Rasio tabungan ${Math.round(savingRate)}%. Pengeluaran terbesar: ${topCategory.name} (${formatCurrency(topCategory.spent)}).`
              : `Rasio tabungan bulan ini ${Math.round(savingRate)}%.`,
            title: 'Keuangan bulan ini terkendali',
          };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.page}>
          <View style={styles.header}>
            <BrandMark />
            <View style={styles.headerActions}>
              <Pressable
                accessibilityLabel="Notifikasi"
                accessibilityRole="button"
                onPress={() => router.push('/notifications')}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                <Bell color={colors.ink} size={20} />
                <View style={styles.badgeDot} />
              </Pressable>
              <Pressable
                accessibilityLabel="Profil dan pengaturan"
                accessibilityRole="button"
                onPress={() => router.push('/profile')}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                <UserRound color={colors.ink} size={20} />
              </Pressable>
              <Pressable
                accessibilityLabel="Keluar"
                accessibilityRole="button"
                onPress={() => void handleSignOut()}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                <LogOut color={colors.ink} size={20} />
              </Pressable>
            </View>
          </View>

          <View style={styles.greetingRow}>
            <View style={styles.greetingCopy}>
              <Text style={styles.greeting}>Halo, {firstName}</Text>
              <Text style={styles.period}>{currentPeriod}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/transactions')}
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
              <Plus color={colors.white} size={19} strokeWidth={2.5} />
              <Text style={styles.addButtonText}>Tambah transaksi</Text>
            </Pressable>
          </View>

          <View style={styles.balancePanel}>
            <View style={styles.balanceMain}>
              <Text style={styles.balanceLabel}>Total Saldo</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.balanceValue}>
                {formatCurrency(summary.balance)}
              </Text>
              <Text style={styles.balanceHint}>
                {summary.income || summary.expense
                  ? 'Ringkasan posisi keuangan'
                  : 'Belum ada transaksi pada periode ini'}
              </Text>
            </View>

            <View style={styles.balanceSubCards}>
              <View style={styles.subCardItem}>
                <Text style={styles.subCardLabel}>Pemasukan Bulan Ini</Text>
                <Text numberOfLines={1} style={styles.subCardIncome}>
                  +{formatCurrency(summary.income)}
                </Text>
              </View>
              <View style={styles.subCardItem}>
                <Text style={styles.subCardLabel}>Pengeluaran Bulan Ini</Text>
                <Text numberOfLines={1} style={styles.subCardExpense}>
                  -{formatCurrency(summary.expense)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ringkasan keuangan</Text>
              <Text style={styles.sectionMeta}>
                {totalBudget > 0 ? `${Math.round(budgetUsage)}% anggaran terpakai` : currentPeriod}
              </Text>
            </View>
            <View style={styles.summaryGrid}>
              {highlights.map(({ color, icon: Icon, label, value }) => (
                <View
                  key={label}
                  style={[styles.summaryItem, { flexBasis: isWide ? '23%' : '47%' }]}>
                  <View style={[styles.summaryIcon, { backgroundColor: `${color}18` }]}>
                    <Icon color={color} size={20} />
                  </View>
                  <Text style={styles.summaryLabel}>{label}</Text>
                  <Text adjustsFontSizeToFit numberOfLines={1} style={styles.summaryValue}>
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Akses cepat</Text>
              <Text style={styles.sectionMeta}>Kelola catatan keuangan</Text>
            </View>
            <View style={styles.actionGrid}>
              {quickActions.map(({ color, icon: Icon, label }) => (
                <Pressable
                  accessibilityRole="button"
                  key={label}
                  onPress={() => handleQuickAction(label)}
                  style={({ pressed }) => [
                    styles.actionCard,
                    { flexBasis: isWide ? '23%' : '47%' },
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.actionIcon, { backgroundColor: `${color}18` }]}>
                    <Icon color={color} size={22} strokeWidth={2.2} />
                  </View>
                  <Text style={styles.actionLabel}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Transaksi terbaru</Text>
              <Pressable onPress={() => router.push('/transactions')}>
                <Text style={styles.sectionLink}>Lihat semua</Text>
              </Pressable>
            </View>
            {dataLoading ? (
              <View style={styles.dataLoading}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : transactions.length ? (
              <View style={styles.transactionList}>
                {transactions.map((transaction) => {
                  const isIncome = transaction.type === 'income';

                  return (
                    <View key={`${transaction.type}-${transaction.id}`} style={styles.transactionRow}>
                      <View
                        style={[
                          styles.transactionIcon,
                          isIncome ? styles.incomeIcon : styles.expenseIcon,
                        ]}>
                        {isIncome ? (
                          <ArrowDownLeft color={colors.primaryDark} size={19} />
                        ) : (
                          <ArrowUpRight color={colors.coral} size={19} />
                        )}
                      </View>
                      <View style={styles.transactionCopy}>
                        <Text numberOfLines={1} style={styles.transactionTitle}>
                          {transaction.title}
                        </Text>
                        <Text numberOfLines={1} style={styles.transactionMeta}>
                          {[
                            transaction.categoryName,
                            transaction.description,
                            formatTransactionDate(transaction.date),
                          ]
                            .filter(Boolean)
                            .join('  |  ')}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={[
                          styles.transactionAmount,
                          isIncome ? styles.incomeAmount : styles.expenseAmount,
                        ]}>
                        {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <ReceiptText color={colors.primary} size={27} />
                </View>
                <Text style={styles.emptyTitle}>Belum ada transaksi</Text>
                <Text style={styles.emptyText}>
                  Catatan pemasukan atau pengeluaran pertamamu akan muncul di sini.
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.insightBand, insight.danger && styles.insightBandDanger]}>
            <ChartNoAxesCombined color={insight.danger ? colors.coral : colors.amber} size={24} />
            <View style={styles.insightCopy}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightText}>{insight.text}</Text>
            </View>
          </View>
          </View>
        </ScrollView>
        <AppBottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: colors.canvas,
    flex: 1,
    justifyContent: 'center',
  },
  safeArea: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  screen: { flex: 1 },
  scrollContent: {
    paddingBottom: 120,
  },
  page: {
    alignSelf: 'center',
    maxWidth: layout.pageMaxWidth,
    paddingHorizontal: 20,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  badgeDot: {
    backgroundColor: '#EF4444',
    borderColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 2,
    height: 10,
    position: 'absolute',
    right: 6,
    top: 6,
    width: 10,
  },
  greetingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
    paddingBottom: 22,
    paddingTop: 28,
  },
  greetingCopy: {
    gap: 5,
  },
  greeting: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: '800',
  },
  period: {
    color: colors.muted,
    fontSize: 14,
    textTransform: 'capitalize',
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: layout.radius,
    flexDirection: 'row',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 15,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  balancePanel: {
    alignItems: 'center',
    backgroundColor: '#22C55E',
    borderRadius: 24,
    elevation: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
    padding: 22,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  balanceMain: {
    flex: 1,
    gap: 4,
    minWidth: 180,
  },
  balanceLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.95,
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
  },
  balanceHint: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.85,
  },
  balanceSubCards: {
    gap: 8,
    minWidth: 180,
  },
  subCardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    elevation: 2,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  subCardLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  subCardIncome: {
    color: '#16A34A',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  subCardExpense: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  section: {
    marginTop: 30,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionMeta: {
    color: colors.muted,
    fontSize: 13,
  },
  sectionLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 118,
    padding: 14,
  },
  summaryIcon: {
    alignItems: 'center',
    borderRadius: layout.radius,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 10,
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
    maxWidth: '100%',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    flexGrow: 1,
    gap: 10,
    minHeight: 104,
    justifyContent: 'center',
    padding: 14,
  },
  actionIcon: {
    alignItems: 'center',
    borderRadius: layout.radius,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  actionLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  dataLoading: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 120,
  },
  transactionList: {
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    overflow: 'hidden',
  },
  transactionRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 11,
    minHeight: 68,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  transactionIcon: {
    alignItems: 'center',
    borderRadius: layout.radius,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  incomeIcon: {
    backgroundColor: '#DCFCE7',
  },
  expenseIcon: {
    backgroundColor: colors.coralSoft,
  },
  transactionCopy: {
    flex: 1,
    minWidth: 0,
  },
  transactionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  transactionMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: '800',
    maxWidth: '38%',
    textAlign: 'right',
  },
  incomeAmount: {
    color: colors.primaryDark,
  },
  expenseAmount: {
    color: colors.coral,
  },
  emptyState: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderStyle: 'dashed',
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 34,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: layout.radius,
    height: 52,
    justifyContent: 'center',
    marginBottom: 12,
    width: 52,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 5,
    maxWidth: 380,
    textAlign: 'center',
  },
  insightBand: {
    alignItems: 'center',
    backgroundColor: colors.amberSoft,
    borderRadius: layout.radius,
    flexDirection: 'row',
    gap: 13,
    marginTop: 26,
    padding: 16,
  },
  insightBandDanger: {
    backgroundColor: colors.coralSoft,
  },
  insightCopy: {
    flex: 1,
    gap: 3,
  },
  insightTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  insightText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});
