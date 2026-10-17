import { describe, expect, it } from 'vitest';

import { buildInstallmentPlan } from './installmentPlan';

const dates = {
  firstPaymentDate: '2026-11-10',
  lastPaymentDate: '2027-02-10',
};

describe('buildInstallmentPlan', () => {
  it('splits the opening debt equally across payment months', () => {
    const plan = buildInstallmentPlan(
      dates,
      [{ date: '2026-10-17', amount: -40_000, startingBalanceFlag: true }],
      '2026-10-20',
    );

    expect(plan.rows.map(row => row.target)).toEqual([
      10_000, 10_000, 10_000, 10_000,
    ]);
    expect(plan.currentDebt).toBe(40_000);
  });

  it('redistributes a partial payment across the remaining months', () => {
    const plan = buildInstallmentPlan(
      dates,
      [
        { date: '2026-10-17', amount: -40_000, startingBalanceFlag: true },
        { date: '2026-11-12', amount: 2_500 },
      ],
      '2026-11-15',
    );

    expect(plan.rows.map(row => row.target)).toEqual([
      10_000, 12_500, 12_500, 12_500,
    ]);
    expect(plan.rows[0]?.paid).toBe(2_500);
    expect(plan.rows[0]?.closingDebt).toBe(37_500);
    expect(plan.currentDebt).toBe(37_500);
  });

  it('reduces later targets after an overpayment', () => {
    const plan = buildInstallmentPlan(
      dates,
      [
        { date: '2026-10-17', amount: -40_000, startingBalanceFlag: true },
        { date: '2026-11-12', amount: 15_000 },
      ],
      '2026-11-30',
    );

    expect(plan.rows.map(row => row.target)).toEqual([
      10_000, 8_334, 8_333, 8_333,
    ]);
  });

  it('ends the plan after early repayment', () => {
    const plan = buildInstallmentPlan(
      dates,
      [
        { date: '2026-10-17', amount: -40_000, startingBalanceFlag: true },
        { date: '2026-11-12', amount: 40_000 },
      ],
      '2026-11-15',
    );

    expect(plan.rows.map(row => row.target)).toEqual([10_000, 0, 0, 0]);
    expect(plan.currentDebt).toBe(0);
  });

  it('assigns the last kopeks exactly', () => {
    const plan = buildInstallmentPlan(
      { firstPaymentDate: '2026-11-10', lastPaymentDate: '2027-01-10' },
      [{ date: '2026-10-17', amount: -10, startingBalanceFlag: true }],
      '2026-10-20',
    );

    expect(plan.rows.map(row => row.target)).toEqual([4, 3, 3]);
  });

  it('shows overdue debt after the final month', () => {
    const plan = buildInstallmentPlan(
      dates,
      [
        { date: '2026-10-17', amount: -40_000, startingBalanceFlag: true },
        { date: '2026-11-12', amount: 2_500 },
      ],
      '2027-03-01',
    );

    expect(plan.rows).toHaveLength(4);
    expect(plan.currentDebt).toBe(37_500);
    expect(plan.overdueDebt).toBe(37_500);
  });
});
