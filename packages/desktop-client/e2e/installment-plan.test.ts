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

test('shows a fixed installment dashboard in reports', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
  await page.getByText('Mortgage', { exact: true }).first().click();

  await page.getByRole('button', { name: 'План рассрочки' }).click();
  await page.getByLabel('Первый платёж').fill('2017-02-10');
  await page.getByLabel('Последний платёж').fill('2017-05-10');
  await page.getByRole('button', { name: 'Сохранить план' }).click();

  await page.goto('/reports');
  await page.getByRole('button', { name: 'Основная' }).last().click();
  await page.getByRole('menu').getByText('Рассрочка').click();
  const dashboard = page.getByTestId('installment-report-dashboard');
  await expect(
    dashboard.getByText('Погашено по операциям счёта'),
  ).toBeVisible();
  await expect(dashboard.getByText('Остаток долга').first()).toBeVisible();
  await expect(
    dashboard.getByText('Баланс бюджетных счетов', { exact: true }),
  ).toBeVisible();
  await expect(dashboard.getByText('Накопить в месяц')).toBeVisible();
  await expect(dashboard.getByText('313,500.00')).toHaveCount(2);
  await expect(dashboard.getByText('20,918.00')).toBeVisible();
  await expect(dashboard.getByText('292,582.00')).toBeVisible();
  await expect(dashboard.getByText('73,145.50')).toBeVisible();
  await expect(dashboard).toMatchThemeScreenshots();

  const deadline = dashboard.getByLabel('Последний платёж', { exact: true });
  await deadline.fill('2017-03-10');
  await expect(dashboard.getByText('146,291.00')).toBeVisible();
  await dashboard.getByRole('button', { name: 'Сохранить срок' }).click();
  await expect(
    dashboard.getByText('Срок сохранён', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(deadline).toHaveValue('2017-03-10', { timeout: 30000 });
  await deadline.fill('2017-09-10');
  await expect(dashboard.getByText('36,572.75')).toBeVisible();
  await deadline.fill('2017-01-10');
  await expect(
    dashboard.getByRole('button', { name: 'Сохранить срок' }),
  ).toBeDisabled();
  await deadline.fill('2017-05-10');
  await dashboard.getByRole('button', { name: 'Сохранить срок' }).click();
  await expect(
    dashboard.getByText('Срок сохранён', { exact: true }),
  ).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Отчеты: Рассрочка' }),
  ).toBeVisible();
  await expect(
    dashboard.getByText('Ещё накопить', { exact: true }),
  ).toBeVisible();
  await expect(dashboard).toMatchThemeScreenshots();
});
