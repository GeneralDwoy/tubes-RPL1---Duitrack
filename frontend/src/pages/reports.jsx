import { useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  PiggyBank,
  Target,
  WalletCards,
  Loader2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { ScreenHeader } from '@/components/screen-header';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { colors, layout } from '@/constants/theme';
import {
  formatCurrency,
  getMonthlyReport,
  listMonthlyTransactions,
} from '@/lib/finance';
import { exportMonthlyReport } from '@/lib/report-export';
import { useAuth } from '@/providers/auth-provider';

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatPeriod(date) {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const { loading: authLoading, session } = useAuth();
  const currentMonth = startOfMonth(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [report, setReport] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    if (!authLoading && !session) navigate('/welcome', { replace: true });
  }, [authLoading, navigate, session]);

  useEffect(() => {
    if (!session) return;

    let active = true;
    Promise.all([getMonthlyReport(selectedMonth), listMonthlyTransactions(selectedMonth)])
      .then(([nextReport, nextTransactions]) => {
        if (!active) return;
        setReport(nextReport);
        setTransactions(nextTransactions);
      })
      .catch((error) => {
        if (active) {
          alert(error instanceof Error ? error.message : 'Terjadi kesalahan saat membaca laporan.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedMonth, session]);

  const changeMonth = (offset) => {
    const nextMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + offset, 1);
    if (nextMonth > currentMonth) return;
    setLoading(true);
    setReport(null);
    setTransactions([]);
    setSelectedMonth(nextMonth);
  };

  const handleExport = async (format) => {
    if (!report) return;
    setExporting(format);
    try {
      await exportMonthlyReport(report, transactions, format);
      alert(
        format === 'excel'
          ? 'File Excel (.xlsx) sudah diunduh ke perangkatmu.'
          : 'File PDF sudah diunduh ke perangkatmu.',
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Silakan coba kembali.');
    } finally {
      setExporting(null);
    }
  };

  if (authLoading || !session) {
    return (
      <div style={{ alignItems: 'center', backgroundColor: colors.canvas, display: 'flex', minHeight: '100vh', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" color={colors.primary} size={36} />
      </div>
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
    <div style={{ backgroundColor: colors.canvas, minHeight: '100vh', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: layout.pageMaxWidth, margin: '0 auto', padding: '0 20px 120px 20px', boxSizing: 'border-box' }}>
        <ScreenHeader
          backHref="/dashboard"
          subtitle="Pantau arus kas dan pemakaian anggaran"
          title="Laporan keuangan"
        />

        {/* Period Selector */}
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
          <button
            aria-label="Bulan sebelumnya"
            onClick={() => changeMonth(-1)}
            style={{
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderColor: colors.line,
              borderRadius: layout.radius,
              borderWidth: 1,
              borderStyle: 'solid',
              cursor: 'pointer',
              display: 'flex',
              height: 42,
              justifyContent: 'center',
              width: 42,
            }}
            type="button"
          >
            <ChevronLeft color={colors.ink} size={21} />
          </button>
          <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', minWidth: 190, padding: '0 16px' }}>
            <span style={{ color: colors.muted, fontSize: 11 }}>Periode laporan</span>
            <span style={{ color: colors.ink, fontSize: 17, fontWeight: '800', marginTop: 3, textTransform: 'capitalize' }}>
              {formatPeriod(selectedMonth)}
            </span>
          </div>
          <button
            aria-label="Bulan berikutnya"
            disabled={nextDisabled}
            onClick={() => changeMonth(1)}
            style={{
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderColor: colors.line,
              borderRadius: layout.radius,
              borderWidth: 1,
              borderStyle: 'solid',
              cursor: nextDisabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              height: 42,
              justifyContent: 'center',
              opacity: nextDisabled ? 0.35 : 1,
              width: 42,
            }}
            type="button"
          >
            <ChevronRight color={colors.ink} size={21} />
          </button>
        </div>

        {loading ? (
          <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 320, justifyContent: 'center' }}>
            <Loader2 className="animate-spin" color={colors.primary} size={36} />
            <span style={{ color: colors.muted, fontSize: 13 }}>Menyiapkan laporan...</span>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 24 }}>
              {summaryItems.map(({ color, icon: Icon, label, softColor, value }) => (
                <div
                  key={label}
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.line,
                    borderRadius: layout.radius,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 132,
                    padding: 16,
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      alignItems: 'center',
                      backgroundColor: softColor,
                      borderRadius: layout.radius,
                      display: 'flex',
                      height: 36,
                      justifyContent: 'center',
                      width: 36,
                    }}
                  >
                    <Icon color={color} size={20} />
                  </div>
                  <span style={{ color: colors.muted, fontSize: 12, marginTop: 12 }}>{label}</span>
                  <span style={{ color, fontSize: 20, fontWeight: '800', marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {formatCurrency(value)}
                  </span>
                </div>
              ))}
            </div>

            {/* Savings Rate Insight */}
            <div
              style={{
                alignItems: 'center',
                backgroundColor: colors.amberSoft,
                borderRadius: layout.radius,
                display: 'flex',
                flexDirection: 'row',
                gap: 13,
                marginTop: 16,
                padding: 16,
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderRadius: layout.radius,
                  display: 'flex',
                  height: 44,
                  justifyContent: 'center',
                  width: 44,
                  flexShrink: 0,
                }}
              >
                <PiggyBank color={summary.balance >= 0 ? colors.primaryDark : colors.coral} size={25} />
              </div>
              <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 3, minWidth: 0 }}>
                <span style={{ color: colors.ink, fontSize: 14, fontWeight: '800' }}>
                  {!hasTransactions
                    ? 'Belum ada aktivitas pada bulan ini'
                    : summary.balance >= 0
                      ? `Tingkat simpanan ${Math.max(Math.round(savingRate), 0)}%`
                      : 'Pengeluaran melebihi pemasukan'}
                </span>
                <span style={{ color: colors.muted, fontSize: 12, lineHeight: '18px' }}>
                  {!hasTransactions
                    ? 'Tambahkan transaksi untuk mulai membentuk laporan.'
                    : summary.balance >= 0
                      ? `${formatCurrency(summary.balance)} masih tersisa dari pemasukan bulan ini.`
                      : `Defisit bulan ini sebesar ${formatCurrency(Math.abs(summary.balance))}.`}
                </span>
              </div>
            </div>

            {/* Export Bar */}
            <div
              style={{
                alignItems: 'center',
                borderBottom: `1px solid ${colors.line}`,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 14,
                justifyContent: 'space-between',
                marginTop: 20,
                paddingBottom: 18,
              }}
            >
              <div style={{ display: 'flex', flex: 1, flexDirection: 'column', minWidth: 210 }}>
                <span style={{ color: colors.ink, fontSize: 15, fontWeight: '800' }}>Ekspor laporan</span>
                <span style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>
                  Simpan riwayat bulan ini sebagai Excel atau PDF.
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                <button
                  disabled={Boolean(exporting)}
                  onClick={() => void handleExport('excel')}
                  style={{
                    alignItems: 'center',
                    backgroundColor: colors.surface,
                    borderColor: colors.line,
                    borderRadius: layout.radius,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    cursor: exporting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 7,
                    justifyContent: 'center',
                    minHeight: 40,
                    minWidth: 92,
                    padding: '0 12px',
                  }}
                  type="button"
                >
                  {exporting === 'excel' ? (
                    <Loader2 className="animate-spin" color={colors.primaryDark} size={18} />
                  ) : (
                    <FileSpreadsheet color={colors.primaryDark} size={18} />
                  )}
                  <span style={{ color: colors.ink, fontSize: 12, fontWeight: '700' }}>Excel</span>
                </button>
                <button
                  disabled={Boolean(exporting)}
                  onClick={() => void handleExport('pdf')}
                  style={{
                    alignItems: 'center',
                    backgroundColor: colors.surface,
                    borderColor: colors.line,
                    borderRadius: layout.radius,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    cursor: exporting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 7,
                    justifyContent: 'center',
                    minHeight: 40,
                    minWidth: 92,
                    padding: '0 12px',
                  }}
                  type="button"
                >
                  {exporting === 'pdf' ? (
                    <Loader2 className="animate-spin" color={colors.coral} size={18} />
                  ) : (
                    <FileText color={colors.coral} size={18} />
                  )}
                  <span style={{ color: colors.ink, fontSize: 12, fontWeight: '700' }}>PDF</span>
                </button>
              </div>
            </div>

            {/* Weekly Cashflow Section */}
            <section
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.line,
                borderRadius: layout.radius,
                borderWidth: 1,
                borderStyle: 'solid',
                marginTop: 18,
                padding: 18,
                boxSizing: 'border-box',
              }}
            >
              <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ color: colors.ink, fontSize: 17, fontWeight: '800', margin: 0 }}>Arus kas per minggu</h3>
                  <p style={{ color: colors.muted, fontSize: 12, margin: '4px 0 0 0' }}>Nominal transaksi berdasarkan tanggal</p>
                </div>
                <ChartNoAxesCombined color={colors.primary} size={23} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'row', gap: 18, marginTop: 20 }}>
                <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row', gap: 7 }}>
                  <div style={{ backgroundColor: colors.primary, borderRadius: 3, height: 9, width: 9 }} />
                  <span style={{ color: colors.muted, fontSize: 11 }}>Pemasukan</span>
                </div>
                <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row', gap: 7 }}>
                  <div style={{ backgroundColor: colors.coral, borderRadius: 3, height: 9, width: 9 }} />
                  <span style={{ color: colors.muted, fontSize: 11 }}>Pengeluaran</span>
                </div>
              </div>

              <div
                style={{
                  alignItems: 'flex-end',
                  borderBottom: `1px solid ${colors.line}`,
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 8,
                  height: 190,
                  marginTop: 12,
                  padding: '0 4px',
                }}
              >
                {report?.weeks.map((week) => {
                  const incomeHeight = week.income ? Math.max((week.income / maxWeekValue) * 100, 4) : 0;
                  const expenseHeight = week.expense
                    ? Math.max((week.expense / maxWeekValue) * 100, 4)
                    : 0;

                  return (
                    <div key={week.label} style={{ alignItems: 'center', display: 'flex', flex: 1, flexDirection: 'column', height: '100%', justifyContent: 'flex-end', minWidth: 0 }}>
                      <div style={{ alignItems: 'flex-end', display: 'flex', flex: 1, flexDirection: 'row', gap: 4, justifyContent: 'center', width: '100%' }}>
                        <div
                          title={`Pemasukan ${formatCurrency(week.income)}`}
                          style={{
                            backgroundColor: colors.primary,
                            borderTopLeftRadius: 4,
                            borderTopRightRadius: 4,
                            height: `${incomeHeight}%`,
                            maxWidth: 24,
                            minWidth: 5,
                            width: '34%',
                          }}
                        />
                        <div
                          title={`Pengeluaran ${formatCurrency(week.expense)}`}
                          style={{
                            backgroundColor: colors.coral,
                            borderTopLeftRadius: 4,
                            borderTopRightRadius: 4,
                            height: `${expenseHeight}%`,
                            maxWidth: 24,
                            minWidth: 5,
                            width: '34%',
                          }}
                        />
                      </div>
                      <span style={{ color: colors.muted, fontSize: 10, marginBottom: 7, marginTop: 7 }}>{week.label}</span>
                    </div>
                  );
                })}
              </div>
              <p style={{ color: colors.muted, fontSize: 10, margin: '8px 0 0 0', textAlign: 'center' }}>Tanggal dalam bulan</p>
            </section>

            {/* Category Budget Section */}
            <section
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.line,
                borderRadius: layout.radius,
                borderWidth: 1,
                borderStyle: 'solid',
                marginTop: 18,
                padding: 18,
                boxSizing: 'border-box',
              }}
            >
              <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ color: colors.ink, fontSize: 17, fontWeight: '800', margin: 0 }}>Anggaran per kategori</h3>
                  <p style={{ color: colors.muted, fontSize: 12, margin: '4px 0 0 0' }}>Pemakaian batas pengeluaran bulanan</p>
                </div>
                <Target color={colors.amber} size={23} />
              </div>

              {report?.categories.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
                  {report.categories.map((category) => {
                    const progress =
                      category.budget > 0
                        ? category.percentage
                        : summary.expense > 0
                          ? (category.spent / summary.expense) * 100
                          : 0;
                    const progressWidth = `${Math.min(progress, 100)}%`;
                    const nearLimit = category.budget > 0 && category.percentage >= 90;

                    return (
                      <div
                        key={category.id}
                        style={{
                          borderBottom: `1px solid ${colors.line}`,
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '15px 0',
                        }}
                      >
                        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                          <div style={{ alignItems: 'center', display: 'flex', gap: 9, minWidth: 0 }}>
                            <div style={{ backgroundColor: category.color, borderRadius: 4, height: 12, width: 12, flexShrink: 0 }} />
                            <span style={{ color: colors.ink, fontSize: 14, fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {category.name}
                            </span>
                          </div>
                          <span style={{ color: colors.ink, fontSize: 13, fontWeight: '800', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {formatCurrency(category.spent)}
                          </span>
                        </div>
                        <div style={{ backgroundColor: colors.surfaceMuted, borderRadius: 4, height: 7, marginTop: 11, overflow: 'hidden', width: '100%' }}>
                          <div
                            style={{
                              backgroundColor: nearLimit ? colors.coral : category.color,
                              borderRadius: 4,
                              height: '100%',
                              width: progressWidth,
                            }}
                          />
                        </div>
                        <span style={{ color: nearLimit ? colors.coral : colors.muted, fontSize: 11, fontWeight: nearLimit ? '700' : '400', marginTop: 7 }}>
                          {category.budget > 0
                            ? `${Math.round(category.percentage)}% dari ${formatCurrency(category.budget)}`
                            : `${Math.round(progress)}% dari total pengeluaran`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 8, padding: '42px 20px', textAlign: 'center' }}>
                  <Target color={colors.primary} size={28} />
                  <h4 style={{ color: colors.ink, fontSize: 16, fontWeight: '800', margin: 0 }}>Belum ada data kategori</h4>
                  <p style={{ color: colors.muted, fontSize: 12, lineHeight: '18px', margin: 0, maxWidth: 360 }}>
                    Kategori yang memiliki transaksi atau anggaran akan tampil di sini.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
      <AppBottomNav />
    </div>
  );
}
