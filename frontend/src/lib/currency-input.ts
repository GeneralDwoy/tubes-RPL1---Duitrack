const MAX_CURRENCY_DIGITS = 14;

export function getCurrencyDigits(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, MAX_CURRENCY_DIGITS);
  return digits.replace(/^0+(?=\d)/, '');
}

export function formatCurrencyInput(value: string) {
  const digits = getCurrencyDigits(value);
  if (!digits) return '';

  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(digits));
}

export function parseCurrencyInput(value: string) {
  const digits = getCurrencyDigits(value);
  return digits ? Number(digits) : 0;
}
