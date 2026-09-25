import { describe, expect, it } from 'vitest';

import { getManualBank, MANUAL_BANKS } from './banks';

describe('manual bank selection', () => {
  it('recognizes the five supported personal banks', () => {
    expect(MANUAL_BANKS.map(bank => bank.id)).toEqual([
      'tbank',
      'alfabank',
      'sberbank',
      'ozon',
      'yandex',
    ]);
  });

  it('treats missing and unknown bank values as unselected', () => {
    expect(getManualBank(undefined)).toBeNull();
    expect(getManualBank('')).toBeNull();
    expect(getManualBank('removed-bank')).toBeNull();
  });
});
