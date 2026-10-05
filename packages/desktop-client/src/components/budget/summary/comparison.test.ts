import { describe, expect, it } from 'vitest';

import { addComparisonMonth, compareMonthValues } from './comparison';

describe('compareMonthValues', () => {
  it.each([
    [4_000, 3_000, { absolute: -1_000, percent: -25 }],
    [-4_000, -3_000, { absolute: 1_000, percent: 25 }],
    [4_000, 4_000, { absolute: 0, percent: 0 }],
    [0, 2_000, { absolute: 2_000, percent: null }],
  ])('compares %i with %i', (base, current, expected) => {
    expect(compareMonthValues(base, current)).toEqual(expected);
  });

  it('calculates a fractional increase', () => {
    expect(compareMonthValues(3_000, 4_000).absolute).toBe(1_000);
    expect(compareMonthValues(3_000, 4_000).percent).toBeCloseTo(33.3333, 3);
  });
});

describe('addComparisonMonth', () => {
  it('does not add the base month or a duplicate', () => {
    expect(addComparisonMonth('2026-09', ['2026-08'], '2026-09')).toEqual([
      '2026-08',
    ]);
    expect(addComparisonMonth('2026-09', ['2026-08'], '2026-08')).toEqual([
      '2026-08',
    ]);
    expect(addComparisonMonth('2026-09', ['2026-08'], '2026-07')).toEqual([
      '2026-08',
      '2026-07',
    ]);
  });
});
