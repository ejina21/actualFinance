import { findImportCategory, parseCategoryRuleTable } from './categoryRules';

describe('import category rules', () => {
  const categories = [
    { id: 'food', name: 'Продукты', group: 'essential' },
    { id: 'income', name: 'Возвраты', group: 'income-group' },
  ];
  const groups = [
    { id: 'essential', name: 'Расходы' },
    { id: 'income-group', name: 'Доходы' },
  ];

  it('reads merchant, group and category from a pasted Markdown table', () => {
    const rules = parseCategoryRuleTable(
      '| Магазин | ДОМ | Расходы | Продукты |\n' +
        '| --- | --- | --- | --- |\n' +
        '| Возврат покупки | ДОМ | Доходы | Возвраты |',
    );

    expect(rules).toEqual([
      {
        payee: 'Магазин',
        group: 'Расходы',
        category: 'Продукты',
      },
      { payee: 'Возврат покупки', group: 'Доходы', category: 'Возвраты' },
    ]);
  });

  it('matches normalized payees only to a real category in the budget', () => {
    const rules = [
      {
        payee: 'Магазин',
        group: 'Расходы',
        category: 'Продукты',
      },
      { payee: 'Другой магазин', group: 'Расходы', category: 'Не существует' },
    ];

    expect(findImportCategory('  МАГАЗИН ', rules, categories, groups)).toBe(
      'food',
    );
    expect(findImportCategory('Другой магазин', rules, categories, groups)).toBeNull();
    expect(
      findImportCategory('Магазин доставка', rules, categories, groups),
    ).toBeNull();
  });
});
