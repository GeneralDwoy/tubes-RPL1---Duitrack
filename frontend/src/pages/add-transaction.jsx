import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Banknote, CalendarDays, FileText, Save, WalletCards, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { AppButton } from '@/components/app-button';
import { CategoryPicker } from '@/components/category-picker';
import { FormField } from '@/components/form-field';
import { ScreenHeader } from '@/components/screen-header';
import { colors, layout } from '@/constants/theme';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/currency-input';
import {
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

function today() {
  const value = new Date();
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AddTransactionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const transactionId = searchParams.get('id');
  const typeParam = searchParams.get('type');
  const type = typeParam === 'income' ? 'income' : 'expense';
  const categoryKind = type === 'income' ? 'pemasukan' : 'pengeluaran';

  const { loading: authLoading, session } = useAuth();
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [recordLoading, setRecordLoading] = useState(Boolean(transactionId));
  const [loadedTransaction, setLoadedTransaction] = useState(null);
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [monthBalance, setMonthBalance] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [serverError, setServerError] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
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
    if (!authLoading && !session) navigate('/welcome', { replace: true });
  }, [authLoading, navigate, session]);

  useEffect(() => {
    if (!session) return;
    listCategories(categoryKind)
      .then((items) => {
        setCategories(items);
        if (!transactionId && items.length === 1) setValue('categoryId', items[0].id_kategori);
      })
      .catch((error) => alert(error.message))
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
        alert(error instanceof Error ? error.message : 'Data transaksi tidak ditemukan.');
        navigate(-1);
      })
      .finally(() => {
        if (active) setRecordLoading(false);
      });

    return () => {
      active = false;
    };
  }, [navigate, reset, session, transactionId, type]);

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

  const onSubmit = async (values) => {
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
      navigate(transactionId ? '/transactions' : '/dashboard', { replace: true });
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
      <div style={{ alignItems: 'center', backgroundColor: colors.canvas, display: 'flex', minHeight: '100vh', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" color={colors.primary} size={36} />
      </div>
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
    <div style={{ backgroundColor: colors.canvas, minHeight: '100vh', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 42px 20px', boxSizing: 'border-box' }}>
        <ScreenHeader
          subtitle={
            transactionId
              ? 'Perubahan akan memperbarui saldo dan laporan'
              : 'Data akan langsung masuk ke ringkasan keuangan'
          }
          title={`${transactionId ? 'Ubah' : 'Tambah'} ${type === 'income' ? 'pemasukan' : 'pengeluaran'}`}
        />

        {/* Type Band */}
        <div
          style={{
            alignItems: 'center',
            backgroundColor: colors.primarySoft,
            borderRadius: layout.radius,
            display: 'flex',
            flexDirection: 'row',
            gap: 12,
            marginTop: 22,
            padding: 15,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              alignItems: 'center',
              backgroundColor: type === 'expense' ? colors.coralSoft : colors.surface,
              borderRadius: layout.radius,
              display: 'flex',
              height: 44,
              justifyContent: 'center',
              width: 44,
              flexShrink: 0,
            }}
          >
            <WalletCards color={type === 'income' ? colors.primaryDark : colors.coral} size={23} />
          </div>
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 3 }}>
            <span style={{ color: colors.ink, fontSize: 15, fontWeight: '800' }}>
              {type === 'income' ? 'Dana masuk' : 'Dana keluar'}
            </span>
            <span style={{ color: colors.muted, fontSize: 12, lineHeight: '17px' }}>
              {type === 'income'
                ? 'Saldo bertambah setelah transaksi tersimpan.'
                : 'Saldo dan anggaran akan diperiksa sebelum disimpan.'}
            </span>
          </div>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.line,
            borderRadius: layout.radius,
            borderWidth: 1,
            borderStyle: 'solid',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            marginTop: 18,
            padding: 20,
            boxSizing: 'border-box',
          }}
        >
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
            name="amount"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormField
                error={errors.amount?.message}
                icon={Banknote}
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
                type="date"
                value={value}
              />
            )}
          />

          {categoryLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 10 }}>
              <Loader2 className="animate-spin" color={colors.primary} size={24} />
            </div>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ color: colors.muted, fontSize: 13, lineHeight: '19px' }}>
                Belum ada kategori untuk jenis transaksi ini.
              </span>
              <AppButton
                label="Buat kategori"
                onClick={() => navigate('/categories')}
                variant="secondary"
              />
            </div>
          )}

          {type === 'expense' && selectedCategoryId && budgetStatus ? (
            <div
              style={{
                backgroundColor: availabilityWarning ? colors.coralSoft : colors.amberSoft,
                borderRadius: layout.radius,
                display: 'flex',
                flexDirection: 'column',
                gap: 9,
                padding: 13,
              }}
            >
              <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.muted, fontSize: 12 }}>Saldo tersedia bulan ini</span>
                <span style={{ color: availabilityWarning ? colors.coral : colors.ink, fontSize: 12, fontWeight: '800' }}>
                  {formatCurrency(availableBalance)}
                </span>
              </div>
              {budgetStatus.budget > 0 ? (
                <>
                  <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: colors.muted, fontSize: 12 }}>Sisa anggaran setelah transaksi</span>
                    <span style={{ color: budgetRemaining < 0 ? colors.coral : colors.ink, fontSize: 12, fontWeight: '800' }}>
                      {formatCurrency(Math.max(budgetRemaining, 0))}
                    </span>
                  </div>
                  <div style={{ backgroundColor: colors.surface, borderRadius: 4, height: 7, overflow: 'hidden', width: '100%' }}>
                    <div
                      style={{
                        backgroundColor: availabilityWarning ? colors.coral : colors.amber,
                        borderRadius: 4,
                        height: '100%',
                        width: `${budgetProgress}%`,
                      }}
                    />
                  </div>
                </>
              ) : (
                <span style={{ color: colors.muted, fontSize: 11 }}>Kategori ini belum memiliki batas anggaran.</span>
              )}
            </div>
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
            type="submit"
          />
        </form>
      </div>
    </div>
  );
}
