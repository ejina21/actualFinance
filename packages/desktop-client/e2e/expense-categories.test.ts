import { expect, test } from './fixtures';

for (const width of [1440, 390]) {
  test(`manages categories from Expenses at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Открыть демоверсию' }).click();
    await expect(page.getByTestId('finance-summary')).toBeVisible();
    await page.getByRole('button', { name: 'Категории', exact: true }).click();
    const manager = page.getByRole('dialog');
    await manager
      .getByRole('button', { name: 'Добавить группу', exact: true })
      .click();
    await manager
      .getByRole('textbox', { name: 'Название группы', exact: true })
      .fill('Тестовая группа');
    await manager
      .getByRole('button', { name: 'Сохранить', exact: true })
      .click();
    const group = manager.getByRole('region', {
      name: 'Тестовая группа',
      exact: true,
    });
    await group
      .getByRole('button', { name: 'Добавить категорию', exact: true })
      .click();
    await manager
      .getByRole('textbox', { name: 'Название категории', exact: true })
      .fill('Тестовая категория');
    await manager
      .getByRole('button', { name: 'Сохранить', exact: true })
      .click();
    await expect(
      group.getByText('Тестовая категория', { exact: true }),
    ).toBeVisible();
    const sample = await page.evaluate(async () => {
      const send = (
        window as unknown as {
          $send: <T>(type: string, args?: unknown) => Promise<T>;
        }
      ).$send;
      const { list } = await send<{ list: { id: string; name: string }[] }>(
        'get-categories',
      );
      const category = list.find(item => item.name === 'Тестовая категория');
      const accounts =
        await send<{ id: string; offbudget: boolean }[]>('accounts-get');
      const account = accounts.find(item => !item.offbudget);
      if (!category || !account) {
        throw new Error('Synthetic category or account missing');
      }
      const transactionId = crypto.randomUUID();
      await send('transaction-add', {
        id: transactionId,
        account: account.id,
        category: category.id,
        date: '2016-07-18',
        amount: -1234,
      });
      return { categoryId: category.id, accountId: account.id, transactionId };
    });
    await manager
      .getByRole('textbox', { name: 'Поиск групп и категорий' })
      .fill('Тестовая');
    await expect(manager).toMatchThemeScreenshots();

    await group
      .getByRole('button', {
        name: 'Изменить категорию Тестовая категория',
        exact: true,
      })
      .click();
    await manager
      .getByRole('textbox', { name: 'Название категории', exact: true })
      .fill('Обновлённая категория');
    await expect(manager).toMatchThemeScreenshots();
    await manager
      .getByRole('button', { name: 'Сохранить', exact: true })
      .click();
    await expect(
      group.getByText('Обновлённая категория', { exact: true }),
    ).toBeVisible();
    await group
      .getByRole('button', {
        name: 'Изменить группу Тестовая группа',
        exact: true,
      })
      .click();
    await manager
      .getByRole('textbox', { name: 'Название группы', exact: true })
      .fill('Новая группа');
    await manager
      .getByRole('button', { name: 'Сохранить', exact: true })
      .click();
    await manager
      .getByRole('textbox', { name: 'Поиск групп и категорий' })
      .fill('');
    const renamed = manager.getByRole('region', {
      name: 'Новая группа',
      exact: true,
    });
    await expect(renamed).toBeVisible();
    await manager
      .getByRole('button', { name: 'Добавить группу', exact: true })
      .click();
    await manager
      .getByRole('textbox', { name: 'Название группы', exact: true })
      .fill(' новая группа ');
    await manager
      .getByRole('button', { name: 'Сохранить', exact: true })
      .click();
    await expect(manager.getByRole('alert')).toContainText('уже существует');
    await manager
      .getByRole('button', { name: 'Отменить', exact: true })
      .click();
    await renamed
      .getByRole('button', {
        name: 'Переместить категорию Обновлённая категория',
        exact: true,
      })
      .click();
    const destination = manager.getByRole('combobox', {
      name: 'Группа категорий',
    });
    await expect(
      destination.locator('option').filter({ hasText: /^Income$/ }),
    ).toHaveCount(0);
    await destination.selectOption({ label: 'Usual Expenses' });
    await manager
      .getByRole('button', { name: 'Сохранить', exact: true })
      .click();
    await expect(
      manager
        .getByRole('region', { name: 'Usual Expenses', exact: true })
        .getByText('Обновлённая категория', { exact: true }),
    ).toBeVisible();
    await manager
      .getByRole('button', { name: 'Закрыть категории', exact: true })
      .click();
    await page.reload();
    await expect(page.getByTestId('finance-summary')).toBeVisible();
    await page.getByRole('button', { name: 'Категории', exact: true }).click();
    await expect(
      manager
        .getByRole('region', { name: 'Usual Expenses', exact: true })
        .getByText('Обновлённая категория', { exact: true }),
    ).toBeVisible();
    const persisted = await page.evaluate(async sample => {
      const send = (
        window as unknown as {
          $send: <T>(type: string, args?: unknown) => Promise<T>;
        }
      ).$send;
      const { list } = await send<{
        list: { id: string; name: string; group: string }[];
      }>('get-categories');
      const transactions = await send<
        { id: string; category: string; amount: number }[]
      >('api/transactions-get', { accountId: sample.accountId });
      return {
        category: list.find(item => item.id === sample.categoryId),
        transaction: transactions.find(
          item => item.id === sample.transactionId,
        ),
      };
    }, sample);
    expect(persisted.category?.name).toBe('Обновлённая категория');
    expect(persisted.transaction?.category).toBe(sample.categoryId);
    expect(persisted.transaction?.amount).toBe(-1234);
  });
}
