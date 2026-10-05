import {
  detectCsvImportBankId,
  findImportCategory,
  readCategoryRules,
} from './categoryRules';

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

  it('matches legacy recipient rules against the original T-Bank description', () => {
    const rules = readCategoryRules({
      'csv-category-rules': JSON.stringify([
        { payee: 'Магазин', group: 'Расходы', category: 'Продукты' },
      ]),
    });

    expect(
      findImportCategory(
        {
          payee: 'Другой получатель',
          bankId: 'tbank',
          columns: { Описание: 'Магазин', 'Имя счёта': 'Карта' },
        },
        rules,
        categories,
        groups,
      ),
    ).toBe('food');
    expect(
      findImportCategory(
        { payee: 'Другой получатель', bankId: 'alfabank' },
        rules,
        categories,
        groups,
      ),
    ).toBeNull();
  });

  it('requires every source-column condition within the selected bank', () => {
    const rules = readCategoryRules({
      'csv-category-rules': JSON.stringify([
        {
          bankId: 'tbank',
          conditions: [
            {
              field: 'csv',
              column: 'Описание',
              op: 'contains',
              value: 'Магазин',
            },
            { field: 'csv', column: 'MCC', op: 'is', value: '5411' },
            { field: 'amount', op: 'lessThan', value: '0' },
          ],
          group: 'Расходы',
          category: 'Продукты',
        },
      ]),
    });
    const transaction = {
      bankId: 'tbank',
      columns: { Описание: 'Магазин у дома', MCC: '5411' },
      amount: -100,
    };

    expect(rules).toHaveLength(1);
    expect(findImportCategory(transaction, rules, categories, groups)).toBe(
      'food',
    );
    expect(
      findImportCategory(
        { ...transaction, columns: { ...transaction.columns, MCC: '5812' } },
        rules,
        categories,
        groups,
      ),
    ).toBeNull();
    expect(
      findImportCategory(
        { ...transaction, bankId: 'alfabank' },
        rules,
        categories,
        groups,
      ),
    ).toBeNull();
  });

  it('recognizes T-Bank from its CSV headings and preserves other bank selections', () => {
    expect(
      detectCsvImportBankId({
        Описание: 'Магазин',
        'Имя счёта': 'Карта',
        'Сумма операции': '-100',
      }),
    ).toBe('tbank');
    expect(detectCsvImportBankId({ Описание: 'Магазин' }, 'alfabank')).toBe(
      'alfabank',
    );
    expect(detectCsvImportBankId({ Описание: 'Магазин' })).toBeNull();
  });
});
