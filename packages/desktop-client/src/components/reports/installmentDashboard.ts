import type {
  InstallmentPlan,
  InstallmentTransaction,
} from '#components/accounts/installmentPlan';

export type InstallmentDashboardData = {
  paid: number;
  remainingDebt: number;
  nextPayment: number | null;
  monthsRemaining: number;
  budgetBalance: number | null;
  stillToSave: number | null;
  monthlySavingTarget: number | null;
};

export function buildInstallmentDashboard(
  plan: InstallmentPlan,
  transactions: readonly InstallmentTransaction[],
  budgetBalance: number | null,
  today: string,
): InstallmentDashboardData {
  const currentMonth = today.slice(0, 7);
  const remainingRows = plan.rows.filter(row => row.month >= currentMonth);
  const monthsRemaining =
    plan.currentDebt > 0 && plan.overdueDebt === 0 ? remainingRows.length : 0;
  const nextPayment =
    monthsRemaining === 0
      ? null
      : (remainingRows
          .map(row =>
            row.month === currentMonth
              ? Math.max(0, row.target - row.paid)
              : row.target,
          )
          .find(amount => amount > 0) ?? null);
  const paid = transactions
    .filter(
      tx =>
        tx.date <= today && tx.startingBalanceFlag !== true && tx.amount > 0,
    )
    .reduce((total, tx) => total + tx.amount, 0);
  const stillToSave =
    budgetBalance === null
      ? null
      : Math.max(0, plan.currentDebt - Math.max(0, budgetBalance));

  return {
    paid,
    remainingDebt: plan.currentDebt,
    nextPayment,
    monthsRemaining,
    budgetBalance,
    stillToSave,
    monthlySavingTarget:
      stillToSave === null
        ? null
        : stillToSave === 0
          ? 0
          : monthsRemaining === 0
            ? null
            : Math.ceil(stillToSave / monthsRemaining),
  };
}
