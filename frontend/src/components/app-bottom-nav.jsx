import { useLocation, useNavigate } from 'react-router-dom';
import { ChartNoAxesCombined, House, ReceiptText, UserRound } from 'lucide-react';
import { colors } from '@/constants/theme';

const items = [
  { href: '/dashboard', icon: House, label: 'Beranda' },
  { href: '/transactions', icon: ReceiptText, label: 'Transaksi' },
  { href: '/reports', icon: ChartNoAxesCombined, label: 'Laporan' },
  { href: '/profile', icon: UserRound, label: 'Profil' },
];

export function AppBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const shellStyle = {
    alignItems: 'center',
    bottom: 16,
    left: 0,
    position: 'fixed',
    right: 0,
    zIndex: 100,
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
  };

  const navStyle = {
    alignItems: 'center',
    backgroundColor: '#0F523E',
    borderRadius: 32,
    boxShadow: '0 6px 12px rgba(7, 53, 39, 0.28)',
    display: 'flex',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
    maxWidth: 440,
    padding: '7px 10px',
    width: '90%',
    pointerEvents: 'auto',
    boxSizing: 'border-box',
  };

  return (
    <div style={shellStyle}>
      <nav role="tablist" style={navStyle}>
        {items.map(({ href, icon: Icon, label }) => {
          const active = location.pathname === href;
          const itemStyle = {
            alignItems: 'center',
            backgroundColor: active ? '#22C55E' : 'transparent',
            borderRadius: 24,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flex: 1,
            flexDirection: 'row',
            gap: 6,
            height: 42,
            justifyContent: 'center',
            padding: '0 12px',
            transition: 'all 0.15s ease',
          };

          const labelStyle = {
            color: active ? colors.white : '#94A3B8',
            fontSize: 12,
            fontWeight: active ? '800' : '600',
          };

          return (
            <button
              key={href}
              onClick={() => navigate(href)}
              role="tab"
              aria-selected={active}
              style={itemStyle}
              type="button"
            >
              <Icon color={active ? colors.white : '#94A3B8'} size={18} />
              <span style={labelStyle}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
