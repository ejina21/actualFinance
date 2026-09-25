import { expect, test } from './fixtures';

test('opens Итого by default and keeps planning values when switching views', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: /Try the demo|Открыть демоверсию/ })
    .click();

  const summary = page.getByTestId('finance-summary');
  await expect(summary).toBeVisible();
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
    summary.getByTestId('finance-summary-scroll'),
  ).toMatchThemeScreenshots();

  await page.getByRole('button', { name: /Envelope|Конверты/ }).click();
  await expect(page.getByTestId('budget-table')).toBeVisible();
  await page.getByRole('button', { name: /Summary|Итого/ }).click();
  await expect(summary).toBeVisible();
});

test('selects a year, custom range, and two comparison months independently', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: /Try the demo|Открыть демоверсию/ })
    .click();
  const summary = page.getByTestId('finance-summary');

  await summary.getByRole('button', { name: /Year|Год/ }).click();
  await summary.getByRole('spinbutton', { name: /Year|Год/ }).fill('2016');
  await expect(
    summary.getByRole('columnheader', { name: /average|среднем/i }),
  ).toBeVisible();
  await expect(
    summary.getByRole('columnheader', { name: /January|Январь/i }),
  ).toBeVisible();

  await summary
    .getByRole('button', { name: /Custom period|Произвольный период/ })
    .click();
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
  await expect(
    summary.getByRole('button', { name: /Custom period|Произвольный период/ }),
  ).toHaveAttribute('aria-pressed', 'true');
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
    summary.getByRole('button', { name: /Custom period|Произвольный период/ }),
  ).toBeVisible();
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
    .getByRole('button', { name: /Custom period|Произвольный период/ })
    .click();
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
