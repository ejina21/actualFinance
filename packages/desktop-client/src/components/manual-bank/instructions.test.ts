import { describe, expect, it } from 'vitest';

import { MANUAL_BANKS } from './banks';
import {
  ACCEPTED_IMPORT_EXTENSIONS,
  getImportInstructions,
  isSupportedImportFilename,
} from './instructions';

describe('manual bank statement guidance', () => {
  it('offers export guidance for every listed bank', () => {
    for (const bank of MANUAL_BANKS) {
      const instructions = getImportInstructions(bank.id);
      expect(instructions.steps.length).toBeGreaterThan(0);
      expect(instructions.sourceUrl).toMatch(/^https:\/\//);
    }
  });

  it('falls back to general guidance for an unknown bank', () => {
    expect(getImportInstructions('old-bank').steps.length).toBeGreaterThan(0);
  });

  it('rejects PDF while accepting supported statement files', () => {
    expect(ACCEPTED_IMPORT_EXTENSIONS).not.toContain('pdf');
    expect(isSupportedImportFilename('statement.PDF')).toBe(false);
    expect(isSupportedImportFilename('statement.csv')).toBe(true);
    expect(isSupportedImportFilename('statement.qfx')).toBe(true);
  });
});
