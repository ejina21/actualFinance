---
title: Справочник API
---

import { types, objects, PrimitiveTypeList, PrimitiveType, StructType, Method, MethodBox } from './types';
import APIList from './APIList';

<APIList title="Бюджеты" sections={[
"getBudgetMonths",
"getBudgetMonth",
"setBudgetAmount",
"setBudgetCarryover",
"holdBudgetForNextMonth",
"resetBudgetHold"
]} />

<APIList title="Операции" sections={[
"Transaction",
"addTransactions",
"importTransactions",
"getTransactions",
"updateTransaction",
"deleteTransaction",
"mergeTransactions"
]} />

<APIList title="Счета" sections={[
"Account",
"getAccounts",
"createAccount",
"updateAccount",
"closeAccount",
"reopenAccount",
"deleteAccount",
"getAccountBalance"
]} />

<APIList title="Категории" sections={[
"Category",
"getCategories",
"createCategory",
"updateCategory",
"deleteCategory"
]} />

<APIList title="Группы категорий" sections={[
"Category group",
"getCategoryGroups",
"createCategoryGroup",
"updateCategoryGroup",
"deleteCategoryGroup"
]} />

<APIList title="Получатели платежей" sections={[
"Payee",
"getPayees",
"createPayee",
"updatePayee",
"deletePayee",
"mergePayees"
]} />

<APIList title="Метки" sections={[
"Tag",
"getTags",
"createTag",
"updateTag",
"deleteTag"
]} />

<APIList title="Правила" sections={[
"ConditionOrAction",
"Rule",
"getRules",
"getPayeeRules",
"createRule",
"updateRule",
"deleteRule"
]} />

<APIList title="Расписание" sections={[
"Schedule",
"RecurConfig",
"getSchedules",
"createSchedule",
"updateSchedule",
"deleteSchedule"
]} />

<APIList title="Заметки" sections={[
"getNote",
"updateNote"
]} />

<APIList title="Прочее" sections={[
"BudgetFile",
"initConfig",
"init",
"shutdown",
"sync",
"runBankSync",
"runImport",
"getBudgets",
"loadBudget",
"downloadBudget",
"importBudget",
"exportBudget",
"batchBudgetUpdates",
"runQuery",
"getIDByName",
"getPreferences",
"setPreference"
]} />

## Виды методов {#types-of-methods}

Методы API подразделяются на один из четырех типов:

- `get`
- `create`
- `update`
- `delete`

Объекты могут иметь поля, специфичные для типа способа. `payee` поле а `transaction` Доступен только в a `create` Это поле не существует в объектах, возвращенных из `get` метод`payee_id` Вместо этого используется.

Поля, специфичные для типа запроса, помечаются как таковые в примечаниях.

`id` Это особое поле. Все объекты имеют `id` Тем не менее, вам не нужно указывать `id` в `create` метод; все `create` Способы возврата созданного `id` Вернемся к вам.

Все `update` и `delete` Методы принимают `id` указать желаемый объект. `update` принимает поля для обновления в качестве второго аргумента — он не принимает полный объект. Это означает, что даже если поле требуется, вам не нужно передавать его `update`Например, a `category` требует `group_id` поле, однако `updateCategory(id, { name: "Food" })` является действительным вызовом. Требуемый означает, что `update` не может установить поле для `null` и `create` Всегда должна содержать поле.

**Примечание:** `updateRule` Это исключение — оно требует полного [`Rule`](#rule) объект включая `id`и возвращается `Promise<Rule>`.

## Первобытные {#primitives}

Это такие типы.

<PrimitiveTypeList />

## Бюджеты {#budgets}

#### `getBudgetMonths` {#getbudgetmonths}

<Method name="getBudgetMonths" args={[]}  returns="Promise<month[]>" />

#### `getBudgetMonth` {#getbudgetmonth}

<Method name="getBudgetMonth" args={[{ name: 'month', type: 'month' }]} returns="Promise<Budget>" />

#### `setBudgetAmount` {#setbudgetamount}

<Method name="setBudgetAmount" args={[{ name: 'month', type: 'month' }, { name: 'categoryId', type: 'id' }, { name: 'value', type: 'amount' }]} returns="Promise<null>" />

#### `setBudgetCarryover` {#setbudgetcarryover}

<Method name="setBudgetCarryover" args={[{ name: 'month', type: 'month' }, { name: 'categoryId', type: 'id' }, { name: 'flag', type: 'bool' }]} returns="Promise<null>" />

#### `holdBudgetForNextMonth` {#holdbudgetfornextmonth}

<Method name="holdBudgetForNextMonth" args={[{ name: 'month', type: 'month' }, { name: 'value', type: 'amount' }]} returns="Promise<null>" />

#### `resetBudgetHold` {#resetbudgethold}

<Method name="resetBudgetHold" args={[{ name: 'month', type: 'month' }]} returns="Promise<null>" />

## Сделки {#transactions}

#### сделка {#transaction}

<StructType fields={objects.transaction} />

#### Раздельные транзакции {#split-transactions}

Разделенная транзакция имеет несколько субтранзакций, которые разделяют общую сумму.
Вы можете создать разделенную транзакцию, указав
множество субтранзакций в `subtransactions` Это поле в основном используется во время создания и поиска.

На практике обновление субтранзакций по отдельности может не работать надежно. Для изменения разделенных транзакций, обновления родительской транзакции и обеспечения полной `subtransactions` массив.

Субтранзакции рассматриваются как полные записи транзакций и проверяются аналогично обычным транзакциям.

На практике для создания API обычно требуются, по крайней мере, поля ниже.

- `amount`
- `account`
- `date`
- `parent_id`
- `is_child: true`

Кроме того, операции с детьми должны четко устанавливать:

- `is_parent`ложный

Факультативные поля включают:

- `category`
- `notes`

Если сумма субтранзакций не равна общей сумме
В настоящее время вызов API будет успешным, но с ошибкой.
Они будут отображаться в приложении.

#### Требования к родительским сделкам {#parent-transaction-requirements}

Сделка должна быть отмечена `is_parent: true` До того, как могут быть добавлены субтранзакции.

Если `is_parent` не устанавливается `true` по родительской сделке, любой предоставленной `subtransactions` будет проигнорирована и сделка будет рассматриваться как стандартная (нераздельная) сделка.

Субтранзакции обрабатываются только тогда, когда родительская транзакция имеет `is_parent: true`.

Если субтранзакции предоставляются, но недействительны (например, отсутствуют необходимые поля, такие как: `account` или `date`API вернет ошибку проверки (HTTP 400), указывающую на отсутствие необходимых полей транзакций.

Рабочий пример полей API:

**Примечание:** При создании новой сплит-транзакции вам обычно не нужно предоставлять `id` для родителя; система будет генерировать один. `amount` должна равняться сумме всех сумм субтранзакций.

```js
{
  "id": "parent-id",
  "is_parent": true,
  "subtransactions": [
    {
      "amount": 142000,
      "account": "9c1e5de4-ecf8-41c2-8a97-4a1e8bc385c9",
      "date": "2024-08-12",
      "parent_id": "parent-id",
      "is_child": true,
      "is_parent": false,
      "category": "71376207-72f9-4b2b-ae24-0931a226f76a",
    },
    {
      "amount": 150,
      "account": "9c1e5de4-ecf8-41c2-8a97-4a1e8bc385c9",
      "date": "2024-08-12",
      "parent_id": "parent-id",
      "is_child": true,
      "is_parent": false,
      "category": "315d3776-d2a8-4d82-8a69-648b0d80125a",
    }
  ]
}
```

#### Переводы {#transfers}

Существующие переводы будут иметь `transfer_id` поле, которое указывает на сделку с другой стороны. **Вы не должны менять это** или вы будете вызывать неожиданное поведение. (Вы можете установить это при импорте, однако).

Если вы хотите создать перевод, используйте получателя перевода для учетной записи, которую вы хотите перевести в / из. [`transfer_acct`](#payee) поле получателя платежа, чтобы найти учетную запись, которую вы хотите перевести в / из, и назначить этого получателя для транзакции. [получатели трансфертов](#transfers-1).)

#### Методы {#methods}

#### `addTransactions` {#addtransactions}

<Method name="addTransactions" args={[{ name: 'accountId', type: 'id'}, { name: 'transactions', type: 'Transaction[]'}, { name: 'runTransfers = false', type: 'bool?'}, { name: 'learnCategories = false', type: 'bool?'}]} returns="Promise<id[]>" />

Добавляет сразу несколько операций. Не согласовывает (см. `importTransactions`Возвращает множество идентификаторов вновь созданных транзакций.

Этот метод делает **не** Избегай дубликатов. `importTransactions` Если вы хотите полного примирения.

Этот метод имеет следующие факультативные флаги:

- `runTransfers`Создавать переводы для транзакций, в которых дается получатель перевода (недостатки к ложным)
- `learnCategories`Обновление Правил, основанных на поле категории в транзакциях (дефолты ложные)

Этот метод в основном для импортеров, которые хотят пропустить все автоматические вещи, потому что они хотят создавать необработанные данные. `importTransactions`.

#### `importTransactions` {#importtransactions}

<Method name="importTransactions" args={[{ name: 'accountId', type: 'id'}, { name: 'transactions', type: 'Transaction[]'}, { name: 'opts = {}', type: 'object?'}]} returns="Promise<{ errors, added, updated }>" />

Добавляет несколько транзакций одновременно, проходя тот же процесс, что и импорт файла или загрузка транзакций из банка.
В частности, все правила выполняются по указанным сделкам перед их добавлением.
Использовать `addTransactions` Вместо этого для добавления необработанных транзакций без последующей обработки.

Импорт будет "примирять" сделки, чтобы избежать добавления дубликатов. `imported_id` В противном случае система будет сопоставлять транзакции с одинаковой суммой и с аналогичными датами и получателями и стараться избегать дубликатов. `imported_id` Вы должны проверить результаты после импорта.

Он также будет создавать переводы, если получатель трансфера указан. [переводы](#transfers).

Этот метод имеет следующие факультативные флаги (проходят в качестве `opts` объект:

- `defaultCleared`• должны ли импортируемые операции быть помечены как очищенные (неисправности в отношении `true`)
- `dryRun`Если: `true`возвращает то, что было бы добавлено/обновлено без фактического изменения базы данных (по умолчанию). `false`)
- `reimportDeleted`Если: `true`транзакции, которые были ранее импортированы, а затем удалены, будут реимпортированы; `false`Они будут пропущены (по умолчанию). `true` Для обратной совместимости — обратите внимание, что [Импорт файлов UI](../transactions/importing.md#avoiding-duplicate-transactions) по умолчанию для `false`)
- `payeeNameNormalization`как `payee_name` Обрабатывается при создании плательщика — `'title-case'` рекапитализирует каждое слово, `'original'` сохраняет название как данное, кроме обрезки окружающего белого пространства (по умолчанию). `'title-case'`)

Пример использования opts:

```js
await api.importTransactions(accountId, transactions, {
  reimportDeleted: false,
  defaultCleared: false,
});
```

Этот метод возвращает объект со следующими полями:

- `added`: множество идентификаторов транзакций, которые были добавлены
- `updated`массив идентификаторов транзакций, которые были обновлены (например, очищены)
- `errors`любые ошибки, которые произошли во время процесса (скорее всего, одна ошибка без изменений в транзакциях);

#### `getTransactions` {#gettransactions}

<Method name="getTransactions" args={[{ name: 'accountId', type: 'id'}, { name: 'startDate', type: 'date' }, { name: 'endDate', type: 'date' }]} returns="Promise<Transaction[]>" />

Получить все транзакции в `accountId` между указанными датами (включительно). Возвращает массив [`Transaction`](#transaction) объекты.

#### `updateTransaction` {#updatetransaction}

<Method name="updateTransaction" args={[{ name: 'id', type: 'id'}, { name: 'fields', type: 'object'} ]} />

Обновление полей транзакции. `fields` может указывать любое поле, описанное в [`Transaction`](#transaction).

#### `deleteTransaction` {#deletetransaction}

<Method name="deleteTransaction" args={[{ name: 'id', type: 'id'}]} />

Исключить транзакцию.

#### `mergeTransactions` {#mergetransactions}

<Method name="mergeTransactions" args={[{ name: 'ids', type: 'id[]' }]} returns="Promise<id>" />

Объединяют ровно две разные транзакции с одного счета в одну. Возвращает идентификатор выжившей транзакции; другая удаляется.

Порядок ids не определяет, какая транзакция выживает:

- Ввозимая транзакция хранится над введенной вручную
- В противном случае сделка с более ранней датой сохраняется.

Сохранившаяся транзакция сохраняет свои собственные значения поля и заполняет любые пустые значения из удаленной транзакции.

Слияние терпит неудачу, если вы дважды передаете один и тот же идентификатор, или если две транзакции находятся на разных счетах, имеют разные суммы или переводы на разные счета.

#### Примеры {#examples}

```js
// Create a transaction of $12.00. A payee of "Kroger" will be
// automatically created if it does not exist already and
// assigned to the transaction.

await importTransactions(accountId, [
  {
    date: '2019-08-20',
    amount: 1200,
    payee_name: 'Kroger',
    category: 'c179c3f4-28a6-4fbd-a54d-195cced07a80',
  },
]);
```

```js
// Get all transactions in an account for the month of August
// (it doesn't matter that August 31st doesn't exist).

await getTransactions(accountId, '2019-08-01', '2019-08-31');
```

```js
// Assign the "Food" category to a transaction

let categories = await getCategories();
let foodCategory = category.find(cat => cat.name === 'Food');
await updateTransaction(id, { category: foodCategory.id });
```

## Счета {#accounts}

#### Счет {#account}

<StructType fields={objects.account} />

#### Закрытие счетов {#closing-accounts}

Избегайте установки `closed` имущество непосредственно для закрытия счета; вместо этого используйте `closeAccount` Если на счете все еще есть деньги, вам нужно будет указать другой счет для перевода текущего баланса. Это поможет правильно отслеживать ваши деньги.

Если вы хотите полностью удалить учетную запись и полностью удалить ее из системы, используйте [`deleteAccount`](#deleteaccount)Обратите внимание, что если это на бюджетном счете, любые деньги, поступающие с этого счета, исчезнут.

#### Методы {#methods-1}

#### `getAccounts` {#getaccounts}

<Method name="getAccounts" args={[]} returns="Promise<Account[]>" />

Получить все счета. Вернуть массив [`Account`](#account) объекты.

#### `createAccount` {#createaccount}

<Method name="createAccount" args={[{ name: 'account', type: 'Account' }, { name: 'initialBalance = 0', type: 'amount?' }]} returns="Promise<id>" />

Создать аккаунт с первоначальным балансом `initialBalance` (недостатки 0). Помните, что [`amount`](#primitives) У него нет десятичных знаков. `id` нового счета.

#### `updateAccount` {#updateaccount}

<Method name="updateAccount" args={[{ name: 'id', type: 'id' }, { name: 'fields', type: 'object' }]} />

Обновление полей учетной записи. `fields` может указывать любое поле, описанное в [`Account`](#account).

#### `closeAccount` {#closeaccount}

<Method name="closeAccount" args={[{ name: 'id', type: 'id' }, { name: 'transferAccountId', type: 'id?' }, { name: 'transferCategoryId', type: 'id?' }]} />

Закройте счет. `transferAccountId` и `transferCategoryId` являются необязательными, если баланс счета равен 0, в противном случае см. следующий абзац.

Если счет имеет ненулевой баланс, необходимо указать счет с `transferAccountId` Если вы переводите деньги с бюджетного счета на внебюджетный счет, вы можете дополнительно указать категорию с `transferCategoryId` Категоризация трансферной транзакции.

Перевод денег на внебюджетный счет нуждается в категории, потому что деньги выводятся из бюджета, поэтому они должны откуда-то поступать.

Если вы хотите просто удалить учетную запись, посмотрите [`deleteAccount`](#deleteaccount).

#### `reopenAccount` {#reopenaccount}

<Method name="reopenAccount" args={[{ name: 'id', type: 'id' }]} />

Открыть закрытый счет.

#### `deleteAccount` {#deleteaccount}

<Method name="deleteAccount" args={[{ name: 'id', type: 'id' }]} />

Удалите аккаунт.

#### `getAccountBalance` {#getaccountbalance}

<Method name="getAccountBalance" args={[{ name: 'id', type: 'id' }, { name: 'cutoff', type: 'Date?'}]} returns="Promise<number>" />

Если отсечение дано, оно дает остаток счета на эту дату. Если отсечение не дано, оно использует текущую дату в качестве отсечения.

#### Примеры {#examples-1}

```js
// Create a savings account
createAccount({
  name: 'Ally Savings',
});
```

```js
// Get all accounts

let accounts = await getAccounts();
```

## Счетные группы {#account-groups}

### Счетная группа {#account-group}

<StructType fields={objects.accountGroup} />

Группы учетных записей позволяют организовывать учетные записи в названные группы, например «Сбережения» или «Кредитные карты».Учетная запись может принадлежать как минимум одной группе, установленной через `account_group_id` на поле [`Account`](#account).

#### Методы {#methods-2}

#### `getAccountGroups` {#getaccountgroups}

<Method name="getAccountGroups" args={[]} returns="Promise<AccountGroup[]>" />

Получите все группы аккаунтов. Возвращает массив [`Account Group`](#account-group) объекты.

#### `createAccountGroup` {#createaccountgroup}

<Method name="createAccountGroup" args={[{ name: 'group', type: 'AccountGroup' }]} returns="Promise<id>" />

Создайте группу учетных записей. `id` новой группы.

#### `updateAccountGroup` {#updateaccountgroup}

<Method name="updateAccountGroup" args={[{ name: 'id', type: 'id' }, { name: 'fields', type: 'object' }]} />

Обновление полей группы аккаунтов. `fields` может указывать на `name` поле, описанное в [`Account Group`](#account-group).

#### `deleteAccountGroup` {#deleteaccountgroup}

<Method name="deleteAccountGroup" args={[{ name: 'id', type: 'id' }]} />

Удалите группу учетных записей. Все учетные записи в группе остаются негруппированными.

#### Примеры {#examples-2}

```js
// Group two accounts under "Savings"

const groupId = await createAccountGroup({ name: 'Savings' });
await updateAccount(allySavingsId, { account_group_id: groupId });
await updateAccount(marcusSavingsId, { account_group_id: groupId });
```

## Категории {#categories}

#### Категория {#category}

<StructType fields={objects.category} />

#### Методы {#methods-3}

#### `getCategories` {#getcategories}

<Method name="getCategories" args={[{ name: 'options = {}', type: 'object?' }]} returns="Promise<Category[]>" />

По умолчанию возвращает все категории.

The `options` Объект поддерживает:

- `hidden`: фильтр со скрытым статусом. `false` возвращать только видимые категории, или `true` Возвращать только спрятанные.

#### `createCategory` {#createcategory}

<Method name="createCategory" args={[{ name: 'category', type: 'Category' }]} returns="Promise<id>" />

Создать категорию. Возвращает `id` новой категории.

#### `updateCategory` {#updatecategory}

<Method name="updateCategory" args={[{ name: 'id', type: 'id' }, { name: 'fields', type: 'object' }]} returns="Promise<null>" />

Обновление полей категории. `fields` может указывать любое поле, описанное в [`Category`](#category).

#### `deleteCategory` {#deletecategory}

<Method name="deleteCategory" args={[{ name: 'id', type: 'id' }]} returns="Promise<null>" />

Исключить категорию.

### Примеры {#examples-3}

```js
{
  name: "Food",
  group_id: "238d4d38-a512-4e28-9bbe-e96fd5d99251"
}
```

#### Категории доходов {#income-categories}

Настройка `is_income` то `true` Чтобы создать категорию дохода. `group_id` категория должна указывать на существующую категорию группы доходов (в настоящее время существует только одна, см. [категория](#category-group)).

## Группы категорий {#category-groups}

#### Категория Группа {#category-group}

<StructType fields={objects.categoryGroup} />

```js
{
  name: 'Bills';
}
```

#### Группы категорий доходов {#income-category-groups}

Должна быть только одна категория дохода,

#### Методы {#methods-4}

#### `getCategoryGroups` {#getcategorygroups}

<Method name="getCategoryGroups" args={[{ name: 'options = {}', type: 'object?' }]} returns="Promise<CategoryGroup[]>" />

По умолчанию возвращает каждую группу со всеми ее категориями, вложенными под нее.

The `options` Объект поддерживает:

- `hidden`фильтр по скрытому статусу, применяемый как к группам, так и к их вложенным категориям. `false` возвращать только видимые группы и категории; `true` Возвращать только спрятанные.

#### `createCategoryGroup` {#createcategorygroup}

<Method name="createCategoryGroup" args={[{ name: 'group', type: 'CategoryGroup' }]} returns="Promise<id>" />

Создайте группу категорий. `id` новой группы.

#### `updateCategoryGroup` {#updatecategorygroup}

<Method name="updateCategoryGroup" args={[{ name: 'id', type: 'id' }, { name: 'fields', type: 'object' }]} returns="Promise<id>" />

Обновление полей группы категорий. `fields` может указывать любое поле, описанное в [`CategoryGroup`](#category-group).

#### `deleteCategoryGroup` {#deletecategorygroup}

<Method name="deleteCategoryGroup" args={[{ name: 'id', type: 'id' }]} returns="Promise<null>" />

Исключить группу категорий.

## Платежи {#payees}

#### плательщик {#payee}

<StructType fields={objects.payee} />

```js
{
  name: "Kroger",
  category: "a1bccbd1-039e-410a-ba05-a76b97a74fc8"
}
```

#### Переводы {#transfers-1}

Переводы используют получателей, чтобы указать, на какие счета переводить деньги в / из. Это позволяет системе использовать ту же логику соответствия получателей для управления переводами.

Каждый счет имеет соответствующего "получателя перевода", уже созданного в системе. Если получатель платежа является получателем перевода, он будет иметь `transfer_acct` поле, настроенное на идентификатор учетной записи. Используйте это для создания переводных транзакций с [`importTransactions`](#importtransactions).

#### Методы {#methods-5}

#### `getPayees` {#getpayees}

<Method name="getPayees" args={[]} returns="Promise<Payee[]>" />

Получите все выплаты.

#### `getCommonPayees` {#getcommonpayees}

<Method name="getCommonPayees" args={[]} returns="Promise<Payee[]>" />

Получите обычных получателей, которые часто появляются в транзакциях.

#### `createPayee` {#createpayee}

<Method name="createPayee" args={[{ name: 'payee', type: 'Payee' }]} returns="Promise<id>" />

Создайте плательщика. `id` нового плательщика.

#### `updatePayee` {#updatepayee}

<Method name="updatePayee" args={[{ name: 'id', type: 'id' }, { name: 'fields', type: 'object' }]} returns="Promise<id>" />

Обновление полей плательщика. `fields` может указывать любое поле, описанное в [`Payee`](#payee).

#### `deletePayee` {#deletepayee}

<Method name="deletePayee" args={[{ name: 'id', type: 'id' }]} returns="Promise<null>" />

Удалить получателя.

#### `mergePayees` {#mergepayees}

<Method name="mergePayees" args={[{ name: 'targetId', type: 'id' }, { name: 'mergeIds', type: 'id[]' }]} returns="Promise<null>" />

Объединение одного или нескольких получателей в целевой получатель, сохраняя имя цели.

## Тэги {#tags}

#### Тег {#tag}

<StructType fields={objects.tag} />

#### Методы {#methods-6}

#### `getTags` {#gettags}

<Method name="getTags" args={[]} returns="Promise<Tag[]>" />

Возьми все бирки.

#### `createTag` {#createtag}

<Method name="createTag" args={[{ name: 'tag', type: 'Tag' }]} returns="Promise<id>" />

Создайте тег. Возвращает `id` новой меткой.

#### `updateTag` {#updatetag}

<Method name="updateTag" args={[{ name: 'id', type: 'id' }, { name: 'fields', type: 'object' }]} returns="Promise<null>" />

Обновление полей тега. `fields` может указывать любое поле, описанное в [`Tag`](#tag).

#### `deleteTag` {#deletetag}

<Method name="deleteTag" args={[{ name: 'id', type: 'id' }]} returns="Promise<null>" />

Удалите тег.

#### Примеры {#examples-4}

```js
// Create a tag
await createTag({
  tag: 'groceries',
  color: '#ff0000',
  description: 'Grocery shopping expenses',
});
```

```js
// Get all tags
let tags = await getTags();
```

```js
// Update a tag's color
await updateTag(id, { color: '#00ff00' });
```

## Правила {#rules}

#### состояние {#conditionoraction}

<StructType fields={objects.condition} />

#### Правило {#rule}

<StructType fields={objects.rule} />

#### Методы {#methods-7}

#### `getRules` {#getrules}

<Method name="getRules" args={[]} returns="Promise<Rule[]>" />

Соблюдай все правила.

#### `getPayeeRules` {#getpayeerules}

<Method name="getPayeeRules" args={[{ name: 'payeeId', type: "id" }]} returns="Promise<Rule[]>" />

Соблюдать все правила, связанные с `payeeId`Это обычные `Rule` предметы в одинаковой форме `getRules` Правило связано с получателем, когда одно из его условий или действий имеет `payee` поле ссылается на этот идентификатор, поэтому возвращенные правила не имеют `payee_id` собственность.

#### `createRule` {#createrule}

<Method name="createRule" args={[{ name: 'rule', type: 'Rule' }]} returns="Promise<Rule>" />

Создает правило. Возвращает новое правило, включая `id`.

#### `updateRule` {#updaterule}

<Method name="updateRule" args={[{ name: 'rule', type: 'Rule' }]} returns="Promise<Rule>" />

В отличие от других методов обновления, для этого требуется полный объект правил, включая `id`Возвращает обновленное правило.

#### `deleteRule` {#deleterule}

<Method name="deleteRule" args={[{ name: 'id', type: 'id' }]} returns="Promise<null>" />

Исключить правило.

#### Примеры {#examples-5}

```js
{
  stage: 'pre',
  conditionsOp: 'and',
  conditions: [
    {
      field: 'payee',
      op: 'is',
      value: 'test-payee',
    },
  ],
  actions: [
    {
      op: 'set',
      field: 'category',
      value: 'fc3825fd-b982-4b72-b768-5b30844cf832',
    },
  ],
}
```

## Расписание {#schedule}

#### Расписание {#schedule-1}

<StructType fields={objects.schedule} />

#### RecurConfig {#recurconfig}

<StructType fields={objects.recurConfig} />

#### Методы {#methods-8}

#### `getSchedules` {#getschedules}

<Method name="getSchedules" args={[]} returns="Promise<Schedule[]>" />

Получите все расписания. Возвращает массив [`Schedule`](#schedule) объекты.

#### `createSchedule` {#createschedule}

<Method name="createSchedule" args={[{ name: 'schedule', type: 'Schedule' }]} returns="Promise<id>" />

Создать расписание на основе информации, заполненной объектом расписания. Просьба обращаться к примечаниям объекта расписания для получения подробной информации по каждому полю.

#### `updateSchedule` {#updateschedule}

<Method name="updateSchedule" args={[{ name: 'id', type: 'id' }, { name: 'fields', type: 'object' }]} returns="Promise<schedule>" />

Обновление полей правила. `fields` может указывать любое поле, описанное в [`Schedule`](#schedule)Возвращает обновленное правило.

#### `deleteSchedule` {#deleteschedule}

<Method name="deleteSchedule" args={[{ name: 'id', type: 'id' }]} returns="Promise<null>" />

## Заметки {#notes}

Примечания могут быть прикреплены к любому объекту (категории, бюджетные месяцы и т. д.) по идентификатору. Они также используются для определения шаблонов бюджета и целей экономии (например. `#template 250`, `#goal 1000`).

#### `getNote` {#getnote}

<Method name="getNote" args={[{ name: 'id', type: 'id' }]} returns="Promise<Note | null>" />

возвращает примечание для данного идентификатора сущности, или `null` Если нота не была установлена.

#### `updateNote` {#updatenote}

<Method name="updateNote" args={[{ name: 'id', type: 'id' }, { name: 'note', type: 'string' }]} returns="Promise<void>" />

Устанавливает заметку на объекте с заданным идентификатором. Передайте пустую строку, чтобы очистить заметку.

## Миск {#misc}

#### Бюджетный файл {#budgetfile}

<StructType fields={objects.budgetFile} />

#### InitConfig {#initconfig}

<StructType fields={objects.initConfig} />

#### Методы {#methods-9}

#### `init` {#init}

<Method name="init" args={[{ name: 'config', type: 'InitConfig?' }]} returns="Promise<void>" />

Инициализирует API, подключившись к серверу Actual Budget. Параметр конфигураций необязателен и по умолчанию `{}` (только локальный режим).

#### `shutdown` {#shutdown}

<Method name="shutdown" args={[]} returns="Promise<void>" />

Это закроет любой открытый бюджет и очистит любые ресурсы.

#### `sync` {#sync}

<Method name="sync" args={[]} returns="Promise<void>" />

Синхронизирует локально кэшированные бюджетные файлы с копией сервера.

#### `runBankSync` {#runbanksync}

<Method name="runBankSync" args={[{ properties: [{ name: 'accountId', type: 'string' }] }]} returns="Promise<void>" />

Запустите синхронизацию банка 3-й стороны (GoCardless, SimpleFIN). Это загрузит транзакции и вставит их в реестр.

#### `runImport` {#runimport}

<Method name="runImport" args={[{ name: 'budgetName', type: 'string' }, { name: 'func', type: 'func' }]} returns="Promise<void>" />

Создает новый бюджетный файл с заданным именем, а затем запускает пользовательскую функцию импортера для заполнения его данными.

#### `getBudgets` {#getbudgets}

<Method name="getBudgets" args={[]} returns="Promise<BudgetFile[]>" />

Возвращает список всех бюджетных файлов либо локально кэшированных, либо на удаленном сервере. `state` поле и локальные файлы имеют `id` поле.

#### `loadBudget` {#loadbudget}

<Method name="loadBudget" args={[{ properties: [{ name: 'syncId', type: 'string' }] }]} returns="Promise<void>" />

Загрузите локально кэшированный бюджетный файл.

#### `downloadBudget` {#downloadbudget}

<Method name="downloadBudget" args={[{ properties: [{ name: 'syncId', type: 'string' }, { name: 'password', type: 'string?' }] }]} returns="Promise<void>" />

Загрузите бюджетный файл. Если файл существует локально, он будет загружаться оттуда. В противном случае он будет загружать файл с сервера.

#### `importBudget` {#importbudget}

<Method name="importBudget" args={[{ name: 'input', type: 'string | ArrayBuffer | Uint8Array' }, { name: 'options', type: "{ type?: 'actual' | 'ynab4' | 'ynab5', filename?: string }?" }]} returns="Promise<{ id: string }>" />

Импортировать бюджет из экспортируемого файла и загружать его. `input` является либо путем к файлу, либо исходным содержимым файла. По умолчанию файл рассматривается как фактический экспорт (a) `.zip` файл, содержащий `db.sqlite` и `metadata.json`); проход `type: 'ynab4'` или `type: 'ynab5'` для импорта экспорта YNAB. При передаче исходного содержимого вы можете предоставить исходное имя файла `filename` - некоторые виды импорта используют его для получения бюджетного названия. Возвращает идентификатор импортного бюджета, который сейчас является загруженным бюджетом.

#### `exportBudget` {#exportbudget}

<Method name="exportBudget" args={[]} returns="Promise<Uint8Array>" />

Экспортировать загруженный в настоящее время бюджет в виде необработанных байтов в формате zip. `.zip` файл или передать его обратно `importBudget` Восстановить бюджет позже.

#### `batchBudgetUpdates` {#batchbudgetupdates}

<Method name="batchBudgetUpdates" args={[{ name: 'func', type: 'func' }]} returns="Promise<void>" />

Выполняет партию бюджетных обновлений. Это полезно для внесения множественных изменений в бюджет за один звонок на сервер.

#### `runQuery` {#runquery}

<Method name="runQuery" args={[{ properties: [{ name: 'query', type: 'ActualQL' }] }]} returns="Promise<unknown>" />

Позволяет запускать любой произвольный запрос ActualQL в открытом бюджете.

#### `getIDByName` {#getidbyname}

<Method name="getIDByName" args={[{ properties: [{ name: 'type', type: 'string' }, { name: 'string', type: 'string'}] }]} returns="Promise<string>" />

Получить идентификатор для любой учетной записи, получателя, категории или расписания, предоставив соответствующее имя. Разрешенными типами являются «счета», «графики», «категории», «получатели».

#### `getServerVersion` {#getserverversion}

<Method name="getServerVersion" args={[]} returns="Promise<{error?: string;} | {version: string;}>" />

Возвращает ошибку или текущую версию сервера.

#### `getPreferences` {#getpreferences}

<Method name="getPreferences" args={[]} returns="Promise<SyncedPrefs>" />

Возвращает синхронизированные предпочтения бюджета — настройки, которые синхронизируются между устройствами, такими как формат номера (см.`numberFormat`, `hideFraction`), валюта (`defaultCurrencyCode`, `currencySymbolPosition`, `currencySpaceBetweenAmountAndSymbol`), формат даты (`dateFormat`), и первый день недели (`firstDayOfWeekIdx`Все значения являются строками (или `undefined` Если предпочтение никогда не было установлено. `SyncedPrefs` Тип экспортируется из `@actual-app/api/models`.

#### `setPreference` {#setpreference}

<Method name="setPreference" args={[{ name: 'id', type: 'keyof SyncedPrefs' }, { name: 'value', type: 'string | undefined' }]} returns="Promise<void>" />

Устанавливает одно синхронизированное предпочтение. `id` Должен быть действительный ключ SyncedPrefs.
