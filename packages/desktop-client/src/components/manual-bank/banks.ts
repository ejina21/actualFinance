export const MANUAL_BANKS = [
  { id: 'tbank', name: 'T-Bank' },
  { id: 'alfabank', name: 'Alfa-Bank' },
  { id: 'sberbank', name: 'Sberbank' },
  { id: 'ozon', name: 'Ozon Bank' },
  { id: 'yandex', name: 'Yandex Bank' },
] as const;

export type ManualBankId = (typeof MANUAL_BANKS)[number]['id'];
export type ManualBank = (typeof MANUAL_BANKS)[number];

export function getManualBank(id: string | null | undefined): ManualBank | null {
  return MANUAL_BANKS.find(bank => bank.id === id) ?? null;
}
