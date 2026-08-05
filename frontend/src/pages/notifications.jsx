import { useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Info,
  TriangleAlert,
  Loader2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { AppBottomNav } from '@/components/app-bottom-nav';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import {
  formatCurrency,
  getMonthlyReport,
  listRecentTransactions,
} from '@/lib/finance';
import { useAuth } from '@/providers/auth-provider';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { loading: authLoading, session } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !session) navigate('/welcome', { replace: true });
  }, [authLoading, navigate, session]);

  useEffect(() => {
    if (!session) return;

    Promise.all([getMonthlyReport(), listRecentTransactions(10)])
      .then(([report, recentTx]) => {
        const items = [];

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
        alert(error instanceof Error ? error.message : 'Silakan coba kembali.'),
      )
      .finally(() => setLoading(false));
  }, [session]);

  if (authLoading || !session) {
    return (
      <div style={{ alignItems: 'center', backgroundColor: colors.canvas, display: 'flex', minHeight: '100vh', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" color={colors.primary} size={36} />
      </div>
    );
  }

  const getIcon = (type) => {
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

  const getBadgeStyle = (type) => {
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
    <div style={{ backgroundColor: colors.canvas, minHeight: '100vh', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 20px 120px 20px', boxSizing: 'border-box' }}>
        <ScreenHeader subtitle="Pemberitahuan aktivitas dan anggaran Anda" title="Notifikasi" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, paddingTop: 18 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }}>
              <Loader2 className="animate-spin" color={colors.primary} size={32} />
            </div>
          ) : notifications.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {notifications.map((item) => (
                <div
                  key={item.id}
                  style={{
                    alignItems: 'flex-start',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 12,
                    padding: 14,
                    boxSizing: 'border-box',
                    ...getBadgeStyle(item.type),
                  }}
                >
                  <div
                    style={{
                      alignItems: 'center',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 12,
                      display: 'flex',
                      height: 38,
                      justifyContent: 'center',
                      marginTop: 2,
                      width: 38,
                      flexShrink: 0,
                    }}
                  >
                    {getIcon(item.type)}
                  </div>
                  <div style={{ display: 'flex', flex: 1, flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ color: '#0F172A', fontSize: 14, fontWeight: '800' }}>{item.title}</span>
                    <span style={{ color: '#475569', fontSize: 12, lineHeight: '18px', marginTop: 3 }}>
                      {item.message}
                    </span>
                    {item.date ? <span style={{ color: '#94A3B8', fontSize: 11, marginTop: 4 }}>{item.date}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', padding: '70px 24px', textAlign: 'center' }}>
              <div
                style={{
                  alignItems: 'center',
                  backgroundColor: colors.primarySoft,
                  borderRadius: 16,
                  display: 'flex',
                  height: 58,
                  justifyContent: 'center',
                  width: 58,
                }}
              >
                <Bell color={colors.primary} size={30} />
              </div>
              <h4 style={{ color: colors.ink, fontSize: 17, fontWeight: '800', marginTop: 14, marginBottom: 0 }}>
                Belum ada pemberitahuan
              </h4>
              <p style={{ color: colors.muted, fontSize: 12, lineHeight: '18px', marginTop: 6, maxWidth: 380 }}>
                Notifikasi otomatis muncul ketika ada transaksi baru atau anggaran kategori berubah.
              </p>
            </div>
          )}
        </div>
      </div>
      <AppBottomNav />
    </div>
  );
}
