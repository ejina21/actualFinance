import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

async function expandNavigation(page: Page) {
  const nav = page.getByRole('navigation', { name: 'Мобильная навигация' });
  const navBox = await nav.boundingBox();
  if (!navBox) {
    throw new Error('Mobile navigation is not measurable');
  }
  const x = navBox.x + navBox.width / 2;
  const y = navBox.y + 12;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y - 210, { steps: 10 });
  await page.mouse.up();
  await expect(nav).toHaveAttribute('data-navbar-state', 'open');
  return nav;
}

test('mobile navigation exposes every main money view', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть демоверсию' }).click();

  const nav = page.getByRole('navigation', { name: 'Мобильная навигация' });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Бюджет' })).toBeVisible();
  await expect(page).toMatchThemeScreenshots();

  await expandNavigation(page);

  for (const name of [
    'Обзор',
    'Бюджет',
    'Счета',
    'Отчеты',
    'Расписания',
    'Настройки',
  ]) {
    await expect(nav.getByRole('link', { name, exact: true })).toBeVisible();
  }

  await nav.getByRole('link', { name: 'Счета', exact: true }).click();
  await expect(page.getByTestId('account-list-item').first()).toBeVisible();
  await expect(page).toMatchThemeScreenshots();
  await page.getByTestId('account-list-item').first().click();
  await expect(
    page.getByText('Bank of America', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('2 января 2017 г.')).toBeVisible();
  await expect(page).toMatchThemeScreenshots();
});

for (const [name, route] of [
  ['Отчеты', '/reports'],
  ['Расписания', '/schedules'],
  ['Настройки', '/settings'],
]) {
  test(`mobile navigation opens ${name}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
    const nav = await expandNavigation(page);
    await nav.getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${route}(?:/|$)`));
  });
}
