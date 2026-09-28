import { join } from 'path';

import { expect, test } from './fixtures';

test('local account remembers a bank and offers statement guidance', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
  await page.getByRole('button', { name: 'Дополнительно' }).click();
  await expect(page.locator('a[href="/bank-sync"]')).toHaveCount(0);
  await expect(page.getByText('Не связан', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Добавить счёт' }).click();
  await page.getByRole('heading', { name: 'Добавить счёт' }).waitFor();
  await page.getByLabel('Название').fill('Счёт для выписки');
  await page.getByRole('button', { name: 'Банк:' }).click();
  await page.getByRole('button', { name: 'Т-Банк', exact: true }).click();
  await page.getByRole('button', { name: 'Создать', exact: true }).click();

  const helpButton = page.getByRole('button', {
    name: 'Как загрузить выписку',
    exact: true,
  });
  await expect(helpButton).toBeVisible();
  await helpButton.focus();
  await page.keyboard.press('Enter');

  const help = page.getByTestId('manual-bank-import-help-modal');
  await expect(help).toBeVisible();
  await expect(help).toContainText(
    'Откройте раздел «Операции» в веб-кабинете Т-Банка.',
  );
  await expect(
    help.getByRole('button', { name: 'Выбрать файл' }),
  ).toBeVisible();
  await expect(help.getByRole('dialog')).toMatchThemeScreenshots();

  const fileChooserPromise = page.waitForEvent('filechooser');
  await help.getByRole('button', { name: 'Выбрать файл' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(join(__dirname, 'data/test.csv'));
  await expect(page.getByTestId('import-transactions-modal')).toBeVisible();
});

test('PDF selection is rejected before opening import preview', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
  await page.getByRole('button', { name: 'Добавить счёт' }).click();
  await page.getByRole('heading', { name: 'Добавить счёт' }).waitFor();
  await page.getByLabel('Название').fill('Счёт с PDF');
  await page.getByRole('button', { name: 'Создать', exact: true }).click();

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Импорт', exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: 'statement.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4'),
  });

  await expect(
    page.getByText('PDF нельзя загрузить напрямую.', { exact: false }),
  ).toBeVisible();
  await expect(page.getByTestId('import-transactions-modal')).toHaveCount(0);
});

test('narrow account menu shows guidance without file upload', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();

  await page.getByRole('button', { name: 'Добавить счёт' }).click();
  await page.getByRole('heading', { name: 'Добавить счёт' }).waitFor();
  await page.getByLabel('Название').fill('Мобильный счёт');
  await page.getByRole('button', { name: 'Создать', exact: true }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Мобильный счёт' }).click();
  await page
    .getByRole('button', { name: 'Как загрузить выписку банка' })
    .click();
  const help = page.getByTestId('manual-bank-import-help-modal');
  await expect(help).toContainText('откройте этот счёт на широком экране');
  await expect(help.getByRole('button', { name: 'Выбрать файл' })).toHaveCount(
    0,
  );
});

test('a combined CSV can be assigned to accounts from All accounts', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
  for (const accountName of ['Счёт А', 'Счёт Б']) {
    await page.getByRole('button', { name: 'Добавить счёт' }).click();
    await page.getByLabel('Название').fill(accountName);
    await page.getByRole('button', { name: 'Создать', exact: true }).click();
  }
  await page.getByRole('link', { name: 'Все счета' }).first().click();

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Импорт', exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: 'operations.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      [
        'Имя счёта;Дата операции;Сумма в валюте счёта;Описание;Сообщение;Метка',
        'Счёт А;28.09.2026 10:00:00;-1,00;Тестовая оплата;покупка;карта',
        'Счёт А;28.09.2026 10:01:00;1,00;Тестовая оплата;возврат;карта',
        'Счёт Б;28.09.2026 12:00:00;-11,00;Другая оплата;заказ;контекст',
      ].join('\n'),
    ),
  });

  const modal = page.getByTestId('import-transactions-modal');
  await expect(modal).toBeVisible();
  await expect(modal).toContainText('Сопоставление счетов');
  await expect(modal).toContainText('Счёт А');
  await expect(modal).toContainText('Счёт Б');
  await expect(modal).toContainText('Исключено встречных операций: 2');
  await expect(modal.getByTestId('account-routing')).toMatchThemeScreenshots();
  await modal.getByText('Поля заметки: 1').click();
  await modal.getByLabel('Метка').check();
  await expect(modal).toContainText('заказ / контекст');
  await expect(
    modal.getByRole('button', { name: /Импортировать 1/ }),
  ).toBeEnabled();
  await modal.getByRole('button', { name: /Импортировать 1/ }).click();
  await expect(modal).toHaveCount(0);
  await expect(page.getByText(/Другая оплата/i)).toBeVisible();
});

test('import draft remains open when the user changes the app section', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
  await page.getByRole('button', { name: 'Добавить счёт' }).click();
  await page.getByLabel('Название').fill('Счёт для черновика');
  await page.getByRole('button', { name: 'Создать', exact: true }).click();

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Импорт', exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(join(__dirname, 'data/test.csv'));

  const modal = page.getByTestId('import-transactions-modal');
  await expect(modal).toBeVisible();
  await modal.locator('#start-date-filter').fill('2016-06-01');
  const firstTransaction = modal
    .getByTestId('row')
    .filter({ hasText: 'test 1' })
    .getByRole('checkbox');
  await expect(firstTransaction).toBeChecked();
  await firstTransaction.uncheck();
  await page.goBack();

  await expect(modal).toBeVisible();
  await expect(modal.locator('#start-date-filter')).toHaveValue('2016-06-01');
  await expect(firstTransaction).not.toBeChecked();
});
