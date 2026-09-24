# Использование API {#using-the-api}

import { Method, MethodBox } from './types';

:::warning

Многие люди ошибочно принимают термин «API» за HTTP и / или REST-полный API. **не** Однако мы предлагаем пакет NPM - API - который позволяет взаимодействовать с продуктом программно.

:::

API предоставляет вам полный программный доступ к вашим данным. Он позволяет запускать пользовательский интерфейс в режиме headless , таким образом взаимодействуя с ним, если это был пользователь, щелкающий по нему. Если вы являетесь разработчиком, вы можете использовать его для импорта транзакций из пользовательского источника, экспорта данных в другое приложение, такое как Excel, или писать все, что вы хотите, поверх Actual.

Единственное, что нужно иметь в виду: Actual не похож на большинство других приложений. В то время как ваши данные хранятся на сервере, сервер не имеет функции для анализа деталей или изменения вашего бюджета. В результате клиент API содержит весь код, необходимый для запроса ваших данных, и будет работать с локальной копией. В настоящее время основным вариантом использования являются импортеры и экспортеры.

## Начало работы {#getting-started}

Мы предоставляем официальный клиент Node.js `@actual-app/api` Другие языки на данный момент не поддерживаются.

Клиент является [Открытый исходный код на GitHub](https://github.com/actualbudget/actual/tree/master/packages/api) Вместе с остальными действительными, если вы хотите увидеть код.

Установите его либо `npm` или `yarn`:

```
npm install --save @actual-app/api
```

```
yarn add @actual-app/api
```

### TypeScript {#typescript}

`@actual-app/api` Для того, чтобы потреблять их, ваши `tsconfig.json` Необходимо использовать современную `moduleResolution`:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler" // or "nodenext" / "node16"
  }
}
```

Наследие `"node"` / `"node10"` / `"classic"` Резолюция не поддерживается в строгом режиме TypeScript. Опубликованные декларации опираются на package.json `exports` условия, которые старые решатели не соблюдают.

### Подключение к удаленному серверу {#connecting-to-a-remote-server}

Затем вам нужно будет подключиться к запущенной серверной версии Actual для доступа к вашим бюджетным файлам.

```js
let api = require('@actual-app/api');

(async () => {
  await api.init({
    // Budget data will be cached locally here, in subdirectories for each file.
    dataDir: '/some/path',
    // This is the URL of your running server
    serverURL: 'http://localhost:5006',
    // This is the password you use to log into the server
    password: 'hunter2',
  });

  // This is the ID from Settings → Show advanced settings → Sync ID
  await api.downloadBudget('1cfdbb80-6274-49bf-b0c2-737235a4c81f');
  // or, if you have end-to-end encryption enabled:
  await api.downloadBudget('1cfdbb80-6274-49bf-b0c2-737235a4c81f', {
    password: 'password1',
  });

  let budget = await api.getBudgetMonth('2019-10');
  console.log(budget);
  await api.shutdown();
})();
```

Вы, вероятно, не хотите жестко кодировать такие пароли, особенно если вы будете использовать Git для отслеживания своего кода. Вы можете использовать переменные среды для хранения паролей вместо этого, или читать их из файла, или запрашивать их интерактивно при запуске сценария вместо этого.

### Самоподписанные сертификаты Https {#self-signed-https-certificates}

Если сервер использует [самоподписанные или заказные сертификаты CA](../config/https.md)Для успешного подключения потребуется дополнительная конфигурация Node.js.

API взаимодействует с сервером, используя встроенный узел `fetch`Есть несколько способов заставить Node.js доверять самоподписанному сертификату.

- Вариант 1: Точечная переменная среды [NODE EXTRA CA CERTS](https://nodejs.org/api/cli.html#node_extra_ca_certsfile) путь к файлу, содержащему публичный сертификат.
- Вариант 2: Установить переменную среды [NODE TLS REJECT UNAUTHORIZED](https://nodejs.org/api/cli.html#node_tls_reject_unauthorizedvalue) то `0`Не рекомендуется, если ваша программа обращается к любым другим конечным точкам, кроме фактического сервера.
- Варианты 3: Используйте конфигурацию сертификатов OpenSSL CA для узла и добавьте свой сертификат в OpenSSL SSL CERT DIR. Что это требует, зависит от вашей сборки Node.js, и детали конфигурации выходят за рамки этой документации. [Стратегия OpenSSL Node.js](https://github.com/nodejs/TSC/blob/main/OpenSSL-Strategy.md) Страница для отправной точки.

## Использование API в браузере {#using-the-api-in-a-browser}

<ExperimentalFeatureWarning />

Пакет также отправляет сборку браузера.Когда вы объединяете свое веб-приложение с современным пульвером (например, Vite), пакет `browser` Запись подбирается автоматически, и вы используете те же методы, что и в Node.js:

```js
import * as api from '@actual-app/api';

await api.init({
  serverURL: 'https://your-server.example.com',
  password: 'hunter2',
});

await api.downloadBudget('1cfdbb80-6274-49bf-b0c2-737235a4c81f');
console.log(await api.getAccounts());
await api.shutdown();
```

За кулисами, `init` Запускает веб-работник, работающий на том же бюджетном движке, который использует фактическое веб-приложение, поддерживаемое SQLite, скомпилированным в WebAssembly. Ваши бюджетные данные хранятся в IndexedDB браузера и остаются на устройстве.

В браузере, `dataDir` Это путь внутри виртуальной файловой системы рабочего, а не папка на диске. Это необязательно: по умолчанию `/documents`И если вы проходите пользовательский путь, он автоматически создается и сохраняется в IndexedDB.

Сборка браузера полностью автономна: Web Worker и его WebAssembly и файлы данных встроены в пакет. Дополнительных файлов для копирования или обслуживания нет, и конфигурация пакета не требуется (нет). `optimizeDeps` Настройки, никаких плагинов для рабочих или активов. Импорт пакета и вызов `init()` Это все, что нужно.

:::caution Требуется перекрестная изоляция
Двигатель использует `SharedArrayBuffer`Таким образом, страница, которая запускает API, должна обслуживаться. **изолированное перекрестное происхождение**- через HTTPS, с `Cross-Origin-Opener-Policy: same-origin` и `Cross-Origin-Embedder-Policy: require-corp`Это требование хостинга / сервера (его нельзя связать). [Доступ к SharedArrayBuffer](../troubleshooting/shared-array-buffer.md)В локальной разработке установите те же заголовки на своем сервере разработчиков (например, через небольшой плагин промежуточного программного обеспечения Vite).
:::

## Устранение ошибок {#handling-errors}

Когда метод API терпит неудачу, отклоненная ошибка обычно несет в себе читаемую человеком информацию. `message` Для наиболее распространенных сбоев подключения и загрузки ошибка также несет стабильный, машиночитаемый `code`Используй. `code` когда вашему приложению необходимо реагировать на определенный вид сбоя (например, показывать свое собственное переведенное сообщение) — сопоставление по тексту `message` Это хрупко, потому что формулировка может меняться между выпусками.

```js
try {
  await api.init({
    dataDir: '/some/path',
    serverURL: 'http://localhost:5006',
    password: 'hunter2',
  });
  await api.downloadBudget('1cfdbb80-6274-49bf-b0c2-737235a4c81f');
} catch (error) {
  switch (error.code) {
    case 'network-failure':
    case 'network':
      // The server could not be reached. Check the serverURL.
      break;
    case 'invalid-password':
      // The server password is wrong.
      break;
    case 'budget-not-found':
      // No budget file matches the given sync ID.
      break;
    default:
      // Fall back to the message text.
      console.error(error.message);
  }
}
```

Это коды для распространенных сбоев:

| Код                      | значение                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `network-failure`        | Сервер не может быть найден — `serverURL` Это неправильно, или сервер отключен или недоступен. |
| `network`                | То же самое `network-failure`, сообщается скачиванием и проверками ключа шифрования.           |
| `invalid-password`       | Пароль сервера, предоставленный `init` Это неправильно.                                        |
| `token-expired`          | Токен сессии, предоставленный `init` является недействительным или истек.                      |
| `unauthorized`           | Клиент не входит на сервер.                                                                    |
| `budget-not-found`       | Ни один бюджетный файл не соответствует данному идентификатору синхронизации.                  |
| `missing-key`            | Бюджетный файл полностью зашифрован, и пароль шифрования не был предоставлен.                  |
| `decrypt-failure`        | Бюджетный файл расшифровать не удалось — пароль шифрования неправильный.                       |
| `old-key-style`          | Бюджетный файл использует старый, неподдерживаемый стиль шифрования.                           |
| `out-of-sync-migrations` | Бюджетный файл поврежден или из слишком старой версии для открытия.                            |

:::note
`code` присутствует для общего соединения и сбоев загрузки, перечисленных выше. Другие ошибки могут нести только `message`Так что всегда держите запасной вариант.
:::

## Написание импортеров данных {#writing-data-importers}

Если вы используете другое приложение, такое как YNAB или Mint, вы можете перенести свои данные в Actual. [Импорт данных YNAB4](../migration/ynab4.md) и [импорт данных nYNAB](../migration/nynab.md) Но если вы хотите импортировать все свои данные в Actual, вы можете написать пользовательский импортер.

Если все, что вы хотите сделать, это добавить транзакции из пользовательского источника (например, API вашего банка), используйте [`importTransactions`](./reference.md#importtransactions)В этом контексте пользовательский импортер - это то, что берет все ваши данные (бюджеты, транзакции, получатели платежей и т. Д.) и сбрасывает их все в новый файл в режиме реального времени.

В этом режиме всегда создается новый файл (вы не можете массово импортировать в существующий файл), и он будет работать намного быстрее, чем если бы вы делали это обычно.

Чтобы написать заказ импортера, использовать `runImport`Он берет имя файла, который вы хотите создать, и запускает функцию. Вот пример импортера:

```js
let api = require('@actual-app/api');
let data = require('my-data.json');

async function run() {
  for (let account of data.accounts) {
    let acctId = await api.createAccount(convertAccount(account));
    await api.addTransactions(
      acctId,
      data.transactions
        .filter(t => t.acctId === acctId)
        .map(convertTransaction),
    );
  }
}

api.runImport('My-Budget', run);
```

Это очень просто, но требует некоторых данных. `my-data.json` и создает все счета и транзакции из него. Функции, используемые для конвертации предметов (например, `convertAccount`) сюда не включены. [справочные документы](./reference.md) Узнать форму объектов, которые реально ожидают.

**Примечание:** Важно, чтобы [`addTransactions`](./reference.md#addtransactions) Вы хотите использовать его вместо [`importTransactions`](./reference.md#importtransactions) Первый не будет запускать процесс сверки (который дублирует транзакции) и не будет создавать другую сторону транзакций передачи и многое другое. `importTransactions` Он может корректировать ваши данные таким образом, чтобы они не соответствовали данным, которые вы импортируете.

Проверь. [YNAB4](https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/importers/ynab4.ts) и [NAB5](https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/importers/ynab5.ts) Импортеры видят, как работает настоящий импортер.

## Методы {#methods}

Это общедоступные методы, которые вы можете использовать. API также экспортирует низкоуровневые функции, такие как: `init`, `send`, `disconnect`и `loadBudget` Если вы хотите вручную управлять соединением. [Читать источник](https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/main.ts) Чтобы узнать об этих методах (поищите их) `export const lib`).

#### `init` {#init}

<Method name="init" argsObject={true} args={[{ properties: [{ name: 'dataDir', type: 'string' }, { name: 'serverURL', type: 'string' }, { name: 'password', type: 'string' }, { name: 'verbose', type: 'boolean' }]}]} returns="Promise<void>" />

Позвоните, прежде чем пытаться использовать какой-либо из методов API. Это подключится к серверу с помощью предоставленного пароля и загрузит бюджетные данные.

`dataDir` по умолчанию для текущего рабочего каталога в Node.js и `/documents` в [Браузерная сборка](#using-the-api-in-a-browser).

Если нет `serverURL` Предоставляется, нет сетевых подключений, и вы сможете получить доступ только к бюджетным файлам, уже загруженным локально.

Вы можете найти свой идентификатор бюджета в разделе «Передовые» страницы настроек.

#### `shutdown` {#shutdown}

<Method name="shutdown" args={[]} returns="Promise<void>" />

Закройте текущий бюджетный файл и прекратите любые другие текущие процессы. Рекомендуется позвонить по нему, прежде чем выходить из сценария.

#### `utils.amountToInteger` {#utilsamounttointeger}

<Method name="utils.amountToInteger" args={[{ name: 'amount', type: 'number' }]} returns="number" />

конвертировать сумму валюты (например, `123.45`) представлен в виде числа с плавающей запятой для целого формата Actual, используемого внутри (т.е. `12345`).

#### `utils.integerToAmount` {#utilsintegertoamount}

<Method name="utils.integerToAmount" args={[{ name: 'amount', type: 'number' }]} returns="number" />

Конвертировать целое число, используемое внутри компании Actual (например, `12345`) к традиционной плавающей точке (т.е. `123.45`).
