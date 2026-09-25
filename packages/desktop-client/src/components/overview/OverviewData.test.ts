import { describe, expect, it } from 'vitest';

import { summarizeCashFlow } from '#components/budget/summary/cashFlow';
import type { SummaryTransaction } from '#components/budget/summary/cashFlow';
import { resolveSummaryPeriod } from '#components/budget/summary/period';

import {
  buildMonthlyTrend,
  buildRecentActivity,
  getBudgetProgress,
} from './OverviewData';

function trendTransaction(
  id: string,
  date: string,
  amount: number,
  extra: Partial<SummaryTransaction> = {},
): SummaryTransaction {
  return {
    id,
    date,
    amount,
    category: null,
    account: 'checking',
    accountOffBudget: false,
    categoryIsIncome: false,
    transferId: null,
    isParent: false,
    startingBalanceFlag: false,
    ...extra,
  };
}

describe('buildMonthlyTrend', () => {
  it('keeps zero months and signed refunds while excluding transfers', () => {
    const summary = summarizeCashFlow(
      [
        trendTransaction('income', '2026-01-01', 10_000),
        trendTransaction('expense', '2026-01-02', -2_000),
        trendTransaction('refund', '2026-01-03', 500, { category: 'food' }),
        trendTransaction('transfer', '2026-02-01', -5_000, {
          transferId: 'paired',
        }),
        trendTransaction('march', '2026-03-01', -4_000),
      ],
      [
        {
          id: 'food-group',
          name: 'Food',
          categories: [{ id: 'food', name: 'Food', group: 'food-group' }],
        },
      ],
      resolveSummaryPeriod({ kind: 'year', year: 2026 }),
    );
    expect(buildMonthlyTrend(summary).slice(0, 3)).toEqual([
      { month: '2026-01', inflow: 10_000, outflow: 1_500 },
      { month: '2026-02', inflow: 0, outflow: 0 },
      { month: '2026-03', inflow: 0, outflow: 4_000 },
    ]);
  });

  it('returns twelve zero points when there are no transactions', () => {
    const summary = summarizeCashFlow(
      [],
      [],
      resolveSummaryPeriod({ kind: 'year', year: 2026 }),
    );
    expect(buildMonthlyTrend(summary)).toHaveLength(12);
    expect(
      buildMonthlyTrend(summary).every(
        point => point.inflow === 0 && point.outflow === 0,
      ),
    ).toBe(true);
  });
});

describe('buildRecentActivity', () => {
  it('handles empty data and preserves uncategorized operations', () => {
    expect(buildRecentActivity([], [])).toEqual([]);

    expect(
      buildRecentActivity(
        [
          {
            id: 'expense',
            account: 'checking',
            date: '2026-09-25',
            amount: -1200,
          },
        ],
        [],
      ),
    ).toEqual([
      expect.objectContaining({
        id: 'expense',
        categoryId: null,
        isExpense: true,
        isTransfer: false,
      }),
    ]);
  });

  it('marks a transfer as a transfer rather than an expense', () => {
    const [activity] = buildRecentActivity(
      [
        {
          id: 'transfer',
          account: 'checking',
          date: '2026-09-25',
          amount: -30000,
          payee: 'savings-transfer',
        },
      ],
      [{ id: 'savings-transfer', name: 'Savings', transfer_acct: 'savings' }],
    );

    expect(activity).toMatchObject({
      isExpense: false,
      isTransfer: true,
      payeeName: 'Savings',
    });
  });

  it('shows an imported payee when no payee entity is assigned', () => {
    const [activity] = buildRecentActivity(
      [
        {
          id: 'imported',
          account: 'checking',
          date: '2026-09-25',
          amount: -1200,
          imported_payee: 'Grocery store',
        },
      ],
      [],
    );

    expect(activity.payeeName).toBe('Grocery store');
  });

  it('shows transaction notes when the payee fields are empty', () => {
    const [activity] = buildRecentActivity(
      [
        {
          id: 'noted',
          account: 'checking',
          date: '2026-09-25',
          amount: -1200,
          notes: 'Grocery delivery',
        },
      ],
      [],
    );

    expect(activity.payeeName).toBe('Grocery delivery');
  });
});

describe('getBudgetProgress', () => {
  it('preserves empty, zero, and over-budget states', () => {
    expect(getBudgetProgress(null, null)).toEqual({
      fraction: 0,
      hasBudget: false,
      isOverspent: false,
    });
    expect(getBudgetProgress(0, 0).fraction).toBe(0);
    expect(getBudgetProgress(-15000, 10000)).toEqual({
      fraction: 1,
      hasBudget: true,
      isOverspent: true,
    });
  });
});
