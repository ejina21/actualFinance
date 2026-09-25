import { describe, expect, it } from 'vitest';

import { resolveSummaryPeriod, SummaryPeriodError } from './period';

describe('resolveSummaryPeriod', () => {
  it('includes leap day in a February month', () => {
    const result = resolveSummaryPeriod({ kind: 'month', month: '2028-02' });
    expect(result.startDate).toBe('2028-02-01');
    expect(result.endDate).toBe('2028-02-29');
    expect(result.columns).toHaveLength(29);
    expect(result.columns[28]).toEqual({
      key: '2028-02-29',
      label: '29',
      startDate: '2028-02-29',
      endDate: '2028-02-29',
    });
  });

  it('keeps all twelve months, including empty ones', () => {
    const result = resolveSummaryPeriod({ kind: 'year', year: 2026 });
    expect(result.columns).toHaveLength(12);
    expect(result.columns[0]).toEqual({
      key: '2026-01',
      label: '2026-01',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });
    expect(result.columns[11]?.endDate).toBe('2026-12-31');
  });

  it('keeps early four-digit years rather than rolling them into the 1900s', () => {
    const result = resolveSummaryPeriod({ kind: 'year', year: 1 });
    expect(result.columns[1]?.endDate).toBe('0001-02-28');
  });

  it('clips the first and last monthly columns to a custom range', () => {
    const result = resolveSummaryPeriod({
      kind: 'range',
      startDate: '2026-01-15',
      endDate: '2026-03-03',
    });
    expect(
      result.columns.map(({ startDate, endDate }) => [startDate, endDate]),
    ).toEqual([
      ['2026-01-15', '2026-01-31'],
      ['2026-02-01', '2026-02-28'],
      ['2026-03-01', '2026-03-03'],
    ]);
  });

  it.each([
    { kind: 'month' as const, month: '2026-13' },
    { kind: 'month' as const, month: '2026-1' },
    { kind: 'range' as const, startDate: '2026-02-30', endDate: '2026-03-03' },
    { kind: 'range' as const, startDate: '2026-03-04', endDate: '2026-03-03' },
  ])('rejects invalid period %#', period => {
    expect(() => resolveSummaryPeriod(period)).toThrow(SummaryPeriodError);
  });
});
