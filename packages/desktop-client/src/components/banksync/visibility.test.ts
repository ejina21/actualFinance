import { describe, expect, it } from 'vitest';

import { getForeignBankSyncVisibility } from './visibility';

describe('foreign bank sync visibility', () => {
  it('does not offer a new link for an unlinked account', () => {
    expect(getForeignBankSyncVisibility(null, true)).toEqual({
      canOfferSetup: false,
      canSyncExisting: false,
    });
  });

  it('keeps sync available for an existing linked account', () => {
    expect(getForeignBankSyncVisibility('linked-id', true)).toEqual({
      canOfferSetup: false,
      canSyncExisting: true,
    });
    expect(
      getForeignBankSyncVisibility('linked-id', false).canSyncExisting,
    ).toBe(false);
  });
});
