import { expect, test } from './fixtures';

test('opens the finance report by default without redundant page title', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
  const summary = page.getByTestId('finance-summary');
  await expect(summary).toBeVisible();
  await expect(
    page.getByRole('main').getByText('Итого', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Расходы', level: 1 }),
  ).toBeVisible();
  await expect(
    summary.getByTestId('finance-summary-cards').locator('strong').first(),
  ).toBeInViewport({ ratio: 1 });
  const cardsBox = await summary
    .getByTestId('finance-summary-cards')
    .boundingBox();
  const tableHeading = await summary
    .getByRole('heading', { name: 'Денежный поток', exact: true })
    .boundingBox();
  if (!cardsBox || !tableHeading) {
    throw new Error('Summary totals are not visible');
  }
  expect(cardsBox.y + cardsBox.height).toBeLessThanOrEqual(tableHeading.y);
  await expect(
    summary.getByRole('table', { name: 'Денежный поток по категориям' }),
  ).toBeVisible();
  await expect(
    summary.getByRole('columnheader', { name: '31', exact: true }),
  ).toBeVisible();
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

test('shows comparison immediately and preserves the selected report period', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
  const summary = page.getByTestId('finance-summary');
  await summary
    .getByRole('combobox', { name: 'Период отчёта' })
    .selectOption('year');
  await summary
    .getByRole('spinbutton', { name: 'Год', exact: true })
    .fill('2016');
  await expect(
    summary.getByRole('columnheader', { name: /среднем/ }),
  ).toBeVisible();
  await summary
    .getByRole('combobox', { name: 'Период отчёта' })
    .selectOption('range');
  await summary.getByLabel('От', { exact: true }).fill('2016-01-15');
  await summary.getByLabel('До', { exact: true }).fill('2016-03-03');
  await expect(
    summary.getByRole('columnheader', { name: /март/i }),
  ).toBeVisible();

  await summary
    .getByRole('button', { name: 'Сравнение месяцев', exact: true })
    .click();
  const comparison = summary.getByTestId('finance-comparison-overview');
  await expect(comparison).toBeInViewport();
  await expect(
    comparison.getByRole('columnheader', { name: /декабрь 2015/i }),
  ).toBeInViewport();
  await summary.getByLabel('Базовый месяц').fill('2099-01');
  await summary
    .getByRole('button', { name: 'Убрать месяц 2015-12 из сравнения' })
    .click();
  await expect(
    summary.getByText('Выберите месяц для сравнения.'),
  ).toBeVisible();
  await summary.getByLabel('Сравнить с месяцем').fill('2016-02');
  await summary
    .getByRole('button', { name: 'Добавить месяц', exact: true })
    .click();
  await expect(
    comparison.getByRole('columnheader', { name: /февраль 2016/i }),
  ).toBeInViewport();
  // The comparison is at the left edge, with no daily columns before it.
  const table = summary.getByTestId('finance-summary-scroll');
  expect(await table.evaluate(el => el.scrollLeft)).toBe(0);
  await expect(
    table.getByRole('columnheader', { name: /февраль 2016/i }),
  ).toBeInViewport();
  const net = comparison.getByTestId('comparison-netFlow');
  await expect(
    net.getByRole('cell').nth(1).getByTestId('comparison-value'),
  ).toHaveText(
    (await net
      .getByRole('cell')
      .nth(1)
      .getByTestId('comparison-change')
      .textContent()) ?? '',
  );
  await expect(net.getByRole('cell').nth(1)).toContainText('—');

  await summary.getByLabel('Сравнить с месяцем').fill('2016-03');
  await summary
    .getByRole('button', { name: 'Добавить месяц', exact: true })
    .click();
  await expect(
    comparison.getByRole('columnheader', { name: /март 2016/i }),
  ).toBeInViewport();
  await expect(
    summary.getByTestId('finance-summary-controls'),
  ).toMatchThemeScreenshots();
  await expect(comparison).toMatchThemeScreenshots();
  await expect(table).toMatchThemeScreenshots();

  await page.getByRole('button', { name: 'Включить приватный режим' }).click();
  await expect(comparison.getByRole('cell').first()).toContainText('••••');
  await expect(table.locator('tbody td').first()).toContainText('••••');
  await summary
    .getByRole('button', { name: 'Обзор периода', exact: true })
    .click();
  await expect(
    summary.getByRole('combobox', { name: 'Период отчёта' }),
  ).toHaveValue('range');
  await expect(summary.getByLabel('От', { exact: true })).toHaveValue(
    '2016-01-15',
  );
  await expect(summary.getByLabel('До', { exact: true })).toHaveValue(
    '2016-03-03',
  );
});

test('keeps summary controls and row labels reachable on a narrow screen', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
  const summary = page.getByTestId('finance-summary');
  const navigation = summary.getByTestId('finance-summary-period-navigation');
  const previous = await navigation
    .getByRole('button', { name: 'Предыдущий период' })
    .boundingBox();
  const next = await navigation
    .getByRole('button', { name: 'Следующий период' })
    .boundingBox();
  if (!previous || !next) throw new Error('Period navigation is not visible');
  expect(Math.abs(previous.y - next.y)).toBeLessThan(3);
  await expect(
    summary.getByTestId('finance-summary-controls'),
  ).toMatchThemeScreenshots();
  await expect(
    summary.getByTestId('finance-summary-scroll'),
  ).toMatchThemeScreenshots();
  await summary
    .getByRole('button', { name: 'Сравнение месяцев', exact: true })
    .click();
  await expect(
    summary.getByTestId('finance-comparison-overview'),
  ).toBeInViewport();
  await expect(summary).toMatchThemeScreenshots();
  expect(await summary.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
});

test('pages monthly columns for a long custom period without truncating its totals', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
  const summary = page.getByTestId('finance-summary');
  await summary
    .getByRole('combobox', { name: 'Период отчёта' })
    .selectOption('range');
  await summary.getByLabel('От', { exact: true }).fill('2016-01-01');
  await summary.getByLabel('До', { exact: true }).fill('2020-12-31');
  await expect(summary.getByText('2016-01 — 2016-12')).toBeVisible();
  await summary.getByRole('button', { name: 'Следующие месяцы' }).click();
  await expect(summary.getByText('2017-01 — 2017-12')).toBeVisible();
  await expect(
    summary.getByRole('columnheader', { name: 'Всего' }),
  ).toBeVisible();
});
