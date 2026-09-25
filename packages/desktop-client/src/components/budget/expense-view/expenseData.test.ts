import { describe, expect, it } from 'vitest';

import { buildExpenseSummary } from './expenseData';

const groups = [
  {
    id: 'food',
    name: 'Основные расходы',
    categories: [
      { id: 'groceries', name: 'Продукты', group: 'food' },
      { id: 'restaurants', name: 'Рестораны', group: 'food' },
    ],
  },
  {
    id: 'income',
    name: 'Доходы',
    is_income: true,
    categories: [{ id: 'salary', name: 'Зарплата', group: 'income' }],
  },
  {
    id: 'transfers',
    name: 'ПЕРЕВОДЫ',
    categories: [{ id: 'loose-transfer', name: 'Перевод', group: 'transfers' }],
  },
  {
    id: 'loans',
    name: 'ЗАЙМЫ',
    categories: [{ id: 'loan', name: 'Дал в долг', group: 'loans' }],
  },
];

describe('buildExpenseSummary', () => {
  it('nets refunds and excludes transfers, income and off-budget activity', () => {
    const summary = buildExpenseSummary(
      [
        { date: '2026-09-02', amount: -20000, category: 'groceries' },
        { date: '2026-09-02', amount: 5000, category: 'groceries' },
        { date: '2026-09-03', amount: -3000, category: 'restaurants' },
        {
          date: '2026-09-03',
          amount: -50000,
          category: null,
          transferId: 'paired-transfer',
        },
        {
          date: '2026-09-03',
          amount: -7000,
          category: 'groceries',
          accountOffBudget: true,
        },
        { date: '2026-09-03', amount: 90000, category: 'salary' },
        { date: '2026-09-03', amount: -40000, category: 'loose-transfer' },
        { date: '2026-09-03', amount: -10000, category: 'loan' },
        { date: '2026-09-03', amount: -1200, category: null },
      ],
      groups,
      'month',
      '2026-09',
    );

    expect(summary.total).toBe(19200);
    expect(summary.columns).toHaveLength(30);
    expect(summary.groups[0]).toMatchObject({
      id: 'food',
      total: 18000,
      values: { '2026-09-02': 15000, '2026-09-03': 3000 },
    });
    expect(summary.groups[0].categories[0]).toMatchObject({
      id: 'groceries',
      total: 15000,
    });
    expect(summary.uncategorized).toMatchObject({
      total: 1200,
      values: { '2026-09-03': 1200 },
    });
    expect(summary.groups).toHaveLength(1);
  });

  it('builds all day columns in leap-year February and leaves empty days at zero', () => {
    const summary = buildExpenseSummary([], groups, 'month', '2028-02');

    expect(summary.columns).toHaveLength(29);
    expect(summary.columns[0].key).toBe('2028-02-01');
    expect(summary.columns[28].key).toBe('2028-02-29');
    expect(summary.total).toBe(0);
    expect(summary.groups[0].values['2028-02-01']).toBe(0);
  });

  it('builds annual monthly totals from expense categories', () => {
    const summary = buildExpenseSummary(
      [
        { date: '2026-01-04', amount: -10000, category: 'groceries' },
        { date: '2026-09-25', amount: -2500, category: 'restaurants' },
        { date: '2025-12-31', amount: -5000, category: 'groceries' },
      ],
      groups,
      'year',
      '2026',
    );

    expect(summary.columns).toHaveLength(12);
    expect(summary.total).toBe(12500);
    expect(summary.groups[0].values['2026-01']).toBe(10000);
    expect(summary.groups[0].values['2026-09']).toBe(2500);
    expect(summary.groups[0].values['2026-12']).toBe(0);
  });
});
