import type { ManualBankId } from './banks';

export async function createAccountWithBank(
  create: () => Promise<string>,
  saveBank: (accountId: string, bankId: ManualBankId) => Promise<unknown>,
  bankId: ManualBankId | '',
): Promise<{ id: string; bankSaved: boolean }> {
  const id = await create();
  if (!bankId) {
    return { id, bankSaved: true };
  }

  try {
    await saveBank(id, bankId);
    return { id, bankSaved: true };
  } catch {
    return { id, bankSaved: false };
  }
}
