import { Check, ChevronDown, Tag, X } from 'lucide-react';
import { colors, layout } from '@/constants/theme';

export function CategoryPicker({
  categories,
  error,
  onChange,
  onClose,
  onOpen,
  open,
  value,
}) {
  const selected = categories.find((category) => category.id_kategori === value);

  const triggerStyle = {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: error ? colors.coral : colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    borderStyle: 'solid',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    paddingLeft: 14,
    paddingRight: 14,
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'left',
  };

  const overlayStyle = {
    alignItems: 'center',
    backgroundColor: 'rgba(10, 30, 27, 0.58)',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    display: open ? 'flex' : 'none',
    justifyContent: 'center',
    padding: 18,
    boxSizing: 'border-box',
  };

  const modalCardStyle = {
    backgroundColor: colors.surface,
    borderRadius: layout.radius,
    maxHeight: '78vh',
    maxWidth: 500,
    padding: 20,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%' }}>
      <label style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>Kategori</label>
      <button onClick={onOpen} style={triggerStyle} type="button">
        {selected ? (
          <div style={{ backgroundColor: selected.warna, borderRadius: 4, height: 20, width: 20, flexShrink: 0 }} />
        ) : (
          <Tag color={colors.muted} size={19} />
        )}
        <span
          style={{
            color: selected ? colors.ink : '#8A9A96',
            flex: 1,
            fontSize: 16,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {selected?.nama_kategori ?? 'Pilih kategori'}
        </span>
        <ChevronDown color={colors.muted} size={19} />
      </button>
      {error ? <span style={{ color: colors.coral, fontSize: 13, lineHeight: '18px' }}>{error}</span> : null}

      {open ? (
        <div onClick={onClose} style={overlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={modalCardStyle}>
            <div style={{ alignItems: 'flex-start', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ color: colors.ink, fontSize: 20, fontWeight: '800', margin: 0 }}>Pilih kategori</h3>
                <p style={{ color: colors.muted, fontSize: 12, margin: '4px 0 0' }}>Kategori aktif untuk transaksi ini</p>
              </div>
              <button
                aria-label="Tutup"
                onClick={onClose}
                style={{
                  alignItems: 'center',
                  backgroundColor: colors.surfaceMuted,
                  border: 'none',
                  borderRadius: layout.radius,
                  cursor: 'pointer',
                  display: 'flex',
                  height: 36,
                  justifyContent: 'center',
                  width: 36,
                }}
                type="button"
              >
                <X color={colors.ink} size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 18, overflowY: 'auto' }}>
              {categories.map((category) => {
                const active = category.id_kategori === value;
                return (
                  <button
                    key={category.id_kategori}
                    onClick={() => {
                      onChange(category.id_kategori);
                      onClose();
                    }}
                    style={{
                      alignItems: 'center',
                      backgroundColor: active ? colors.primarySoft : 'transparent',
                      borderColor: active ? colors.primary : colors.line,
                      borderRadius: layout.radius,
                      borderWidth: 1,
                      borderStyle: 'solid',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 11,
                      minHeight: 58,
                      padding: 12,
                      textAlign: 'left',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                    type="button"
                  >
                    <div style={{ backgroundColor: category.warna, borderRadius: 4, height: 20, width: 20, flexShrink: 0 }} />
                    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 2 }}>
                      <span style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>{category.nama_kategori}</span>
                      {category.target_anggaran > 0 ? (
                        <span style={{ color: colors.muted, fontSize: 11 }}>Memiliki anggaran bulanan</span>
                      ) : null}
                    </div>
                    {active ? <Check color={colors.primary} size={20} strokeWidth={2.5} /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
