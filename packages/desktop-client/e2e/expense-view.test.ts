import { expect, test } from './fixtures';

test('shows spending by category without planning and returns to the prior budget mode', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: /Try the demo|Открыть демоверсию/ })
    .click();
  await expect(page.getByTestId('budget-table')).toBeVisible();

  await page.getByRole('button', { name: /Expenses only|Расходы/ }).click();
  const summary = page.getByTestId('expense-summary');
  await expect(summary).toBeVisible();
  await expect(summary.getByRole('table')).toBeVisible();
  await expect(summary.getByText(/Budgeted|Запланировано/)).toHaveCount(0);
  await expect(summary.getByText(/Overspent|Перерасход/)).toHaveCount(0);

  await summary.getByRole('button', { name: /Year|Год/ }).click();
  await summary
    .getByRole('spinbutton', { name: /period|период/i })
    .fill('2016');
  await expect(
    summary.getByRole('columnheader', { name: /Total|Итого|Всего/ }),
  ).toBeVisible();
  await expect(
    summary.getByRole('columnheader', { name: /January|Январь/ }),
  ).toBeVisible();
  await expect(summary.getByText('Usual Expenses')).toBeVisible();
  await expect(summary.getByText('Food')).toBeVisible();
  await expect(summary.getByRole('cell', { name: /\d/ }).first()).toBeVisible();
  await expect(
    summary.getByTestId('expense-summary-scroll'),
  ).toMatchThemeScreenshots();

  await page.getByRole('button', { name: /Envelope|Конверты/ }).click();
  await expect(page.getByTestId('budget-table')).toBeVisible();
});

test('shows the spending table on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page
    .getByRole('button', { name: /Try the demo|Открыть демоверсию/ })
    .click();
  await page.getByRole('button', { name: /Expenses only|Расходы/ }).click();

  const summary = page.getByTestId('expense-summary');
  await expect(summary.getByRole('table')).toBeVisible();
  await expect(
    summary.getByRole('combobox', { name: /Month|Месяц/i }),
  ).toBeVisible();
  await expect(
    summary.getByRole('columnheader', { name: /Total|Итого|Всего/ }),
  ).toBeVisible();
});
