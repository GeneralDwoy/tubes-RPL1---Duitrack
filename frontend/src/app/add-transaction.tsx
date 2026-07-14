import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Banknote, CalendarDays, FileText, Save, WalletCards } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { z } from 'zod';

import { AppButton } from '@/components/app-button';
import { CategoryPicker } from '@/components/category-picker';
import { FormField } from '@/components/form-field';
import { ScreenHeader } from '@/components/screen-header';
import { colors, layout } from '@/constants/theme';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/currency-input';
import {
  type Category,
  type CategoryBudgetStatus,
  type CategoryKind,
  type EditableTransaction,
  FinanceValidationError,
  createExpense,
  createIncome,
  formatCurrency,
  getCategoryBudgetStatus,
  getMonthlySummary,
  getTransaction,
  listCategories,
  updateExpense,
  updateIncome,
} from '@/lib/finance';
import { useAuth } from '@/providers/auth-provider';

const transactionSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, 'Nominal wajib diisi')
    .refine((value) => parseCurrencyInput(value) > 0, 'Nominal harus lebih dari 0'),
  categoryId: z.string(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Gunakan format YYYY-MM-DD')
    .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00`).getTime()), 'Tanggal tidak valid'),
  description: z.string(),
  source: z.string(),
});

type TransactionValues = z.infer<typeof transactionSchema>;

function today() {
  const value = new Date();
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AddTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; type?: string }>();
  const type: 'income' | 'expense' = params.type === 'income' ? 'income' : 'expense';
  const transactionId = params.id;
  const categoryKind: CategoryKind = type === 'income' ? 'pemasukan' : 'pengeluaran';
  const { loading: authLoading, session } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [recordLoading, setRecordLoading] = useState(Boolean(transactionId));
  const [loadedTransaction, setLoadedTransaction] = useState<EditableTransaction | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<CategoryBudgetStatus | null>(null);
  const [monthBalance, setMonthBalance] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionValues>({
    defaultValues: {
      amount: '',
      categoryId: '',
      date: today(),
      description: '',
      source: '',
    },
    resolver: zodResolver(transactionSchema),
  });
  const selectedCategoryId = useWatch({ control, name: 'categoryId' });
  const selectedAmount = useWatch({ control, name: 'amount' });
  const selectedDate = useWatch({ control, name: 'date' });

  useEffect(() => {
    if (!authLoading && !session) router.replace('/welcome');
  }, [authLoading, router, session]);

  useEffect(() => {
    if (!session) return;
    listCategories(categoryKind)
      .then((items) => {
        setCategories(items);
        if (!transactionId && items.length === 1) setValue('categoryId', items[0].id_kategori);
      })
      .catch((error) => Alert.alert('Gagal memuat kategori', error.message))
      .finally(() => setCategoryLoading(false));
  }, [categoryKind, session, setValue, transactionId]);

  useEffect(() => {
    if (!session || !transactionId) return;

    let active = true;
    getTransaction(type, transactionId)
      .then((transaction) => {
        if (!active) return;
        setLoadedTransaction(transaction);
        reset({
          amount: formatCurrencyInput(String(transaction.amount)),
          categoryId: transaction.categoryId,
          date: transaction.date,
          description: transaction.description,
          source: transaction.source,
        });
      })
      .catch((error) => {
        if (!active) return;
        Alert.alert(
          'Transaksi tidak dapat dibuka',
          error instanceof Error ? error.message : 'Data transaksi tidak ditemukan.',
        );
        router.back();
      })
      .finally(() => {
        if (active) setRecordLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reset, router, session, transactionId, type]);

  useEffect(() => {
    if (type !== 'expense' || !session || !selectedCategoryId || !selectedDate) return;

    let active = true;
    Promise.all([
      getCategoryBudgetStatus(selectedCategoryId, selectedDate),
      getMonthlySummary(selectedDate),
    ])
      .then(([nextBudgetStatus, summary]) => {
        if (!active) return;
        setBudgetStatus(nextBudgetStatus);
        setMonthBalance(summary.balance);
      })
      .catch(() => {
        if (active) setBudgetStatus(null);
      });

    return () => {
      active = false;
    };
  }, [selectedCategoryId, selectedDate, session, type]);

  const onSubmit = async (values: TransactionValues) => {
    setServerError(null);

    if (type === 'expense' && !values.categoryId) {
      setServerError('Kategori pengeluaran wajib dipilih.');
      return;
    }

    if (type === 'income' && !values.source.trim()) {
      setServerError('Sumber pemasukan wajib diisi.');
      return;
    }

    try {
      const amount = parseCurrencyInput(values.amount);
      if (type === 'income') {
        const input = {
          amount,
          categoryId: values.categoryId || null,
          date: values.date,
          notes: values.description,
          source: values.source,
        };
        if (transactionId) await updateIncome(transactionId, input);
        else await createIncome(input);
      } else {
        const input = {
          amount,
          categoryId: values.categoryId,
          date: values.date,
          description: values.description,
        };
        if (transactionId) await updateExpense(transactionId, input);
        else await createExpense(input);
      }
      router.replace(transactionId ? '/transactions' : '/dashboard');
    } catch (error) {
      setServerError(
        error instanceof FinanceValidationError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Transaksi gagal disimpan.',
      );
    }
  };

  if (authLoading || !session || recordLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const enteredAmount = parseCurrencyInput(selectedAmount);
  const editingSameMonth =
    loadedTransaction?.type === 'expense' &&
    loadedTransaction.date.slice(0, 7) === selectedDate.slice(0, 7);
  const editingSameCategory =
    editingSameMonth && loadedTransaction?.categoryId === selectedCategoryId;
  const availableBalance = monthBalance + (editingSameMonth ? loadedTransaction.amount : 0);
  const spentBeforeTransaction = Math.max(
    (budgetStatus?.spent ?? 0) - (editingSameCategory ? loadedTransaction.amount : 0),
    0,
  );
  const projectedSpending = spentBeforeTransaction + enteredAmount;
  const budgetRemaining = (budgetStatus?.budget ?? 0) - projectedSpending;
  const budgetProgress = budgetStatus?.budget
    ? Math.min((projectedSpending / budgetStatus.budget) * 100, 100)
    : 0;
  const availabilityWarning =
    enteredAmount > availableBalance ||
    Boolean(budgetStatus?.budget && projectedSpending > budgetStatus.budget);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          subtitle={
            transactionId
              ? 'Perubahan akan memperbarui saldo dan laporan'
              : 'Data akan langsung masuk ke ringkasan keuangan'
          }
          title={`${transactionId ? 'Ubah' : 'Tambah'} ${type === 'income' ? 'pemasukan' : 'pengeluaran'}`}
        />

        <View style={styles.typeBand}>
          <View style={[styles.typeIcon, type === 'expense' && styles.typeIconExpense]}>
            <WalletCards color={type === 'income' ? colors.primaryDark : colors.coral} size={23} />
          </View>
          <View style={styles.typeCopy}>
            <Text style={styles.typeTitle}>
              {type === 'income' ? 'Dana masuk' : 'Dana keluar'}
            </Text>
            <Text style={styles.typeText}>
              {type === 'income'
                ? 'Saldo bertambah setelah transaksi tersimpan.'
                : 'Saldo dan anggaran akan diperiksa sebelum disimpan.'}
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}
          <Controller
            control={control}
            name="amount"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormField
                error={errors.amount?.message}
                icon={Banknote}
                keyboardType="numeric"
                label="Nominal"
                maxLength={18}
                onBlur={onBlur}
                onChangeText={(text) => onChange(formatCurrencyInput(text))}
                placeholder="Contoh: 250.000"
                value={value}
              />
            )}
          />
          <Controller
            control={control}
            name="date"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormField
                autoCapitalize="none"
                error={errors.date?.message}
                icon={CalendarDays}
                label="Tanggal"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="YYYY-MM-DD"
                value={value}
              />
            )}
          />

          {categoryLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : categories.length > 0 ? (
            <CategoryPicker
              categories={categories}
              error={type === 'expense' && serverError?.includes('Kategori') ? serverError : undefined}
              onChange={(value) => {
                setBudgetStatus(null);
                setValue('categoryId', value, { shouldValidate: true });
              }}
              onClose={() => setPickerOpen(false)}
              onOpen={() => setPickerOpen(true)}
              open={pickerOpen}
              value={selectedCategoryId}
            />
          ) : (
            <View style={styles.noCategory}>
              <Text style={styles.noCategoryText}>Belum ada kategori untuk jenis transaksi ini.</Text>
              <AppButton
                label="Buat kategori"
                onPress={() => router.push('/categories')}
                variant="secondary"
              />
            </View>
          )}

          {type === 'expense' && selectedCategoryId && budgetStatus ? (
            <View style={[styles.budgetBand, availabilityWarning && styles.budgetBandWarning]}>
              <View style={styles.budgetLine}>
                <Text style={styles.budgetLabel}>Saldo tersedia bulan ini</Text>
                <Text style={[styles.budgetValue, availabilityWarning && styles.warningText]}>
                  {formatCurrency(availableBalance)}
                </Text>
              </View>
              {budgetStatus.budget > 0 ? (
                <>
                  <View style={styles.budgetLine}>
                    <Text style={styles.budgetLabel}>Sisa anggaran setelah transaksi</Text>
                    <Text style={[styles.budgetValue, budgetRemaining < 0 && styles.warningText]}>
                      {formatCurrency(Math.max(budgetRemaining, 0))}
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        availabilityWarning && styles.progressFillWarning,
                        { width: `${budgetProgress}%` as `${number}%` },
                      ]}
                    />
                  </View>
                </>
              ) : (
                <Text style={styles.noBudgetText}>Kategori ini belum memiliki batas anggaran.</Text>
              )}
            </View>
          ) : null}

          {type === 'income' ? (
            <Controller
              control={control}
              name="source"
              render={({ field: { onBlur, onChange, value } }) => (
                <FormField
                  icon={WalletCards}
                  label="Sumber pemasukan"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Contoh: Gaji bulanan"
                  value={value}
                />
              )}
            />
          ) : null}

          <Controller
            control={control}
            name="description"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormField
                icon={FileText}
                label={type === 'income' ? 'Catatan (opsional)' : 'Deskripsi (opsional)'}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Tambahkan keterangan"
                value={value}
              />
            )}
          />

          <AppButton
            disabled={categories.length === 0}
            icon={Save}
            label={transactionId ? 'Simpan perubahan' : 'Simpan transaksi'}
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
          />
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
  page: {
    alignSelf: 'center',
    maxWidth: 720,
    paddingBottom: 42,
    paddingHorizontal: 20,
    width: '100%',
  },
  typeBand: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: layout.radius,
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
    padding: 15,
  },
  typeIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: layout.radius,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  typeIconExpense: { backgroundColor: colors.coralSoft },
  typeCopy: { flex: 1, gap: 3 },
  typeTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  typeText: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  formCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    gap: 18,
    marginTop: 18,
    padding: 20,
  },
  serverError: {
    backgroundColor: colors.coralSoft,
    borderRadius: layout.radius,
    color: '#8A3932',
    fontSize: 13,
    lineHeight: 19,
    padding: 11,
  },
  noCategory: { gap: 12 },
  noCategoryText: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  budgetBand: {
    backgroundColor: colors.amberSoft,
    borderRadius: layout.radius,
    gap: 9,
    padding: 13,
  },
  budgetBandWarning: { backgroundColor: colors.coralSoft },
  budgetLine: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  budgetLabel: { color: colors.muted, flex: 1, fontSize: 12 },
  budgetValue: { color: colors.ink, fontSize: 12, fontWeight: '800', maxWidth: '45%', textAlign: 'right' },
  warningText: { color: colors.coral },
  progressTrack: { backgroundColor: colors.surface, borderRadius: 4, height: 7, overflow: 'hidden' },
  progressFill: { backgroundColor: colors.amber, borderRadius: 4, height: '100%' },
  progressFillWarning: { backgroundColor: colors.coral },
  noBudgetText: { color: colors.muted, fontSize: 11 },
});
