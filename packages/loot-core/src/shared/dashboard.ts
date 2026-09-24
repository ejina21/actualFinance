import type { NewDashboardWidgetEntity } from '#types/models';

export const DEFAULT_DASHBOARD_STATE: NewDashboardWidgetEntity[] = [
  // Top row: Key metrics at a glance
  {
    type: 'summary-card',
    width: 3,
    height: 2,
    x: 0,
    y: 0,
    meta: {
      name: 'Общий доход с начала года',
      content: JSON.stringify({
        type: 'sum',
        fontSize: 20,
      }),
      timeFrame: {
        start: '2024-01-01',
        end: '2024-12-31',
        mode: 'yearToDate',
      },
      conditions: [
        {
          field: 'amount',
          op: 'gt',
          value: 0,
        },
        {
          field: 'account',
          op: 'onBudget',
          value: '',
        },
        {
          field: 'transfer',
          op: 'is',
          value: false,
        },
      ],
      conditionsOp: 'and',
    },
  },
  {
    type: 'summary-card',
    width: 3,
    height: 2,
    x: 3,
    y: 0,
    meta: {
      name: 'Общие расходы с начала года',
      content: JSON.stringify({
        type: 'sum',
        fontSize: 20,
      }),
      timeFrame: {
        start: '2024-01-01',
        end: '2024-12-31',
        mode: 'yearToDate',
      },
      conditions: [
        {
          field: 'amount',
          op: 'lt',
          value: 0,
        },
        {
          field: 'account',
          op: 'onBudget',
          value: '',
        },
        {
          field: 'transfer',
          op: 'is',
          value: false,
        },
      ],
      conditionsOp: 'and',
    },
  },
  {
    type: 'summary-card',
    width: 3,
    height: 2,
    x: 6,
    y: 0,
    meta: {
      name: 'В среднем за месяц',
      content: JSON.stringify({
        type: 'avgPerMonth',
        fontSize: 20,
      }),
      timeFrame: {
        start: '2024-01-01',
        end: '2024-12-31',
        mode: 'yearToDate',
      },
      conditions: [
        {
          field: 'amount',
          op: 'lt',
          value: 0,
        },
        {
          field: 'account',
          op: 'onBudget',
          value: '',
        },
        {
          field: 'transfer',
          op: 'is',
          value: false,
        },
      ],
      conditionsOp: 'and',
    },
  },
  {
    type: 'summary-card',
    width: 3,
    height: 2,
    x: 9,
    y: 0,
    meta: {
      name: 'В среднем за операцию',
      content: JSON.stringify({
        type: 'avgPerTransact',
        fontSize: 20,
      }),
      timeFrame: {
        start: '2024-01-01',
        end: '2024-12-31',
        mode: 'yearToDate',
      },
      conditions: [
        {
          field: 'amount',
          op: 'lt',
          value: 0,
        },
        {
          field: 'account',
          op: 'onBudget',
          value: '',
        },
        {
          field: 'transfer',
          op: 'is',
          value: false,
        },
      ],
      conditionsOp: 'and',
    },
  },
  // Second row: Net worth and cash flow side by side
  {
    type: 'net-worth-card',
    width: 6,
    height: 2,
    x: 0,
    y: 2,
    meta: null,
  },
  {
    type: 'cash-flow-card',
    width: 6,
    height: 2,
    x: 6,
    y: 2,
    meta: null,
  },
  // Third row: Spending comparisons
  {
    type: 'spending-card',
    width: 4,
    height: 2,
    x: 0,
    y: 5,
    meta: {
      name: 'Этот месяц',
      mode: 'single-month',
    },
  },
  {
    type: 'spending-card',
    width: 4,
    height: 2,
    x: 4,
    y: 5,
    meta: {
      name: 'Обзор бюджета',
      mode: 'budget',
    },
  },
  {
    type: 'spending-card',
    width: 4,
    height: 2,
    x: 8,
    y: 5,
    meta: {
      name: 'Среднее за 3 месяца',
      mode: 'average',
    },
  },
  // Fourth row: Calendar and savings rate
  {
    type: 'calendar-card',
    width: 8,
    height: 4,
    x: 0,
    y: 8,
    meta: {
      name: 'Календарь операций',
      timeFrame: {
        start: '2024-01-01',
        end: '2024-03-31',
        mode: 'sliding-window',
      },
      conditions: [
        {
          field: 'transfer',
          op: 'is',
          value: false,
        },
      ],
      conditionsOp: 'and',
    },
  },
  {
    type: 'summary-card',
    width: 4,
    height: 2,
    x: 8,
    y: 8,
    meta: {
      name: 'Изменение капитала за последнее время',
      content: JSON.stringify({
        type: 'sum',
        fontSize: 32,
      }),
      timeFrame: {
        start: '2024-01-01',
        end: '2024-03-31',
        mode: 'sliding-window',
      },
      conditions: [],
      conditionsOp: 'and',
    },
  },
  {
    type: 'markdown-card',
    width: 4,
    height: 2,
    x: 8,
    y: 10,
    meta: {
      content:
        '## Подсказки по панели отчётов\n\nДобавляйте виджеты и редактируйте существующие с помощью кнопок в верхней части страницы. Выберите тип виджета и настройте его под себя.\n\n**Перемещение карточек:** Перетащите карточку за заголовок.\n\n**Удаление карточек:** Откройте меню с тремя точками на карточке и выберите «Удалить».',
    },
  },
];
