import type { SummaryTransaction } from './cashFlow';

export type QueryTransaction = Omit<
  SummaryTransaction,
  'accountOffBudget' | 'categoryIsIncome' | 'isParent' | 'startingBalanceFlag'
> & {
  accountOffBudget: boolean | null;
  categoryIsIncome: boolean | null;
  starting_balance_flag: boolean | null;
};

export function normalizeTransactions(
  data: readonly QueryTransaction[],
): SummaryTransaction[] {
  return data.map(row => ({
    ...row,
    accountOffBudget: Boolean(row.accountOffBudget),
    categoryIsIncome: Boolean(row.categoryIsIncome),
    isParent: false,
    startingBalanceFlag: Boolean(row.starting_balance_flag),
  }));
}
