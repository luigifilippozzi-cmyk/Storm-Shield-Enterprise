/**
 * Safe decimal math for monetary values.
 * All money values are stored/transported as strings (DECIMAL(14,2)).
 * These helpers avoid floating-point rounding errors.
 */

export function toMinorUnits(amount: string): number {
  const [whole = '0', frac = '0'] = amount.split('.');
  const paddedFrac = frac.padEnd(2, '0').slice(0, 2);
  return parseInt(whole, 10) * 100 + parseInt(paddedFrac, 10);
}

export function fromMinorUnits(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = (abs % 100).toString().padStart(2, '0');
  return `${negative ? '-' : ''}${whole}.${frac}`;
}

export function addMoney(a: string, b: string): string {
  return fromMinorUnits(toMinorUnits(a) + toMinorUnits(b));
}

export function subtractMoney(a: string, b: string): string {
  return fromMinorUnits(toMinorUnits(a) - toMinorUnits(b));
}

export function multiplyMoney(amount: string, factor: number): string {
  return fromMinorUnits(Math.round(toMinorUnits(amount) * factor));
}

export function formatUSD(amount: string): string {
  const num = parseFloat(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}
