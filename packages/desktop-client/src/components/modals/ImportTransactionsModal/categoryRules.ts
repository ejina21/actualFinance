import type { SyncedPrefs } from '@actual-app/core/types/prefs';

export type ImportCategoryCondition = {
  field: 'payee' | 'notes' | 'account' | 'amount';
  op: 'is' | 'contains' | 'startsWith' | 'lessThan' | 'greaterThan';
  value: string;
};

export type ImportCategoryRule = {
  conditions: ImportCategoryCondition[];
  group: string;
  category: string;
};

export type ImportCategoryTransaction = {
  payee?: string | number | null;
  notes?: string | number | null;
  account?: string | number | null;
  amount?: number | null;
};

type Category = { id: string; name: string; group: string };
type Group = { id: string; name: string };

function normalize(value: string | number | null | undefined) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('ru');
}

function parseAmount(value: string) {
  return Number(value.replace(/\s/g, '').replace(',', '.'));
}

function isCondition(value: unknown): value is ImportCategoryCondition {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const condition = value as Partial<ImportCategoryCondition>;
  const isTextField = ['payee', 'notes', 'account'].includes(
    condition.field ?? '',
  );
  const isTextOp = ['is', 'contains', 'startsWith'].includes(
    condition.op ?? '',
  );
  const isAmountOp = ['is', 'lessThan', 'greaterThan'].includes(
    condition.op ?? '',
  );
  return (
    typeof condition.value === 'string' &&
    normalize(condition.value).length > 0 &&
    ((isTextField && isTextOp) ||
      (condition.field === 'amount' &&
        isAmountOp &&
        Number.isFinite(parseAmount(condition.value))))
  );
}

export function readCategoryRules(prefs: SyncedPrefs): ImportCategoryRule[] {
  try {
    const parsed: unknown = JSON.parse(prefs['csv-category-rules'] ?? '[]');
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap((value: unknown) => {
      if (!value || typeof value !== 'object') {
        return [];
      }
      const rule = value as Partial<ImportCategoryRule> & { payee?: unknown };
      if (typeof rule.group !== 'string' || typeof rule.category !== 'string') {
        return [];
      }
      if (Array.isArray(rule.conditions)) {
        if (
          rule.conditions.length === 0 ||
          !rule.conditions.every(isCondition)
        ) {
          return [];
        }
        return [
          {
            conditions: rule.conditions,
            group: rule.group,
            category: rule.category,
          },
        ];
      }
      if (typeof rule.payee === 'string' && normalize(rule.payee)) {
        return [
          {
            conditions: [
              { field: 'payee' as const, op: 'is' as const, value: rule.payee },
            ],
            group: rule.group,
            category: rule.category,
          },
        ];
      }
      return [];
    });
  } catch {
    return [];
  }
}

function matchesCondition(
  condition: ImportCategoryCondition,
  transaction: ImportCategoryTransaction,
) {
  if (condition.field === 'amount') {
    if (transaction.amount == null || !Number.isFinite(transaction.amount)) {
      return false;
    }
    const amount = Math.round(transaction.amount * 100);
    const expected = Math.round(parseAmount(condition.value) * 100);
    switch (condition.op) {
      case 'is':
        return amount === expected;
      case 'lessThan':
        return amount < expected;
      case 'greaterThan':
        return amount > expected;
      default:
        return false;
    }
  }

  const actual = normalize(transaction[condition.field]);
  const expected = normalize(condition.value);
  if (!actual) {
    return false;
  }
  switch (condition.op) {
    case 'is':
      return actual === expected;
    case 'contains':
      return actual.includes(expected);
    case 'startsWith':
      return actual.startsWith(expected);
    default:
      return false;
  }
}

export function findImportCategory(
  transaction: ImportCategoryTransaction,
  rules: readonly ImportCategoryRule[],
  categories: readonly Category[],
  groups: readonly Group[],
): string | null {
  for (const rule of rules) {
    if (
      !rule.conditions.every(condition =>
        matchesCondition(condition, transaction),
      )
    ) {
      continue;
    }
    const matchingCategories = categories.filter(
      category => normalize(category.name) === normalize(rule.category),
    );
    const group = groups.find(
      item => normalize(item.name) === normalize(rule.group),
    );
    const match = group
      ? matchingCategories.find(category => category.group === group.id)
      : matchingCategories.length === 1
        ? matchingCategories[0]
        : undefined;
    if (match) {
      return match.id;
    }
  }
  return null;
}
