import { findImportCategory, readCategoryRules } from './categoryRules';

describe('import category rules', () => {
  const categories = [
    { id: 'food', name: 'Продукты', group: 'essential' },
    { id: 'income', name: 'Возвраты', group: 'income-group' },
  ];
  const groups = [
    { id: 'essential', name: 'Расходы' },
    { id: 'income-group', name: 'Доходы' },
  ];

  it('keeps saved merchant mappings as editable exact-match conditions', () => {
    const rules = readCategoryRules({
      'csv-category-rules': JSON.stringify([
        {
          payee: 'Магазин',
          group: 'Расходы',
          category: 'Продукты',
        },
      ]),
    });
    expect(rules).toEqual([
      {
        conditions: [{ field: 'payee', op: 'is', value: 'Магазин' }],
        group: 'Расходы',
        category: 'Продукты',
      },
    ]);
  });

  it('matches every condition against the imported operation', () => {
    const rules = readCategoryRules({
      'csv-category-rules': JSON.stringify([
        {
          conditions: [
            { field: 'payee', op: 'contains', value: 'Магазин' },
            { field: 'notes', op: 'contains', value: 'доставка' },
            { field: 'account', op: 'is', value: 'Основной счёт' },
          ],
          group: 'Расходы',
          category: 'Продукты',
        },
      ]),
    });
    expect(
      findImportCategory(
        {
          payee: 'МАГАЗИН доставка',
          notes: 'Быстрая доставка',
          account: 'Основной счёт',
          amount: -100,
        },
        rules,
        categories,
        groups,
      ),
    ).toBe('food');
    expect(
      findImportCategory(
        {
          payee: 'Магазин доставка',
          notes: 'Быстрая доставка',
          account: 'Другой счёт',
          amount: -100,
        },
        rules,
        categories,
        groups,
      ),
    ).toBeNull();
  });

  it('compares signed amounts and skips categories missing from the budget', () => {
    const rules = readCategoryRules({
      'csv-category-rules': JSON.stringify([
        {
          conditions: [{ field: 'amount', op: 'lessThan', value: '-500' }],
          group: 'Расходы',
          category: 'Не существует',
        },
        {
          conditions: [{ field: 'amount', op: 'lessThan', value: '-500' }],
          group: 'Расходы',
          category: 'Продукты',
        },
      ]),
    });
    expect(
      findImportCategory(
        { payee: '', notes: '', account: '', amount: -600 },
        rules,
        categories,
        groups,
      ),
    ).toBe('food');
    expect(
      findImportCategory(
        { payee: '', notes: '', account: '', amount: -400 },
        rules,
        categories,
        groups,
      ),
    ).toBeNull();
  });
});
