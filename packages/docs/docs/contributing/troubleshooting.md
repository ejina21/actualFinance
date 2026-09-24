---
title: Решение проблем при разработке
---

Это руководство поможет вам решить общие проблемы при разработке для Actual.

## Тип ошибки {#type-errors}

### Проблема: ошибки компиляции TypeScript {#issue-typescript-compilation-errors}

**Решение:**

1. Беги. `yarn typecheck` Увидеть все типы ошибок
2. Проверьте, правильно ли импортируются типы
3. Ищите существующие определения типов в `packages/loot-core/src/types/`
4. Использовать `satisfies` вместо того, чтобы `as` для сужения типа

### Вопрос: Невозможно найти определение модуля или типа {#issue-cannot-find-module-or-type-definitions}

**Решение:**

1. Проверить `tsconfig.json` для картографирования путей
2. Убедитесь, что вы используете правильный путь импорта для упаковки.
3. Беги. `yarn install` Для обеспечения всех зависимостей

## Ошибки Linter {#linter-errors}

### Ошибки ESLint или Prettier {#issue-eslint-or-prettier-errors}

**Решение:**

1. Беги. `yarn lint:fix` Автоматизация многих проблем
2. Проверьте выход ESLint на конкретные нарушения правил и исправьте их

## Тестовые сбои {#test-failures}

### Проблема: тесты неожиданно провалились {#issue-tests-fail-unexpectedly}

**Решение:**

1. Проверьте, работает ли тест в правильной среде (узел против Интернета)
2. **Проблемы с кэш-памятью**Чистый тайник с `rm -rf .lage` Если тесты ведут себя неожиданно

### Тесты E2E провалились {#issue-e2e-tests-fail}

**Решение:**

1. Убедитесь, что браузеры Playwright установлены: `yarn workspace @actual-app/web run playwright install`
2. Запустите тесты с головным браузером для отладки: `yarn workspace @actual-app/web run playwright test --headed --debug`

## Вопросы разрешения импорта {#import-resolution-issues}

### Проблема: ошибки импорта, характерные для платформы {#issue-platform-specific-import-errors}

**Решение:**

- Не указывайте напрямую на специфический импорт платформы.`.api`, `.web`, `.electron`)
- Условный экспорт в `loot-core` Для платформенного кода

## Построить неудачи {#build-failures}

### Оригинальное название: Build fails with errors {#issue-build-fails-with-errors}

**Решение:**

1. Чистые артефакты сборки:
   ```bash
   rm -rf packages/*/dist packages/*/lib-dist packages/*/build
   ```
2. Установить зависимости:
   ```bash
   yarn install
   ```
3. Проверьте версию Node.js (требуется >=22):
   ```bash
   node --version
   ```
4. Проверить версию Yarn (требуется ^4.9.1):
   ```bash
   yarn --version
   ```

### Проблема: Неисправности сборки родных модулей (better-sqlite3) {#issue-native-module-build-failures-better-sqlite3}

**Решение:**

1. В Windows: убедитесь, что вы выбрали «Автоматически установить необходимые инструменты» во время установки Node.js
2. Беги. `yarn rebuild-electron` Электронные сборки Electron builds
3. Беги. `yarn workspace @actual-app/core rebuild` Разработчик: Node.js builds
4. Убедитесь, что у вас есть необходимые инструменты сборки (Python, Visual Studio Build Tools на Windows)

## Проблемы сервера разработки {#development-server-issues}

### Сервер разработки не запускается {#issue-development-server-wont-start}

**Решение:**

1. Проверьте, используется ли порт
2. Убедитесь, что все зависимости установлены: `yarn install`
3. Попробуйте очистить модуль node modules и переустановить:
   ```bash
   rm -rf node_modules packages/**/node_modules
   yarn install
   ```
4. Проверьте сообщения об ошибках в консоли

### Оригинальное название: Hot Reload Not Working {#issue-hot-reload-not-working}

**Решение:**

1. Убедитесь, что вы используете правильную команду разработки
2. Проверьте, работают ли наблюдатели файлов (может быть ограничено в некоторых системах).
3. Попробуйте перезагрузить сервер разработки
4. Проверьте проблемы с разрешениями файловой системы

## Проблемы командования рабочим пространством {#workspace-command-issues}

### Оригинальное название: Workspace Command Not Found {#issue-workspace-command-not-found}

**Решение:**

1. Убедитесь, что вы выполняете команды из корневого каталога
2. Проверьте правильность названия рабочего пространства: `yarn workspaces list`
3. Проверьте package.json на наличие скриптов
4. Используйте правильный псевдоним рабочего пространства (например, `@actual-app/web` вместо того, чтобы `desktop-client`)

## Проблемы с Git {#git-issues}

### Оригинальное название: Pre-commit hooks failing {#issue-pre-commit-hooks-failing}

**Решение:**

1. Убедитесь, что Хаски установлен: `yarn prepare`
2. Запуск подкладки вручную: `yarn lint:fix`
3. Проверка типа бега: `yarn typecheck`
4. Исправьте любые ошибки перед совершением

## Вопросы окружающей среды {#environment-issues}

### Неправильный Node.js или версия Yarn {#issue-wrong-nodejs-or-yarn-version}

**Решение:**

1. Проверьте необходимые версии `package.json`:
   - Node.js: >=22
   - Ярн: ^4.9.1
2. Используйте менеджер версий:
   - [нвм](https://github.com/nvm-sh/nvm) Для Node.js
   - Версия Yarn управляется `packageManager` поле
3. Обновите свою среду в соответствии с требованиями

## Получить помощь {#getting-help}

Если вы все еще испытываете проблемы:

1. Проверь [Руководство по разработке](./development-setup.md) для установки инструкций
2. Обзор [Руководство по испытаниям](./testing.md) по вопросам, связанным с испытаниями
3. Проверь [Code Style Руководство](./code-style.md) по вопросам, связанным с кодом
4. Попросите о помощи в [Общество раздора](https://discord.gg/pRYNYr4W5A)
5. Поиск или создание проблемы на [GitHub](https://github.com/actualbudget/actual/issues)
