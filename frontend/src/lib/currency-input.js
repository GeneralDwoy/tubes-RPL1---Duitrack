export function formatCurrencyInput(value) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const number = Number.parseInt(digits, 10);
  return new Intl.NumberFormat('id-ID').format(number);
}

export function parseCurrencyInput(value) {
  const digits = value.replace(/\D/g, '');
  return digits ? Number.parseInt(digits, 10) : 0;
}
