import type { AccountEntity } from '@actual-app/core/types/models';
import { describe, expect, it } from 'vitest';

import { buildAccountMovement } from './accounts';
import type { SummaryTransaction } from './cashFlow';

function account(
  id: string,
  offbudget: 0 | 1 = 0,
  closed: 0 | 1 = 0,
): AccountEntity {
  return {
    id,
    name: id,
    offbudget,
    closed,
    sort_order: 0,
    last_reconciled: null,
    tombstone: 0,
    account_group_id: null,
    account_id: null,
    bank: null,
    bankName: null,
    bankId: null,
    mask: null,
    official_name: null,
    balance_current: null,
    balance_available: null,
    balance_limit: null,
    account_sync_source: null,
    last_sync: null,
    bank_sync_status: null,
  };
}

function transaction(
  id: string,
  accountId: string,
  amount: number,
  extra: Partial<SummaryTransaction> = {},
): SummaryTransaction {
  return {
    id,
    account: accountId,
    date: '2026-09-01',
    amount,
    category: null,
    accountOffBudget: false,
    categoryIsIncome: false,
    transferId: null,
    isParent: false,
    startingBalanceFlag: false,
    ...extra,
  };
}

describe('buildAccountMovement', () => {
  it('reconciles opening, inflows and outflows to closing', () => {
    const result = buildAccountMovement(
      [account('checking')],
      [{ account: 'checking', amount: 10_000 }],
      [
        transaction('in', 'checking', 500),
        transaction('out', 'checking', -2_000),
      ],
    );
    expect(result).toContainEqual(
      expect.objectContaining({
        id: 'checking',
        opening: 10_000,
        inflows: 500,
        outflows: 2_000,
        openingAdjustment: 0,
        closing: 8_500,
      }),
    );
  });

  it('shows both legs of a transfer without changing combined balances', () => {
    const result = buildAccountMovement(
      [account('checking'), account('savings')],
      [
        { account: 'checking', amount: 10_000 },
        { account: 'savings', amount: 2_000 },
      ],
      [
        transaction('from', 'checking', -3_000, { transferId: 'pair' }),
        transaction('to', 'savings', 3_000, { transferId: 'pair' }),
      ],
    );
    expect(result.find(row => row.id === 'checking')?.closing).toBe(7_000);
    expect(result.find(row => row.id === 'savings')?.closing).toBe(5_000);
    expect(result.reduce((sum, row) => sum + row.closing, 0)).toBe(12_000);
  });

  it('keeps inactive and closed accounts, and marks off-budget separately', () => {
    const result = buildAccountMovement(
      [account('idle'), account('closed', 0, 1), account('investment', 1)],
      [
        { account: 'closed', amount: 900 },
        { account: 'investment', amount: 4_000 },
      ],
      [],
    );
    expect(result.map(row => [row.id, row.closing, row.isOffBudget])).toEqual([
      ['idle', 0, false],
      ['closed', 900, false],
      ['investment', 4_000, true],
    ]);
  });

  it('separates an in-period starting balance as an opening adjustment and skips split parents', () => {
    const result = buildAccountMovement(
      [account('checking')],
      [],
      [
        transaction('opening', 'checking', 5_000, {
          startingBalanceFlag: true,
        }),
        transaction('split-parent', 'checking', -1_000, { isParent: true }),
        transaction('split-child', 'checking', -1_000),
      ],
    );
    expect(result[0]).toEqual(
      expect.objectContaining({
        opening: 0,
        openingAdjustment: 5_000,
        outflows: 1_000,
        closing: 4_000,
      }),
    );
  });
});
