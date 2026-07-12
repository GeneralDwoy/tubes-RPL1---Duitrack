import { Check, ChevronDown, Tag, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, layout } from '@/constants/theme';
import type { Category } from '@/lib/finance';

type CategoryPickerProps = {
  categories: Category[];
  error?: string;
  onChange: (categoryId: string) => void;
  onClose: () => void;
  onOpen: () => void;
  open: boolean;
  value: string;
};

export function CategoryPicker({
  categories,
  error,
  onChange,
  onClose,
  onOpen,
  open,
  value,
}: CategoryPickerProps) {
  const selected = categories.find((category) => category.id_kategori === value);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Kategori</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onOpen}
        style={[styles.trigger, error && styles.triggerError]}>
        {selected ? (
          <View style={[styles.color, { backgroundColor: selected.warna }]} />
        ) : (
          <Tag color={colors.muted} size={19} />
        )}
        <Text style={[styles.triggerText, !selected && styles.placeholder]} numberOfLines={1}>
          {selected?.nama_kategori ?? 'Pilih kategori'}
        </Text>
        <ChevronDown color={colors.muted} size={19} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal animationType="fade" onRequestClose={onClose} transparent visible={open}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Pilih kategori</Text>
                <Text style={styles.modalSubtitle}>Kategori aktif untuk transaksi ini</Text>
              </View>
              <Pressable accessibilityLabel="Tutup" onPress={onClose} style={styles.closeButton}>
                <X color={colors.ink} size={20} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.options}>
              {categories.map((category) => {
                const active = category.id_kategori === value;
                return (
                  <Pressable
                    key={category.id_kategori}
                    onPress={() => {
                      onChange(category.id_kategori);
                      onClose();
                    }}
                    style={[styles.option, active && styles.optionActive]}>
                    <View style={[styles.color, { backgroundColor: category.warna }]} />
                    <View style={styles.optionCopy}>
                      <Text style={styles.optionName}>{category.nama_kategori}</Text>
                      {category.target_anggaran > 0 ? (
                        <Text style={styles.optionMeta}>Memiliki anggaran bulanan</Text>
                      ) : null}
                    </View>
                    {active ? <Check color={colors.primary} size={20} strokeWidth={2.5} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 7, width: '100%' },
  label: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  trigger: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  triggerError: { borderColor: colors.coral },
  triggerText: { color: colors.ink, flex: 1, fontSize: 16 },
  placeholder: { color: '#8A9A96' },
  color: { borderRadius: 4, height: 20, width: 20 },
  error: { color: colors.coral, fontSize: 13, lineHeight: 18 },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(10, 30, 27, 0.58)',
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: layout.radius,
    maxHeight: '78%',
    maxWidth: 500,
    padding: 20,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  modalSubtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: layout.radius,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  options: { gap: 8, paddingTop: 18 },
  option: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    minHeight: 58,
    padding: 12,
  },
  optionActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  optionCopy: { flex: 1, gap: 2 },
  optionName: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  optionMeta: { color: colors.muted, fontSize: 11 },
});
