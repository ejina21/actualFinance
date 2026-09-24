---
title: Настройка среды разработки
---

Это руководство поможет вам создать среду для развития, чтобы внести свой вклад в развитие.

## Предпосылки {#prerequisites}

:::tip
Если вы предпочитаете не устанавливать Node и Yarn локально, вы можете использовать [Контейнер Dev](#dev-container) или бежать [Docker представляет](#docker-compose) напрямую.
:::

Прежде чем начать, убедитесь, что вы установили следующее:

- **Node.js**Версия 22 или больше. Вы можете скачать его из [Сайт Node.js](https://nodejs.org/en/download) (рекомендуем версию LTS).
  - Используйте диспетчер версий, как [нвм](https://github.com/nvm-sh/nvm) или [асдф](https://asdf-vm.com) Управление несколькими версиями Node.js.
  - В Windows во время установки Node.js обязательно выберите Автоматически установить необходимые инструменты со страницы Tools for Native Modules .

- **Ярн**Версия 4.9.1 или выше. Yarn - это менеджер пакетов, используемый Actual.
  - В проекте используются рабочие пространства Yarn 4 (структура монорепо).

- **Гит**Требуется для клонирования хранилища и контроля версий.

## Первоначальная настройка {#initial-setup}

1. Клонирование фактического хранилища:

   ```bash
   git clone https://github.com/actualbudget/actual.git
   cd actual
   ```

2. Установите все зависимости:

   ```bash
   yarn install
   ```

   Это позволит установить зависимости для всех пакетов в монорепо.

3. Проверьте свою настройку, запустив проверку типа:
   ```bash
   yarn typecheck
   ```

## Контейнер Dev {#dev-container}

Репо включает в себя a [`.devcontainer/`](https://github.com/actualbudget/actual/tree/master/.devcontainer) Конфигурация, которая следует за [Спецификация Dev Containers](https://containers.dev/)Любой инструмент, который поддерживает спецификацию, может использовать его — например, VS Code или Cursor (с помощью специального кода). [Расширение контейнеров Dev](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)), JetBrains IDE (через Gateway), GitHub Codespaces или [`@devcontainers/cli`](https://github.com/devcontainers/cli).

В редакторе, который поддерживает спецификацию, откройте клонированный репо и примите **Открыть в контейнере** Выберите команду (или запустите эквивалентную команду из палитры команд вашего редактора). `yarn install` будет работать автоматически через `postCreateCommand`И вы будете сброшены в оболочку с готовой цепочкой инструментов.

Чтобы запустить сервер, откройте терминал внутри контейнера и запустите:

```bash
yarn start
```

Сервер будет доступен в `http://localhost:3001/`Большинство редакторов автоматически пересылают порт из контейнера на ваш хост.

## Docker представляет {#docker-compose}

Для других редакторов запустите корень repo:

```bash
docker compose up --build
```

Начинается контейнер, который `yarn start:browser` Порт 3001. Открыто. `http://localhost:3001/` в вашем браузере.

:::note
Контейнер монтирует ваш репо на `/app`Если вы уже сбежали `yarn install` на вашем хосте - нативные модули (`better-sqlite3`, `bcrypt`, `electron`, `sharp`) будет компилироваться для вашей ОС хоста и не будет работать внутри контейнера Linux. `node_modules/` Во-первых, позвольте контейнеру переустановить или запустить путь контейнера разработчика выше (который автоматически восстанавливает их).
:::

## Основные команды развития {#essential-development-commands}

Все команды должны выполняться из **root каталог** Никогда не запускайте команды пряжи из детских каталогов рабочего пространства.

### Проверка типа {#type-checking}

```bash
# Run TypeScript type checking (ALWAYS run before committing)
yarn typecheck
```

### Линька и форматирование {#linting-and-formatting}

```bash
# Check for linting and formatting issues
yarn lint

# Auto-fix linting and formatting issues
yarn lint:fix
```

### Испытание {#testing}

```bash
# Run all tests across all packages
yarn test

# Run tests without cache (for debugging)
yarn test:debug
```

Для более подробной информации о тестировании см. [Руководство по испытаниям](./testing.md).

### Запуск серверов разработки {#starting-development-servers}

```bash
# Start browser development server
yarn start
# or explicitly:
yarn start:browser

# Start with sync server (for testing sync functionality)
yarn start:server-dev

# Start desktop app development
yarn start:desktop
```

### Здание {#building}

```bash
# Build browser version
yarn build:browser

# Build desktop app
yarn build:desktop

# Build API package
yarn build:api

# Build CLI package
yarn build:cli

# Build sync server
yarn build:server
```

## Структура рабочего пространства {#workspace-structure}

Actual использует рабочие пространства Yarn для управления монорепо с несколькими пакетами. Для получения подробной информации о каждом пакете см. [Структура проекта](./project-details/index.md) Документация.

## Запуск команд Workspace-Specific {#running-workspace-specific-commands}

Для запуска команд для конкретного рабочего пространства используйте:

```bash
yarn workspace <workspace-name> run <command>
```

Примеры:

```bash
# Run tests for @actual-app/core
yarn workspace @actual-app/core run test

# Start the docs development server
yarn workspace docs start

# Build the API package
yarn workspace @actual-app/api build
```

## Общие задачи развития {#common-development-tasks}

### Проведение специальных тестов {#running-specific-tests}

Видишь? [Руководство по испытаниям](./testing.md).

### Отладка {#debugging}

```bash
# Run tests in debug mode (without cache)
yarn test:debug

# Run E2E tests with headed browser
yarn workspace @actual-app/web run playwright test --headed --debug accounts.test.ts
```

### Проверка типа {#type-checking-1}

TypeScript использует ссылки на проекты. `yarn typecheck` От корня до проверки всех пакетов.

### Строительство для производства {#building-for-production}

```bash
# Browser build
yarn build:browser

# Desktop build
yarn build:desktop

# API build
yarn build:api

# CLI build
yarn build:cli

# Sync server build
yarn build:server
```

## Разработка Workflow {#development-workflow}

При внесении изменений:

1. Прочитайте соответствующие файлы, чтобы понять текущую реализацию
2. Сосредоточьтесь, постепенные изменения
3. Проверка типа бега: `yarn typecheck`
4. Пробег подкладки: `yarn lint:fix`
5. Проведите соответствующие тесты
6. Исправьте любые ошибки linter, которые вводятся

Для более подробной информации смотрите [Разработка Workflow](./index.md#development-workflow) Раздел.

## устранение неполадок {#troubleshooting}

Если вы столкнулись с проблемами:

- **Типы ошибок**Пробег `yarn typecheck` Увидеть все типы ошибок
- **Ошибки Linter**Пробег `yarn lint:fix` Автоматизация многих проблем
- **Неудачи испытаний**Посмотреть [Руководство по испытаниям](./testing.md) для отладки подсказок
- **Построить неудачи**Чистые артефакты сборки и переустановка зависимостей:
  ```bash
  rm -rf packages/*/dist packages/*/lib-dist packages/*/build
  yarn install
  ```

Для получения дополнительной помощи по устранению неполадок см. [Руководство по устранению неполадок](./troubleshooting.md).

## Следующие шаги {#next-steps}

- Прочитай [Руководство по содействию](./index.md) для получения информации о внесении изменений
- Обзор [Code Style Руководство](./code-style.md) для кодирующих конвенций
- Проверь. [Руководство по испытаниям](./testing.md) для тестирования стратегий
- Исследуйте [Структура проекта](./project-details/index.md) Чтобы понять организацию кодовой базы
