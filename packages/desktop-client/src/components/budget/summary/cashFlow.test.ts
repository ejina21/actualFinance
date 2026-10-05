import type { CategoryGroupEntity } from '@actual-app/core/types/models';
import { describe, expect, it } from 'vitest';

import { monthlyAverage, summarizeCashFlow } from './cashFlow';
import type { SummaryTransaction } from './cashFlow';
import { resolveSummaryPeriod } from './period';

const period = resolveSummaryPeriod({ kind: 'month', month: '2026-09' });
const groups = [
  {
    id: 'income',
    name: 'Доходы',
    is_income: true,
    categories: [{ id: 'salary', name: 'Зарплата', group: 'income' }],
  },
  {
    id: 'food',
    name: 'Еда',
    categories: [{ id: 'groceries', name: 'Продукты', group: 'food' }],
  },
] satisfies CategoryGroupEntity[];

function transaction(
  id: string,
  amount: number,
  category: string | null,
  extra: Partial<SummaryTransaction> = {},
): SummaryTransaction {
  return {
    id,
    date: '2026-09-01',
    amount,
    category,
    account: 'checking',
    accountOffBudget: false,
    categoryIsIncome: category === 'salary',
    transferId: null,
    isParent: false,
    startingBalanceFlag: false,
    ...extra,
  };
}

describe('summarizeCashFlow', () => {
  it('shows loan movements separately from income and expenses', () => {
    const result = summarizeCashFlow(
      [
        transaction('salary', 10_000, 'salary'),
        transaction('food', -2_000, 'groceries'),
        transaction('borrowed', 35_000, 'borrowed'),
        transaction('repaid', -5_000, 'repaid'),
      ],
      [
        ...groups,
        {
          id: 'loans',
          name: 'ЗАЙМЫ',
          categories: [
            { id: 'borrowed', name: 'Я взял в долг', group: 'loans' },
            { id: 'repaid', name: 'Я вернул долг', group: 'loans' },
          ],
        },
      ],
      period,
    );

    expect(result.income).toBe(10_000);
    expect(result.expenses).toBe(2_000);
    expect(result.netFlow).toBe(8_000);
    expect(result.loanMovement).toBe(30_000);
    expect(result.loanTransactionCount).toBe(2);
    expect(result.loanGroups[0]?.total).toBe(30_000);
    expect(result.loanGroups[0]?.categories.map(row => row.total)).toEqual([
      35_000, -5_000,
    ]);
    expect(result.loanColumnTotals['2026-09-01']).toBe(30_000);
    expect(result.expenseGroups.map(group => group.name)).not.toContain(
      'ЗАЙМЫ',
    );
  });

  it('accounts for signed category amounts, refunds and income reversals', () => {
    const result = summarizeCashFlow(
      [
        transaction('salary', 100_000, 'salary'),
        transaction('salary-reversal', -10_000, 'salary'),
        transaction('food', -20_000, 'groceries'),
        transaction('refund', 5_000, 'groceries'),
      ],
      groups,
      period,
    );
    expect(result.income).toBe(90_000);
    expect(result.expenses).toBe(15_000);
    expect(result.netFlow).toBe(75_000);
    expect(result.incomeGroups[0]?.categories[0]?.total).toBe(90_000);
    expect(result.expenseGroups[0]?.categories[0]?.total).toBe(15_000);
    expect(result.columnTotals['2026-09-01']).toEqual({
      income: 90_000,
      expenses: 15_000,
    });
  });

  it('keeps uncategorized inflows and outflows visible', () => {
    const result = summarizeCashFlow(
      [transaction('in', 2_000, null), transaction('out', -7_500, null)],
      [],
      period,
    );
    expect(result.income).toBe(2_000);
    expect(result.expenses).toBe(7_500);
    expect(result.netFlow).toBe(-5_500);
    expect(result.uncategorizedIncome.total).toBe(2_000);
    expect(result.uncategorizedExpenses.total).toBe(7_500);
  });

  it('excludes internal transfers, off-budget activity, starting balances and split parents', () => {
    const result = summarizeCashFlow(
      [
        transaction('transfer', -50_000, null, { transferId: 'paired' }),
        transaction('off-budget', -8_000, 'groceries', {
          accountOffBudget: true,
        }),
        transaction('opening', 50_000, null, { startingBalanceFlag: true }),
        transaction('parent', -9_000, 'groceries', { isParent: true }),
        transaction('child-food', -6_000, 'groceries'),
        transaction('child-uncat', -3_000, null),
      ],
      groups,
      period,
    );
    expect(result.income).toBe(0);
    expect(result.expenses).toBe(9_000);
    expect(result.expenseGroups[0]?.total).toBe(6_000);
    expect(result.uncategorizedExpenses.total).toBe(3_000);
  });

  it('clips dates to the selected range and reconciles every column', () => {
    const selected = resolveSummaryPeriod({
      kind: 'range',
      startDate: '2026-09-15',
      endDate: '2026-10-03',
    });
    const result = summarizeCashFlow(
      [
        transaction('before', -1_000, 'groceries', { date: '2026-09-14' }),
        transaction('sep', -2_000, 'groceries', { date: '2026-09-15' }),
        transaction('oct', 4_000, null, { date: '2026-10-03' }),
        transaction('after', 5_000, null, { date: '2026-10-04' }),
      ],
      groups,
      selected,
    );
    expect(result.expenses).toBe(2_000);
    expect(result.income).toBe(4_000);
    expect(result.columnTotals['2026-09']).toEqual({
      income: 0,
      expenses: 2_000,
    });
    expect(result.columnTotals['2026-10']).toEqual({
      income: 4_000,
      expenses: 0,
    });
  });
});

describe('monthlyAverage', () => {
  it('divides the annual total by twelve including empty months and rounds to minor units', () => {
    expect(monthlyAverage(41_500)).toBe(3_458);
    expect(monthlyAverage(-41_500)).toBe(-3_458);
    expect(monthlyAverage(0)).toBe(0);
  });
});
