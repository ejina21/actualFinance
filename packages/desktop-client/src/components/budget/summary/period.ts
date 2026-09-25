export type SummaryPeriod =
  | { kind: 'month'; month: string }
  | { kind: 'year'; year: number }
  | { kind: 'range'; startDate: string; endDate: string };

export type SummaryColumn = {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
};

export type ResolvedSummaryPeriod = {
  startDate: string;
  endDate: string;
  columns: SummaryColumn[];
};

export class SummaryPeriodError extends Error {
  constructor(public readonly code: 'invalid-date' | 'invalid-range') {
    super(code);
    this.name = 'SummaryPeriodError';
  }
}

function parseDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new SummaryPeriodError('invalid-date');
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new SummaryPeriodError('invalid-date');
  }
  return date;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function endOfMonth(year: number, month: number): string {
  const date = new Date(0);
  date.setUTCFullYear(year, month, 0);
  return isoDate(date);
}

function monthlyColumns(startDate: string, endDate: string): SummaryColumn[] {
  const columns: SummaryColumn[] = [];
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  let year = start.getUTCFullYear();
  let month = start.getUTCMonth() + 1;
  const lastYear = end.getUTCFullYear();
  const lastMonth = end.getUTCMonth() + 1;
  while (year < lastYear || (year === lastYear && month <= lastMonth)) {
    const key = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
    columns.push({
      key,
      label: key,
      startDate: startDate > `${key}-01` ? startDate : `${key}-01`,
      endDate:
        endDate < endOfMonth(year, month) ? endDate : endOfMonth(year, month),
    });
    if (month === 12) {
      year += 1;
      month = 1;
    } else {
      month += 1;
    }
  }
  return columns;
}

export function resolveSummaryPeriod(
  period: SummaryPeriod,
): ResolvedSummaryPeriod {
  if (period.kind === 'month') {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period.month)) {
      throw new SummaryPeriodError('invalid-date');
    }
    const startDate = `${period.month}-01`;
    const start = parseDate(startDate);
    const endDate = endOfMonth(start.getUTCFullYear(), start.getUTCMonth() + 1);
    const columns: SummaryColumn[] = [];
    for (let day = 1; day <= Number(endDate.slice(-2)); day += 1) {
      const date = `${period.month}-${String(day).padStart(2, '0')}`;
      columns.push({
        key: date,
        label: String(day),
        startDate: date,
        endDate: date,
      });
    }
    return { startDate, endDate, columns };
  }

  if (period.kind === 'year') {
    if (
      !Number.isInteger(period.year) ||
      period.year < 1 ||
      period.year > 9999
    ) {
      throw new SummaryPeriodError('invalid-date');
    }
    const year = String(period.year).padStart(4, '0');
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    return { startDate, endDate, columns: monthlyColumns(startDate, endDate) };
  }

  parseDate(period.startDate);
  parseDate(period.endDate);
  if (period.startDate > period.endDate) {
    throw new SummaryPeriodError('invalid-range');
  }
  return {
    startDate: period.startDate,
    endDate: period.endDate,
    columns: monthlyColumns(period.startDate, period.endDate),
  };
}
