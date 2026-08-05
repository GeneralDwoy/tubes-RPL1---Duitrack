import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus, Save, Tag, Target, Trash2, X, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { AppButton } from '@/components/app-button';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { FormField } from '@/components/form-field';
import { ScreenHeader } from '@/components/screen-header';
import { colors, layout } from '@/constants/theme';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/currency-input';
import {
  createCategory,
  deleteCategory,
  formatCurrency,
  listCategories,
  updateCategory,
} from '@/lib/finance';
import { useAuth } from '@/providers/auth-provider';

const swatches = ['#087B68', '#D76459', '#D99A2B', '#5377A6', '#9A6DB0', '#73817E'];

const categorySchema = z.object({
  budget: z.string(),
  kind: z.enum(['pemasukan', 'pengeluaran']),
  name: z.string().trim().min(2, 'Nama kategori minimal 2 karakter'),
});

function getCategoryError(error) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === '23505') return 'Nama kategori tersebut sudah digunakan.';
  if (code === '23503') return 'Kategori sudah dipakai transaksi dan tidak dapat dihapus.';
  return error instanceof Error ? error.message : 'Kategori gagal disimpan.';
}

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { loading: authLoading, session } = useAuth();
  const [filter, setFilter] = useState('pengeluaran');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedColor, setSelectedColor] = useState(swatches[0]);
  const [serverError, setServerError] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { budget: '0', kind: 'pengeluaran', name: '' },
    resolver: zodResolver(categorySchema),
  });
  const selectedKind = useWatch({ control, name: 'kind' });

  useEffect(() => {
    if (!authLoading && !session) navigate('/welcome', { replace: true });
  }, [authLoading, navigate, session]);

  const loadCategories = async () => {
    try {
      setCategories(await listCategories());
    } catch (error) {
      alert(getCategoryError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) return;

    listCategories()
      .then(setCategories)
      .catch((error) => alert(getCategoryError(error)))
      .finally(() => setLoading(false));
  }, [session]);

  const openCreate = () => {
    setEditing(null);
    setSelectedColor(swatches[0]);
    setServerError(null);
    reset({ budget: '0', kind: filter, name: '' });
    setModalVisible(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setSelectedColor(category.warna);
    setServerError(null);
    reset({
      budget: formatCurrencyInput(String(category.target_anggaran)),
      kind: category.jenis,
      name: category.nama_kategori,
    });
    setModalVisible(true);
  };

  const onSubmit = async (values) => {
    setServerError(null);
    const input = {
      budget: parseCurrencyInput(values.budget),
      color: selectedColor,
      kind: values.kind,
      name: values.name,
    };

    try {
      if (editing) await updateCategory(editing.id_kategori, input);
      else await createCategory(input);
      setModalVisible(false);
      setFilter(values.kind);
      await loadCategories();
    } catch (error) {
      setServerError(getCategoryError(error));
    }
  };

  const confirmDelete = (category) => {
    const confirmed = window.confirm(
      `Hapus kategori?\nKategori ${category.nama_kategori} akan dihapus.`,
    );

    if (!confirmed) return;

    const doDelete = async () => {
      try {
        await deleteCategory(category.id_kategori);
        await loadCategories();
      } catch (error) {
        window.alert(getCategoryError(error));
      }
    };

    void doDelete();
  };

  if (authLoading || !session) {
    return (
      <div style={{ alignItems: 'center', backgroundColor: colors.canvas, display: 'flex', minHeight: '100vh', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" color={colors.primary} size={36} />
      </div>
    );
  }

  const visibleCategories = categories.filter((category) => category.jenis === filter);

  return (
    <div style={{ backgroundColor: colors.canvas, minHeight: '100vh', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 20px 120px 20px', boxSizing: 'border-box' }}>
        <ScreenHeader
          action={
            <button
              aria-label="Tambah kategori"
              onClick={openCreate}
              style={{
                alignItems: 'center',
                backgroundColor: colors.primary,
                border: 'none',
                borderRadius: layout.radius,
                cursor: 'pointer',
                display: 'flex',
                height: 40,
                justifyContent: 'center',
                width: 40,
              }}
              type="button"
            >
              <Plus color={colors.white} size={20} />
            </button>
          }
          subtitle="Atur kelompok transaksi dan batas bulanan"
          title="Kelola Kategori & Anggaran"
        />

        {/* Filter Segmented */}
        <div
          style={{
            backgroundColor: colors.surfaceMuted,
            borderRadius: layout.radius,
            display: 'flex',
            flexDirection: 'row',
            marginTop: 20,
            padding: 4,
          }}
        >
          {['pengeluaran', 'pemasukan'].map((kind) => (
            <button
              key={kind}
              onClick={() => setFilter(kind)}
              style={{
                alignItems: 'center',
                backgroundColor: filter === kind ? colors.surface : 'transparent',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                flex: 1,
                justifyContent: 'center',
                minHeight: 40,
                padding: '0 10px',
              }}
              type="button"
            >
              <span
                style={{
                  color: filter === kind ? colors.primaryDark : colors.muted,
                  fontSize: 14,
                  fontWeight: '700',
                }}
              >
                {kind === 'pengeluaran' ? 'Pengeluaran' : 'Pemasukan'}
              </span>
            </button>
          ))}
        </div>

        {/* Category List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 18 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
              <Loader2 className="animate-spin" color={colors.primary} size={32} />
            </div>
          ) : visibleCategories.length === 0 ? (
            <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 8, padding: '70px 0', textAlign: 'center' }}>
              <Tag color={colors.primary} size={28} />
              <h4 style={{ color: colors.ink, fontSize: 17, fontWeight: '800', margin: 0 }}>Belum ada kategori</h4>
              <p style={{ color: colors.muted, fontSize: 13, margin: 0 }}>Tambahkan kategori untuk memulai pencatatan.</p>
            </div>
          ) : (
            visibleCategories.map((category) => (
              <div
                key={category.id_kategori}
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
                  minHeight: 72,
                  padding: 12,
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ backgroundColor: category.warna, borderRadius: 4, height: 40, width: 7, flexShrink: 0 }} />
                <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 4 }}>
                  <span style={{ color: colors.ink, fontSize: 15, fontWeight: '800' }}>{category.nama_kategori}</span>
                  <span style={{ color: colors.muted, fontSize: 12, lineHeight: '17px' }}>
                    {category.jenis === 'pengeluaran' && category.target_anggaran > 0
                      ? `Anggaran ${formatCurrency(category.target_anggaran)} / bulan`
                      : category.jenis === 'pengeluaran'
                        ? 'Tanpa batas anggaran'
                        : 'Kategori pemasukan'}
                  </span>
                </div>
                <button
                  aria-label={`Ubah ${category.nama_kategori}`}
                  onClick={() => openEdit(category)}
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
                  <Pencil color={colors.ink} size={18} />
                </button>
                <button
                  aria-label={`Hapus ${category.nama_kategori}`}
                  onClick={() => confirmDelete(category)}
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
                  <Trash2 color={colors.coral} size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      <AppBottomNav />

      {/* Modal Dialog */}
      {modalVisible ? (
        <div
          onClick={() => setModalVisible(false)}
          style={{
            alignItems: 'center',
            backgroundColor: 'rgba(10, 30, 27, 0.58)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
            display: 'flex',
            justifyContent: 'center',
            padding: 18,
            boxSizing: 'border-box',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.surface,
              borderRadius: layout.radius,
              maxWidth: 520,
              padding: 22,
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ alignItems: 'flex-start', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ color: colors.ink, fontSize: 21, fontWeight: '800', margin: 0 }}>
                  {editing ? 'Ubah kategori' : 'Tambah kategori'}
                </h3>
                <p style={{ color: colors.muted, fontSize: 12, margin: '4px 0 0' }}>Isi identitas dan anggaran kategori.</p>
              </div>
              <button
                aria-label="Tutup"
                onClick={() => setModalVisible(false)}
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

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 17, marginTop: 22 }}>
              {serverError ? (
                <div
                  style={{
                    backgroundColor: colors.coralSoft,
                    borderRadius: layout.radius,
                    color: '#8A3932',
                    fontSize: 13,
                    lineHeight: '19px',
                    padding: 11,
                  }}
                >
                  {serverError}
                </div>
              ) : null}

              <Controller
                control={control}
                name="name"
                render={({ field: { onBlur, onChange, value } }) => (
                  <FormField
                    error={errors.name?.message}
                    icon={Tag}
                    label="Nama kategori"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Contoh: Makanan"
                    value={value}
                  />
                )}
              />

              <Controller
                control={control}
                name="kind"
                render={({ field: { onChange, value } }) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>Jenis kategori</label>
                    <div
                      style={{
                        backgroundColor: colors.surfaceMuted,
                        borderRadius: layout.radius,
                        display: 'flex',
                        flexDirection: 'row',
                        padding: 4,
                      }}
                    >
                      {['pengeluaran', 'pemasukan'].map((kind) => (
                        <button
                          key={kind}
                          onClick={() => onChange(kind)}
                          style={{
                            alignItems: 'center',
                            backgroundColor: value === kind ? colors.surface : 'transparent',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            display: 'flex',
                            flex: 1,
                            justifyContent: 'center',
                            minHeight: 40,
                            padding: '0 10px',
                          }}
                          type="button"
                        >
                          <span
                            style={{
                              color: value === kind ? colors.primaryDark : colors.muted,
                              fontSize: 14,
                              fontWeight: '700',
                            }}
                          >
                            {kind === 'pengeluaran' ? 'Pengeluaran' : 'Pemasukan'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              />

              {selectedKind === 'pengeluaran' ? (
                <Controller
                  control={control}
                  name="budget"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <FormField
                      error={errors.budget?.message}
                      icon={Target}
                      label="Anggaran bulanan"
                      maxLength={18}
                      onBlur={onBlur}
                      onChangeText={(text) => onChange(formatCurrencyInput(text))}
                      placeholder="Contoh: 1.000.000"
                      value={value}
                    />
                  )}
                />
              ) : null}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>Warna</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 11 }}>
                  {swatches.map((color) => (
                    <button
                      aria-label={`Pilih warna ${color}`}
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      style={{
                        backgroundColor: color,
                        borderColor: selectedColor === color ? colors.ink : colors.surface,
                        borderRadius: 8,
                        borderWidth: 3,
                        borderStyle: 'solid',
                        cursor: 'pointer',
                        height: 34,
                        width: 34,
                        boxSizing: 'border-box',
                      }}
                      type="button"
                    />
                  ))}
                </div>
              </div>

              <AppButton
                icon={Save}
                label={editing ? 'Simpan perubahan' : 'Tambah kategori'}
                loading={isSubmitting}
                type="submit"
              />
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
