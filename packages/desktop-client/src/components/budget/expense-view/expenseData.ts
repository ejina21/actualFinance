import type { CategoryGroupEntity } from '@actual-app/core/types/models';

const nonExpenseGroupNames = new Set(['ЗАЙМЫ', 'ПЕРЕВОДЫ']);

export type ExpensePeriod = 'month' | 'year';

export type ExpenseTransaction = {
  date: string;
  amount: number;
  category: string | null;
  transferId?: string | null;
  accountOffBudget?: boolean | null;
  categoryIsIncome?: boolean | null;
};

export type ExpenseRow = {
  id: string;
  name: string;
  total: number;
  values: Record<string, number>;
};

export type ExpenseGroup = ExpenseRow & { categories: ExpenseRow[] };

export type ExpenseSummary = {
  columns: Array<{ key: string; label: string }>;
  total: number;
  groups: ExpenseGroup[];
  uncategorized: ExpenseRow;
};

export function buildExpenseSummary(
  transactions: readonly ExpenseTransaction[],
  categoryGroups: readonly CategoryGroupEntity[],
  period: ExpensePeriod,
  anchor: string,
): ExpenseSummary {
  const columns =
    period === 'month'
      ? Array.from(
          {
            length: new Date(
              Number(anchor.slice(0, 4)),
              Number(anchor.slice(5, 7)),
              0,
            ).getDate(),
          },
          (_, index) => ({
            key: `${anchor}-${String(index + 1).padStart(2, '0')}`,
            label: String(index + 1),
          }),
        )
      : Array.from({ length: 12 }, (_, index) => ({
          key: `${anchor}-${String(index + 1).padStart(2, '0')}`,
          label: String(index + 1),
        }));

  function makeValues(): Record<string, number> {
    return Object.fromEntries(columns.map(column => [column.key, 0]));
  }

  const groups: ExpenseGroup[] = [];
  const excludedCategoryIds = new Set<string>();
  const categoriesById = new Map<
    string,
    { category: ExpenseRow; group: ExpenseGroup }
  >();

  for (const sourceGroup of categoryGroups) {
    if (
      sourceGroup.is_income ||
      sourceGroup.tombstone ||
      nonExpenseGroupNames.has(
        sourceGroup.name.trim().toLocaleUpperCase('ru-RU'),
      )
    ) {
      for (const category of sourceGroup.categories ?? []) {
        excludedCategoryIds.add(category.id);
      }
      continue;
    }

    const group: ExpenseGroup = {
      id: sourceGroup.id,
      name: sourceGroup.name,
      total: 0,
      values: makeValues(),
      categories: [],
    };
    for (const sourceCategory of sourceGroup.categories ?? []) {
      if (sourceCategory.is_income || sourceCategory.tombstone) {
        excludedCategoryIds.add(sourceCategory.id);
        continue;
      }
      const category: ExpenseRow = {
        id: sourceCategory.id,
        name: sourceCategory.name,
        total: 0,
        values: makeValues(),
      };
      group.categories.push(category);
      categoriesById.set(category.id, { category, group });
    }
    groups.push(group);
  }

  const uncategorized: ExpenseRow = {
    id: 'uncategorized',
    name: '',
    total: 0,
    values: makeValues(),
  };
  let total = 0;

  for (const transaction of transactions) {
    if (
      transaction.transferId ||
      transaction.accountOffBudget ||
      transaction.categoryIsIncome ||
      (transaction.category !== null &&
        excludedCategoryIds.has(transaction.category))
    ) {
      continue;
    }
    const key =
      period === 'month' ? transaction.date : transaction.date.slice(0, 7);
    if (!(key in uncategorized.values)) {
      continue;
    }

    const target = transaction.category
      ? categoriesById.get(transaction.category)
      : undefined;
    if (!target && transaction.amount >= 0) {
      continue;
    }

    const spent = -transaction.amount;
    total += spent;
    if (target) {
      target.category.total += spent;
      target.category.values[key] += spent;
      target.group.total += spent;
      target.group.values[key] += spent;
    } else {
      uncategorized.total += spent;
      uncategorized.values[key] += spent;
    }
  }

  return {
    columns,
    total,
    groups,
    uncategorized,
  };
}
