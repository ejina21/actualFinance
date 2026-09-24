---
title: 'Командная строка (CLI)'
---

# Командная строка (CLI) {#cli-tool}

Пакет `@actual-app/cli` позволяет работать с данными Actual Budget из терминала. Он подключается к серверу синхронизации и даёт команды для просмотра и изменения бюджетов, счетов, операций, категорий, получателей платежей, правил и расписаний.

:::note
Это отдельный инструмент. [Командная строка сервера](../install/cli-tool.md) (`@actual-app/sync-server`) нужна для запуска и управления сервером.
:::

## установка {#installation}

Требуется Node.js v22 или выше.

```bash
npm install --save @actual-app/cli
```

Или установить глобально:

```bash
npm install --location=global @actual-app/cli
```

## конфигурация {#configuration}

CLI требует подключения к работающему фактическому синхронизирующему серверу.Конфигурация может быть обеспечена через переменные среды, флаги CLI или файл конфигурации.

### Переменные среды {#environment-variables}

| переменный                   | Описание                                                 |
| ---------------------------- | -------------------------------------------------------- |
| `ACTUAL_SERVER_URL`          | URL фактического синхронизирующего сервера (обязательно) |
| `ACTUAL_SYNC_ID`             | Budget Sync ID (требуется для большинства команд)        |
| `ACTUAL_PASSWORD`            | Пароль сервера (требуется один из паролей или токенов)   |
| `ACTUAL_SESSION_TOKEN`       | Session Token (альтернатива паролю)                      |
| `ACTUAL_DATA_DIR`            | Локальный каталог кэшированных бюджетных данных          |
| `ACTUAL_CACHE_TTL`           | Кэш TTL в секундах (по умолчанию: 60)                    |
| `ACTUAL_LOCK_TIMEOUT`        | Время ожидания в считанные секунды (по умолчанию: 10)    |
| `ACTUAL_NO_LOCK`             | Настроить `1` Отключить блокировку budget-dir            |
| `ACTUAL_ENCRYPTION_PASSWORD` | Пароль для сквозных зашифрованных бюджетных файлов       |

Три секрета — `ACTUAL_PASSWORD`, `ACTUAL_SESSION_TOKEN` и `ACTUAL_ENCRYPTION_PASSWORD` - можно прочитать из файла, добавив `_FILE` имя переменной (например, `ACTUAL_PASSWORD_FILE=/run/secrets/actual-password`). `_FILE`Суффиксированные переменные среды имеют приоритет над обычными.

### Флаги CLI {#cli-flags}

Глобальные флаги перекрывают переменные среды:

| Флаг                      | Описание                                                   |
| ------------------------- | ---------------------------------------------------------- |
| `--server-url <url>`      | URL сервера                                                |
| `--password <pw>`         | Пароль сервера                                             |
| `--session-token <token>` | Сеансовый токен                                            |
| `--sync-id <id>`          | Бюджетный Sync ID                                          |
| `--data-dir <path>`       | Локальный каталог данных для кэшированных бюджетных данных |
| `--format <format>`       | Формат выпуска: `json` (неисправность), `table`, `csv`     |
| `--verbose`               | Показать информационные сообщения на stderr                |

### Конфигурировать файл {#config-file}

CLI использует [космофизика](https://github.com/cosmiconfig/cosmiconfig) Конфигурационный файл может находиться в любом месте между текущим рабочим каталогом и домашним каталогом.

Вы можете создать файл конфигурации в любом из этих форматов:

- `.actualrc` (Джон или Ямл)
- `.actualrc.json`, `.actualrc.yaml`, `.actualrc.yml`
- `actual.config.json`, `actual.config.yaml`, `actual.config.yml`
- Ан `"actual"` Ключ в вашем `package.json`

Вместо этого вы можете хранить конфигурацию в `actual` подкаталог глобального каталога конфигурации (например, `~/.config/actual/` Linux) в любом из этих форматов:

- `config` (Джон или Ямл)
- `config.json`
- `config.yaml`
- `config.yml`

Пример `.actualrc.json`:

```json
{
  "serverUrl": "http://localhost:5006",
  "password": "your-password",
  "syncId": "1cfdbb80-6274-49bf-b0c2-737235a4c81f",
  "cacheTtl": 60,
  "lockTimeout": 10,
  "noLock": false
}
```

:::caution Безопасность
Избегайте хранения паролей в конфигурационных файлах (включая `password` Если эти файлы содержат пароли, установите ограничительные разрешения (например, 600 на Linux) и, если они находятся в git-репо, добавьте их в `.gitignore`Предпочитает переменные среды, такие как `ACTUAL_PASSWORD` или `ACTUAL_SESSION_TOKEN`, или использовать токен сеанса в конфигурации вместо пароля. еще лучше использовать встроенную поддержку вашего времени выполнения для секретов (например, секреты Docker) и указать `ACTUAL_PASSWORD_FILE` или `ACTUAL_SESSION_TOKEN_FILE` в итоговом файле. [Переменные среды](#environment-variables) Для деталей.
:::

## использование {#usage}

```bash
actual <command> <subcommand> [options]
```

## командование {#commands}

### Счета {#accounts}

```bash
# List all accounts (excludes closed by default)
actual accounts list [--include-closed]

# Create an account
actual accounts create --name "Checking" [--offbudget] [--balance 50000]

# Update an account
actual accounts update <id> [--name "New Name"] [--offbudget true]

# Close an account (with optional transfer)
actual accounts close <id> [--transfer-account <id>] [--transfer-category <id>]

# Reopen a closed account
actual accounts reopen <id>

# Delete an account
actual accounts delete <id>

# Get account balance
actual accounts balance <id> [--cutoff 2026-01-31]
```

### Бюджеты {#budgets}

```bash
# List available budgets on the server
actual budgets list

# Download a budget by sync ID
actual budgets download <syncId> [--encryption-password <pw>]

# Sync the current budget
actual budgets sync

# List budget months
actual budgets months

# View a specific month
actual budgets month 2026-03

# Set a budget amount (in integer cents)
actual budgets set-amount --month 2026-03 --category <id> --amount 50000

# Set carryover flag
actual budgets set-carryover --month 2026-03 --category <id> --flag true

# Hold funds for next month
actual budgets hold-next-month --month 2026-03 --amount 10000

# Reset held funds
actual budgets reset-hold --month 2026-03
```

### Категории {#categories}

```bash
# List all categories
actual categories list

# Create a category
actual categories create --name "Groceries" --group-id <id> [--is-income]

# Update a category
actual categories update <id> [--name "Food"] [--hidden true]

# Delete a category (with optional transfer)
actual categories delete <id> [--transfer-to <id>]
```

### Группы категорий {#category-groups}

```bash
# List all category groups
actual category-groups list

# Create a category group
actual category-groups create --name "Essentials" [--is-income]

# Update a category group
actual category-groups update <id> [--name "New Name"] [--hidden true]

# Delete a category group (with optional transfer)
actual category-groups delete <id> [--transfer-to <id>]
```

### Сделки {#transactions}

```bash
# List transactions for an account within a date range
actual transactions list --account <id> --start 2026-01-01 --end 2026-03-31

# Add transactions (inline JSON)
actual transactions add --account <id> --data '[{"date":"2026-03-13","amount":-5000,"payee_name":"Store"}]'

# Add transactions (from file)
actual transactions add --account <id> --file transactions.json

# Import transactions with reconciliation (deduplication)
actual transactions import --account <id> --data '[...]' [--dry-run]

# Update a transaction
actual transactions update <id> --data '{"notes":"Updated note"}'

# Delete a transaction
actual transactions delete <id>
```

### Платежи {#payees}

```bash
# List all payees
actual payees list

# List common payees
actual payees common

# Create a payee
actual payees create --name "Grocery Store"

# Update a payee
actual payees update <id> --name "New Name"

# Delete a payee
actual payees delete <id>

# Merge multiple payees into one
actual payees merge --target <id> --ids id1,id2,id3
```

### Тэги {#tags}

```bash
# List all tags
actual tags list

# Create a tag
actual tags create --tag "vacation" [--color "#ff0000"] [--description "Vacation expenses"]

# Update a tag
actual tags update <id> [--tag "trip"] [--color "#00ff00"]

# Delete a tag
actual tags delete <id>
```

### Правила {#rules}

```bash
# List all rules
actual rules list

# List rules for a specific payee
actual rules payee-rules <payeeId>

# Create a rule (inline JSON)
actual rules create --data '{"stage":"pre","conditionsOp":"and","conditions":[...],"actions":[...]}'

# Create a rule (from file)
actual rules create --file rule.json

# Update a rule
actual rules update --data '{"id":"...","stage":"pre",...}'

# Delete a rule
actual rules delete <id>
```

### Расписание {#schedules}

```bash
# List all schedules
actual schedules list

# Create a schedule
actual schedules create --data '{"name":"Rent","date":"1st","amount":-150000,"amountOp":"is","account":"...","payee":"..."}'

# Update a schedule
actual schedules update <id> --data '{"name":"Updated Rent"}' [--reset-next-date]

# Delete a schedule
actual schedules delete <id>
```

### Запрос (ActualQL) {#query-actualql}

Запускать запросы используя [Актуальный QL](./actual-ql/index.md).

#### Подкоманды {#subcommands}

| Подкомандующий         | Описание                         |
| ---------------------- | -------------------------------- |
| `query run`            | Выполнить запрос AQL             |
| `query tables`         | Перечень имеющихся таблиц        |
| `query fields <table>` | Список полей и типов для таблицы |

#### `query run` Варианты {#query-run-options}

| Вариант               | Описание                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| `--table <table>`     | Таблица для запроса (использование) `actual query tables` В список                                       |
| `--select <fields>`   | Разделенные поля для выбора                                                                              |
| `--filter <json>`     | Фильтр JSON (например). `'{"amount":{"$lt":0}}'`)                                                        |
| `--where <json>`      | Алиса для `--filter` (не могут быть использованы вместе)                                                 |
| `--order-by <fields>` | Поля с необязательным направлением: `field1:desc,field2` (перенаправлено с «Asc»)                        |
| `--limit <n>`         | Ограниченное количество результатов                                                                      |
| `--offset <n>`        | Пропустить первые N результатов (для пагинации)                                                          |
| `--last <n>`          | Показать последние N транзакций (коротко: подразумевает) `--table transactions`, `--order-by date:desc`) |
| `--count`             | Подсчитайте соответствующие строки вместо того, чтобы возвращать их                                      |
| `--group-by <fields>` | Поля, разделенные запятой, группируются по                                                               |
| `--file <path>`       | Прочитайте запрос из файла JSON (использовать) `-` для Стин                                              |

#### Примеры {#examples}

```bash
# Show last 5 transactions (convenience shortcut)
actual query run --last 5

# Override default columns with --last
actual query run --last 10 --select "date,amount,notes"

# Transactions ordered by date descending with limit
actual query run --table transactions --select "date,amount,payee.name" --order-by "date:desc" --limit 10

# Filter with JSON — negative amounts (expenses)
actual query run --table transactions --filter '{"amount":{"$lt":0}}' --limit 5

# Use --where (alias for --filter, more intuitive for SQL users)
actual query run --table transactions --where '{"payee.name":"Grocery Store"}' --limit 5

# Count all transactions
actual query run --table transactions --count

# Count with a filter
actual query run --table transactions --filter '{"category.name":"Groceries"}' --count

# Group by category with aggregate (use --file for aggregate expressions)
echo '{"table":"transactions","groupBy":["category.name"],"select":["category.name",{"amount":{"$sum":"$amount"}}]}' | actual query run --file -

# Pagination: skip first 20, show next 10
actual query run --table transactions --order-by "date:desc" --limit 10 --offset 20

# Multi-field ordering
actual query run --table transactions --order-by "date:desc,amount:asc" --limit 10

# Run a query from a JSON file
actual query run --file query.json

# Pipe query from stdin
echo '{"table":"transactions","select":["date","amount"],"limit":5}' | actual query run --file -

# List available tables
actual query tables

# List fields for a table
actual query fields transactions
```

Видишь? [Актуальный QL](./actual-ql/index.md) для полного фильтра/функции, включая `$transform`, `$month`, `$year`и агрегированные функции.

### сервер {#server}

```bash
# Get the server version
actual server version

# Look up an entity ID by name
actual server get-id --type accounts --name "Checking"
actual server get-id --type categories --name "Groceries"

# Trigger bank sync
actual server bank-sync [--account <id>]
```

## Суммарная конвенция {#amount-convention}

Все денежные суммы представлены как **целые центы**:

| Значение CLI | Сумма в долларах |
| ------------ | ---------------- |
| `5000`       | $50.00           |
| `-12350`     | -$123.50         |
| `100`        | $1.00            |

При предоставлении сумм всегда используйте целочисленные центы. Например, чтобы бюджет 50 долларов, пройдите `5000`.

**Формат выхода:** Таблица`--format table`) и CSV (`--format csv`) выход автоматически преобразует значения центов в десятичные (например. `1665.00` вместо того, чтобы `166500`Выход JSON всегда возвращает необработанные центы для программного использования.

## Форматы выхода {#output-formats}

The `--format` Флаг контролирует, как отображаются результаты:

- **`json`** (по умолчанию) — Машиночитаемый вывод JSON, идеально подходящий для сценариев. Результаты запросов возвращаются в виде голого массива записей.
- **`table`** - Формат таблицы для чтения человеком. Количество полей автоматически формируется в виде десятичных знаков.
- **`csv`** - Сепарированные по запятой значения для импорта электронных таблиц.

Использовать `--verbose` включение информационных сообщений на stderr для отладки или видимости того, что делает CLI.

## Общие рабочие процессы {#common-workflows}

**Смотрите бюджет на текущий месяц:**

```bash
actual budgets month 2026-03 --format table
```

**Проверьте баланс счета:**

```bash
# Find the account ID
actual server get-id --type accounts --name "Checking"
# Get the balance
actual accounts balance <id>
```

**Экспортные операции в CSV:**

```bash
actual transactions list --account <id> --start 2026-01-01 --end 2026-12-31 --format csv > transactions.csv
```

**Добавить транзакцию:**

```bash
actual transactions add --account <id> --data '[{"date":"2026-03-14","amount":-2500,"payee_name":"Coffee Shop"}]'
```

## Советы и общие подводные камни {#tips-common-pitfalls}

- **Раздельные сделки:** При суммировании или подсчете транзакций фильтр `"is_parent": false` Разделенный родитель держит общую сумму, а его дети держат отдельные части, в том числе оба подсчитывают общую сумму дважды.
- **Избегайте быстрых последовательных запросов:** Каждый вызов CLI открывает новое соединение с сервером. Запуск запросов в узком цикле (например, один в месяц) может вызвать ограничение скорости или сбои аутентификации. Вместо этого, возьмите все данные в одном запросе с фильтром диапазона дат и обработайте локально.
- **Некатегоризированные транзакции:** `category.name` это `null` Для операций без категории. Учитывайте это при фильтрации или группировании по категориям.
- **Никаких подполей даты в AQL:** `date.month`, `date.year`, и т.д. не поддерживаются в виде полей запросов. Для группирования по месяцам, извлекайте необработанные транзакции с фильтром диапазона дат и агрегируйте локально в скрипте.

## Самоподписанные SSL сертификаты {#self-signed-ssl-certificates}

Если ваш фактический сервер синхронизации использует самоподписанный SSL-сертификат, CLI отклонит соединение по умолчанию. Вы можете решить эту проблему, добавив свой сертификат CA в доверенные сертификаты системы, хотя детали выходят за рамки этого документа.

Кроме того, вы можете разрешить подключение к серверу, который использует самоподписанный сертификат, установив `NODE_TLS_REJECT_UNAUTHORIZED` переменная среда:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 actual budgets list
```

Или экспортировать его на весь сеанс:

```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
actual budgets list
```

:::caution Безопасность
настройка `NODE_TLS_REJECT_UNAUTHORIZED=0` Отключает верификацию всех сертификатов TLS, что делает соединение уязвимым для атак «человек посередине». Используйте это только в доверенных сетевых средах, где вы контролируете сервер и понимаете риски.
:::

## Обработка ошибок {#error-handling}

- Ненулевые коды выхода указывают на ошибку
- Ошибки пишутся в виде простого текста на stderr (например, `Error: message`)
- Использовать `--verbose` включение информационных сообщений stderr для отладки
