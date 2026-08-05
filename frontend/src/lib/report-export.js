import { formatCurrency } from '@/lib/finance';

function formatPeriod(period) {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
    new Date(`${period}T00:00:00`),
  );
}

function formatDate(date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function downloadOnWeb(content, fileName, mimeType) {
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

function formatExportCurrency(value) {
  return `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value)}`;
}

async function downloadPdfOnWeb(report, transactions, fileName) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableModule.default ?? autoTableModule.autoTable;
  const doc = new jsPDF({ format: 'a4', orientation: 'landscape', unit: 'mm' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const summaryItems = [
    ['Total pemasukan', report.summary.income],
    ['Total pengeluaran', report.summary.expense],
    ['Sisa saldo', report.summary.balance],
  ];

  doc.setProperties({
    author: 'DuiTrack',
    subject: `Laporan keuangan ${formatPeriod(report.period)}`,
    title: `Laporan DuiTrack ${formatPeriod(report.period)}`,
  });
  doc.setTextColor(8, 123, 104);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('DuiTrack', 14, 16);
  doc.setTextColor(100, 119, 115);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Laporan keuangan pribadi - ${formatPeriod(report.period)}`, 14, 22);
  doc.setDrawColor(8, 123, 104);
  doc.setLineWidth(0.8);
  doc.line(14, 26, pageWidth - 14, 26);

  summaryItems.forEach(([label, value], index) => {
    const boxWidth = (pageWidth - 36) / 3;
    const x = 14 + index * (boxWidth + 4);
    doc.setFillColor(238, 243, 240);
    doc.setDrawColor(216, 226, 222);
    doc.roundedRect(x, 31, boxWidth, 20, 1.5, 1.5, 'FD');
    doc.setTextColor(100, 119, 115);
    doc.setFontSize(8);
    doc.text(label, x + 4, 38);
    doc.setTextColor(23, 43, 40);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(formatExportCurrency(value), x + 4, 46);
    doc.setFont('helvetica', 'normal');
  });

  autoTable(doc, {
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

  const transactionEnd = doc.lastAutoTable?.finalY ?? 59;
  autoTable(doc, {
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

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(7);
    doc.setTextColor(100, 119, 115);
    doc.text(`DuiTrack | Halaman ${page} dari ${pageCount}`, pageWidth - 14, 200, {
      align: 'right',
    });
  }
  const pdfBuffer = doc.output('arraybuffer');
  downloadOnWeb(new Uint8Array(pdfBuffer), fileName, 'application/pdf');
}

async function createExcelFile(report, transactions) {
  const excelModule = await import('exceljs');
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
  return new Uint8Array(buffer);
}

export async function exportMonthlyReport(report, transactions, format) {
  const fileBase = `DuiTrack-${report.period.slice(0, 7)}`;

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
}
