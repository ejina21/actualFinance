import { expect, test } from './fixtures';

test('opens the finance report by default without redundant page title', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: /Try the demo|Открыть демоверсию/ })
    .click();

  const summary = page.getByTestId('finance-summary');
  await expect(summary).toBeVisible();
  await expect(
    page.getByRole('main').getByText('Итого', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', {
      name: /Budget|Бюджет/,
      level: 1,
      hidden: true,
    }),
  ).toBeAttached();
  await expect(
    summary.getByRole('table', { name: /Cash flow|Денежный поток/ }),
  ).toBeVisible();
  await expect(
    summary.getByRole('columnheader', { name: /Total|Всего/ }),
  ).toBeVisible();
  await expect(summary.getByRole('columnheader', { name: '31' })).toBeVisible();
  await expect(
    summary.getByTestId('finance-summary-cards'),
  ).toMatchThemeScreenshots();
  await expect(
    summary.getByTestId('finance-summary-controls'),
  ).toMatchThemeScreenshots();
  await expect(
    summary.getByTestId('finance-summary-scroll'),
  ).toMatchThemeScreenshots();
});

test('selects a year, custom range, and two comparison months independently', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page
    .getByRole('button', { name: /Try the demo|Открыть демоверсию/ })
    .click();
  const summary = page.getByTestId('finance-summary');
  const periodControl = summary.getByRole('combobox', {
    name: /Summary period|Период отчёта/,
  });
  const addMonth = summary.getByRole('button', {
    name: /Add month|Добавить месяц/,
  });
  const periodBox = await periodControl.boundingBox();
  const addMonthBox = await addMonth.boundingBox();
  if (!periodBox || !addMonthBox) {
    throw new Error('Summary controls are not visible');
  }
  expect(
    Math.abs(
      periodBox.y + periodBox.height - addMonthBox.y - addMonthBox.height,
    ),
  ).toBeLessThan(3);

  await summary
    .getByRole('combobox', { name: /Summary period|Период отчёта/ })
    .selectOption('year');
  await summary.getByRole('spinbutton', { name: /Year|Год/ }).fill('2016');
  await expect(
    summary.getByRole('columnheader', { name: /average|среднем/i }),
  ).toBeVisible();
  await expect(
    summary.getByRole('columnheader', { name: /January|Январь/i }),
  ).toBeVisible();

  await summary
    .getByRole('combobox', { name: /Summary period|Период отчёта/ })
    .selectOption('range');
  await summary
    .getByRole('textbox', { name: 'От', exact: true })
    .fill('2016-01-15');
  await summary
    .getByRole('textbox', { name: 'До', exact: true })
    .fill('2016-03-03');
  await expect(
    summary.getByRole('columnheader', { name: /March|Март/i }),
  ).toBeVisible();

  await summary.getByLabel(/Base month|Базовый месяц/).fill('2016-01');
  await summary
    .getByLabel(/Compare with month|Сравнить с месяцем/)
    .fill('2016-02');
  await summary
    .getByRole('button', { name: /Add month|Добавить месяц/ })
    .click();
  await summary
    .getByLabel(/Compare with month|Сравнить с месяцем/)
    .fill('2016-03');
  await summary
    .getByRole('button', { name: /Add month|Добавить месяц/ })
    .click();
  await expect(
    summary.getByRole('columnheader', { name: '2016-02' }),
  ).toBeVisible();
  await expect(
    summary.getByRole('columnheader', { name: '2016-03' }),
  ).toBeVisible();
  const netFlowRow = summary.getByTestId('finance-summary-net-flow-row');
  await expect(netFlowRow).toBeVisible();
  await expect(netFlowRow.getByRole('rowheader')).toHaveText(
    /Net flow|Разница/,
  );
  await expect(netFlowRow.locator('td')).toHaveCount(11);
  await summary.getByLabel(/Base month|Базовый месяц/).fill('2099-01');
  await expect(netFlowRow.locator('td').nth(6)).toHaveText(
    (await netFlowRow.locator('td').nth(5).textContent()) ?? '',
  );
  await expect(netFlowRow.locator('td').nth(9)).toHaveText(
    (await netFlowRow.locator('td').nth(8).textContent()) ?? '',
  );
  await expect(netFlowRow.locator('td').nth(7)).toHaveText('—');
  await expect(netFlowRow.locator('td').nth(10)).toHaveText('—');
  await expect(
    summary.getByRole('combobox', { name: /Summary period|Период отчёта/ }),
  ).toHaveValue('range');
  await page
    .getByRole('button', {
      name: /Включить приватный режим|Enable privacy mode/,
    })
    .click();
  await expect(
    summary.getByTestId('finance-summary-cards').locator('strong').first(),
  ).toContainText('••••');
  await expect(
    summary
      .getByRole('table', { name: /Cash flow|Денежный поток/ })
      .locator('tbody td')
      .filter({ hasText: '••••' })
      .first(),
  ).toBeVisible();
});

test('keeps summary controls and row labels reachable on a narrow screen', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page
    .getByRole('button', { name: /Try the demo|Открыть демоверсию/ })
    .click();
  const summary = page.getByTestId('finance-summary');
  await expect(
    summary.getByRole('combobox', { name: /Summary period|Период отчёта/ }),
  ).toBeVisible();
  const navigation = summary.getByTestId('finance-summary-period-navigation');
  await expect(navigation).toBeVisible();
  const previous = await navigation
    .getByRole('button', { name: /Previous period|Предыдущий период/ })
    .boundingBox();
  const next = await navigation
    .getByRole('button', { name: /Next period|Следующий период/ })
    .boundingBox();
  if (!previous || !next) {
    throw new Error('Period navigation is not visible');
  }
  expect(Math.abs(previous.y - next.y)).toBeLessThan(3);
  await expect(
    summary.getByTestId('finance-summary-controls'),
  ).toMatchThemeScreenshots();
  await expect(
    summary.getByRole('table', { name: /Cash flow|Денежный поток/ }),
  ).toBeVisible();
  await expect(
    summary.getByTestId('finance-summary-scroll'),
  ).toMatchThemeScreenshots();
});

test('pages monthly columns for a long custom period without truncating its totals', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: /Try the demo|Открыть демоверсию/ })
    .click();
  const summary = page.getByTestId('finance-summary');
  await summary
    .getByRole('combobox', { name: /Summary period|Период отчёта/ })
    .selectOption('range');
  await summary
    .getByRole('textbox', { name: 'От', exact: true })
    .fill('2016-01-01');
  await summary
    .getByRole('textbox', { name: 'До', exact: true })
    .fill('2020-12-31');
  await expect(summary.getByText('2016-01 — 2016-12')).toBeVisible();
  await summary
    .getByRole('button', { name: /Next months|Следующие месяцы/ })
    .click();
  await expect(summary.getByText('2017-01 — 2017-12')).toBeVisible();
  await expect(
    summary.getByRole('columnheader', { name: /Total|Всего/ }),
  ).toBeVisible();
});
