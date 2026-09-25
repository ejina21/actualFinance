import type { AccountEntity } from '@actual-app/core/types/models';

import type { SummaryTransaction } from './cashFlow';

export type AccountAmount = { account: string; amount: number };

export type AccountMovement = {
  id: string;
  name: string;
  opening: number;
  inflows: number;
  outflows: number;
  openingAdjustment: number;
  closing: number;
  isOffBudget: boolean;
};

export function buildAccountMovement(
  accounts: readonly AccountEntity[],
  beforePeriod: readonly AccountAmount[],
  inPeriod: readonly SummaryTransaction[],
): AccountMovement[] {
  const openingByAccount = new Map<string, number>();
  for (const { account, amount } of beforePeriod) {
    openingByAccount.set(
      account,
      (openingByAccount.get(account) ?? 0) + amount,
    );
  }
  const movements = accounts
    .filter(account => !account.tombstone)
    .map(account => ({
      id: account.id,
      name: account.name,
      opening: openingByAccount.get(account.id) ?? 0,
      inflows: 0,
      outflows: 0,
      openingAdjustment: 0,
      closing: 0,
      isOffBudget: Boolean(account.offbudget),
    }));
  const byId = new Map(movements.map(row => [row.id, row]));
  for (const transaction of inPeriod) {
    if (transaction.isParent) {
      continue;
    }
    const row = byId.get(transaction.account);
    if (!row) {
      continue;
    }
    if (transaction.startingBalanceFlag) {
      row.openingAdjustment += transaction.amount;
    } else if (transaction.amount >= 0) {
      row.inflows += transaction.amount;
    } else {
      row.outflows -= transaction.amount;
    }
  }
  for (const row of movements) {
    row.closing =
      row.opening + row.inflows - row.outflows + row.openingAdjustment;
  }
  return movements;
}
