import { expect, test } from './fixtures';

test('excludes off-budget balances from overall totals while retaining the individual account', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
  const budgetTotal = page.getByTestId('sidebar-on-budget-balance');
  await expect(budgetTotal).toHaveText('20,918.00');
  await expect(page.getByTestId('sidebar-all-accounts-balance')).toHaveText(
    '20,918.00',
  );

  await page.goto('/accounts');
  await expect(page.getByTestId('account-balance')).toHaveText('20,918.00');
  await page.getByText('Mortgage', { exact: true }).first().click();
  await expect(page.getByTestId('account-balance')).toHaveText('-312,500.00');

  await page.goto('/budget');
  const movements = page.getByRole('table', { name: 'Движение по счетам' });
  await expect(movements).toBeVisible();
  await expect(movements.getByText('Mortgage', { exact: true })).toHaveCount(0);
  await expect(movements.getByText('Roth IRA', { exact: true })).toHaveCount(0);

  await page.goto('/overview');
  await expect(
    page.getByRole('main').getByRole('link', { name: /Все счета/ }),
  ).toContainText('20,918.00');
});
