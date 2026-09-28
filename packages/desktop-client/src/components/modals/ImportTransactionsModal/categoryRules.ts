import type { SyncedPrefs } from '@actual-app/core/types/prefs';

export type ImportCategoryRule = {
  payee: string;
  group: string;
  category: string;
};

type Category = { id: string; name: string; group: string };
type Group = { id: string; name: string };

function normalize(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru');
}

export function parseCategoryRuleTable(table: string): ImportCategoryRule[] {
  const rules: ImportCategoryRule[] = [];
  for (const line of table.split(/\r?\n/)) {
    if (!line.includes('|')) {
      continue;
    }
    const cells = line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(cell => cell.trim());
    if (cells.length < 3 || cells.every(cell => /^:?-{3,}:?$/.test(cell))) {
      continue;
    }
    const [payee, group, category] =
      cells.length >= 4
        ? [cells[0], cells[2], cells[3]]
        : [cells[0], cells[1], cells[2]];
    if (payee && category) {
      rules.push({ payee, group, category });
    }
  }
  return rules;
}

export function readCategoryRules(prefs: SyncedPrefs): ImportCategoryRule[] {
  try {
    const parsed: unknown = JSON.parse(prefs['csv-category-rules'] ?? '[]');
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (rule): rule is ImportCategoryRule =>
        rule &&
        typeof rule.payee === 'string' &&
        typeof rule.group === 'string' &&
        typeof rule.category === 'string',
    );
  } catch {
    return [];
  }
}

export function findImportCategory(
  payee: string,
  rules: readonly ImportCategoryRule[],
  categories: readonly Category[],
  groups: readonly Group[],
): string | null {
  const rule = rules.find(item => normalize(item.payee) === normalize(payee));
  if (!rule) {
    return null;
  }

  const matchingCategories = categories.filter(
    category => normalize(category.name) === normalize(rule.category),
  );
  const group = groups.find(
    item => normalize(item.name) === normalize(rule.group),
  );
  if (group) {
    return (
      matchingCategories.find(category => category.group === group.id)?.id ??
      null
    );
  }
  return matchingCategories.length === 1 ? matchingCategories[0].id : null;
}
