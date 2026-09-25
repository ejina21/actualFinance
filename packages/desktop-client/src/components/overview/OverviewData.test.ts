import { describe, expect, it } from 'vitest';

import { buildRecentActivity, getBudgetProgress } from './OverviewData';

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
