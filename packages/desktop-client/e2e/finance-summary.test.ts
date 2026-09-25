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

test('keeps category and total columns in place while scrolling through a period', async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
  const summary = page.getByTestId('finance-summary');
  const scroll = summary.getByTestId('finance-summary-scroll');
  const category = scroll.getByRole('columnheader', { name: 'Категория' });
  const total = scroll.getByRole('columnheader', { name: 'Всего' });
  const categoryAmount = scroll
    .getByRole('rowheader', { name: 'Food', exact: true })
    .locator('..')
    .locator('td')
    .first();
  const sectionRows = scroll
    .locator('tbody th[scope="rowgroup"]')
    .locator('..');

  for (const period of ['month', 'year', 'range'] as const) {
    if (period === 'year') {
      await summary
        .getByRole('combobox', { name: 'Период отчёта' })
        .selectOption('year');
    } else if (period === 'range') {
      await summary
        .getByRole('combobox', { name: 'Период отчёта' })
        .selectOption('range');
      await summary.getByLabel('От', { exact: true }).fill('2016-01-01');
      await summary.getByLabel('До', { exact: true }).fill('2017-12-31');
    }
    const categoryBefore = await category.boundingBox();
    const totalBefore = await total.boundingBox();
    const amountBefore = await categoryAmount.boundingBox();
    await expect(sectionRows).toHaveCount(2);
    const sectionAmountsBefore = await Promise.all(
      [0, 1].map(index =>
        sectionRows.nth(index).locator('td').first().boundingBox(),
      ),
    );
    if (!categoryBefore || !totalBefore || !amountBefore) {
      throw new Error('The fixed columns are missing');
    }
    expect(sectionAmountsBefore.every(Boolean)).toBe(true);
    await scroll.evaluate(element => {
      element.scrollLeft = 900;
    });
    await expect
      .poll(() => scroll.evaluate(element => element.scrollLeft))
      .toBeGreaterThan(0);
    const categoryAfter = await category.boundingBox();
    const totalAfter = await total.boundingBox();
    const amountAfter = await categoryAmount.boundingBox();
    const sectionAmountsAfter = await Promise.all(
      [0, 1].map(index =>
        sectionRows.nth(index).locator('td').first().boundingBox(),
      ),
    );
    if (!categoryAfter || !totalAfter || !amountAfter) {
      throw new Error('The fixed columns disappeared while scrolling');
    }
    expect(Math.abs(categoryAfter.x - categoryBefore.x)).toBeLessThan(2);
    expect(Math.abs(totalAfter.x - totalBefore.x)).toBeLessThan(2);
    expect(Math.abs(amountAfter.x - amountBefore.x)).toBeLessThan(2);
    for (const [index, amount] of sectionAmountsAfter.entries()) {
      expect(amount).not.toBeNull();
      expect(
        Math.abs((amount?.x ?? 0) - (sectionAmountsBefore[index]?.x ?? 0)),
      ).toBeLessThan(2);
      expect(Math.abs((amount?.x ?? 0) - totalAfter.x)).toBeLessThan(2);
    }
    await expect(category).toBeInViewport();
    await expect(total).toBeInViewport();
  }
  await expect(scroll).toMatchThemeScreenshots();
  await page.setViewportSize({ width: 390, height: 844 });
  await summary
    .getByRole('combobox', { name: 'Период отчёта' })
    .selectOption('month');
  await expect(
    scroll.getByRole('columnheader', { name: '1', exact: true }),
  ).toBeInViewport({ ratio: 0.5 });
  const mobileCategory = await category.boundingBox();
  const mobileTotal = await total.boundingBox();
  const mobileSectionAmounts = await Promise.all(
    [0, 1].map(index =>
      sectionRows.nth(index).locator('td').first().boundingBox(),
    ),
  );
  if (!mobileCategory || !mobileTotal) {
    throw new Error('The mobile fixed columns are missing');
  }
  await scroll.evaluate(element => {
    element.scrollLeft = 900;
  });
  const mobileCategoryAfter = await category.boundingBox();
  const mobileTotalAfter = await total.boundingBox();
  const mobileSectionAmountsAfter = await Promise.all(
    [0, 1].map(index =>
      sectionRows.nth(index).locator('td').first().boundingBox(),
    ),
  );
  if (!mobileCategoryAfter || !mobileTotalAfter) {
    throw new Error('The mobile fixed columns disappeared while scrolling');
  }
  expect(Math.abs(mobileCategoryAfter.x - mobileCategory.x)).toBeLessThan(2);
  expect(Math.abs(mobileTotalAfter.x - mobileTotal.x)).toBeLessThan(2);
  for (const [index, amount] of mobileSectionAmountsAfter.entries()) {
    expect(amount).not.toBeNull();
    expect(
      Math.abs((amount?.x ?? 0) - (mobileSectionAmounts[index]?.x ?? 0)),
    ).toBeLessThan(2);
  }
});

test('colors the net difference by sign across summary totals', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
  const summary = page.getByTestId('finance-summary');
  await summary
    .getByRole('combobox', { name: 'Период отчёта' })
    .selectOption('year');
  await summary
    .getByRole('spinbutton', { name: 'Год', exact: true })
    .fill('2016');

  const colors = await page.evaluate(() => {
    const probe = document.createElement('span');
    document.body.append(probe);
    const resolve = (token: string) => {
      probe.style.color = `var(--color-${token})`;
      return getComputedStyle(probe).color;
    };
    const result = {
      positive: resolve('numberPositive'),
      negative: resolve('numberNegative'),
      accentPositive: resolve('financeAccentPositive'),
      accentNegative: resolve('financeAccentNegative'),
      neutral: resolve('pageText'),
    };
    probe.remove();
    return result;
  });
  const netCells = summary
    .getByTestId('finance-summary-net-flow-row')
    .getByRole('cell');
  const amounts = (await netCells.allTextContents()).map(text =>
    Number(text.trim().replaceAll(',', '').replaceAll('−', '-')),
  );
  expect(amounts.some(value => value > 0)).toBe(true);
  expect(amounts.some(value => value < 0)).toBe(true);
  for (const [index, value] of amounts.entries()) {
    const positiveColor = index === 0 ? colors.accentPositive : colors.positive;
    const negativeColor = index === 0 ? colors.accentNegative : colors.negative;
    await expect(netCells.nth(index)).toHaveCSS(
      'color',
      value > 0 ? positiveColor : value < 0 ? negativeColor : colors.neutral,
    );
  }
  const netCard = summary
    .getByTestId('finance-summary-cards')
    .getByText('Разница', { exact: true })
    .locator('..')
    .locator('strong');
  await expect(netCard).toHaveCSS(
    'color',
    amounts[0] > 0
      ? colors.positive
      : amounts[0] < 0
        ? colors.negative
        : colors.neutral,
  );
  await expect(
    summary.getByTestId('finance-summary-net-flow-row'),
  ).toMatchThemeScreenshots();

  const positiveIndex = amounts.findIndex(
    (value, index) => index >= 2 && value > 0,
  );
  const negativeIndex = amounts.findIndex(
    (value, index) => index >= 2 && value < 0,
  );
  expect(positiveIndex).toBeGreaterThanOrEqual(2);
  expect(negativeIndex).toBeGreaterThanOrEqual(2);
  const positiveMonth = `2016-${String(positiveIndex - 1).padStart(2, '0')}`;
  const negativeMonth = `2016-${String(negativeIndex - 1).padStart(2, '0')}`;

  await summary
    .getByRole('combobox', { name: 'Период отчёта' })
    .selectOption('month');
  await summary.getByLabel('месяц', { exact: true }).fill(negativeMonth);
  await expect(netCard).toHaveCSS('color', colors.negative);
  await expect(
    summary.getByTestId('finance-summary-cards'),
  ).toMatchThemeScreenshots();

  await summary
    .getByRole('button', { name: 'Сравнение месяцев', exact: true })
    .click();
  await summary.getByLabel('Базовый месяц').fill(positiveMonth);
  await summary.getByLabel('Сравнить с месяцем').fill(negativeMonth);
  await summary
    .getByRole('button', { name: 'Добавить месяц', exact: true })
    .click();
  const comparison = summary.getByTestId('finance-comparison-overview');
  const comparisonNet = comparison.getByTestId('comparison-netFlow');
  await expect(comparisonNet.getByRole('cell').first()).toHaveCSS(
    'color',
    colors.positive,
  );
  await expect(
    comparisonNet.getByRole('cell').last().getByTestId('comparison-value'),
  ).toHaveCSS('color', colors.negative);
  await expect(
    comparisonNet.getByRole('cell').last().getByTestId('comparison-change'),
  ).toHaveCSS('color', colors.negative);
  await expect(
    summary
      .getByTestId('finance-summary-net-flow-row')
      .getByRole('cell')
      .last()
      .getByTestId('comparison-value'),
  ).toHaveCSS('color', colors.negative);
  await expect(comparisonNet).toMatchThemeScreenshots();
});
