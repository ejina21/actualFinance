# Поиск и применение переводов за прошлые периоды {#identify-and-apply-transfers-historically}

Эти SQL скрипты изменяют транзакции для применения. [переводы](../../transactions/transfers.md) Это полезно, когда вы мигрировали несколько учетных записей.

:::caution
Прежде чем выполнять какие-либо действия, убедитесь, что у вас есть полное [резервный](../../backup-restore/backup.md).
:::

:::note
Этот процесс будет применяться только при соблюдении нижеприведенных условий.

- Эти две операции связаны с разными счетами.
- Суммы точно такие же, но перевернутые например. `-1.00` и `1.00`
- Даты транзакций находятся в пределах 3 дней друг от друга.

- Совпадение происходит только один раз. Это означает, что передачи равной ценности по приведенной ниже схеме не будут применяться.

      `Account A` -> `Account B` -> `Account A/C`

      Как мы не можем достоверно сказать порядок переводов.

:::

## Как {#how-to}

1. Создайте вторую копию резервной копии
2. Извлеките резервную копию
3. Открой. `db.sqlite` Файл с вашим предпочтительным инструментом [SQLite3 Cli](https://www.sqlite.org/cli.html), [Хайдиск](https://www.heidisql.com/)и т.д.
4. Запустите запрос ниже, чтобы сначала просмотреть затронутые транзакции

   ```sql
   SELECT t.id,
       acct,
       a.name,
       amount,
       t.date,
       imported_description,
       t.description,
       t.transferred_id,
       (
           SELECT id
           FROM transactions s
           WHERE s.tombstone = 0
               AND s.id != t.id
               AND starting_balance_flag = 0
               AND s.amount = (t.amount * -1)
               AND s.acct != t.acct
               AND (
                   (
                       s.date >= t.date
                       AND s.date <= (t.date + 3)
                   )
                   OR (
                       s.date <= t.date
                       AND s.date >= (t.date -3)
                   )
               )
       ) AS "transferred_id_new",
       (
           SELECT pa.id
           FROM transactions s
               LEFT JOIN payees pa ON s.acct = pa.transfer_acct
           WHERE s.tombstone = 0
               AND s.id != t.id
               AND starting_balance_flag = 0
               AND s.amount = (t.amount * -1)
               AND s.acct != t.acct
               AND (
                   (
                       s.date >= t.date
                       AND s.date <= (t.date + 3)
                   )
                   OR (
                       s.date <= t.date
                       AND s.date >= (t.date -3)
                   )
               )
       ) AS "description_new"
   FROM transactions t
       LEFT JOIN accounts a ON t.acct = a.id
       LEFT JOIN payees p ON t.description = p.id
       LEFT JOIN accounts ta ON p.transfer_acct = ta.id
   WHERE t.tombstone = 0
       AND starting_balance_flag = 0
       AND (
           SELECT COUNT(*)
           FROM transactions s
           WHERE s.tombstone = 0
               AND s.id != t.id
               AND starting_balance_flag = 0
               AND s.amount = (t.amount * -1)
               AND s.acct != t.acct
               AND (
                   (
                       s.date >= t.date
                       AND s.date <= (t.date + 3)
                   )
                   OR (
                       s.date <= t.date
                       AND s.date >= (t.date -3)
                   )
               )
       ) = 1
   ORDER BY DATE DESC;
   ```

5. Запустите запрос ниже, чтобы обновить транзакции

   ```sql
   UPDATE transactions
   SET transferred_id = (
           SELECT s.id
           FROM transactions s
           WHERE s.tombstone = 0
               AND s.id != transactions.id
               AND starting_balance_flag = 0
               AND s.amount = (transactions.amount * -1)
               AND s.acct != transactions.acct
               AND (
                   (
                       s.date >= transactions.date
                       AND s.date <= (transactions.date + 3)
                   )
                   OR (
                       s.date <= transactions.date
                       AND s.date >= (transactions.date -3)
                   )
               )
       ),
       description = (
           SELECT pa.id
           FROM transactions s
               LEFT JOIN payees pa ON s.acct = pa.transfer_acct
           WHERE s.tombstone = 0
               AND s.id != transactions.id
               AND starting_balance_flag = 0
               AND s.amount = (transactions.amount * -1)
               AND s.acct != transactions.acct
               AND (
                   (
                       s.date >= transactions.date
                       AND s.date <= (transactions.date + 3)
                   )
                   OR (
                       s.date <= transactions.date
                       AND s.date >= (transactions.date -3)
                   )
               )
       )
   WHERE tombstone = 0
       AND starting_balance_flag = 0
       AND (
           SELECT COUNT(*)
           FROM transactions s
           WHERE s.tombstone = 0
               AND s.id != transactions.id
               AND starting_balance_flag = 0
               AND s.amount = (transactions.amount * -1)
               AND s.acct != transactions.acct
               AND (
                   (
                       s.date >= transactions.date
                       AND s.date <= (transactions.date + 3)
                   )
                   OR (
                       s.date <= transactions.date
                       AND s.date >= (transactions.date -3)
                   )
               )
       ) = 1;
   ```

6. Зип! `db.sqlite` Файл с оригиналом `metadata.json` файл
7. Следуй за мной. [восстанавливать](../../backup-restore/restore.md) Процесс их применения в экземпляре Actual Server
8. Убедитесь, что ваши балансы верны, и вы увидите правильные транзакции, помеченные как переводы.
