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
        'Bank of America;28.09.2026 10:00:00;-1,00;Тестовая оплата;покупка;карта',
        'Bank of America;28.09.2026 10:01:00;1,00;Тестовая оплата;возврат;карта',
        'Ally Savings;28.09.2026 12:00:00;-11,00;Другая оплата;заказ;контекст',
      ].join('\n'),
    ),
  });

  const modal = page.getByTestId('import-transactions-modal');
  await expect(modal).toBeVisible();
  await expect(modal.getByTestId('account-routing')).toHaveCount(0);
  await expect(
    modal.getByRole('button', { name: 'Настроить импорт' }),
  ).toBeVisible();
  await expect(modal).toContainText('Исключено встречных операций: 2');
  await expect(modal.locator('#auto-exclude-pairs')).toHaveCount(0);
  await expect(
    modal.getByTestId('csv-import-fields'),
  ).toMatchThemeScreenshots();
  await expect(
    modal.getByTestId('csv-import-settings-hint'),
  ).toMatchThemeScreenshots();
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

test('unmatched CSV account is configured in settings before import', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
  await page.getByRole('button', { name: 'Добавить счёт' }).click();
  await page.getByLabel('Название').fill('Домашний счёт');
  await page.getByRole('button', { name: 'Создать', exact: true }).click();
  await page.getByRole('link', { name: 'Все счета' }).first().click();

  async function uploadStatement() {
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Импорт', exact: true }).click();
    const chooser = await chooserPromise;
    await chooser.setFiles({
      name: 'statement.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(
        'Имя счёта;Дата операции;Сумма в валюте счёта;Описание\n' +
          'Счёт из банка;28.09.2026;-10,00;Покупка',
      ),
    });
    return page.getByTestId('import-transactions-modal');
  }

  const modal = await uploadStatement();
  await expect(modal).toContainText('Не настроены счета: Счёт из банка');
  await expect(
    modal.getByRole('button', { name: /Импортировать/ }),
  ).toBeDisabled();
  await modal.getByRole('button', { name: 'Настроить импорт' }).click();

  const settings = page.getByTestId('settings');
  await expect(settings).toContainText('Счета в файле');
  await settings.getByRole('button', { name: 'Счёт из банка' }).click();
  await page
    .getByRole('button', { name: 'Домашний счёт', exact: true })
    .click();
  await settings.getByRole('button', { name: 'Сохранить шаблон' }).click();
  await expect(settings).toContainText('Сохранено');

  await page.getByRole('link', { name: 'Все счета' }).first().click();
  const nextModal = await uploadStatement();
  await expect(
    nextModal.getByRole('button', { name: /Импортировать 1/ }),
  ).toBeEnabled();
  await nextModal.getByRole('button', { name: /Импортировать 1/ }).click();
  await expect(nextModal).toHaveCount(0);
  await expect(page.getByText('Покупка')).toBeVisible();
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

test('saved CSV settings are editable and applied to the next upload', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
  await page.getByRole('button', { name: 'Добавить счёт' }).click();
  await page.getByLabel('Название').fill('Счёт для шаблона');
  await page.getByRole('button', { name: 'Создать', exact: true }).click();
  await page.getByRole('link', { name: 'Все счета' }).first().click();

  async function uploadStatement() {
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Импорт', exact: true }).click();
    const chooser = await chooserPromise;
    await chooser.setFiles({
      name: 'statement.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(
        'Имя счёта;Дата операции;Сумма операции;Сумма в валюте счёта;Описание;Сообщение;Метка\n' +
          'Счёт для шаблона;28.09.2026;-10,00;-10,00;Покупка;заказ;метка',
      ),
    });
    return page.getByTestId('import-transactions-modal');
  }

  const modal = await uploadStatement();
  await modal.getByText('Поля заметки: 1').click();
  await modal.getByLabel('Метка').check();
  await expect(modal.locator('#csv-delimiter-select')).toHaveCount(0);
  await expect(modal.locator('#form_flip')).toHaveCount(0);
  await modal.getByRole('button', { name: 'Настроить импорт' }).click();
  await expect(modal).toHaveCount(0);
  await expect(page).toHaveURL(/\/settings\?importAccount=all/);
  const settings = page.getByTestId('settings');
  await expect(settings).toContainText('Настройки импорта выписок');
  await expect(settings).toContainText('Поля заметки: 2');
  await settings.locator('#saved-import-pairs-all').uncheck();
  await settings.getByRole('button', { name: 'Сохранить шаблон' }).click();
  await expect(settings).toContainText('Сохранено');
  await settings.getByRole('button', { name: 'Добавить правило' }).click();
  await settings
    .getByRole('textbox', { name: 'Значение условия 1' })
    .fill('Покупка');
  await settings.getByRole('button', { name: 'Добавить условие' }).click();
  await settings.getByRole('button', { name: 'Поле условия 2' }).click();
  await page.getByRole('button', { name: 'CSV: Сообщение' }).click();
  await settings
    .getByRole('textbox', { name: 'Значение условия 2' })
    .fill('заказ');
  const categorySearch = settings.getByRole('textbox', {
    name: 'Поиск категории',
  });
  await categorySearch.scrollIntoViewIfNeeded();
  await categorySearch.fill('Food');
  await settings
    .getByTestId('import-category-results')
    .getByRole('button', { name: 'Usual Expenses · Food' })
    .click();
  await expect(
    settings.getByTestId('import-category-rule-editor'),
  ).toMatchThemeScreenshots();
  await settings.getByRole('button', { name: 'Сохранить правило' }).click();
  await expect(settings).toContainText('Описание содержит Покупка');
  await expect(settings).toContainText('Сообщение содержит заказ');
  await expect(
    settings.getByTestId('import-category-settings'),
  ).toMatchThemeScreenshots();

  await page.getByRole('link', { name: 'Все счета' }).first().click();
  const nextModal = await uploadStatement();
  await expect(nextModal).toContainText('Поля заметки: 2');
  await expect(nextModal.locator('#auto-exclude-pairs')).toHaveCount(0);
  await expect(
    nextModal.getByTestId('row').filter({ hasText: 'Покупка' }),
  ).toContainText('Food');
  await nextModal.getByRole('button', { name: /Импортировать 1/ }).click();
  await expect(nextModal).toHaveCount(0);
  await expect(
    page.getByTestId('row').filter({ hasText: 'Покупка' }),
  ).toContainText('Food');
});

test('many saved category rules remain readable and scrollable', async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
  await page.getByRole('link', { name: 'Настройки', exact: true }).click();

  const card = page.getByTestId('import-category-settings');
  for (let index = 1; index <= 12; index++) {
    await card.getByRole('button', { name: 'Добавить правило' }).click();
    await card
      .getByRole('textbox', { name: 'Значение условия 1' })
      .fill(`Магазин ${index}`);
    await card.getByRole('textbox', { name: 'Поиск категории' }).fill('Food');
    await card
      .getByTestId('import-category-results')
      .getByRole('button', { name: 'Usual Expenses · Food' })
      .click();
    await card.getByRole('button', { name: 'Сохранить правило' }).click();
    await expect(card).toContainText(`Магазин ${index}`);
  }

  const list = card.getByTestId('import-category-rule-list');
  const rows = list.getByTestId('import-category-rule-row');
  await expect(rows).toHaveCount(12);
  const geometry = await list.evaluate(element => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    firstRowHeight: element.firstElementChild?.getBoundingClientRect().height,
  }));
  expect(geometry.firstRowHeight).toBeGreaterThanOrEqual(52);
  expect(geometry.scrollHeight).toBeGreaterThan(geometry.clientHeight);
  await rows
    .first()
    .getByRole('button', { name: /Действия с правилом/ })
    .click();
  await page.getByRole('button', { name: 'Ниже', exact: true }).click();
  await expect(rows.first()).toContainText('Магазин 11');
  await rows
    .first()
    .getByRole('button', { name: /Изменить правило/ })
    .click();
  await expect(
    card.getByRole('textbox', { name: 'Значение условия 1' }),
  ).toHaveValue('Магазин 11');
  await card.getByRole('button', { name: 'Отмена' }).click();
  await rows.last().scrollIntoViewIfNeeded();
  await expect(rows.last()).toBeVisible();
  await list.evaluate(element => {
    element.scrollTop = 0;
  });
  await expect(card).toMatchThemeScreenshots();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(card).toMatchThemeScreenshots();
});

test('category rule search selects a category directly', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
  await page.getByRole('link', { name: 'Настройки', exact: true }).click();

  const card = page.getByTestId('import-category-settings');
  await card.getByRole('button', { name: 'Добавить правило' }).click();
  await card
    .getByRole('textbox', { name: 'Значение условия 1' })
    .fill('Магазин');
  await card.getByRole('textbox', { name: 'Поиск категории' }).fill('Food');
  await card
    .getByTestId('import-category-results')
    .getByRole('button', { name: 'Usual Expenses · Food' })
    .click();

  await expect(
    card.getByRole('button', { name: 'Сохранить правило' }),
  ).toBeEnabled();
});
