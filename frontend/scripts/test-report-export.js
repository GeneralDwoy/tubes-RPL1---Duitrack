import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTableModule from 'jspdf-autotable';

const autoTable = autoTableModule.default ?? autoTableModule;

async function main() {
  const pdf = new jsPDF({ format: 'a4', orientation: 'landscape', unit: 'mm' });
  pdf.text('DuiTrack - Laporan Keuangan', 14, 16);
  autoTable(pdf, {
    body: [['19/07/2026', 'Pemasukan', 'Gaji', 'Rp 5.000.000']],
    head: [['Tanggal', 'Jenis', 'Kategori', 'Nominal']],
  });
  const pdfBytes = new Uint8Array(pdf.output('arraybuffer'));
  assert.ok(pdfBytes.length > 1000, 'PDF tidak berhasil dibentuk');
  assert.equal(String.fromCharCode(...pdfBytes.slice(0, 4)), '%PDF');

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Laporan Bulanan');
  sheet.addTable({
    columns: [{ name: 'Tanggal' }, { name: 'Jenis' }, { name: 'Nominal' }],
    name: 'DaftarTransaksi',
    ref: 'A1',
    rows: [['19/07/2026', 'Pemasukan', 5000000]],
    style: { showRowStripes: true, theme: 'TableStyleMedium4' },
  });
  const excelBytes = await workbook.xlsx.writeBuffer();
  assert.ok(excelBytes.byteLength > 1000, 'Excel tidak berhasil dibentuk');

  console.log(`Ekspor valid: PDF ${pdfBytes.length} byte, Excel ${excelBytes.byteLength} byte.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
