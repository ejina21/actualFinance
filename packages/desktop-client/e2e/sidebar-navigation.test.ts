import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

test('keeps sidebar destinations, account search and keyboard focus available', async ({
  browser,
}) => {
  const page: Page = await browser.newPage();

  try {
    await page.goto('/');
    await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
    await page.getByRole('link', { name: 'Обзор', exact: true }).click();

    const sidebar = page.getByRole('navigation', { name: 'Боковая панель' });
    for (const [name, destination] of [
      ['Обзор', '/overview'],
      ['Бюджет', '/budget'],
      ['Операции', '/accounts'],
      ['Отчеты', '/reports'],
      ['Расписания', '/schedules'],
      ['Настройки', '/settings'],
    ]) {
      await expect(
        sidebar.getByRole('link', { name, exact: true }),
      ).toHaveAttribute('href', destination);
    }

    const overview = sidebar.getByRole('link', { name: 'Обзор', exact: true });
    await page.keyboard.press('Tab');
    await overview.focus();
    await expect(overview).toHaveCSS('outline-style', 'solid');

    await sidebar.getByRole('button', { name: 'Дополнительно' }).click();
    for (const destination of ['/payees', '/rules', '/tags']) {
      await expect(sidebar.locator(`a[href="${destination}"]`)).toBeVisible();
    }

    await sidebar.getByRole('button', { name: 'Найти счёт' }).click();
    const search = sidebar.getByRole('textbox', { name: 'Найти счёт' });
    await search.fill('Ally Savings');
    await expect(
      sidebar.getByRole('row', { name: /Ally Savings/ }),
    ).toBeVisible();
    await sidebar.getByRole('button', { name: 'Закрыть поиск' }).click();
    await expect(
      page.getByTestId('sidebar-all-accounts-balance'),
    ).toBeVisible();

    await sidebar
      .getByRole('button', { name: 'Открепить боковую панель' })
      .click();
    await expect(
      sidebar.getByRole('button', { name: 'Закрепить боковую панель' }),
    ).toBeVisible();
    await expect(
      sidebar.getByRole('row', { name: /Ally Savings/ }),
    ).toBeVisible();
  } finally {
    await page.close();
  }
});
