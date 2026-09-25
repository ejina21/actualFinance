import { useMemo } from 'react';

import { q } from '@actual-app/core/shared/query';

import { useAccounts } from '#hooks/useAccounts';
import { useCategories } from '#hooks/useCategories';
import { useQuery } from '#hooks/useQuery';

import { buildAccountMovement } from './accounts';
import type { AccountAmount } from './accounts';
import { summarizeCashFlow } from './cashFlow';
import type { CashFlowSummary } from './cashFlow';
import { resolveSummaryPeriod } from './period';
import type { SummaryPeriod } from './period';
import { normalizeTransactions } from './queryTransactions';
import type { QueryTransaction } from './queryTransactions';

function resolveComparisonPeriods(comparisonKey: string) {
  let error: Error | undefined;
  const periods = comparisonKey
    ? comparisonKey.split(',').flatMap(month => {
        try {
          return [
            { month, period: resolveSummaryPeriod({ kind: 'month', month }) },
          ];
        } catch (caught) {
          error = caught instanceof Error ? caught : new Error(String(caught));
          return [];
        }
      })
    : [];
  return { periods, error };
}

export function useFinanceSummary(
  period: SummaryPeriod,
  comparisonMonths: readonly string[],
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
              'starting_balance_flag',
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
  const comparisonKey = [...new Set(comparisonMonths)].join(',');
  const { periods: comparisonPeriods, error: comparisonError } = useMemo(
    () => resolveComparisonPeriods(comparisonKey),
    [comparisonKey],
  );
  const comparisonTransactions = useQuery<QueryTransaction>(
    () =>
      comparisonPeriods.length > 0
        ? q('transactions')
            .filter({
              is_parent: false,
              $or: comparisonPeriods.map(
                ({ period: { startDate: start, endDate: end } }) => ({
                  date: { $gte: start, $lte: end },
                }),
              ),
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
              'starting_balance_flag',
            ])
        : null,
    [comparisonPeriods],
  );
  const rows = normalizeTransactions(transactions.data ?? []);
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
  if (comparisonPeriods.length > 0) {
    const compareRows = normalizeTransactions(
      comparisonTransactions.data ?? [],
    );
    for (const { month, period: monthPeriod } of comparisonPeriods) {
      comparison[month] = summarizeCashFlow(
        compareRows,
        categories.data?.grouped ?? [],
        monthPeriod,
      );
    }
  }

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
      beforePeriod.isLoading ||
      (comparisonPeriods.length > 0 && comparisonTransactions.isLoading),
    error:
      periodError ??
      accounts.error ??
      categories.error ??
      transactions.error ??
      beforePeriod.error ??
      comparisonError ??
      (comparisonPeriods.length > 0 ? comparisonTransactions.error : undefined),
  };
}
