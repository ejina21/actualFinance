import type { SyncedPrefs } from '@actual-app/core/types/prefs';

export type ImportCategoryCondition = {
  field: 'payee' | 'notes' | 'account' | 'amount' | 'csv';
  column?: string;
  op: 'is' | 'contains' | 'startsWith' | 'lessThan' | 'greaterThan';
  value: string;
};

export type ImportCategoryRule = {
  conditions: ImportCategoryCondition[];
  bankId?: string;
  group: string;
  category: string;
};

export type ImportCategoryTransaction = {
  bankId?: string | null;
  columns?: Record<string, unknown>;
  payee?: string | number | null;
  notes?: string | number | null;
  account?: string | number | null;
  amount?: number | null;
};

type Category = { id: string; name: string; group: string };
type Group = { id: string; name: string };

export function detectCsvImportBankId(
  columns: Record<string, unknown>,
  savedBankId?: string | null,
): string | null {
  if (
    Object.hasOwn(columns, 'Описание') &&
    Object.hasOwn(columns, 'Имя счёта') &&
    Object.hasOwn(columns, 'Сумма операции')
  ) {
    return 'tbank';
  }
  return savedBankId || null;
}

function normalize(value: unknown) {
  return (
    typeof value === 'string' || typeof value === 'number' ? String(value) : ''
  )
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
  const isTextField = ['payee', 'notes', 'account', 'csv'].includes(
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
    (condition.field !== 'csv' ||
      (typeof condition.column === 'string' &&
        normalize(condition.column).length > 0)) &&
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
            ...(typeof rule.bankId === 'string' && rule.bankId
              ? { bankId: rule.bankId }
              : {}),
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
            ...(typeof rule.bankId === 'string' && rule.bankId
              ? { bankId: rule.bankId }
              : {}),
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
  bankId: string | null,
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

  const value =
    condition.field === 'csv'
      ? transaction.columns?.[condition.column ?? '']
      : condition.field === 'payee' &&
          bankId === 'tbank' &&
          transaction.columns?.['Описание'] != null
        ? transaction.columns['Описание']
        : transaction[condition.field];
  const actual = normalize(value);
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
  const bankId = transaction.columns
    ? detectCsvImportBankId(transaction.columns, transaction.bankId)
    : transaction.bankId;
  for (const rule of rules) {
    if (rule.bankId && rule.bankId !== bankId) {
      continue;
    }
    if (
      !rule.conditions.every(condition =>
        matchesCondition(condition, transaction, bankId ?? null),
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
