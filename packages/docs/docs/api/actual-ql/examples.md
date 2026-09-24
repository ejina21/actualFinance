# Примеры ActualQL {#actualql-examples}

## Поиск по месяцам или годам {#searching-by-month-or-year}

ActualQL поддерживает различные функции преобразования данных, а также возможность преобразования полевых данных. `{ $month: '2021-01-01' }` Возвращается с месяца `2021-01`Но нам нужен способ применить это к `date` поле, и мы используем `$transform` За это.

Эта часть заслуживает лучших документов, но вот пример, который вы можете использовать для поиска по месяцам или годам:

```js
q('transactions')
  .filter({ date: { $transform: '$month', $eq: '2021-01' } })
  .select('*');
```

Это позволит вернуть все транзакции в течение месяца. `2021-01`Мы применили `$month` функция для `date` поле и применяемое условие равенства `2021-01`.

Вы можете заменить `$year` Делать то же самое в течение года.

## Общая сумма на одного плательщика с 6 апреля 2020 года по 5 апреля 2021 года {#total-amount-per-payee-between-6-apr-2020-and-5-apr-2021}

```js
(
  await $query(
    $q('transactions')
      .filter({
        $and: [
          { date: { $gte: '2020-04-06' } },
          { date: { $lte: '2021-04-05' } },
        ],
      })
      .groupBy('payee.name')
      .orderBy('payee.name')
      .select(['payee.name', { amount: { $sum: '$amount' } }]),
  )
).data.map(row => {
  console.log(`${row['payee.name']}: ${row.amount / 100}`);
});
```

## Общая сумма всех транзакций с примечанием, содержащим проценты (P) между 6 апреля 2020 года и 5 апреля 2021 года {#total-amount-of-all-transactions-with-note-containing-interest-p-between-6-apr-2020-and-5-apr-2021}

```js
(
  await $query(
    $q('transactions')
      .filter({
        $and: [
          { date: { $gte: '2020-04-06' } },
          { date: { $lte: '2021-04-05' } },
          { notes: { $like: '%#interest (P)%' } },
        ],
      })
      .calculate({ $sum: '$amount' }),
  )
).data / 100;
```

или

```js
(
  await $query(
    $q('transactions')
      .filter({
        $and: [
          { date: { $gte: '2020-04-06' } },
          { date: { $lte: '2021-04-05' } },
          { notes: { $like: '%#interest (P)%' } },
        ],
      })
      .select({ total: { $sum: '$amount' } }),
  )
).data[0].total / 100;
```

## Общая сумма по категориям между 6 апреля 2020 года и 5 апреля 2021 года {#total-amount-per-category-between-6-apr-2020-and-5-apr-2021}

```js
(
  await $query(
    $q('transactions')
      .filter({
        $and: [
          { date: { $gte: '2020-04-06' } },
          { date: { $lte: '2021-04-05' } },
        ],
      })
      .groupBy('category.name')
      .orderBy(['category.group.sort_order', 'category.sort_order'])
      .select([
        'category.group.name',
        'category.name',
        { amount: { $sum: '$amount' } },
      ]),
  )
).data.map(row => {
  console.log(
    `${row['category.group.name']}/${row['category.name']}: ${
      row.amount / 100
    }`,
  );
});
```

## Использование CLI {#cli-usage}

Приведенные выше примеры приведены в JavaScript. [Инструмент CLI](../cli.md)Вы можете выразить многие из тех же запросов с помощью флагов командной строки. Вот как переводятся шаблоны JS:

```bash
# Select specific fields (JS: .select(['date', 'amount', 'payee.name']))
actual query run --table transactions --select "date,amount,payee.name"

# Filter by condition (JS: .filter({ amount: { $lt: 0 } }))
actual query run --table transactions --filter '{"amount":{"$lt":0}}'

# Order by field descending (JS: .orderBy([{ date: 'desc' }]))
actual query run --table transactions --order-by "date:desc"

# Search by month (JS: .filter({ date: { $transform: '$month', $eq: '2021-01' } }))
actual query run --table transactions --filter '{"date":{"$transform":"$month","$eq":"2021-01"}}'

# Group by payee with sum — use --file for aggregate queries
echo '{"table":"transactions","groupBy":["payee.name"],"select":["payee.name",{"amount":{"$sum":"$amount"}}]}' | actual query run --file -

# Count transactions (JS: .calculate({ $count: '*' }))
actual query run --table transactions --count

# Quick shortcut: last 10 transactions
actual query run --last 10
```
