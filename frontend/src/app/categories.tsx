import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Pencil, Plus, Save, Tag, Target, Trash2, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { z } from 'zod';

import { AppButton } from '@/components/app-button';
import { FormField } from '@/components/form-field';
import { ScreenHeader } from '@/components/screen-header';
import { colors, layout } from '@/constants/theme';
import {
  type Category,
  type CategoryKind,
  createCategory,
  deleteCategory,
  formatCurrency,
  listCategories,
  updateCategory,
} from '@/lib/finance';
import { useAuth } from '@/providers/auth-provider';

const swatches = ['#087B68', '#D76459', '#D99A2B', '#5377A6', '#9A6DB0', '#73817E'];

const categorySchema = z.object({
  budget: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d+$/.test(value), 'Anggaran harus berupa angka'),
  kind: z.enum(['pemasukan', 'pengeluaran']),
  name: z.string().trim().min(2, 'Nama kategori minimal 2 karakter'),
});

type CategoryValues = z.infer<typeof categorySchema>;

function getCategoryError(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === '23505') return 'Nama kategori tersebut sudah digunakan.';
  if (code === '23503') return 'Kategori sudah dipakai transaksi dan tidak dapat dihapus.';
  return error instanceof Error ? error.message : 'Kategori gagal disimpan.';
}

export default function CategoriesScreen() {
  const router = useRouter();
  const { loading: authLoading, session } = useAuth();
  const [filter, setFilter] = useState<CategoryKind>('pengeluaran');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [selectedColor, setSelectedColor] = useState(swatches[0]);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryValues>({
    defaultValues: { budget: '0', kind: 'pengeluaran', name: '' },
    resolver: zodResolver(categorySchema),
  });
  const selectedKind = useWatch({ control, name: 'kind' });

  useEffect(() => {
    if (!authLoading && !session) router.replace('/welcome');
  }, [authLoading, router, session]);

  const loadCategories = async () => {
    try {
      setCategories(await listCategories());
    } catch (error) {
      Alert.alert('Gagal memuat kategori', getCategoryError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) return;

    listCategories()
      .then(setCategories)
      .catch((error) => Alert.alert('Gagal memuat kategori', getCategoryError(error)))
      .finally(() => setLoading(false));
  }, [session]);

  const openCreate = () => {
    setEditing(null);
    setSelectedColor(swatches[0]);
    setServerError(null);
    reset({ budget: '0', kind: filter, name: '' });
    setModalVisible(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setSelectedColor(category.warna);
    setServerError(null);
    reset({
      budget: String(category.target_anggaran),
      kind: category.jenis,
      name: category.nama_kategori,
    });
    setModalVisible(true);
  };

  const onSubmit = async (values: CategoryValues) => {
    setServerError(null);
    const input = {
      budget: Number(values.budget || 0),
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

  const confirmDelete = (category: Category) => {
    Alert.alert(
      'Hapus kategori?',
      `Kategori ${category.nama_kategori} akan dihapus.`,
      [
        { style: 'cancel', text: 'Batal' },
        {
          onPress: async () => {
            try {
              await deleteCategory(category.id_kategori);
              await loadCategories();
            } catch (error) {
              Alert.alert('Kategori tidak dapat dihapus', getCategoryError(error));
            }
          },
          style: 'destructive',
          text: 'Hapus',
        },
      ],
    );
  };

  if (authLoading || !session) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const visibleCategories = categories.filter((category) => category.jenis === filter);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <ScreenHeader
          action={
            <Pressable
              accessibilityLabel="Tambah kategori"
              accessibilityRole="button"
              onPress={openCreate}
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
              <Plus color={colors.white} size={20} />
            </Pressable>
          }
          subtitle="Atur kelompok transaksi dan batas bulanan"
          title="Kategori & anggaran"
        />

        <View style={styles.segmented}>
          {(['pengeluaran', 'pemasukan'] as CategoryKind[]).map((kind) => (
            <Pressable
              accessibilityRole="button"
              key={kind}
              onPress={() => setFilter(kind)}
              style={[styles.segment, filter === kind && styles.segmentActive]}>
              <Text style={[styles.segmentText, filter === kind && styles.segmentTextActive]}>
                {kind === 'pengeluaran' ? 'Pengeluaran' : 'Pemasukan'}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={colors.primary} size="large" style={styles.listLoader} />
          ) : visibleCategories.length === 0 ? (
            <View style={styles.emptyState}>
              <Tag color={colors.primary} size={28} />
              <Text style={styles.emptyTitle}>Belum ada kategori</Text>
              <Text style={styles.emptyText}>Tambahkan kategori untuk memulai pencatatan.</Text>
            </View>
          ) : (
            visibleCategories.map((category) => (
              <View key={category.id_kategori} style={styles.categoryRow}>
                <View style={[styles.colorMark, { backgroundColor: category.warna }]} />
                <View style={styles.categoryCopy}>
                  <Text style={styles.categoryName}>{category.nama_kategori}</Text>
                  <Text style={styles.categoryMeta}>
                    {category.jenis === 'pengeluaran' && category.target_anggaran > 0
                      ? `Anggaran ${formatCurrency(category.target_anggaran)} / bulan`
                      : category.jenis === 'pengeluaran'
                        ? 'Tanpa batas anggaran'
                        : 'Kategori pemasukan'}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel={`Ubah ${category.nama_kategori}`}
                  onPress={() => openEdit(category)}
                  style={styles.iconButton}>
                  <Pencil color={colors.ink} size={18} />
                </Pressable>
                <Pressable
                  accessibilityLabel={`Hapus ${category.nama_kategori}`}
                  onPress={() => confirmDelete(category)}
                  style={styles.iconButton}>
                  <Trash2 color={colors.coral} size={18} />
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
        transparent
        visible={modalVisible}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{editing ? 'Ubah kategori' : 'Tambah kategori'}</Text>
                <Text style={styles.modalSubtitle}>Isi identitas dan anggaran kategori.</Text>
              </View>
              <Pressable
                accessibilityLabel="Tutup"
                onPress={() => setModalVisible(false)}
                style={styles.iconButton}>
                <X color={colors.ink} size={20} />
              </Pressable>
            </View>

            <View style={styles.modalForm}>
              {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}
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
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Jenis kategori</Text>
                    <View style={styles.segmented}>
                      {(['pengeluaran', 'pemasukan'] as CategoryKind[]).map((kind) => (
                        <Pressable
                          key={kind}
                          onPress={() => onChange(kind)}
                          style={[styles.segment, value === kind && styles.segmentActive]}>
                          <Text
                            style={[
                              styles.segmentText,
                              value === kind && styles.segmentTextActive,
                            ]}>
                            {kind === 'pengeluaran' ? 'Pengeluaran' : 'Pemasukan'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
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
                      keyboardType="numeric"
                      label="Anggaran bulanan"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="0 berarti tanpa batas"
                      value={value}
                    />
                  )}
                />
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Warna</Text>
                <View style={styles.swatchRow}>
                  {swatches.map((color) => (
                    <Pressable
                      accessibilityLabel={`Pilih warna ${color}`}
                      key={color}
                      onPress={() => setSelectedColor(color)}
                      style={[
                        styles.swatch,
                        { backgroundColor: color },
                        selectedColor === color && styles.swatchActive,
                      ]}
                    />
                  ))}
                </View>
              </View>

              <AppButton
                icon={Save}
                label={editing ? 'Simpan perubahan' : 'Tambah kategori'}
                loading={isSubmitting}
                onPress={handleSubmit(onSubmit)}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  page: {
    alignSelf: 'center',
    flex: 1,
    maxWidth: 820,
    paddingHorizontal: 20,
    width: '100%',
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: layout.radius,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  pressed: { opacity: 0.72 },
  segmented: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: layout.radius,
    flexDirection: 'row',
    marginTop: 20,
    padding: 4,
  },
  segment: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  segmentActive: { backgroundColor: colors.surface },
  segmentText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  segmentTextActive: { color: colors.primaryDark },
  list: { gap: 10, paddingBottom: 36, paddingTop: 18 },
  listLoader: { marginTop: 40 },
  categoryRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    minHeight: 72,
    padding: 12,
  },
  colorMark: { borderRadius: 4, height: 40, width: 7 },
  categoryCopy: { flex: 1, gap: 4 },
  categoryName: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  categoryMeta: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: layout.radius,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  emptyState: { alignItems: 'center', gap: 8, paddingVertical: 70 },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  emptyText: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(10, 30, 27, 0.58)',
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: layout.radius,
    maxWidth: 520,
    padding: 22,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalTitle: { color: colors.ink, fontSize: 21, fontWeight: '800' },
  modalSubtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  modalForm: { gap: 17, marginTop: 22 },
  serverError: {
    backgroundColor: colors.coralSoft,
    borderRadius: layout.radius,
    color: '#8A3932',
    fontSize: 13,
    lineHeight: 19,
    padding: 11,
  },
  fieldGroup: { gap: 8 },
  fieldLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 11 },
  swatch: { borderColor: colors.surface, borderRadius: 8, borderWidth: 3, height: 34, width: 34 },
  swatchActive: { borderColor: colors.ink },
});
