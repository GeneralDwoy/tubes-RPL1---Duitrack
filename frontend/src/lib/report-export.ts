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

function downloadOnWeb(content: BlobPart, fileName: string, mimeType: string) {
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

function formatExportCurrency(value: number) {
  return `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value)}`;
}

async function downloadPdfOnWeb(
  report: MonthlyReport,
  transactions: FinanceTransaction[],
  fileName: string,
) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf/dist/jspdf.es.min.js'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableModule.default ?? autoTableModule.autoTable;
  const document = new jsPDF({ format: 'a4', orientation: 'landscape', unit: 'mm' });
  const pageWidth = document.internal.pageSize.getWidth();
  const summaryItems = [
    ['Total pemasukan', report.summary.income],
    ['Total pengeluaran', report.summary.expense],
    ['Sisa saldo', report.summary.balance],
  ] as const;

  document.setProperties({
    author: 'DuiTrack',
    subject: `Laporan keuangan ${formatPeriod(report.period)}`,
    title: `Laporan DuiTrack ${formatPeriod(report.period)}`,
  });
  document.setTextColor(8, 123, 104);
  document.setFontSize(22);
  document.setFont('helvetica', 'bold');
  document.text('DuiTrack', 14, 16);
  document.setTextColor(100, 119, 115);
  document.setFontSize(10);
  document.setFont('helvetica', 'normal');
  document.text(`Laporan keuangan pribadi - ${formatPeriod(report.period)}`, 14, 22);
  document.setDrawColor(8, 123, 104);
  document.setLineWidth(0.8);
  document.line(14, 26, pageWidth - 14, 26);

  summaryItems.forEach(([label, value], index) => {
    const boxWidth = (pageWidth - 36) / 3;
    const x = 14 + index * (boxWidth + 4);
    document.setFillColor(238, 243, 240);
    document.setDrawColor(216, 226, 222);
    document.roundedRect(x, 31, boxWidth, 20, 1.5, 1.5, 'FD');
    document.setTextColor(100, 119, 115);
    document.setFontSize(8);
    document.text(label, x + 4, 38);
    document.setTextColor(23, 43, 40);
    document.setFontSize(12);
    document.setFont('helvetica', 'bold');
    document.text(formatExportCurrency(value), x + 4, 46);
    document.setFont('helvetica', 'normal');
  });

  autoTable(document, {
    body: transactions.length
      ? transactions.map((transaction) => [
          formatDate(transaction.date),
          transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
          transaction.title,
          transaction.categoryName ?? '-',
          transaction.description ?? '-',
          formatExportCurrency(transaction.amount),
        ])
      : [['-', '-', 'Belum ada transaksi', '-', '-', 'Rp 0']],
    columnStyles: { 5: { halign: 'right' } },
    head: [['Tanggal', 'Jenis', 'Transaksi', 'Kategori', 'Deskripsi', 'Nominal']],
    headStyles: { fillColor: [8, 123, 104], fontStyle: 'bold', textColor: 255 },
    margin: { left: 14, right: 14 },
    startY: 59,
    styles: { cellPadding: 2.3, fontSize: 8, lineColor: [216, 226, 222], lineWidth: 0.15 },
    theme: 'grid',
  });

  const transactionEnd =
    (document as typeof document & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 59;
  autoTable(document, {
    body: report.categories.length
      ? report.categories.map((category) => [
          category.name,
          formatExportCurrency(category.spent),
          category.budget ? formatExportCurrency(category.budget) : 'Tanpa batas',
          category.budget ? `${Math.round(category.percentage)}%` : '-',
        ])
      : [['Belum ada data anggaran', 'Rp 0', '-', '-']],
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    head: [['Kategori', 'Terpakai', 'Anggaran', 'Persentase']],
    headStyles: { fillColor: [23, 43, 40], fontStyle: 'bold', textColor: 255 },
    margin: { left: 14, right: 14 },
    pageBreak: 'auto',
    startY: transactionEnd + 10,
    styles: { cellPadding: 2.3, fontSize: 8, lineColor: [216, 226, 222], lineWidth: 0.15 },
    theme: 'grid',
  });

  const pageCount = document.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    document.setPage(page);
    document.setFontSize(7);
    document.setTextColor(100, 119, 115);
    document.text(`DuiTrack | Halaman ${page} dari ${pageCount}`, pageWidth - 14, 200, {
      align: 'right',
    });
  }
  const pdfBuffer = document.output('arraybuffer');
  downloadOnWeb(new Uint8Array(pdfBuffer), fileName, 'application/pdf');
}

async function createExcelFile(report: MonthlyReport, transactions: FinanceTransaction[]) {
  const excelModule = await import('exceljs/dist/exceljs.min.js');
  const ExcelJS = excelModule.default ?? excelModule;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Laporan Bulanan', {
    pageSetup: { fitToPage: true, orientation: 'landscape', paperSize: 9 },
    views: [{ state: 'frozen', ySplit: 8 }],
  });
  const currencyFormat = '[$Rp-421] #,##0;[Red]-[$Rp-421] #,##0';

  workbook.creator = 'DuiTrack';
  workbook.created = new Date();
  workbook.subject = `Laporan keuangan ${formatPeriod(report.period)}`;
  workbook.title = `Laporan DuiTrack ${formatPeriod(report.period)}`;

  worksheet.mergeCells('A1:F1');
  worksheet.getCell('A1').value = `DuiTrack - Laporan Keuangan ${formatPeriod(report.period)}`;
  worksheet.getCell('A1').font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 16 };
  worksheet.getCell('A1').alignment = { vertical: 'middle' };
  worksheet.getCell('A1').fill = { fgColor: { argb: 'FF087B68' }, pattern: 'solid', type: 'pattern' };
  worksheet.getRow(1).height = 28;

  worksheet.addTable({
    columns: [{ name: 'Ringkasan' }, { name: 'Nominal' }],
    name: 'RingkasanKeuangan',
    ref: 'A3',
    rows: [
      ['Total Pemasukan', report.summary.income],
      ['Total Pengeluaran', report.summary.expense],
      ['Sisa Saldo', report.summary.balance],
    ],
    style: { showRowStripes: true, theme: 'TableStyleMedium4' },
  });
  for (let row = 4; row <= 6; row += 1) worksheet.getCell(`B${row}`).numFmt = currencyFormat;

  const transactionRows = transactions.length
    ? transactions.map((transaction) => [
        formatDate(transaction.date),
        transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        transaction.title,
        transaction.categoryName ?? '-',
        transaction.description ?? '-',
        transaction.amount,
      ])
    : [['-', '-', 'Belum ada transaksi', '-', '-', 0]];
  worksheet.addTable({
    columns: [
      { name: 'Tanggal' },
      { name: 'Jenis' },
      { name: 'Transaksi' },
      { name: 'Kategori' },
      { name: 'Deskripsi' },
      { name: 'Nominal' },
    ],
    name: 'DaftarTransaksi',
    ref: 'A8',
    rows: transactionRows,
    style: { showRowStripes: true, theme: 'TableStyleMedium4' },
  });
  const transactionEndRow = 8 + transactionRows.length;
  for (let row = 9; row <= transactionEndRow; row += 1) {
    worksheet.getCell(`F${row}`).numFmt = currencyFormat;
  }

  const budgetStartRow = transactionEndRow + 3;
  const budgetRows = report.categories.length
    ? report.categories.map((category) => [
        category.name,
        category.spent,
        category.budget,
        category.budget ? category.percentage / 100 : null,
      ])
    : [['Belum ada data anggaran', 0, 0, null]];
  worksheet.addTable({
    columns: [
      { name: 'Kategori' },
      { name: 'Terpakai' },
      { name: 'Anggaran' },
      { name: 'Persentase' },
    ],
    name: 'EvaluasiAnggaran',
    ref: `A${budgetStartRow}`,
    rows: budgetRows,
    style: { showRowStripes: true, theme: 'TableStyleMedium2' },
  });
  const budgetEndRow = budgetStartRow + budgetRows.length;
  for (let row = budgetStartRow + 1; row <= budgetEndRow; row += 1) {
    worksheet.getCell(`B${row}`).numFmt = currencyFormat;
    worksheet.getCell(`C${row}`).numFmt = currencyFormat;
    worksheet.getCell(`D${row}`).numFmt = '0%';
  }

  worksheet.columns = [
    { width: 18 },
    { width: 18 },
    { width: 26 },
    { width: 22 },
    { width: 38 },
    { width: 20 },
  ];
  worksheet.autoFilter = { from: 'A8', to: `F${transactionEndRow}` };
  worksheet.headerFooter.oddFooter = '&LDuiTrack&CArsip keuangan pribadi&RHalaman &P dari &N';

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer as unknown as ArrayLike<number>);
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
      const bytes = await createExcelFile(report, transactions);
      downloadOnWeb(
        bytes,
        `${fileBase}.xlsx`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
    } else {
      await downloadPdfOnWeb(report, transactions, `${fileBase}.pdf`);
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
  const file = new File(Paths.cache, `${fileBase}.xlsx`);
  file.create({ overwrite: true });
  file.write(await createExcelFile(report, transactions));
  await Sharing.shareAsync(file.uri, {
    dialogTitle: 'Simpan laporan Excel DuiTrack',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    UTI: 'org.openxmlformats.spreadsheetml.sheet',
  });
}
