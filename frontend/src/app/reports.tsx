import { useRouter } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Target,
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

import { ScreenHeader } from '@/components/screen-header';
import { colors, layout } from '@/constants/theme';
import { formatCurrency, getMonthlyReport, type MonthlyReport } from '@/lib/finance';
import { useAuth } from '@/providers/auth-provider';

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatPeriod(date: Date) {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
}

export default function ReportsScreen() {
  const router = useRouter();
  const { loading: authLoading, session } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 760;
  const currentMonth = startOfMonth(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !session) router.replace('/welcome');
  }, [authLoading, router, session]);

  useEffect(() => {
    if (!session) return;

    let active = true;
    getMonthlyReport(selectedMonth)
      .then((nextReport) => {
        if (active) setReport(nextReport);
      })
      .catch((error) => {
        if (active) {
          Alert.alert(
            'Laporan belum dapat dimuat',
            error instanceof Error ? error.message : 'Terjadi kesalahan saat membaca laporan.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedMonth, session]);

  const changeMonth = (offset: number) => {
    const nextMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + offset, 1);
    if (nextMonth > currentMonth) return;
    setLoading(true);
    setReport(null);
    setSelectedMonth(nextMonth);
  };

  if (authLoading || !session) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const summary = report?.summary ?? { balance: 0, expense: 0, income: 0 };
  const savingRate = summary.income > 0 ? (summary.balance / summary.income) * 100 : 0;
  const maxWeekValue = Math.max(
    1,
    ...(report?.weeks.flatMap((week) => [week.income, week.expense]) ?? []),
  );
  const hasTransactions = summary.income > 0 || summary.expense > 0;
  const nextDisabled =
    selectedMonth.getFullYear() === currentMonth.getFullYear() &&
    selectedMonth.getMonth() === currentMonth.getMonth();

  const summaryItems = [
    {
      color: colors.primaryDark,
      icon: WalletCards,
      label: 'Saldo bulan ini',
      softColor: colors.primarySoft,
      value: summary.balance,
    },
    {
      color: colors.primary,
      icon: ArrowDownLeft,
      label: 'Total pemasukan',
      softColor: colors.primarySoft,
      value: summary.income,
    },
    {
      color: colors.coral,
      icon: ArrowUpRight,
      label: 'Total pengeluaran',
      softColor: colors.coralSoft,
      value: summary.expense,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          <ScreenHeader subtitle="Pantau arus kas dan pemakaian anggaran" title="Laporan keuangan" />

          <View style={styles.periodRow}>
            <Pressable
              accessibilityLabel="Bulan sebelumnya"
              accessibilityRole="button"
              onPress={() => changeMonth(-1)}
              style={({ pressed }) => [styles.periodButton, pressed && styles.pressed]}>
              <ChevronLeft color={colors.ink} size={21} />
            </Pressable>
            <View style={styles.periodCopy}>
              <Text style={styles.periodLabel}>Periode laporan</Text>
              <Text style={styles.periodValue}>{formatPeriod(selectedMonth)}</Text>
            </View>
            <Pressable
              accessibilityLabel="Bulan berikutnya"
              accessibilityRole="button"
              disabled={nextDisabled}
              onPress={() => changeMonth(1)}
              style={({ pressed }) => [
                styles.periodButton,
                nextDisabled && styles.disabled,
                pressed && styles.pressed,
              ]}>
              <ChevronRight color={colors.ink} size={21} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.reportLoading}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.loadingText}>Menyiapkan laporan...</Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryGrid}>
                {summaryItems.map(({ color, icon: Icon, label, softColor, value }) => (
                  <View
                    key={label}
                    style={[styles.summaryCard, { flexBasis: isWide ? '31%' : '47%' }]}>
                    <View style={[styles.summaryIcon, { backgroundColor: softColor }]}>
                      <Icon color={color} size={20} />
                    </View>
                    <Text style={styles.summaryLabel}>{label}</Text>
                    <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.summaryValue, { color }]}>
                      {formatCurrency(value)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.insightBand}>
                <View style={styles.insightIcon}>
                  <PiggyBank color={summary.balance >= 0 ? colors.primaryDark : colors.coral} size={25} />
                </View>
                <View style={styles.insightCopy}>
                  <Text style={styles.insightTitle}>
                    {!hasTransactions
                      ? 'Belum ada aktivitas pada bulan ini'
                      : summary.balance >= 0
                        ? `Tingkat simpanan ${Math.max(Math.round(savingRate), 0)}%`
                        : 'Pengeluaran melebihi pemasukan'}
                  </Text>
                  <Text style={styles.insightText}>
                    {!hasTransactions
                      ? 'Tambahkan transaksi untuk mulai membentuk laporan.'
                      : summary.balance >= 0
                        ? `${formatCurrency(summary.balance)} masih tersisa dari pemasukan bulan ini.`
                        : `Defisit bulan ini sebesar ${formatCurrency(Math.abs(summary.balance))}.`}
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeading}>
                  <View>
                    <Text style={styles.sectionTitle}>Arus kas per minggu</Text>
                    <Text style={styles.sectionSubtitle}>Nominal transaksi berdasarkan tanggal</Text>
                  </View>
                  <ChartNoAxesCombined color={colors.primary} size={23} />
                </View>

                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendMark, styles.incomeMark]} />
                    <Text style={styles.legendText}>Pemasukan</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendMark, styles.expenseMark]} />
                    <Text style={styles.legendText}>Pengeluaran</Text>
                  </View>
                </View>

                <View style={styles.chart}>
                  {report?.weeks.map((week) => {
                    const incomeHeight = week.income ? Math.max((week.income / maxWeekValue) * 100, 4) : 0;
                    const expenseHeight = week.expense
                      ? Math.max((week.expense / maxWeekValue) * 100, 4)
                      : 0;

                    return (
                      <View key={week.label} style={styles.weekColumn}>
                        <View style={styles.barArea}>
                          <View
                            accessibilityLabel={`${week.label}, pemasukan ${formatCurrency(week.income)}`}
                            style={[styles.bar, styles.incomeBar, { height: `${incomeHeight}%` }]}
                          />
                          <View
                            accessibilityLabel={`${week.label}, pengeluaran ${formatCurrency(week.expense)}`}
                            style={[styles.bar, styles.expenseBar, { height: `${expenseHeight}%` }]}
                          />
                        </View>
                        <Text style={styles.weekLabel}>{week.label}</Text>
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.chartCaption}>Tanggal dalam bulan</Text>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeading}>
                  <View>
                    <Text style={styles.sectionTitle}>Anggaran per kategori</Text>
                    <Text style={styles.sectionSubtitle}>Pemakaian batas pengeluaran bulanan</Text>
                  </View>
                  <Target color={colors.amber} size={23} />
                </View>

                {report?.categories.length ? (
                  <View style={styles.categoryList}>
                    {report.categories.map((category) => {
                      const progress =
                        category.budget > 0
                          ? category.percentage
                          : summary.expense > 0
                            ? (category.spent / summary.expense) * 100
                            : 0;
                      const progressWidth = `${Math.min(progress, 100)}%` as `${number}%`;
                      const nearLimit = category.budget > 0 && category.percentage >= 90;

                      return (
                        <View key={category.id} style={styles.categoryRow}>
                          <View style={styles.categoryHeader}>
                            <View style={styles.categoryNameRow}>
                              <View style={[styles.categoryMark, { backgroundColor: category.color }]} />
                              <Text numberOfLines={1} style={styles.categoryName}>
                                {category.name}
                              </Text>
                            </View>
                            <Text adjustsFontSizeToFit numberOfLines={1} style={styles.categoryAmount}>
                              {formatCurrency(category.spent)}
                            </Text>
                          </View>
                          <View style={styles.progressTrack}>
                            <View
                              style={[
                                styles.progressFill,
                                { backgroundColor: nearLimit ? colors.coral : category.color, width: progressWidth },
                              ]}
                            />
                          </View>
                          <Text style={[styles.categoryMeta, nearLimit && styles.limitText]}>
                            {category.budget > 0
                              ? `${Math.round(category.percentage)}% dari ${formatCurrency(category.budget)}`
                              : `${Math.round(progress)}% dari total pengeluaran`}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Target color={colors.primary} size={28} />
                    <Text style={styles.emptyTitle}>Belum ada data kategori</Text>
                    <Text style={styles.emptyText}>
                      Kategori yang memiliki transaksi atau anggaran akan tampil di sini.
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
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
  scrollContent: { paddingBottom: 44 },
  page: {
    alignSelf: 'center',
    maxWidth: layout.pageMaxWidth,
    paddingHorizontal: 20,
    width: '100%',
  },
  periodRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  periodButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  periodCopy: { alignItems: 'center', minWidth: 190, paddingHorizontal: 16 },
  periodLabel: { color: colors.muted, fontSize: 11 },
  periodValue: { color: colors.ink, fontSize: 17, fontWeight: '800', marginTop: 3, textTransform: 'capitalize' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.35 },
  reportLoading: { alignItems: 'center', gap: 12, minHeight: 320, justifyContent: 'center' },
  loadingText: { color: colors.muted, fontSize: 13 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 24 },
  summaryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 132,
    minWidth: 0,
    padding: 16,
  },
  summaryIcon: { alignItems: 'center', borderRadius: layout.radius, height: 36, justifyContent: 'center', width: 36 },
  summaryLabel: { color: colors.muted, fontSize: 12, marginTop: 12 },
  summaryValue: { fontSize: 20, fontWeight: '800', marginTop: 5, maxWidth: '100%' },
  insightBand: {
    alignItems: 'center',
    backgroundColor: colors.amberSoft,
    borderRadius: layout.radius,
    flexDirection: 'row',
    gap: 13,
    marginTop: 16,
    padding: 16,
  },
  insightIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: layout.radius,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  insightCopy: { flex: 1, gap: 3, minWidth: 0 },
  insightTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  insightText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  section: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    marginTop: 18,
    padding: 18,
  },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  sectionSubtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  legendRow: { flexDirection: 'row', gap: 18, marginTop: 20 },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  legendMark: { borderRadius: 3, height: 9, width: 9 },
  incomeMark: { backgroundColor: colors.primary },
  expenseMark: { backgroundColor: colors.coral },
  legendText: { color: colors.muted, fontSize: 11 },
  chart: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 190,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  weekColumn: { alignItems: 'center', flex: 1, justifyContent: 'flex-end', minWidth: 0 },
  barArea: { alignItems: 'flex-end', flex: 1, flexDirection: 'row', gap: 4, justifyContent: 'center', width: '100%' },
  bar: { borderTopLeftRadius: 4, borderTopRightRadius: 4, maxWidth: 24, minWidth: 5, width: '34%' },
  incomeBar: { backgroundColor: colors.primary },
  expenseBar: { backgroundColor: colors.coral },
  weekLabel: { color: colors.muted, fontSize: 10, marginBottom: 7, marginTop: 7 },
  chartCaption: { color: colors.muted, fontSize: 10, marginTop: 8, textAlign: 'center' },
  categoryList: { marginTop: 8 },
  categoryRow: { borderBottomColor: colors.line, borderBottomWidth: 1, paddingVertical: 15 },
  categoryHeader: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  categoryNameRow: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 9, minWidth: 0 },
  categoryMark: { borderRadius: 4, height: 12, width: 12 },
  categoryName: { color: colors.ink, flex: 1, fontSize: 14, fontWeight: '700' },
  categoryAmount: { color: colors.ink, fontSize: 13, fontWeight: '800', maxWidth: '42%', textAlign: 'right' },
  progressTrack: { backgroundColor: colors.surfaceMuted, borderRadius: 4, height: 7, marginTop: 11, overflow: 'hidden' },
  progressFill: { borderRadius: 4, height: '100%' },
  categoryMeta: { color: colors.muted, fontSize: 11, marginTop: 7 },
  limitText: { color: colors.coral, fontWeight: '700' },
  emptyState: { alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 42 },
  emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  emptyText: { color: colors.muted, fontSize: 12, lineHeight: 18, maxWidth: 360, textAlign: 'center' },
});
