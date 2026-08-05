import { useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Pencil,
  ReceiptText,
  Search,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { ScreenHeader } from '@/components/screen-header';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { colors, layout } from '@/constants/theme';
import {
  deleteTransaction,
  formatCurrency,
  listRecentTransactions,
} from '@/lib/finance';
import { useAuth } from '@/providers/auth-provider';

const filters = [
  { label: 'Semua', value: 'all' },
  { label: 'Pemasukan', value: 'income' },
  { label: 'Pengeluaran', value: 'expense' },
];

const periodFilters = [
  { label: 'Semua', value: 'all' },
  { label: 'Tanggal', value: 'date' },
  { label: 'Bulan', value: 'month' },
  { label: 'Tahun', value: 'year' },
];

function getDefaultPeriodValue(filter) {
  const date = new Date();
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  if (filter === 'date') return `${year}-${month}-${day}`;
  if (filter === 'month') return `${year}-${month}`;
  if (filter === 'year') return year;
  return '';
}

function formatDate(value) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

export default function TransactionsPage() {
  const navigate = useNavigate();
  const { loading: authLoading, session } = useAuth();
  const [filter, setFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [periodValue, setPeriodValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!authLoading && !session) navigate('/welcome', { replace: true });
  }, [authLoading, navigate, session]);

  useEffect(() => {
    if (!session) return;
    listRecentTransactions(1000)
      .then(setTransactions)
      .catch((error) => alert(error.message))
      .finally(() => setLoading(false));
  }, [session]);

  if (authLoading || !session) {
    return (
      <div style={{ alignItems: 'center', backgroundColor: colors.canvas, display: 'flex', minHeight: '100vh', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" color={colors.primary} size={36} />
      </div>
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

  const selectPeriodFilter = (nextFilter) => {
    setPeriodFilter(nextFilter);
    setPeriodValue(getDefaultPeriodValue(nextFilter));
  };

  const confirmDelete = (transaction) => {
    const confirmed = window.confirm(
      `Hapus transaksi?\n${transaction.title} senilai ${formatCurrency(transaction.amount)} akan dihapus.`,
    );

    if (!confirmed) return;

    const doDelete = async () => {
      setDeletingId(transaction.id);
      try {
        await deleteTransaction(transaction.type, transaction.id);
        setTransactions((current) =>
          current.filter(
            (item) => !(item.id === transaction.id && item.type === transaction.type),
          ),
        );
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Silakan coba kembali.');
      } finally {
        setDeletingId(null);
      }
    };

    void doDelete();
  };

  return (
    <div style={{ backgroundColor: colors.canvas, minHeight: '100vh', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 120px 20px', boxSizing: 'border-box' }}>
        <ScreenHeader
          backHref="/dashboard"
          subtitle="Cari kembali catatan pemasukan dan pengeluaran"
          title="Riwayat transaksi"
        />

        {/* Action Row */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 10, marginTop: 20 }}>
          <button
            onClick={() => navigate('/add-transaction?type=income')}
            style={{
              alignItems: 'center',
              backgroundColor: colors.primarySoft,
              border: 'none',
              borderRadius: layout.radius,
              cursor: 'pointer',
              display: 'flex',
              flex: 1,
              flexDirection: 'row',
              gap: 8,
              justifyContent: 'center',
              minHeight: 46,
              padding: '0 12px',
            }}
            type="button"
          >
            <ArrowDownLeft color={colors.primaryDark} size={19} />
            <span style={{ color: colors.primaryDark, fontSize: 14, fontWeight: '800' }}>Pemasukan</span>
          </button>
          <button
            onClick={() => navigate('/add-transaction?type=expense')}
            style={{
              alignItems: 'center',
              backgroundColor: colors.coralSoft,
              border: 'none',
              borderRadius: layout.radius,
              cursor: 'pointer',
              display: 'flex',
              flex: 1,
              flexDirection: 'row',
              gap: 8,
              justifyContent: 'center',
              minHeight: 46,
              padding: '0 12px',
            }}
            type="button"
          >
            <ArrowUpRight color={colors.coral} size={19} />
            <span style={{ color: colors.coral, fontSize: 14, fontWeight: '800' }}>Pengeluaran</span>
          </button>
        </div>

        {/* Type Segmented */}
        <div
          style={{
            backgroundColor: colors.surfaceMuted,
            borderRadius: layout.radius,
            display: 'flex',
            flexDirection: 'row',
            marginTop: 14,
            padding: 4,
          }}
        >
          {filters.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              style={{
                alignItems: 'center',
                backgroundColor: filter === item.value ? colors.surface : 'transparent',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                flex: 1,
                justifyContent: 'center',
                minHeight: 38,
              }}
              type="button"
            >
              <span
                style={{
                  color: filter === item.value ? colors.primaryDark : colors.muted,
                  fontSize: 13,
                  fontWeight: '700',
                }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          <div
            style={{
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderColor: colors.line,
              borderRadius: layout.radius,
              borderWidth: 1,
              borderStyle: 'solid',
              display: 'flex',
              flexDirection: 'row',
              gap: 9,
              minHeight: 46,
              padding: '0 13px',
              boxSizing: 'border-box',
            }}
          >
            <Search color={colors.muted} size={18} />
            <input
              aria-label="Cari transaksi"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi atau kategori"
              style={{
                border: 'none',
                color: colors.ink,
                flex: 1,
                fontSize: 14,
                outline: 'none',
                padding: '10px 0',
                backgroundColor: 'transparent',
              }}
              value={searchQuery}
            />
          </div>

          <div
            style={{
              backgroundColor: colors.surfaceMuted,
              borderRadius: layout.radius,
              display: 'flex',
              flexDirection: 'row',
              padding: 4,
            }}
          >
            {periodFilters.map((item) => (
              <button
                key={item.value}
                onClick={() => selectPeriodFilter(item.value)}
                style={{
                  alignItems: 'center',
                  backgroundColor: periodFilter === item.value ? colors.surface : 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  flex: 1,
                  justifyContent: 'center',
                  minHeight: 34,
                }}
                type="button"
              >
                <span
                  style={{
                    color: periodFilter === item.value ? colors.primaryDark : colors.muted,
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {periodFilter !== 'all' ? (
            <div
              style={{
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderColor: colors.line,
                borderRadius: layout.radius,
                borderWidth: 1,
                borderStyle: 'solid',
                display: 'flex',
                flexDirection: 'row',
                gap: 9,
                minHeight: 44,
                padding: '0 13px',
                boxSizing: 'border-box',
              }}
            >
              <CalendarDays color={colors.muted} size={18} />
              <input
                aria-label={`Filter ${periodFilter}`}
                maxLength={periodFilter === 'date' ? 10 : periodFilter === 'month' ? 7 : 4}
                onChange={(e) => setPeriodValue(e.target.value)}
                placeholder={
                  periodFilter === 'date'
                    ? 'YYYY-MM-DD'
                    : periodFilter === 'month'
                      ? 'YYYY-MM'
                      : 'YYYY'
                }
                style={{
                  border: 'none',
                  color: colors.ink,
                  flex: 1,
                  fontSize: 14,
                  outline: 'none',
                  padding: '9px 0',
                  backgroundColor: 'transparent',
                }}
                value={periodValue}
              />
            </div>
          ) : null}

          {!loading ? (
            <span style={{ color: colors.muted, fontSize: 11 }}>
              {visibleTransactions.length} transaksi ditemukan
            </span>
          ) : null}
        </div>

        {/* Transaction List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingTop: 16 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
              <Loader2 className="animate-spin" color={colors.primary} size={32} />
            </div>
          ) : visibleTransactions.length === 0 ? (
            <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 8, padding: '70px 0', textAlign: 'center' }}>
              <ReceiptText color={colors.primary} size={30} />
              <h4 style={{ color: colors.ink, fontSize: 17, fontWeight: '800', margin: 0 }}>Belum ada transaksi</h4>
              <p style={{ color: colors.muted, fontSize: 13, margin: 0 }}>
                {transactions.length
                  ? 'Tidak ada transaksi yang sesuai dengan pencarian atau filter.'
                  : 'Transaksi yang tersimpan akan tampil di sini.'}
              </p>
            </div>
          ) : (
            visibleTransactions.map((transaction) => {
              const income = transaction.type === 'income';
              return (
                <div
                  key={`${transaction.type}-${transaction.id}`}
                  style={{
                    alignItems: 'center',
                    backgroundColor: colors.surface,
                    borderColor: colors.line,
                    borderRadius: layout.radius,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 11,
                    minHeight: 70,
                    padding: 12,
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      alignItems: 'center',
                      backgroundColor: income ? colors.primarySoft : colors.coralSoft,
                      borderRadius: layout.radius,
                      display: 'flex',
                      height: 38,
                      justifyContent: 'center',
                      width: 38,
                      flexShrink: 0,
                    }}
                  >
                    {income ? (
                      <ArrowDownLeft color={colors.primaryDark} size={19} />
                    ) : (
                      <ArrowUpRight color={colors.coral} size={19} />
                    )}
                  </div>
                  <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <span style={{ color: colors.ink, fontSize: 14, fontWeight: '800', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {transaction.title}
                    </span>
                    <span style={{ color: colors.muted, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {[transaction.categoryName, transaction.description, formatDate(transaction.date)]
                        .filter(Boolean)
                        .join(' - ')}
                    </span>
                  </div>
                  <div style={{ alignItems: 'flex-end', display: 'flex', flexDirection: 'column', gap: 8, maxWidth: '42%', minWidth: 88 }}>
                    <span
                      style={{
                        color: income ? colors.primary : colors.coral,
                        fontSize: 13,
                        fontWeight: '800',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {income ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: 6 }}>
                      <button
                        aria-label={`Ubah ${transaction.title}`}
                        onClick={() => navigate(`/add-transaction?id=${transaction.id}&type=${transaction.type}`)}
                        style={{
                          alignItems: 'center',
                          backgroundColor: colors.surfaceMuted,
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          display: 'flex',
                          height: 30,
                          justifyContent: 'center',
                          width: 30,
                        }}
                        type="button"
                      >
                        <Pencil color={colors.ink} size={16} />
                      </button>
                      <button
                        aria-label={`Hapus ${transaction.title}`}
                        disabled={deletingId === transaction.id}
                        onClick={() => confirmDelete(transaction)}
                        style={{
                          alignItems: 'center',
                          backgroundColor: colors.surfaceMuted,
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          display: 'flex',
                          height: 30,
                          justifyContent: 'center',
                          width: 30,
                        }}
                        type="button"
                      >
                        {deletingId === transaction.id ? (
                          <Loader2 className="animate-spin" color={colors.coral} size={16} />
                        ) : (
                          <Trash2 color={colors.coral} size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <AppBottomNav />
    </div>
  );
}
