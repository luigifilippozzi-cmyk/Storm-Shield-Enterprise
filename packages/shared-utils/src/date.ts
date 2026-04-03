export function getCurrentFiscalPeriod(
  fiscalYearStartMonth: number = 1,
  date: Date = new Date(),
): { year: number; month: number; periodName: string } {
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  const fiscalYear = month >= fiscalYearStartMonth ? year : year - 1;
  const periodMonth =
    ((month - fiscalYearStartMonth + 12) % 12) + 1;

  return {
    year: fiscalYear,
    month: periodMonth,
    periodName: `FY${fiscalYear}-P${periodMonth.toString().padStart(2, '0')}`,
  };
}

export function getMonthRange(
  year: number,
  month: number,
): { start: string; end: string } {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export function toUTCDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}
