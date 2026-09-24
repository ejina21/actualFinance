import React from 'react';

export const types = {
  id: {
    name: 'id',
    type: 'string',
    description: (
      <span>
        <a href="https://en.wikipedia.org/wiki/Universally_unique_identifier">
          UUID
        </a>
      </span>
    ),
  },
  month: {
    name: 'month',
    type: 'string',
    description: <code>YYYY-MM</code>,
  },
  date: {
    name: 'date',
    type: 'string',
    description: <code>YYYY-MM-DD</code>,
  },
  amount: {
    name: 'amount',
    type: 'integer',
    description: (
      <span>
        Сумма хранится как целое число без дробной части. Обычно значение
        умножается на 100: <code>value * 100</code>. Множитель зависит от
        валюты. Например, сумма <code>$120.30</code> будет храниться как{' '}
        <code>12030</code>.
      </span>
    ),
  },
};

export const objects = {
  initConfig: [
    {
      name: 'serverURL',
      type: 'string',
      description: <span>Адрес сервера Actual Budget.</span>,
    },
    {
      name: 'password',
      type: 'string',
      description: <span>Пароль вашего сервера Actual Budget.</span>,
    },
    {
      name: 'dataDir',
      type: 'string',
      description: (
        <span>
          Каталог для хранения локально кэшированных бюджетных файлов.
        </span>
      ),
    },
    {
      name: 'verbose',
      type: 'boolean',
      description: (
        <span>Включает или отключает внутреннее журналирование Actual.</span>
      ),
    },
  ],

  transaction: [
    {
      name: 'id',
      type: types.id,
    },
    { name: 'account', type: types.id, required: true },
    { name: 'date', type: 'date', required: true },
    { name: 'amount', type: types.amount },
    {
      name: 'payee',
      type: types.id,
      description: (
        <span>
          В запросе <a href="#types-of-methods">create</a> это поле имеет
          приоритет над <code>payee_name</code>.
        </span>
      ),
    },
    {
      name: 'payee_name',
      type: 'string',
      description: (
        <div>
          <div className="mb-6">
            Если указать имя, будет создан получатель. Если такой получатель уже
            есть, используется существующий.
          </div>
          * Доступно только в запросе <a href="#types-of-methods">create</a>
        </div>
      ),
    },
    {
      name: 'imported_payee',
      type: 'string',
      description:
        'Это может быть что угодно. Предназначено для представления необработанного описания при импорте, позволяя пользователю увидеть исходное значение.',
    },
    { name: 'category', type: types.id },
    { name: 'notes', type: 'string' },
    {
      name: 'imported_id',
      type: 'string',
      description:
        'Уникальный идентификатор, обычно выдаваемый банком при импорте. Используйте его, чтобы избежать дублирования транзакций.',
    },
    {
      name: 'transfer_id',
      type: 'string',
      description: (
        <span>
          Для перевода — <code>id</code> связанной операции на другом счёте. См.{' '}
          <a href="#transfers">переводы</a>.
        </span>
      ),
    },
    {
      name: 'cleared',
      type: 'boolean',
      description: <span>Показывает, подтверждена ли операция.</span>,
    },
    {
      name: 'subtransactions',
      type: 'Transaction[]',
      description: (
        <div>
          <div className="mb-6">
            Массив частей разделённой операции. См.{' '}
            <a href="#split-transactions">разделённые операции</a>.
          </div>
          * Доступно только в запросах <a href="#types-of-methods">get</a> и{' '}
          <a href="#types-of-methods">create</a>
        </div>
      ),
    },
  ],

  account: [
    { name: 'id', type: types.id },
    { name: 'name', type: 'string', required: true },
    {
      name: 'offbudget',
      type: 'bool',
      description: (
        <span>
          По умолчанию: <code>false</code>
        </span>
      ),
    },
    {
      name: 'closed',
      type: 'bool',
      description: (
        <span>
          По умолчанию: <code>false</code>
        </span>
      ),
    },
    {
      name: 'balance_current',
      type: 'number | null',
      description: (
        <span>
          Текущий остаток счёта, полученный при синхронизации с банком. Его
          также можно задать вручную. По умолчанию: <code>null</code>
        </span>
      ),
    },
    {
      name: 'account_group_id',
      type: 'id | null',
      description: (
        <span>
          <a href="#account-group">Группа счетов</a>, к которой относится этот
          счёт. По умолчанию: <code>null</code>
        </span>
      ),
    },
  ],

  accountGroup: [
    { name: 'id', type: types.id },
    { name: 'name', type: 'string', required: true },
  ],

  category: [
    { name: 'id', type: types.id },
    { name: 'name', type: 'string', required: true },
    { name: 'group_id', type: types.id, required: true },
    {
      name: 'is_income',
      type: 'bool',
      description: (
        <span>
          По умолчанию: <code>false</code>
        </span>
      ),
    },
  ],

  categoryGroup: [
    { name: 'id', type: types.id },
    { name: 'name', type: 'string', required: true },
    {
      name: 'is_income',
      type: 'bool',
      description: (
        <span>
          По умолчанию: <code>false</code>
        </span>
      ),
    },
    {
      name: 'categories',
      type: 'Category[]',
      description: (
        <div>
          <div className="mb-6">
            Массив категорий группы. Не передавайте его при создании или
            изменении группы.
          </div>
          Доступно только в запросе <code>get</code>.
        </div>
      ),
    },
  ],

  schedule: [
    {
      name: 'id',
      type: types.id,
    },
    {
      name: 'name',
      type: 'string',
      description: (
        <span>
          Имя не обязательно, но если оно указано, оно должно быть уникальным.
        </span>
      ),
    },
    {
      name: 'rule',
      type: 'string',
      description: (
        <span>
          Все расписания имеют связанное базовое правило. Не должны быть
          снабжены новым расписанием. Он будет автоматически создан. Правила не
          могут быть обновлены до другого правила. Однако вы можете
          отредактировать правило с помощью API выше для Правила.
        </span>
      ),
    },
    {
      name: 'next_date',
      type: 'string',
      description: (
        <span>
          Следующее появление расписания. Не должно быть снабжено новым
          расписанием.
        </span>
      ),
    },
    {
      name: 'completed',
      type: 'boolean',
      description: <span>Чтобы не было нового расписания.</span>,
    },
    {
      name: 'posts_transaction',
      type: 'boolean',
      description: (
        <span>
          Нужно ли автоматически создавать операции по расписанию. По умолчанию:{' '}
          <code>false</code>.
        </span>
      ),
    },
    {
      name: 'payee',
      type: 'id | null',
      description: (
        <span>
          Необязательно. По умолчанию: <code>null</code>.
        </span>
      ),
    },
    {
      name: 'account',
      type: 'id | null',
      description: (
        <span>
          Необязательно. По умолчанию: <code>null</code>.
        </span>
      ),
    },
    {
      name: 'amount',
      type: 'number | { num1: number; num2: number }',
      description: (
        <span>
          Обычно укажите одно число. Если <code>amountOp</code> равно{' '}
          <code>isbetween</code>, задайте обе границы: <code>num1</code> и{' '}
          <code>num2</code>.
        </span>
      ),
    },
    {
      name: 'amountOp',
      type: "'is' | 'isapprox' | 'isbetween'",
      description: (
        <span>
          Определяет, как <code>amount</code> интерпретируется.
        </span>
      ),
    },
    {
      name: 'date',
      type: 'date | RecurConfig',
      required: true,
      description: (
        <span>
          Обязательное поле при создании расписания. Для разового события
          укажите дату. Для повторения используйте параметры RecurConfig ниже.
        </span>
      ),
    },
  ],

  recurConfig: [
    {
      name: 'frequency',
      type: `'daily' | 'weekly' | 'monthly' | 'yearly'`,
      required: true,
      description: <span>Как часто повторяется расписание.</span>,
    },
    {
      name: 'interval',
      type: 'number',
      description: (
        <span>
          Интервал повторения. По умолчанию: <code>1</code> если значение не
          указано.
        </span>
      ),
    },
    {
      name: 'patterns',
      type: 'RecurPattern[]',
      description: (
        <span>
          Необязательные шаблоны дат повторения, например дни недели или числа
          месяца.
        </span>
      ),
    },
    {
      name: 'skipWeekend',
      type: 'boolean',
      description: (
        <span>
          Если значение <code>true</code>, выходные пропускаются при расчёте дат
          повторения.
        </span>
      ),
    },
    {
      name: 'start',
      type: 'string',
      required: true,
      description: (
        <span>Строка даты ISO, указывающая дату начала повторения.</span>
      ),
    },
    {
      name: 'endMode',
      type: `'never' | 'after_n_occurrences' | 'on_date'`,
      required: true,
      description: (
        <span>
          Задаёт окончание повторения: без ограничения, после указанного числа
          событий или в определённую дату.
        </span>
      ),
    },
    {
      name: 'endOccurrences',
      type: 'number',
      description: (
        <span>
          Если <code>endMode</code> равно <code>'after_n_occurrences'</code>,
          указывает число повторений.
        </span>
      ),
    },
    {
      name: 'endDate',
      type: 'string',
      description: (
        <span>
          Если <code>endMode</code> равно <code>'on_date'</code>, указывает дату
          окончания повторений в формате ISO.
        </span>
      ),
    },
    {
      name: 'weekendSolveMode',
      type: `'before' | 'after'`,
      description: (
        <span>
          Если расчётная дата выпадает на выходной и <code>skipWeekend</code>{' '}
          имеет значение <code>true</code>, параметр <code>before</code> или{' '}
          <code>after</code> определяет перенос на предыдущий или следующий
          рабочий день.
        </span>
      ),
    },
  ],

  payee: [
    { name: 'id', type: types.id },
    { name: 'name', type: 'string', required: true },
    { name: 'category', type: types.id },
    {
      name: 'transfer_acct',
      type: types.id,
      description: (
        <span>
          <code>id</code> счёта, с которым связан получатель для перевода.
        </span>
      ),
    },
  ],

  tag: [
    { name: 'id', type: types.id },
    { name: 'tag', type: 'string', required: true },
    { name: 'color', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'hidden', type: 'boolean' },
  ],

  condition: [
    { name: 'field', type: 'string', required: true },
    { name: 'op', type: 'string', required: true },
    { name: 'value', type: 'string', required: true },
  ],

  rule: [
    { name: 'id', type: types.id },
    {
      name: 'stage',
      type: 'string',
      required: true,
      description: (
        <span>
          Допустимые значения: <code>pre</code>, <code>default</code>, or{' '}
          <code>post</code>.
        </span>
      ),
    },
    {
      name: 'conditionsOp',
      type: 'string',
      description: (
        <span>
          Допустимые значения: <code>and</code> или <code>or</code>.
        </span>
      ),
    },
    { name: 'conditions', type: 'ConditionOrAction[]' },
    { name: 'actions', type: 'ConditionOrAction[]' },
  ],

  budgetFile: [
    {
      name: 'name',
      type: 'string',
      required: true,
      description: <span>Название бюджета.</span>,
    },
    {
      name: 'cloudFileId',
      type: 'string',
      required: true,
      description: <span>Ид для бюджета на сервере. Обычно это UUID.</span>,
    },
    {
      name: 'groupId',
      type: 'string',
      required: true,
      description: <span>ИД группы для бюджета.</span>,
    },
    {
      name: 'hasKey',
      type: 'boolean',
      required: true,
      description: <span>Если файл имеет ключ шифрования.</span>,
    },
    {
      name: 'encryptKeyId',
      type: 'string',
      description: (
        <span>ID ключа шифрования для файла, если он зашифрован.</span>
      ),
    },
    {
      name: 'state',
      type: 'string',
      description: (
        <span>
          Для удалённых файлов значение равно <code>remote</code>.
        </span>
      ),
    },
    {
      name: 'id',
      type: 'string',
      description: <span>Локальный идентификатор файла бюджета.</span>,
    },
  ],
};

function Table({ style, headers, className, children }) {
  return (
    <table className={`text-sm ${className}`} style={style}>
      <thead>
        <tr>
          {headers.map(header => (
            <th key={header} className="text-gray-900 font-thin">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="border">{children}</tbody>
    </table>
  );
}

export function PrimitiveTypeList() {
  return (
    <Table headers={['Имя', 'Тип', 'Примечания']} style={{ maxWidth: 700 }}>
      {Object.keys(types).map(name => {
        return (
          <PrimitiveType
            key={name}
            name={types[name].name}
            type={types[name].type}
            description={types[name].description}
          />
        );
      })}
    </Table>
  );
}

export function PrimitiveType({ name, type, description }) {
  return (
    <tr>
      <td valign="top">
        <code>{name}</code>
      </td>
      <td valign="top">
        <code className="text-gray-600">{type}</code>
      </td>
      <td>{description}</td>
    </tr>
  );
}

export function StructType({ fields }) {
  return (
    <div className="struct mt-4 mb-10">
      <Table
        className="mb-0"
        showBorder={true}
        headers={['Поле', 'Тип', 'Обязательно?', 'Примечания']}
      >
        {fields.map(field => {
          return (
            <tr key={field.name}>
              <td valign="top">
                <code>{field.name}</code>
              </td>
              <td valign="top">
                <code className="text-gray-600">
                  {typeof field.type === 'string'
                    ? field.type
                    : field.type.name}
                </code>
              </td>
              <td valign="top">{field.required ? 'да' : 'нет'}</td>
              <td>{field.description}</td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}

function Argument({ arg }) {
  if (arg.properties) {
    return (
      <span>
        {arg.name ? arg.name + ': ' : ''}
        {'{ '}
        {arg.properties
          .map(prop => <Argument key={prop.name} arg={prop} />)
          .map(insertCommas)}
        {' }'}
      </span>
    );
  }
  return (
    <span style={{ position: 'relative' }}>
      <span
        className="text-gray-500"
        style={{ position: 'absolute', bottom: -20, fontSize: 12 }}
      >
        {arg.type}
      </span>
      {arg.name}
    </span>
  );
}

function insertCommas(element, i, arr) {
  if (i === arr.length - 1) {
    return element;
  }
  return [element, ', '];
}

export function Method({ name, args, returns = 'Promise<null>', children }) {
  return (
    <p className="method">
      <div className="p-4 pb-6 rounded border-b bg-gray-100 overflow-auto">
        <code className="text-blue-800">
          {name}(
          {args
            .map(arg => <Argument key={arg.name} arg={arg} />)
            .map(insertCommas)}
          ) <span className="text-gray-500">&rarr; {returns}</span>
        </code>
      </div>
      {children && React.cloneElement(children, {})}
    </p>
  );
}

export function MethodBox({ children }) {
  return <div style={{ border: '1px solid red' }}>{children}</div>;
}
