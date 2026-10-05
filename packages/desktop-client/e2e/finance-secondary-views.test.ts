import { expect, test } from './fixtures';

test('keeps reports, schedules and settings available in Russian', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();

  await page.getByRole('link', { name: 'Отчеты', exact: true }).click();
  await expect(page.getByTestId('reports-overview')).toBeVisible();
  await expect(page).toMatchThemeScreenshots();

  await page.getByRole('link', { name: 'Расписания', exact: true }).click();
  await expect(page.getByText('Следующая дата')).toBeVisible();
  await expect(page).toMatchThemeScreenshots();

  await page.getByRole('link', { name: 'Настройки', exact: true }).click();
  await expect(page.getByTestId('settings')).toBeVisible();
  await expect(page).toMatchThemeScreenshots();
});

test('keeps the report date picker interactive', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
  await page.getByRole('link', { name: 'Отчеты', exact: true }).click();
  await expect(page.getByTestId('reports-overview')).toBeVisible();
  await page.getByText('Чистый капитал', { exact: true }).click();
  await page.getByTestId('date-range-picker-trigger').click();
  const picker = page.locator('[data-popover]');
  await expect(picker).toBeVisible();
  await picker.getByRole('button', { name: '3 месяца' }).click();
  await page.keyboard.press('Escape');
  await expect(picker).toBeHidden();
  await page.getByTestId('date-range-picker-trigger').click();
  await expect(
    picker.getByRole('button', { name: '3 месяца' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await picker.getByRole('button', { name: 'День', exact: true }).click();
  await expect(picker).toBeVisible();
});
