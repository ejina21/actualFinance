import type { CategoryGroupEntity } from '@actual-app/core/types/models';

import type { ResolvedSummaryPeriod } from './period';

export type SummaryTransaction = {
  id: string;
  date: string;
  amount: number;
  category: string | null;
  account: string;
  accountOffBudget: boolean;
  categoryIsIncome: boolean;
  transferId: string | null;
  isParent: boolean;
  startingBalanceFlag: boolean;
};

export type CashFlowRow = {
  id: string;
  name: string;
  total: number;
  values: Record<string, number>;
};

export type CashFlowGroup = CashFlowRow & { categories: CashFlowRow[] };

export type CashFlowSummary = {
  income: number;
  expenses: number;
  netFlow: number;
  columnTotals: Record<string, { income: number; expenses: number }>;
  incomeGroups: CashFlowGroup[];
  expenseGroups: CashFlowGroup[];
  uncategorizedIncome: CashFlowRow;
  uncategorizedExpenses: CashFlowRow;
};

export function monthlyAverage(annualTotal: number): number {
  return Math.sign(annualTotal) * Math.round(Math.abs(annualTotal) / 12);
}

export function summarizeCashFlow(
  rows: readonly SummaryTransaction[],
  groups: readonly CategoryGroupEntity[],
  period: ResolvedSummaryPeriod,
): CashFlowSummary {
  function values(): Record<string, number> {
    return Object.fromEntries(period.columns.map(column => [column.key, 0]));
  }

  function row(id: string, name: string): CashFlowRow {
    return { id, name, total: 0, values: values() };
  }

  const incomeGroups: CashFlowGroup[] = [];
  const expenseGroups: CashFlowGroup[] = [];
  const categoryLookup = new Map<
    string,
    { group: CashFlowGroup; category: CashFlowRow; kind: 'income' | 'expenses' }
  >();
  for (const sourceGroup of groups) {
    if (sourceGroup.tombstone) {
      continue;
    }
    const group: CashFlowGroup = {
      ...row(sourceGroup.id, sourceGroup.name),
      categories: [],
    };
    const kind = sourceGroup.is_income ? 'income' : 'expenses';
    for (const sourceCategory of sourceGroup.categories ?? []) {
      if (sourceCategory.tombstone) {
        continue;
      }
      const category = row(sourceCategory.id, sourceCategory.name);
      group.categories.push(category);
      categoryLookup.set(category.id, { group, category, kind });
    }
    if (kind === 'income') {
      incomeGroups.push(group);
    } else {
      expenseGroups.push(group);
    }
  }

  const uncategorizedIncome = row('uncategorized-income', '');
  const uncategorizedExpenses = row('uncategorized-expenses', '');
  const columnTotals = Object.fromEntries(
    period.columns.map(column => [column.key, { income: 0, expenses: 0 }]),
  ) satisfies CashFlowSummary['columnTotals'];
  const hasDailyColumns = period.columns[0]?.key.length === 10;
  let income = 0;
  let expenses = 0;

  for (const transaction of rows) {
    if (
      transaction.date < period.startDate ||
      transaction.date > period.endDate ||
      transaction.transferId ||
      transaction.accountOffBudget ||
      transaction.startingBalanceFlag ||
      transaction.isParent
    ) {
      continue;
    }
    const key = hasDailyColumns
      ? transaction.date
      : transaction.date.slice(0, 7);
    const column = columnTotals[key];
    if (!column) {
      continue;
    }

    const found = transaction.category
      ? categoryLookup.get(transaction.category)
      : undefined;
    const kind =
      found?.kind ??
      (transaction.categoryIsIncome || transaction.amount >= 0
        ? 'income'
        : 'expenses');
    const value = kind === 'income' ? transaction.amount : -transaction.amount;
    const target =
      found?.category ??
      (kind === 'income' ? uncategorizedIncome : uncategorizedExpenses);
    target.total += value;
    target.values[key] += value;
    if (found) {
      found.group.total += value;
      found.group.values[key] += value;
    }
    column[kind] += value;
    if (kind === 'income') {
      income += value;
    } else {
      expenses += value;
    }
  }

  return {
    income,
    expenses,
    netFlow: income - expenses,
    columnTotals,
    incomeGroups,
    expenseGroups,
    uncategorizedIncome,
    uncategorizedExpenses,
  };
}
