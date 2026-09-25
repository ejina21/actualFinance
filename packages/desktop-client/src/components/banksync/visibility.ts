export const FOREIGN_BANK_SYNC_SETUP_ENABLED = false;

export function getForeignBankSyncVisibility(
  linkedAccountId: string | null | undefined,
  isServerOnline: boolean,
) {
  return {
    canOfferSetup:
      FOREIGN_BANK_SYNC_SETUP_ENABLED && isServerOnline && !linkedAccountId,
    canSyncExisting: Boolean(linkedAccountId && isServerOnline),
  };
}
