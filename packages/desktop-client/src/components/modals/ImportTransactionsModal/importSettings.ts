import type { SyncedPrefs } from '@actual-app/core/types/prefs';

import type { DateFormat, FieldMapping } from './utils';
import { isDateFormat } from './utils';

export type CsvImportProfile = {
  columns: string[];
  mappings: FieldMapping;
  dateFormat: DateFormat;
  delimiter: string;
  encoding: string;
  hasHeaderRow: boolean;
  skipStartLines: number;
  skipEndLines: number;
  inOutMode: boolean;
  outValue: string;
  flipAmount: boolean;
  multiplierAmount: string;
  importNotes: boolean;
  autoExcludePairs: boolean;
  clearOnImport: boolean;
  reconcile: boolean;
  reimportDeleted: boolean;
};

export function getCsvImportProfileKey(accountId?: string) {
  return `csv-import-profile-${accountId ?? 'all'}` as const;
}

export function areCsvMappingsCompatible(
  mappings: FieldMapping,
  columns: readonly string[],
) {
  return Object.values(mappings)
    .flat()
    .filter((value): value is string => typeof value === 'string')
    .every(column => columns.includes(column));
}

function isFieldMapping(value: unknown): value is FieldMapping {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const mapping = value as Record<string, unknown>;
  return (
    typeof mapping.date === 'string' &&
    (typeof mapping.amount === 'string' || mapping.amount === null) &&
    (typeof mapping.payee === 'string' || mapping.payee === null) &&
    (typeof mapping.notes === 'string' ||
      mapping.notes === null ||
      (Array.isArray(mapping.notes) &&
        mapping.notes.every(note => typeof note === 'string')))
  );
}

export function getCsvImportProfile(
  prefs: SyncedPrefs,
  accountId?: string,
): CsvImportProfile | null {
  const saved = prefs[getCsvImportProfileKey(accountId)];
  if (!saved) {
    const legacy = prefs[`csv-mappings-${accountId}`];
    if (!legacy) {
      return null;
    }
    try {
      const mappings: unknown = JSON.parse(legacy);
      if (!isFieldMapping(mappings)) {
        return null;
      }
      const columns = Array.from(
        new Set(
          Object.values(mappings)
            .flat()
            .filter((value): value is string => typeof value === 'string'),
        ),
      );
      const savedDateFormat = prefs[`parse-date-${accountId}-csv`];
      return {
        columns,
        mappings,
        dateFormat:
          savedDateFormat && isDateFormat(savedDateFormat)
            ? savedDateFormat
            : 'yyyy mm dd',
        delimiter: prefs[`csv-delimiter-${accountId}`] || 'auto',
        encoding: prefs[`csv-encoding-${accountId}`] || 'auto',
        hasHeaderRow: prefs[`csv-has-header-${accountId}`] !== 'false',
        skipStartLines:
          parseInt(prefs[`csv-skip-start-lines-${accountId}`] ?? '', 10) || 0,
        skipEndLines:
          parseInt(prefs[`csv-skip-end-lines-${accountId}`] ?? '', 10) || 0,
        inOutMode: prefs[`csv-in-out-mode-${accountId}`] === 'true',
        outValue: prefs[`csv-out-value-${accountId}`] ?? '',
        flipAmount: prefs[`flip-amount-${accountId}-csv`] === 'true',
        multiplierAmount: '',
        importNotes: prefs[`import-notes-${accountId}-csv`] !== 'false',
        autoExcludePairs: true,
        clearOnImport: true,
        reconcile: true,
        reimportDeleted:
          prefs[`import-reimport-deleted-${accountId}`] !== 'false',
      };
    } catch {
      return null;
    }
  }

  try {
    const profile: unknown = JSON.parse(saved);
    if (!profile || typeof profile !== 'object') {
      return null;
    }
    const value = profile as Record<string, unknown>;
    if (
      !Array.isArray(value.columns) ||
      !value.columns.every(column => typeof column === 'string') ||
      !isFieldMapping(value.mappings) ||
      typeof value.dateFormat !== 'string' ||
      !isDateFormat(value.dateFormat) ||
      typeof value.delimiter !== 'string' ||
      typeof value.encoding !== 'string' ||
      typeof value.hasHeaderRow !== 'boolean' ||
      typeof value.skipStartLines !== 'number' ||
      typeof value.skipEndLines !== 'number' ||
      typeof value.inOutMode !== 'boolean' ||
      typeof value.outValue !== 'string' ||
      typeof value.flipAmount !== 'boolean' ||
      typeof value.multiplierAmount !== 'string' ||
      typeof value.importNotes !== 'boolean' ||
      typeof value.autoExcludePairs !== 'boolean' ||
      typeof value.clearOnImport !== 'boolean' ||
      typeof value.reconcile !== 'boolean' ||
      typeof value.reimportDeleted !== 'boolean'
    ) {
      return null;
    }
    return profile as CsvImportProfile;
  } catch {
    return null;
  }
}
