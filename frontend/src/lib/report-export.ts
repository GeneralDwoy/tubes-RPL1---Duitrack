import { Platform } from 'react-native';

import { formatCurrency, type FinanceTransaction, type MonthlyReport } from '@/lib/finance';

export type ReportExportFormat = 'excel' | 'pdf';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPeriod(period: string) {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
    new Date(`${period}T00:00:00`),
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function createReportHtml(report: MonthlyReport, transactions: FinanceTransaction[]) {
  const transactionRows = transactions
    .map(
      (transaction) => `
        <tr>
          <td>${escapeHtml(formatDate(transaction.date))}</td>
          <td>${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</td>
          <td>${escapeHtml(transaction.title)}</td>
          <td>${escapeHtml(transaction.categoryName ?? '-')}</td>
          <td>${escapeHtml(transaction.description ?? '-')}</td>
          <td class="number">${escapeHtml(formatCurrency(transaction.amount))}</td>
        </tr>`,
    )
    .join('');
  const categoryRows = report.categories
    .map(
      (category) => `
        <tr>
          <td>${escapeHtml(category.name)}</td>
          <td class="number">${escapeHtml(formatCurrency(category.spent))}</td>
          <td class="number">${category.budget ? escapeHtml(formatCurrency(category.budget)) : 'Tanpa batas'}</td>
          <td class="number">${category.budget ? `${Math.round(category.percentage)}%` : '-'}</td>
        </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
  <html lang="id">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Laporan DuiTrack ${escapeHtml(report.period.slice(0, 7))}</title>
      <style>
        @page { margin: 24px; }
        * { box-sizing: border-box; }
        body { color: #172b28; font-family: Arial, sans-serif; font-size: 11px; margin: 0; }
        header { border-bottom: 3px solid #087b68; margin-bottom: 20px; padding-bottom: 12px; }
        h1 { font-size: 24px; margin: 0; }
        h2 { font-size: 15px; margin: 24px 0 8px; }
        p { color: #647773; margin: 5px 0 0; }
        .summary { display: table; table-layout: fixed; width: 100%; }
        .summary-item { border: 1px solid #d8e2de; display: table-cell; padding: 12px; width: 33.33%; }
        .label { color: #647773; display: block; margin-bottom: 6px; }
        .value { font-size: 16px; font-weight: 700; }
        table { border-collapse: collapse; width: 100%; }
        th { background: #eef3f0; font-weight: 700; text-align: left; }
        th, td { border: 1px solid #d8e2de; padding: 7px; vertical-align: top; }
        .number { text-align: right; white-space: nowrap; }
        .empty { color: #647773; padding: 18px; text-align: center; }
        footer { color: #647773; font-size: 9px; margin-top: 22px; }
      </style>
    </head>
    <body>
      <header>
        <h1>DuiTrack</h1>
        <p>Laporan keuangan pribadi - ${escapeHtml(formatPeriod(report.period))}</p>
      </header>
      <section class="summary">
        <div class="summary-item"><span class="label">Pemasukan</span><span class="value">${escapeHtml(formatCurrency(report.summary.income))}</span></div>
        <div class="summary-item"><span class="label">Pengeluaran</span><span class="value">${escapeHtml(formatCurrency(report.summary.expense))}</span></div>
        <div class="summary-item"><span class="label">Sisa saldo</span><span class="value">${escapeHtml(formatCurrency(report.summary.balance))}</span></div>
      </section>
      <h2>Riwayat transaksi</h2>
      <table>
        <thead><tr><th>Tanggal</th><th>Jenis</th><th>Transaksi</th><th>Kategori</th><th>Deskripsi</th><th class="number">Nominal</th></tr></thead>
        <tbody>${transactionRows || '<tr><td class="empty" colspan="6">Belum ada transaksi pada periode ini.</td></tr>'}</tbody>
      </table>
      <h2>Evaluasi anggaran</h2>
      <table>
        <thead><tr><th>Kategori</th><th class="number">Terpakai</th><th class="number">Anggaran</th><th class="number">Persentase</th></tr></thead>
        <tbody>${categoryRows || '<tr><td class="empty" colspan="4">Belum ada data anggaran.</td></tr>'}</tbody>
      </table>
      <footer>Dibuat otomatis oleh DuiTrack pada ${escapeHtml(new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(new Date()))}.</footer>
    </body>
  </html>`;
}

function escapeCsv(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function createCsv(report: MonthlyReport, transactions: FinanceTransaction[]) {
  const rows: (string | number)[][] = [
    ['DuiTrack - Laporan Keuangan'],
    ['Periode', formatPeriod(report.period)],
    ['Total Pemasukan', report.summary.income],
    ['Total Pengeluaran', report.summary.expense],
    ['Sisa Saldo', report.summary.balance],
    [],
    ['Tanggal', 'Jenis', 'Transaksi', 'Kategori', 'Deskripsi', 'Nominal'],
    ...transactions.map((transaction) => [
      transaction.date,
      transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      transaction.title,
      transaction.categoryName ?? '',
      transaction.description ?? '',
      transaction.amount,
    ]),
  ];
  return `\uFEFF${rows.map((row) => row.map(escapeCsv).join(';')).join('\r\n')}`;
}

function downloadOnWeb(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function printPdfOnWeb(html: string) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) throw new Error('Browser memblokir jendela cetak. Izinkan pop-up untuk DuiTrack.');
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 350);
}

export async function exportMonthlyReport(
  report: MonthlyReport,
  transactions: FinanceTransaction[],
  format: ReportExportFormat,
) {
  const fileBase = `DuiTrack-${report.period.slice(0, 7)}`;
  const html = createReportHtml(report, transactions);

  if (Platform.OS === 'web') {
    if (format === 'excel') {
      downloadOnWeb(createCsv(report, transactions), `${fileBase}.csv`, 'text/csv;charset=utf-8');
    } else {
      printPdfOnWeb(html);
    }
    return;
  }

  const Sharing = await import('expo-sharing');
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Menu penyimpanan file tidak tersedia pada perangkat ini.');
  }

  if (format === 'pdf') {
    const Print = await import('expo-print');
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, {
      dialogTitle: 'Simpan laporan PDF DuiTrack',
      mimeType: 'application/pdf',
      UTI: '.pdf',
    });
    return;
  }

  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.cache, `${fileBase}.csv`);
  file.create({ overwrite: true });
  file.write(createCsv(report, transactions));
  await Sharing.shareAsync(file.uri, {
    dialogTitle: 'Simpan laporan Excel DuiTrack',
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
  });
}
