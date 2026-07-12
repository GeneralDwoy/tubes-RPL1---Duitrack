import { supabase } from '@/lib/supabase';

export type CategoryKind = 'pemasukan' | 'pengeluaran';

export type Category = {
  aktif: boolean;
  id_kategori: string;
  id_user: string;
  ikon: string | null;
  jenis: CategoryKind;
  nama_kategori: string;
  target_anggaran: number;
  warna: string;
};

export type FinanceTransaction = {
  amount: number;
  categoryName: string | null;
  createdAt: string;
  date: string;
  description: string | null;
  id: string;
  title: string;
  type: 'income' | 'expense';
};

export type MonthlySummary = {
  balance: number;
  expense: number;
  income: number;
};

type CategoryInput = {
  budget?: number;
  color: string;
  kind: CategoryKind;
  name: string;
};

type IncomeInput = {
  amount: number;
  categoryId?: string | null;
  date: string;
  notes?: string;
  source: string;
};

type ExpenseInput = {
  amount: number;
  categoryId: string;
  date: string;
  description?: string;
};

type IncomeRow = {
  created_at: string;
  detail_pemasukan: {
    catatan: string | null;
    id_kategori: string | null;
    sumber: string;
  }[];
  id_pemasukan: string;
  tanggal: string;
  total_pemasukan: number;
};

type ExpenseRow = {
  created_at: string;
  detail_pengeluaran: {
    deskripsi: string | null;
    id_kategori: string;
  }[];
  id_pengeluaran: string;
  tanggal: string;
  total_pengeluaran: number;
};

export class FinanceValidationError extends Error {}

async function requireUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error('Sesi pengguna tidak ditemukan. Silakan masuk kembali.');
  return user.id;
}

function getMonthBounds(dateValue: string | Date) {
  const date = typeof dateValue === 'string' ? new Date(`${dateValue}T00:00:00`) : dateValue;
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  const toDate = (value: Date) => {
    const localYear = value.getFullYear();
    const localMonth = String(value.getMonth() + 1).padStart(2, '0');
    const localDay = String(value.getDate()).padStart(2, '0');
    return `${localYear}-${localMonth}-${localDay}`;
  };

  return { end: toDate(end), start: toDate(start) };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

export async function listCategories(kind?: CategoryKind) {
  let query = supabase
    .from('kategori')
    .select('id_kategori,id_user,nama_kategori,jenis,target_anggaran,warna,ikon,aktif')
    .eq('aktif', true)
    .order('nama_kategori');

  if (kind) query = query.eq('jenis', kind);
  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((category) => ({
    ...category,
    target_anggaran: Number(category.target_anggaran),
  })) as Category[];
}

export async function createCategory(input: CategoryInput) {
  const userId = await requireUserId();
  const { error } = await supabase.from('kategori').insert({
    id_user: userId,
    jenis: input.kind,
    nama_kategori: input.name.trim(),
    target_anggaran: input.kind === 'pengeluaran' ? input.budget ?? 0 : 0,
    warna: input.color,
  });
  if (error) throw error;
}

export async function updateCategory(categoryId: string, input: CategoryInput) {
  const { error } = await supabase
    .from('kategori')
    .update({
      jenis: input.kind,
      nama_kategori: input.name.trim(),
      target_anggaran: input.kind === 'pengeluaran' ? input.budget ?? 0 : 0,
      warna: input.color,
    })
    .eq('id_kategori', categoryId);
  if (error) throw error;
}

export async function deleteCategory(categoryId: string) {
  const { error } = await supabase.from('kategori').delete().eq('id_kategori', categoryId);
  if (error) throw error;
}

export async function getMonthlySummary(dateValue: string | Date = new Date()) {
  const { start } = getMonthBounds(dateValue);
  const { data, error } = await supabase
    .from('ringkasan_bulanan')
    .select('total_pemasukan,total_pengeluaran,saldo')
    .eq('periode', start)
    .maybeSingle();

  if (error) throw error;
  return {
    balance: Number(data?.saldo ?? 0),
    expense: Number(data?.total_pengeluaran ?? 0),
    income: Number(data?.total_pemasukan ?? 0),
  } satisfies MonthlySummary;
}

async function getCategorySpending(categoryId: string, date: string) {
  const userId = await requireUserId();
  const { start, end } = getMonthBounds(date);
  const { data: headers, error: headerError } = await supabase
    .from('pengeluaran')
    .select('id_pengeluaran')
    .eq('id_user', userId)
    .gte('tanggal', start)
    .lt('tanggal', end);

  if (headerError) throw headerError;
  const ids = (headers ?? []).map((header) => header.id_pengeluaran);
  if (ids.length === 0) return 0;

  const { data, error } = await supabase
    .from('detail_pengeluaran')
    .select('nominal')
    .eq('id_kategori', categoryId)
    .in('id_pengeluaran', ids);

  if (error) throw error;
  return (data ?? []).reduce((total, item) => total + Number(item.nominal), 0);
}

export async function createIncome(input: IncomeInput) {
  const userId = await requireUserId();
  const { data: header, error: headerError } = await supabase
    .from('pemasukan')
    .insert({ id_user: userId, tanggal: input.date })
    .select('id_pemasukan')
    .single();

  if (headerError) throw headerError;

  const { error: detailError } = await supabase.from('detail_pemasukan').insert({
    catatan: input.notes?.trim() || null,
    id_kategori: input.categoryId || null,
    id_pemasukan: header.id_pemasukan,
    nominal: input.amount,
    sumber: input.source.trim(),
  });

  if (detailError) {
    await supabase.from('pemasukan').delete().eq('id_pemasukan', header.id_pemasukan);
    throw detailError;
  }

  return header.id_pemasukan;
}

export async function createExpense(input: ExpenseInput) {
  const [userId, summary, categories] = await Promise.all([
    requireUserId(),
    getMonthlySummary(input.date),
    listCategories('pengeluaran'),
  ]);

  if (input.amount > summary.balance) {
    throw new FinanceValidationError(
      `Saldo tidak cukup. Saldo bulan ini ${formatCurrency(summary.balance)}.`,
    );
  }

  const category = categories.find((item) => item.id_kategori === input.categoryId);
  if (!category) throw new FinanceValidationError('Kategori pengeluaran tidak ditemukan.');

  if (category.target_anggaran > 0) {
    const currentSpending = await getCategorySpending(category.id_kategori, input.date);
    if (currentSpending + input.amount > category.target_anggaran) {
      const remaining = Math.max(category.target_anggaran - currentSpending, 0);
      throw new FinanceValidationError(
        `Anggaran ${category.nama_kategori} tersisa ${formatCurrency(remaining)}.`,
      );
    }
  }

  const { data: header, error: headerError } = await supabase
    .from('pengeluaran')
    .insert({ id_user: userId, tanggal: input.date })
    .select('id_pengeluaran')
    .single();

  if (headerError) throw headerError;

  const { error: detailError } = await supabase.from('detail_pengeluaran').insert({
    deskripsi: input.description?.trim() || null,
    id_kategori: input.categoryId,
    id_pengeluaran: header.id_pengeluaran,
    nominal: input.amount,
  });

  if (detailError) {
    await supabase.from('pengeluaran').delete().eq('id_pengeluaran', header.id_pengeluaran);
    throw detailError;
  }

  return header.id_pengeluaran;
}

export async function listRecentTransactions(limit = 10) {
  const [incomeResult, expenseResult, categories] = await Promise.all([
    supabase
      .from('pemasukan')
      .select('id_pemasukan,tanggal,total_pemasukan,created_at,detail_pemasukan(sumber,catatan,id_kategori)')
      .order('tanggal', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('pengeluaran')
      .select('id_pengeluaran,tanggal,total_pengeluaran,created_at,detail_pengeluaran(deskripsi,id_kategori)')
      .order('tanggal', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit),
    listCategories(),
  ]);

  if (incomeResult.error) throw incomeResult.error;
  if (expenseResult.error) throw expenseResult.error;

  const categoryNames = new Map(
    categories.map((category) => [category.id_kategori, category.nama_kategori]),
  );

  const incomes = (incomeResult.data as unknown as IncomeRow[]).map((row) => {
    const detail = row.detail_pemasukan[0];
    return {
      amount: Number(row.total_pemasukan),
      categoryName: detail?.id_kategori ? categoryNames.get(detail.id_kategori) ?? null : null,
      createdAt: row.created_at,
      date: row.tanggal,
      description: detail?.catatan ?? null,
      id: row.id_pemasukan,
      title: detail?.sumber ?? 'Pemasukan',
      type: 'income' as const,
    };
  });

  const expenses = (expenseResult.data as unknown as ExpenseRow[]).map((row) => {
    const detail = row.detail_pengeluaran[0];
    const categoryName = detail?.id_kategori
      ? categoryNames.get(detail.id_kategori) ?? null
      : null;
    return {
      amount: Number(row.total_pengeluaran),
      categoryName,
      createdAt: row.created_at,
      date: row.tanggal,
      description: detail?.deskripsi ?? null,
      id: row.id_pengeluaran,
      title: categoryName ?? 'Pengeluaran',
      type: 'expense' as const,
    };
  });

  return [...incomes, ...expenses]
    .sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`))
    .slice(0, limit) satisfies FinanceTransaction[];
}
