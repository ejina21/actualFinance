import { q } from '@actual-app/core/shared/query';

import { useAccounts } from '#hooks/useAccounts';
import { useCategories } from '#hooks/useCategories';
import { useQuery } from '#hooks/useQuery';

import { buildAccountMovement, type AccountAmount } from './accounts';
import {
  summarizeCashFlow,
  type CashFlowSummary,
  type SummaryTransaction,
} from './cashFlow';
import { resolveSummaryPeriod, type SummaryPeriod } from './period';

type QueryTransaction = Omit<
  SummaryTransaction,
  'accountOffBudget' | 'categoryIsIncome' | 'isParent' | 'startingBalanceFlag'
> & {
  accountOffBudget: boolean | null;
  categoryIsIncome: boolean | null;
  startingBalanceFlag: boolean | null;
};

export function useFinanceSummary(
  period: SummaryPeriod,
  _comparisonMonths: readonly string[],
) {
  let periodError: Error | undefined;
  let resolvedPeriod;
  try {
    resolvedPeriod = resolveSummaryPeriod(period);
  } catch (error) {
    periodError = error instanceof Error ? error : new Error(String(error));
  }
  const startDate = resolvedPeriod?.startDate;
  const endDate = resolvedPeriod?.endDate;
  const accounts = useAccounts();
  const categories = useCategories();
  const transactions = useQuery<QueryTransaction>(
    () =>
      startDate && endDate
        ? q('transactions')
            .filter({
              date: { $gte: startDate, $lte: endDate },
              is_parent: false,
            })
            .select([
              'id',
              'date',
              'amount',
              { category: { $id: '$category.id' } },
              { account: { $id: '$account.id' } },
              { accountOffBudget: { $id: '$account.offbudget' } },
              { categoryIsIncome: { $id: '$category.is_income' } },
              { transferId: { $id: '$payee.transfer_acct.id' } },
              { startingBalanceFlag: '$starting_balance_flag' },
            ])
        : null,
    [startDate, endDate],
  );
  const beforePeriod = useQuery<AccountAmount>(
    () =>
      startDate
        ? q('transactions')
            .filter({ date: { $lt: startDate }, is_parent: false })
            .groupBy([{ $id: '$account.id' }])
            .select([
              { account: { $id: '$account.id' } },
              { amount: { $sum: '$amount' } },
            ])
        : null,
    [startDate],
  );
  const rows: SummaryTransaction[] = (transactions.data ?? []).map(row => ({
    ...row,
    accountOffBudget: Boolean(row.accountOffBudget),
    categoryIsIncome: Boolean(row.categoryIsIncome),
    isParent: false,
    startingBalanceFlag: Boolean(row.startingBalanceFlag),
  }));
  const cashFlow = resolvedPeriod
    ? summarizeCashFlow(rows, categories.data?.grouped ?? [], resolvedPeriod)
    : null;
  const accountMovements = buildAccountMovement(
    accounts.data ?? [],
    beforePeriod.data ?? [],
    rows,
  );
  const closingOnBudget = accountMovements
    .filter(row => !row.isOffBudget)
    .reduce((total, row) => total + row.closing, 0);
  const comparison: Record<string, CashFlowSummary> = {};

  return {
    period: resolvedPeriod,
    cashFlow,
    accountMovements,
    closingOnBudget,
    comparison,
    isLoading:
      accounts.isLoading ||
      categories.isLoading ||
      transactions.isLoading ||
      beforePeriod.isLoading,
    error:
      periodError ??
      accounts.error ??
      categories.error ??
      transactions.error ??
      beforePeriod.error,
  };
}
