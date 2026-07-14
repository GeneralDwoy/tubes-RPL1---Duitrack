declare module 'exceljs/dist/exceljs.min.js' {
  export * from 'exceljs';

  const ExcelJS: typeof import('exceljs');
  export default ExcelJS;
}
