import { ApiError, apiRequest } from '@/lib/api';

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

export type EditableTransaction = {
  amount: number;
  categoryId: string;
  date: string;
  description: string;
  id: string;
  source: string;
  type: 'income' | 'expense';
};

export type MonthlySummary = {
  balance: number;
  expense: number;
  income: number;
};

export type CategoryBudgetStatus = {
  budget: number;
  categoryName: string;
  spent: number;
};

export type ReportCategory = {
  budget: number;
  color: string;
  id: string;
  name: string;
  percentage: number;
  spent: number;
};

export type ReportWeek = {
  expense: number;
  income: number;
  label: string;
};

export type MonthlyReport = {
  categories: ReportCategory[];
  period: string;
  summary: MonthlySummary;
  weeks: ReportWeek[];
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

type ApiCategory = {
  aktif: boolean | number;
  id_kategori: number | string;
  id_user: number | string;
  ikon: string | null;
  jenis: CategoryKind;
  nama_kategori: string;
  target_anggaran: number | string;
  warna: string;
};

type ApiTransaction = {
  catatan: string | null;
  deskripsi: string | null;
  id_kategori: number | string;
  id_transaksi: number | string;
  jenis_transaksi: CategoryKind;
  nama_kategori: string | null;
  nominal: number | string;
  tanggal: string;
};

type ApiSummary = {
  periode: string;
  saldoBulanan: number | string;
  saldoKeseluruhan: number | string;
  totalPemasukan: number | string;
  totalPengeluaran: number | string;
};

type RequestOptions = Parameters<typeof apiRequest>[1];

export class FinanceValidationError extends Error {}

function toDateString(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthBounds(dateValue: string | Date) {
  const date = typeof dateValue === 'string' ? new Date(`${dateValue}T00:00:00`) : dateValue;
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { end: toDateString(endDate), start: toDateString(startDate) };
}

function buildQuery(values: Record<string, string | number | undefined>) {
  const parts = Object.entries(values)
    .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

function financeError(error: unknown): never {
  if (error instanceof ApiError) {
    if (error.code === 'INSUFFICIENT_BALANCE') {
      const balance = Number(error.data?.saldo ?? 0);
      throw new FinanceValidationError(`Saldo tidak cukup. Saldo yang tersedia ${formatCurrency(balance)}.`);
    }
    if (error.code === 'BUDGET_EXCEEDED') {
      const remaining = Number(error.data?.sisaAnggaran ?? 0);
      throw new FinanceValidationError(`${error.message}. Sisa anggaran ${formatCurrency(remaining)}.`);
    }
    if (error.code === 'INCOME_IN_USE') throw new FinanceValidationError(error.message);
  }
  throw error;
}

async function financeRequest<T>(path: string, options?: RequestOptions) {
  try {
    return await apiRequest<T>(path, options);
  } catch (error) {
    return financeError(error);
  }
}

function mapCategory(category: ApiCategory): Category {
  return {
    aktif: Boolean(category.aktif),
    id_kategori: String(category.id_kategori),
    id_user: String(category.id_user),
    ikon: category.ikon,
    jenis: category.jenis,
    nama_kategori: category.nama_kategori,
    target_anggaran: Number(category.target_anggaran),
    warna: category.warna || '#087B68',
  };
}

function mapTransaction(transaction: ApiTransaction): FinanceTransaction {
  const income = transaction.jenis_transaksi === 'pemasukan';
  const date = String(transaction.tanggal).slice(0, 10);
  return {
    amount: Number(transaction.nominal),
    categoryName: transaction.nama_kategori,
    createdAt: `${date}T00:00:00.000Z`,
    date,
    description: income ? transaction.catatan : transaction.deskripsi,
    id: String(transaction.id_transaksi),
    title: income ? transaction.deskripsi || 'Pemasukan' : transaction.nama_kategori || 'Pengeluaran',
    type: income ? 'income' : 'expense',
  };
}

async function listApiTransactions(options: {
  endDate?: string;
  limit?: number;
  search?: string;
  startDate?: string;
  type?: 'all' | CategoryKind;
} = {}) {
  const query = buildQuery({
    endDate: options.endDate,
    limit: options.limit,
    search: options.search,
    startDate: options.startDate,
    type: options.type,
  });
  const data = await financeRequest<{ transactions: ApiTransaction[] }>(`/transactions${query}`);
  return data.transactions.map(mapTransaction);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

export async function listCategories(kind?: CategoryKind) {
  const query = buildQuery({ jenis: kind });
  const data = await financeRequest<{ categories: ApiCategory[] }>(`/categories${query}`);
  return data.categories.map(mapCategory);
}

export async function createCategory(input: CategoryInput) {
  await financeRequest('/categories', {
    body: {
      jenis: input.kind,
      namaKategori: input.name.trim(),
      targetAnggaran: input.kind === 'pengeluaran' ? input.budget ?? 0 : 0,
      warna: input.color,
    },
    method: 'POST',
  });
}

export async function updateCategory(categoryId: string, input: CategoryInput) {
  await financeRequest(`/categories/${categoryId}`, {
    body: {
      jenis: input.kind,
      namaKategori: input.name.trim(),
      targetAnggaran: input.kind === 'pengeluaran' ? input.budget ?? 0 : 0,
      warna: input.color,
    },
    method: 'PUT',
  });
}

export async function deleteCategory(categoryId: string) {
  await financeRequest(`/categories/${categoryId}`, { method: 'DELETE' });
}

export async function getMonthlySummary(dateValue: string | Date = new Date()) {
  const { start } = getMonthBounds(dateValue);
  const data = await financeRequest<ApiSummary>(`/transactions/summary?month=${start.slice(0, 7)}`);
  return {
    balance: Number(data.saldoBulanan),
    expense: Number(data.totalPengeluaran),
    income: Number(data.totalPemasukan),
  } satisfies MonthlySummary;
}

export async function getMonthlyReport(dateValue: Date = new Date()) {
  const { start, end } = getMonthBounds(dateValue);
  const [transactions, categories, summary] = await Promise.all([
    listApiTransactions({ endDate: end, limit: 1000, startDate: start }),
    listCategories('pengeluaran'),
    getMonthlySummary(dateValue),
  ]);

  const daysInMonth = new Date(dateValue.getFullYear(), dateValue.getMonth() + 1, 0).getDate();
  const weeks: ReportWeek[] = Array.from({ length: Math.ceil(daysInMonth / 7) }, (_, index) => {
    const firstDay = index * 7 + 1;
    return {
      expense: 0,
      income: 0,
      label: `${firstDay}-${Math.min(firstDay + 6, daysInMonth)}`,
    };
  });
  const spending = new Map<string, number>();

  for (const transaction of transactions) {
    const weekIndex = Math.floor((Number(transaction.date.slice(8, 10)) - 1) / 7);
    if (transaction.type === 'income') {
      weeks[weekIndex].income += transaction.amount;
    } else {
      weeks[weekIndex].expense += transaction.amount;
      const category = categories.find((item) => item.nama_kategori === transaction.categoryName);
      if (category) {
        spending.set(category.id_kategori, (spending.get(category.id_kategori) ?? 0) + transaction.amount);
      }
    }
  }

  const reportCategories = categories
    .map((category) => {
      const spent = spending.get(category.id_kategori) ?? 0;
      return {
        budget: category.target_anggaran,
        color: category.warna,
        id: category.id_kategori,
        name: category.nama_kategori,
        percentage: category.target_anggaran > 0 ? (spent / category.target_anggaran) * 100 : 0,
        spent,
      } satisfies ReportCategory;
    })
    .filter((category) => category.spent > 0 || category.budget > 0)
    .sort((a, b) => b.spent - a.spent);

  return {
    categories: reportCategories,
    period: start,
    summary,
    weeks,
  } satisfies MonthlyReport;
}

export async function getCategoryBudgetStatus(categoryId: string, date: string) {
  const { start, end } = getMonthBounds(date);
  const [categories, transactions] = await Promise.all([
    listCategories('pengeluaran'),
    listApiTransactions({ endDate: end, limit: 1000, startDate: start, type: 'pengeluaran' }),
  ]);
  const category = categories.find((item) => item.id_kategori === categoryId);
  if (!category) throw new FinanceValidationError('Kategori pengeluaran tidak ditemukan.');

  const spent = transactions
    .filter((transaction) => transaction.categoryName === category.nama_kategori)
    .reduce((total, transaction) => total + transaction.amount, 0);
  return {
    budget: category.target_anggaran,
    categoryName: category.nama_kategori,
    spent,
  } satisfies CategoryBudgetStatus;
}

export async function createIncome(input: IncomeInput) {
  if (!input.categoryId) throw new FinanceValidationError('Kategori pemasukan wajib dipilih.');
  const data = await financeRequest<{ idPemasukan: number }>('/transactions/income', {
    body: {
      catatan: input.notes?.trim() || null,
      idKategori: Number(input.categoryId),
      nominal: input.amount,
      sumber: input.source.trim(),
      tanggal: input.date,
    },
    method: 'POST',
  });
  return String(data.idPemasukan);
}

export async function createExpense(input: ExpenseInput) {
  const data = await financeRequest<{ idPengeluaran: number }>('/transactions/expense', {
    body: {
      deskripsi: input.description?.trim() || null,
      idKategori: Number(input.categoryId),
      nominal: input.amount,
      tanggal: input.date,
    },
    method: 'POST',
  });
  return String(data.idPengeluaran);
}

export async function getTransaction(type: 'income' | 'expense', transactionId: string) {
  const data = await financeRequest<{ transaction: ApiTransaction }>(
    `/transactions/${type}/${transactionId}`,
  );
  const transaction = data.transaction;
  return {
    amount: Number(transaction.nominal),
    categoryId: String(transaction.id_kategori),
    date: String(transaction.tanggal).slice(0, 10),
    description: type === 'income' ? transaction.catatan ?? '' : transaction.deskripsi ?? '',
    id: String(transaction.id_transaksi),
    source: type === 'income' ? transaction.deskripsi ?? '' : '',
    type,
  } satisfies EditableTransaction;
}

export async function updateIncome(transactionId: string, input: IncomeInput) {
  if (!input.categoryId) throw new FinanceValidationError('Kategori pemasukan wajib dipilih.');
  await financeRequest(`/transactions/income/${transactionId}`, {
    body: {
      catatan: input.notes?.trim() || null,
      idKategori: Number(input.categoryId),
      nominal: input.amount,
      sumber: input.source.trim(),
      tanggal: input.date,
    },
    method: 'PUT',
  });
}

export async function updateExpense(transactionId: string, input: ExpenseInput) {
  await financeRequest(`/transactions/expense/${transactionId}`, {
    body: {
      deskripsi: input.description?.trim() || null,
      idKategori: Number(input.categoryId),
      nominal: input.amount,
      tanggal: input.date,
    },
    method: 'PUT',
  });
}

export async function deleteTransaction(type: 'income' | 'expense', transactionId: string) {
  await financeRequest(`/transactions/${type}/${transactionId}`, { method: 'DELETE' });
}

export async function listRecentTransactions(limit = 10) {
  return listApiTransactions({ limit: Math.min(Math.max(limit, 1), 1000) });
}

export async function listMonthlyTransactions(dateValue: Date) {
  const { start, end } = getMonthBounds(dateValue);
  return listApiTransactions({ endDate: end, limit: 1000, startDate: start });
}
