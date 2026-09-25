import type {
  PayeeEntity,
  TransactionEntity,
} from '@actual-app/core/types/models';

type ActivityTransaction = Pick<
  TransactionEntity,
  'id' | 'account' | 'date' | 'amount' | 'payee' | 'imported_payee' | 'category'
>;

type ActivityPayee = Pick<PayeeEntity, 'id' | 'name' | 'transfer_acct'>;

export function buildRecentActivity(
  transactions: readonly ActivityTransaction[],
  payees: readonly ActivityPayee[],
) {
  const payeesById = new Map(payees.map(payee => [payee.id, payee]));

  return transactions.slice(0, 5).map(transaction => {
    const payee = transaction.payee
      ? payeesById.get(transaction.payee)
      : undefined;
    const isTransfer = Boolean(payee?.transfer_acct);

    return {
      id: transaction.id,
      accountId: transaction.account,
      date: transaction.date,
      amount: transaction.amount,
      payeeName: payee?.name || transaction.imported_payee || null,
      categoryId: transaction.category ?? null,
      isTransfer,
      isExpense: transaction.amount < 0 && !isTransfer,
    };
  });
}

export function getBudgetProgress(
  spent: number | null,
  budgeted: number | null,
) {
  const safeBudgeted = budgeted ?? 0;
  const hasBudget = Math.abs(safeBudgeted) > 0;
  const fraction = hasBudget
    ? Math.min(Math.abs(spent ?? 0) / Math.abs(safeBudgeted), 1)
    : 0;

  return {
    fraction,
    hasBudget,
    isOverspent: hasBudget && Math.abs(spent ?? 0) > Math.abs(safeBudgeted),
  };
}
