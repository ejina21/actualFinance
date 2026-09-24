---
title: 'Сервер из командной строки'
---

## Хостинг Actual с сервером CLI {#hosting-actual-with-the-server-cli}

Actual синхронный сервер доступен в виде пакета NPM. Пакет предназначен для максимального удобства работы синхронного сервера и публикуется в официальном реестре NPM. [@actual-app/sync-server](https://www.npmjs.com/package/@actual-app/sync-server).

### Установка сервера CLI {#installing-the-server-cli}

Node.js v22 или выше. `@actual-app/sync-server` пакет pm

**Установите глобально с помощью npm:**

```bash
npm install --location=global @actual-app/sync-server
```

После установки вы можете выполнять команды непосредственно с вашего терминала. `actual-server`.

### использование {#usage}

> Перед запуском инструмента перейдите в каталог, который вы хотите, чтобы ваши файлы были расположены.

Запустите сервер CLI со следующим синтаксисом:

```bash
actual-server [options]
```

**Доступные варианты**

| Командование         | Описание                            |
| -------------------- | ----------------------------------- |
| `-h` или `--help`    | Распечатайте этот список и выйдите. |
| `-v` или `--version` | Печать этой версии и выход.         |
| `--config`           | Путь к файлу конфигурирования.      |
| `--reset-password`   | Сбросьте пароль                     |

**Значения по умолчанию**

Если нет `--config` Опция установлена, Actual будет искать `config.json` файл в текущем каталоге. Если он существует, он будет использоваться. Если его нет, Actual установит [Конфигурация по умолчанию](../config/index.md).

### Примеры {#examples}

Бежать с [Конфигурация по умолчанию](../config/index.md):

```bash
actual-server
```

Бежать с [Конфигурация JSON](../config/index.md):

```bash
actual-server --config ./custom-config.json
```

Бежать с [Переменная конфигурация окружающей среды](../config/index.md):

```bash
ACTUAL_DATA_DIR=./custom-directory actual-server --config ./config.json
```

Сбросьте пароль

```bash
actual-server --reset-password
```

### Обновление сервера CLI {#updating-the-server-cli}

Сервер синхронизации может быть обновлен простой командой.

```bash
npm update -g @actual-app/sync-server
```

### Удаление сервера CLI {#uninstalling-the-server-cli}

Синхронный сервер может быть удален с помощью простой команды.

```bash
npm uninstall -g @actual-app/sync-server
```
