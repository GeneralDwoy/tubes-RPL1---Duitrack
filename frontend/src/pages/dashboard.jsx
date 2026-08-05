import { useNavigate } from 'react-router-dom';
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
  Loader2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { BrandMark } from '@/components/brand-mark';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { colors, layout } from '@/constants/theme';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import {
  formatCurrency,
  getMonthlyReport,
  listRecentTransactions,
} from '@/lib/finance';
import { useAuth } from '@/providers/auth-provider';

const quickActions = [
  { color: colors.primary, icon: ArrowDownLeft, label: 'Pemasukan' },
  { color: colors.coral, icon: ArrowUpRight, label: 'Pengeluaran' },
  { color: colors.amber, icon: Target, label: 'Kelola Kategori & Anggaran' },
  { color: '#5377A6', icon: FileChartColumn, label: 'Laporan' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { loading, session, signOut } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [summary, setSummary] = useState({ balance: 0, expense: 0, income: 0 });
  const [reportCategories, setReportCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadError, setLoadError] = useState(null);

  const metadataName = session?.user?.user_metadata?.full_name;
  const firstName =
    typeof metadataName === 'string' && metadataName.trim()
      ? metadataName.trim().split(/\s+/)[0]
      : 'Pengguna';
  const currentPeriod = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  useEffect(() => {
    if (!loading && !session) navigate('/welcome', { replace: true });
  }, [loading, navigate, session]);

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
        if (active) setLoadError(getAuthErrorMessage(error));
      })
      .finally(() => {
        if (active) setDataLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session]);

  const handleQuickAction = (label) => {
    if (label === 'Pemasukan') {
      navigate('/add-transaction?type=income');
      return;
    }
    if (label === 'Pengeluaran') {
      navigate('/add-transaction?type=expense');
      return;
    }
    if (label === 'Kelola Kategori & Anggaran') {
      navigate('/categories');
      return;
    }
    if (label === 'Laporan') {
      navigate('/reports');
      return;
    }
  };

  const formatTransactionDate = (date) =>
    new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(
      new Date(`${date}T00:00:00`),
    );

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/welcome', { replace: true });
    } catch (error) {
      alert(getAuthErrorMessage(error));
    }
  };

  if (loading || !session) {
    return (
      <div style={{ alignItems: 'center', backgroundColor: colors.canvas, display: 'flex', minHeight: '100vh', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" color={colors.primary} size={36} />
      </div>
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
    <div style={{ backgroundColor: colors.canvas, minHeight: '100vh', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: layout.pageMaxWidth, margin: '0 auto', padding: '0 20px 120px 20px', boxSizing: 'border-box' }}>
        {/* Header */}
        <header
          style={{
            alignItems: 'center',
            borderBottom: `1px solid ${colors.line}`,
            display: 'flex',
            justifyContent: 'space-between',
            padding: '18px 0',
          }}
        >
          <BrandMark />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              aria-label="Notifikasi"
              onClick={() => navigate('/notifications')}
              style={{
                alignItems: 'center',
                backgroundColor: colors.surface,
                border: `1px solid ${colors.line}`,
                borderRadius: layout.radius,
                cursor: 'pointer',
                display: 'flex',
                height: 40,
                justifyContent: 'center',
                position: 'relative',
                width: 40,
              }}
              type="button"
            >
              <Bell color={colors.ink} size={20} />
              <div
                style={{
                  backgroundColor: '#EF4444',
                  border: '2px solid #FFFFFF',
                  borderRadius: 999,
                  height: 10,
                  position: 'absolute',
                  right: 6,
                  top: 6,
                  width: 10,
                }}
              />
            </button>
            <button
              aria-label="Profil dan pengaturan"
              onClick={() => navigate('/profile')}
              style={{
                alignItems: 'center',
                backgroundColor: colors.surface,
                border: `1px solid ${colors.line}`,
                borderRadius: layout.radius,
                cursor: 'pointer',
                display: 'flex',
                height: 40,
                justifyContent: 'center',
                width: 40,
              }}
              type="button"
            >
              <UserRound color={colors.ink} size={20} />
            </button>
            <button
              aria-label="Keluar"
              onClick={() => void handleSignOut()}
              style={{
                alignItems: 'center',
                backgroundColor: colors.surface,
                border: `1px solid ${colors.line}`,
                borderRadius: layout.radius,
                cursor: 'pointer',
                display: 'flex',
                height: 40,
                justifyContent: 'center',
                width: 40,
              }}
              type="button"
            >
              <LogOut color={colors.ink} size={20} />
            </button>
          </div>
        </header>

        {/* Greeting Row */}
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            justifyContent: 'space-between',
            paddingBottom: 22,
            paddingTop: 28,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <h2 style={{ color: colors.ink, fontSize: 27, fontWeight: '800', margin: 0 }}>Halo, {firstName}</h2>
            <span style={{ color: colors.muted, fontSize: 14, textTransform: 'capitalize' }}>{currentPeriod}</span>
          </div>
          <button
            onClick={() => navigate('/transactions')}
            style={{
              alignItems: 'center',
              backgroundColor: colors.primary,
              border: 'none',
              borderRadius: layout.radius,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'row',
              gap: 8,
              minHeight: 44,
              padding: '0 15px',
            }}
            type="button"
          >
            <Plus color={colors.white} size={19} strokeWidth={2.5} />
            <span style={{ color: colors.white, fontSize: 14, fontWeight: '700' }}>Tambah transaksi</span>
          </button>
        </div>

        {loadError ? (
          <div
            style={{
              backgroundColor: colors.coralSoft,
              borderColor: '#E8B8B2',
              borderRadius: layout.radius,
              borderWidth: 1,
              borderStyle: 'solid',
              marginBottom: 18,
              padding: 12,
            }}
          >
            <span style={{ color: '#8A3932', fontSize: 13, fontWeight: '600' }}>{loadError}</span>
          </div>
        ) : null}

        {/* Total Balance Panel */}
        <div
          style={{
            alignItems: 'center',
            backgroundColor: '#22C55E',
            borderRadius: 24,
            boxShadow: '0 8px 16px rgba(34, 197, 94, 0.25)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            justifyContent: 'space-between',
            padding: 22,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 4, minWidth: 180 }}>
            <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', opacity: 0.95 }}>Total Saldo</span>
            <span style={{ color: '#FFFFFF', fontSize: 34, fontWeight: '900', wordBreak: 'break-all' }}>
              {formatCurrency(summary.balance)}
            </span>
            <span style={{ color: '#FFFFFF', fontSize: 12, opacity: 0.85 }}>
              {summary.income || summary.expense
                ? 'Ringkasan posisi keuangan'
                : 'Belum ada transaksi pada periode ini'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                padding: '10px 16px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: '700' }}>Pemasukan Bulan Ini</span>
              <span style={{ color: '#16A34A', fontSize: 15, fontWeight: '800', marginTop: 2 }}>
                +{formatCurrency(summary.income)}
              </span>
            </div>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                padding: '10px 16px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: '700' }}>Pengeluaran Bulan Ini</span>
              <span style={{ color: '#EF4444', fontSize: 15, fontWeight: '800', marginTop: 2 }}>
                -{formatCurrency(summary.expense)}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Highlights */}
        <section style={{ marginTop: 30 }}>
          <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ color: colors.ink, fontSize: 18, fontWeight: '800', margin: 0 }}>Ringkasan keuangan</h3>
            <span style={{ color: colors.muted, fontSize: 13 }}>
              {totalBudget > 0 ? `${Math.round(budgetUsage)}% anggaran terpakai` : currentPeriod}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {highlights.map(({ color, icon: Icon, label, value }) => (
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
                  minHeight: 118,
                  padding: 14,
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    alignItems: 'center',
                    backgroundColor: `${color}18`,
                    borderRadius: layout.radius,
                    display: 'flex',
                    height: 36,
                    justifyContent: 'center',
                    width: 36,
                  }}
                >
                  <Icon color={color} size={20} />
                </div>
                <span style={{ color: colors.muted, fontSize: 11, marginTop: 10 }}>{label}</span>
                <span style={{ color: colors.ink, fontSize: 16, fontWeight: '800', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section style={{ marginTop: 30 }}>
          <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ color: colors.ink, fontSize: 18, fontWeight: '800', margin: 0 }}>Akses cepat</h3>
            <span style={{ color: colors.muted, fontSize: 13 }}>Kelola catatan keuangan</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {quickActions.map(({ color, icon: Icon, label }) => (
              <button
                key={label}
                onClick={() => handleQuickAction(label)}
                style={{
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderColor: colors.line,
                  borderRadius: layout.radius,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  justifyContent: 'center',
                  minHeight: 104,
                  padding: 14,
                  boxSizing: 'border-box',
                  transition: 'opacity 0.15s ease',
                }}
                type="button"
              >
                <div
                  style={{
                    alignItems: 'center',
                    backgroundColor: `${color}18`,
                    borderRadius: layout.radius,
                    display: 'flex',
                    height: 40,
                    justifyContent: 'center',
                    width: 40,
                  }}
                >
                  <Icon color={color} size={22} strokeWidth={2.2} />
                </div>
                <span style={{ color: colors.ink, fontSize: 14, fontWeight: '700', textAlign: 'center' }}>{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Transactions */}
        <section style={{ marginTop: 30 }}>
          <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ color: colors.ink, fontSize: 18, fontWeight: '800', margin: 0 }}>Transaksi terbaru</h3>
            <button
              onClick={() => navigate('/transactions')}
              style={{ background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', fontSize: 13, fontWeight: '700', padding: 0 }}
              type="button"
            >
              Lihat semua
            </button>
          </div>

          {dataLoading ? (
            <div
              style={{
                alignItems: 'center',
                borderColor: colors.line,
                borderRadius: layout.radius,
                borderWidth: 1,
                borderStyle: 'solid',
                display: 'flex',
                justifyContent: 'center',
                minHeight: 120,
              }}
            >
              <Loader2 className="animate-spin" color={colors.primary} size={24} />
            </div>
          ) : transactions.length ? (
            <div
              style={{
                borderColor: colors.line,
                borderRadius: layout.radius,
                borderWidth: 1,
                borderStyle: 'solid',
                overflow: 'hidden',
              }}
            >
              {transactions.map((transaction, index) => {
                const isIncome = transaction.type === 'income';

                return (
                  <div
                    key={`${transaction.type}-${transaction.id}`}
                    style={{
                      alignItems: 'center',
                      backgroundColor: colors.surface,
                      borderBottom: index < transactions.length - 1 ? `1px solid ${colors.line}` : 'none',
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 11,
                      minHeight: 68,
                      padding: '10px 14px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div
                      style={{
                        alignItems: 'center',
                        backgroundColor: isIncome ? '#DCFCE7' : colors.coralSoft,
                        borderRadius: layout.radius,
                        display: 'flex',
                        height: 38,
                        justifyContent: 'center',
                        width: 38,
                        flexShrink: 0,
                      }}
                    >
                      {isIncome ? (
                        <ArrowDownLeft color={colors.primaryDark} size={19} />
                      ) : (
                        <ArrowUpRight color={colors.coral} size={19} />
                      )}
                    </div>
                    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ color: colors.ink, fontSize: 14, fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {transaction.title}
                      </span>
                      <span style={{ color: colors.muted, fontSize: 12, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {[
                          transaction.categoryName,
                          transaction.description,
                          formatTransactionDate(transaction.date),
                        ]
                          .filter(Boolean)
                          .join('  |  ')}
                      </span>
                    </div>
                    <span
                      style={{
                        color: isIncome ? colors.primaryDark : colors.coral,
                        fontSize: 13,
                        fontWeight: '800',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                alignItems: 'center',
                borderColor: colors.line,
                borderRadius: layout.radius,
                borderStyle: 'dashed',
                borderWidth: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '34px 24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  alignItems: 'center',
                  backgroundColor: colors.primarySoft,
                  borderRadius: layout.radius,
                  display: 'flex',
                  height: 52,
                  justifyContent: 'center',
                  marginBottom: 12,
                  width: 52,
                }}
              >
                <ReceiptText color={colors.primary} size={27} />
              </div>
              <h4 style={{ color: colors.ink, fontSize: 16, fontWeight: '800', margin: 0 }}>Belum ada transaksi</h4>
              <p style={{ color: colors.muted, fontSize: 13, lineHeight: '20px', margin: '5px 0 0 0', maxWidth: 380 }}>
                Catatan pemasukan atau pengeluaran pertamamu akan muncul di sini.
              </p>
            </div>
          )}
        </section>

        {/* Insight Band */}
        <div
          style={{
            alignItems: 'center',
            backgroundColor: insight.danger ? colors.coralSoft : colors.amberSoft,
            borderRadius: layout.radius,
            display: 'flex',
            flexDirection: 'row',
            gap: 13,
            marginTop: 26,
            padding: 16,
            boxSizing: 'border-box',
          }}
        >
          <ChartNoAxesCombined color={insight.danger ? colors.coral : colors.amber} size={24} />
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 3 }}>
            <span style={{ color: colors.ink, fontSize: 14, fontWeight: '800' }}>{insight.title}</span>
            <span style={{ color: colors.muted, fontSize: 12, lineHeight: '18px' }}>{insight.text}</span>
          </div>
        </div>
      </div>
      <AppBottomNav />
    </div>
  );
}
