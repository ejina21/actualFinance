import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

test('shows the overview and live account sidebar', async ({ browser }) => {
  const page: Page = await browser.newPage();

  try {
    await page.goto('/');
    await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
    await page.getByRole('link', { name: 'Обзор', exact: true }).click();

    const main = page.getByRole('main');
    await expect(main.getByText('Последние операции')).toBeVisible();
    await expect(main.getByRole('progressbar')).toBeVisible();
    const trend = main.getByTestId('overview-trend');
    await expect(trend.getByText('Доходы и расходы по месяцам')).toBeVisible();
    await expect(
      trend
        .getByRole('img')
        .first()
        .or(trend.getByText('За этот период операций нет.')),
    ).toBeVisible();
    await expect(
      page.getByTestId('sidebar-all-accounts-balance'),
    ).toBeVisible();

    await expect(main).toMatchThemeScreenshots();
    await expect(page.locator('.sidebar-redesign')).toMatchThemeScreenshots();
  } finally {
    await page.close();
  }
});

test('keeps the finance trend readable on a narrow screen', async ({
  browser,
}) => {
  const page: Page = await browser.newPage();

  try {
    await page.goto('/');
    await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
    await page.getByRole('link', { name: 'Обзор', exact: true }).click();
    await page.setViewportSize({ width: 390, height: 1100 });

    const trend = page.getByTestId('overview-trend');
    await expect(trend.getByText('Доходы и расходы по месяцам')).toBeVisible();
    await expect(
      trend
        .getByRole('img')
        .first()
        .or(trend.getByText('За этот период операций нет.')),
    ).toBeVisible();
    await trend.scrollIntoViewIfNeeded();
    await expect(trend).toMatchThemeScreenshots();
  } finally {
    await page.close();
  }
});
