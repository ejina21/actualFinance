import { expect, test } from './fixtures';

test('shows a monthly installment plan for a debt account', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
  await page.getByText('Mortgage', { exact: true }).first().click();

  await page.getByRole('button', { name: 'План рассрочки' }).click();
  await page.getByLabel('Первый платёж').fill('2017-02-10');
  await page.getByLabel('Последний платёж').fill('2017-05-10');
  await page.getByRole('button', { name: 'Сохранить план' }).click();

  const plan = page.getByTestId('installment-plan-card');
  await expect(plan.getByText('Остаток долга')).toBeVisible();
  await expect(plan.getByText('Прогноз следующего платежа')).toBeVisible();
  await plan.getByText('План по месяцам').click();
  await expect(plan.getByRole('row')).toHaveCount(5);
  await expect(plan).toMatchThemeScreenshots();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => plan.evaluate(element => element.getBoundingClientRect().width))
    .toBeGreaterThan(300);
  await plan.getByText('План по месяцам').click();
  await expect(plan.getByRole('row')).toHaveCount(5);
  await expect(plan).toMatchThemeScreenshots();
});
