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
