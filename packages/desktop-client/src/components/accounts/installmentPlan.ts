export type InstallmentPlanConfig = {
  firstPaymentDate: string;
  lastPaymentDate: string;
};

export type InstallmentTransaction = {
  date: string;
  amount: number;
  startingBalanceFlag?: boolean;
};

export type InstallmentMonth = {
  month: string;
  openingDebt: number;
  target: number;
  paid: number;
  closingDebt: number;
  isProjected: boolean;
};

export type InstallmentPlan = {
  rows: InstallmentMonth[];
  currentDebt: number;
  overdueDebt: number;
};

export function parseInstallmentPlanConfig(
  value: string | undefined,
): InstallmentPlanConfig | null {
  if (!value) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('firstPaymentDate' in parsed) ||
      !('lastPaymentDate' in parsed) ||
      typeof parsed.firstPaymentDate !== 'string' ||
      typeof parsed.lastPaymentDate !== 'string'
    ) {
      return null;
    }
    const config = {
      firstPaymentDate: parsed.firstPaymentDate,
      lastPaymentDate: parsed.lastPaymentDate,
    };
    return isValidInstallmentPlanConfig(config) ? config : null;
  } catch {
    return null;
  }
}

function validDate(date: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) &&
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date
  );
}

function monthNumber(date: string): number {
  return Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1;
}

function monthLabel(month: number): string {
  return `${String(Math.floor(month / 12)).padStart(4, '0')}-${String((month % 12) + 1).padStart(2, '0')}`;
}

export function isValidInstallmentPlanConfig(
  config: InstallmentPlanConfig,
): boolean {
  return (
    validDate(config.firstPaymentDate) &&
    validDate(config.lastPaymentDate) &&
    config.firstPaymentDate <= config.lastPaymentDate &&
    monthNumber(config.firstPaymentDate) <=
      monthNumber(config.lastPaymentDate) &&
    monthNumber(config.lastPaymentDate) - monthNumber(config.firstPaymentDate) <
      600
  );
}

export function buildInstallmentPlan(
  config: InstallmentPlanConfig,
  transactions: readonly InstallmentTransaction[],
  today: string,
): InstallmentPlan {
  if (!isValidInstallmentPlanConfig(config) || !validDate(today)) {
    throw new Error('Invalid installment plan dates');
  }

  const firstMonth = monthNumber(config.firstPaymentDate);
  const lastMonth = monthNumber(config.lastPaymentDate);
  const todayMonth = monthNumber(today);
  const actualTransactions = transactions.filter(tx => tx.date <= today);
  const currentDebt = Math.max(
    0,
    -actualTransactions.reduce((total, tx) => total + tx.amount, 0),
  );

  let balance = actualTransactions
    .filter(
      tx =>
        monthNumber(tx.date) < firstMonth || tx.startingBalanceFlag === true,
    )
    .reduce((total, tx) => total + tx.amount, 0);

  const rows: InstallmentMonth[] = [];
  for (let month = firstMonth; month <= lastMonth; month += 1) {
    const openingDebt = Math.max(0, -balance);
    const remainingMonths = lastMonth - month + 1;
    const target = Math.ceil(openingDebt / remainingMonths);
    const isProjected = month > todayMonth;
    const paid = isProjected
      ? 0
      : Math.max(
          0,
          actualTransactions
            .filter(
              tx =>
                monthNumber(tx.date) === month &&
                tx.startingBalanceFlag !== true,
            )
            .reduce((total, tx) => total + tx.amount, 0),
        );

    if (isProjected) {
      balance += target;
    } else {
      balance += actualTransactions
        .filter(
          tx =>
            monthNumber(tx.date) === month && tx.startingBalanceFlag !== true,
        )
        .reduce((total, tx) => total + tx.amount, 0);
    }

    rows.push({
      month: monthLabel(month),
      openingDebt,
      target,
      paid,
      closingDebt: Math.max(0, -balance),
      isProjected,
    });
  }

  return {
    rows,
    currentDebt,
    overdueDebt: today > config.lastPaymentDate ? currentDebt : 0,
  };
}
