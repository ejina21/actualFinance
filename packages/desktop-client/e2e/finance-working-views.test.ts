import { expect, test } from './fixtures';

test('keeps a long payee and negative amount usable in a narrow account register', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
  await page
    .getByRole('navigation', { name: 'Боковая панель' })
    .getByRole('row', { name: 'Bank of America', exact: true })
    .click();
  await expect(page.getByTestId('transaction-table')).toBeVisible();

  await page.getByRole('button', { name: 'Добавить новую операцию' }).click();
  const newRow = page.getByTestId('new-transaction').getByTestId('row').first();
  const payee = newRow.getByTestId('payee');
  await payee.click();
  await payee
    .getByRole('textbox')
    .fill(
      'Очень длинное название получателя для проверки отображения операции',
    );
  await page.getByTestId('create-payee-button').click();

  const debit = newRow.getByTestId('debit');
  await debit.click();
  await debit.getByRole('textbox').fill('123456.78');
  await page.keyboard.press('Tab');
  await page.getByTestId('add-button').click();
  await page.getByRole('button', { name: 'Отменить' }).click();

  await page.setViewportSize({ width: 800, height: 800 });
  const savedRow = page
    .getByTestId('transaction-table')
    .getByTestId('row')
    .filter({ hasText: '123,456.78' });
  await expect(savedRow).toBeVisible();
  await expect(savedRow.getByTestId('payee')).toContainText(
    'Очень длинное название получателя',
  );
  await expect(savedRow.getByTestId('debit')).toContainText('123,456.78');
  await expect(page).toMatchThemeScreenshots();
  await savedRow.getByTestId('debit').scrollIntoViewIfNeeded();
  await expect(savedRow.getByTestId('debit')).toBeInViewport();
});

test('changes budget views in settings and keeps the planning tables editable', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
  await page.getByRole('link', { name: 'Бюджет', exact: true }).click();
  await expect(page.getByTestId('finance-summary')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Вид бюджета' })).toHaveCount(0);
  await expect(
    page.getByRole('main').getByText('Итого', { exact: true }),
  ).toHaveCount(0);

  await page.getByRole('link', { name: 'Настройки', exact: true }).click();
  const view = page.getByRole('combobox', { name: 'Вид бюджета' });
  await expect(view).toHaveValue('summary');
  await expect(view.locator('option')).toHaveText([
    'Конверты',
    'Отслеживание',
    'Расходы',
  ]);
  await expect(
    page.getByTestId('budget-view-setting'),
  ).toMatchThemeScreenshots();

  await view.selectOption('envelope');
  await page.getByRole('link', { name: 'Бюджет', exact: true }).click();
  await expect(page.getByTestId('budget-table')).toBeVisible();
  await expect(page).toMatchThemeScreenshots();

  await page.getByRole('link', { name: 'Настройки', exact: true }).click();
  await view.selectOption({ label: 'Расходы' });
  await page.getByRole('link', { name: 'Бюджет', exact: true }).click();
  await expect(page.getByTestId('finance-summary')).toBeVisible();
  await expect(page.getByTestId('finance-summary')).toMatchThemeScreenshots();

  await page.getByRole('link', { name: 'Настройки', exact: true }).click();
  await view.selectOption('tracking');
  await page.getByRole('link', { name: 'Бюджет', exact: true }).click();
  await expect(page.getByTestId('budget-table')).toBeVisible();
});
