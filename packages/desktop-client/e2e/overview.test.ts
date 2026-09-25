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
    await expect(
      page.getByTestId('sidebar-all-accounts-balance'),
    ).toBeVisible();

    await expect(main).toMatchThemeScreenshots();
    await expect(page.locator('.sidebar-redesign')).toMatchThemeScreenshots();
  } finally {
    await page.close();
  }
});
