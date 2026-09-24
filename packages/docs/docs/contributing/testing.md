---
title: Тестирование
---

Actual использует комплексную стратегию тестирования для обеспечения качества и надежности кода. В этом руководстве рассказывается о том, как запускать тесты, писать тесты и отлаживать сбои в тестировании.

## Обзор испытаний {#testing-overview}

Проект использует несколько рамок тестирования:

- **Самый сильный** - Рамки для испытания блоков
- **драматург** Сквозное тестирование (E2E)
- **возраст** - Задание бегуна для выполнения тестов через монорепо эффективно

## Запуск тестов {#running-tests}

### Запуск всех тестов {#running-all-tests}

```bash
# Run all tests across all packages (recommended)
yarn test

# Run tests without cache (for debugging/CI)
yarn test:debug
```

The `yarn test` Команда использует Lage для параллельного выполнения тестов во всех рабочих пространствах.

- **Параллельная казнь**Тесты выполняются одновременно в разных пакетах для более быстрой обратной связи
- **Умное кэширование**Результаты испытаний кэшируются в `.lage/` Каталог для пропуска неизмененных пакетов
- **Осознание зависимости**Понимание зависимостей рабочего пространства и порядка выполнения

### Запуск тестов для конкретного пакета {#running-tests-for-a-specific-package}

```bash
# Run tests for @actual-app/core
yarn workspace @actual-app/core run test

# Run tests for the API package
yarn workspace @actual-app/api run test

# Run tests for desktop-client
yarn workspace @actual-app/web run test
```

### Запуск специального тестового файла {#running-a-specific-test-file}

```bash
# Run E2E test for a specific file
yarn workspace @actual-app/web run playwright test accounts.test.ts
```

## Единичные тесты (Vitest) {#unit-tests-vitest}

Единичные тесты расположены рядом с исходными файлами или в `__tests__` В тестовых файлах используются следующие соглашения об именах:

- `.test.ts` Тестовые файлы TypeScript
- `.test.tsx` - Реагировать на компоненты тестовых файлов
- `.spec.js` Тестовые файлы JavaScript (наследие)

### Написание Unit Tests {#writing-unit-tests}

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
// ... other imports

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup code
  });

  it('should behave as expected', () => {
    // Test logic
    expect(result).toBe(expected);
  });
});
```

### Тестирование лучших практик {#testing-best-practices}

- **Минимизируйте насмешки**Предпочитаете реальные реализации вместо макетов, когда это возможно
- **Используйте описательные названия тестов**Названия тестов должны четко описывать то, что тестируется
- **Самые яркие глобалы**: `describe`, `it`, `expect`, `beforeEach`и т.д. доступны по всему миру.
- **Тесты Sync-сервера**: Для тестов синхронизации глобалы четко определены в конфигурации

## Сквозные испытания (Playwright) {#end-to-end-tests-playwright}

Испытания E2E проводятся в `packages/desktop-client/e2e/` Используйте Playwright в качестве тестового бегуна.

### Тестирование E2E {#running-e2e-tests}

```bash
# Run E2E tests for web
yarn e2e

# Desktop Electron E2E (includes full build)
yarn e2e:desktop

# Run E2E tests for a specific package
yarn workspace @actual-app/web e2e

# Run specific E2E test with headed browser
yarn workspace @actual-app/web run playwright test --headed --debug accounts.test.ts
```

### E2E Испытательная структура {#e2e-test-structure}

- Испытания проводятся в `packages/desktop-client/e2e/`
- Модели страниц находятся в `e2e/page-models/` для многоразового взаимодействия страниц
- Мобильные тесты имеют `.mobile.test.ts` суффикс

## Визуальные регрессионные тесты (VRT) {#visual-regression-tests-vrt}

Тесты визуальной регрессии захватывают скриншоты и сравнивают их с базовыми изображениями для обнаружения визуальных изменений.

```bash
# Run visual regression tests
yarn vrt

# Run visual regression tests in Docker (consistent environment)
yarn vrt:docker
```

Снимки визуальной регрессии хранятся в тестовом файле `*-snapshots/` Каталоги. Используйте Docker для согласованных сред при запуске VRT. Они будут автоматически генерироваться и работать на запросах на вытягивание, чтобы поймать неожиданные визуальные изменения.

## Отладка тестовых сбоев {#debugging-test-failures}

### Lage Cache проблемы {#lage-cache-issues}

Если тесты ведут себя неожиданно, кэш Lage может вызывать проблемы:

```bash
# Clear Lage cache
rm -rf .lage

# Run tests without cache
yarn test:debug
```

### Тесты продолжаются на ошибки {#tests-continue-on-error}

С этим `--continue` Флаг, все пакеты работают, даже если один из них не справляется. Это помогает выявить все сбои в тестировании в монорепо за один раз.

### Режим отладки {#debug-mode}

```bash
# Run tests in debug mode (without parallelization)
yarn test:debug

# Run specific E2E test with headed browser and debug mode
yarn workspace @actual-app/web run playwright test --headed --debug accounts.test.ts
```

## Конфигурация тестов {#test-configuration}

### Самая быстрая конфигурация {#vitest-configuration}

- Корневая конфигурация: `vitest.config.ts` (для среды узлов)
- Веб-конфигурация: `vitest.web.config.ts` (для браузерной среды)
- Тесты Sync-сервера имеют глобали, явно определенные в конфигурации

### Конфигурация драматурга {#playwright-configuration}

- Файл Config: `packages/desktop-client/playwright.config.ts`
- Отчеты об испытаниях: `packages/desktop-client/playwright-report/`
- Результаты испытаний: `packages/desktop-client/test-results/`

## Тестирование Checklist {#testing-checklist}

Перед подачей запроса на вытягивание:

- [ ] Все существующие испытания проходят`yarn test`)
- [ ] Новая функциональность имеет соответствующий тестовый охват
- [ ] Тесты следуют лучшим практикам (минимизируйте насмешки, описательные имена).
- [ ] Тесты E2E проходят при внесении изменений в пользовательский интерфейс

## Дополнительные ресурсы {#additional-resources}

- [Самые яркие документы](https://vitest.dev/)
- [Документация драматурга](https://playwright.dev/)
- [Документация по возрасту](https://microsoft.github.io/lage/)
