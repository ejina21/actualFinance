import { describe, expect, it } from 'vitest';

import { buildInstallmentPlan } from '#components/accounts/installmentPlan';

import { buildInstallmentDashboard } from './installmentDashboard';

const config = {
  firstPaymentDate: '2026-11-10',
  lastPaymentDate: '2027-02-10',
};

describe('buildInstallmentDashboard', () => {
  it('updates debt, the next payment and savings after a partial payment', () => {
    const transactions = [
      { date: '2026-10-17', amount: -40_000, startingBalanceFlag: true },
      { date: '2026-11-12', amount: 2_500 },
    ];
    const today = '2026-11-15';
    const plan = buildInstallmentPlan(config, transactions, today);

    expect(buildInstallmentDashboard(plan, transactions, 7_500, today)).toEqual(
      {
        paid: 2_500,
        remainingDebt: 37_500,
        nextPayment: 7_500,
        monthsRemaining: 4,
        budgetBalance: 7_500,
        stillToSave: 30_000,
        monthlySavingTarget: 7_500,
      },
    );
  });

  it('does not use a negative budget balance as funding', () => {
    const transactions = [
      { date: '2026-10-17', amount: -40_000, startingBalanceFlag: true },
    ];
    const plan = buildInstallmentPlan(config, transactions, '2026-10-20');

    expect(
      buildInstallmentDashboard(plan, transactions, -5_000, '2026-10-20'),
    ).toMatchObject({
      monthsRemaining: 4,
      stillToSave: 40_000,
      monthlySavingTarget: 10_000,
    });
  });

  it('shows no savings needed when the budget balance covers the debt', () => {
    const transactions = [
      { date: '2026-10-17', amount: -40_000, startingBalanceFlag: true },
    ];
    const plan = buildInstallmentPlan(config, transactions, '2026-10-20');

    expect(
      buildInstallmentDashboard(plan, transactions, 50_000, '2026-10-20'),
    ).toMatchObject({ stillToSave: 0, monthlySavingTarget: 0 });
  });

  it('keeps a debt past the deadline without dividing by zero', () => {
    const transactions = [
      { date: '2026-10-17', amount: -40_000, startingBalanceFlag: true },
      { date: '2027-02-10', amount: 10_000 },
    ];
    const today = '2027-03-01';
    const plan = buildInstallmentPlan(config, transactions, today);

    expect(
      buildInstallmentDashboard(plan, transactions, 5_000, today),
    ).toMatchObject({
      paid: 10_000,
      remainingDebt: 30_000,
      nextPayment: null,
      monthsRemaining: 0,
      stillToSave: 25_000,
      monthlySavingTarget: null,
    });
  });

  it('stops the monthly target after the last payment day, even within that month', () => {
    const transactions = [
      { date: '2026-10-17', amount: -40_000, startingBalanceFlag: true },
    ];
    const today = '2027-02-11';
    const plan = buildInstallmentPlan(config, transactions, today);

    expect(
      buildInstallmentDashboard(plan, transactions, 5_000, today),
    ).toMatchObject({
      nextPayment: null,
      monthsRemaining: 0,
      stillToSave: 35_000,
      monthlySavingTarget: null,
    });
  });

  it('waits for the budget balance instead of showing a false saving target', () => {
    const transactions = [
      { date: '2026-10-17', amount: -40_000, startingBalanceFlag: true },
    ];
    const plan = buildInstallmentPlan(config, transactions, '2026-10-20');

    expect(
      buildInstallmentDashboard(plan, transactions, null, '2026-10-20'),
    ).toMatchObject({
      budgetBalance: null,
      stillToSave: null,
      monthlySavingTarget: null,
    });
  });
});
