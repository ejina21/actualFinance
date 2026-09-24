# Сборка из исходного кода {#build-from-source}

:::info

Установка Actual путем его создания из источника является высокотехническим процессом. Мы рекомендуем этот подход в первую очередь для участников.

В большинстве случаев мы предлагаем выбрать один из самых простых вариантов:

- [Пикаподы](./pikapods.md)
- [Клиент рабочего стола](../../../download)
- [Сервер CLI](./cli-tool.md)
- [Докер](./docker.md)

:::

Сервер Actual используется для синхронизации изменений между устройствами. [Веб-клиент Actual](https://github.com/actualbudget/actual).

## Предпосылки {#prerequisites}

- Сервер Actual требует Node.js v22 или выше. Вы можете загрузить и установить последнюю версию Node.js из [Сайт Node.js](https://nodejs.org/en/download) (рекомендуем загрузить версию «LTS»).
  - Если вы находитесь в Windows, во время установки Node.js обязательно выберите Automatically install the necessary tools from the Tools for Native Modules page. Это необходимо для создания лучше-sqlite3. Если вы пропустили это при установке Node.js, дважды щелкните `C:\Program Files\nodejs\install_tools.bat` От проводника файлов или запустить его в терминале.
- Используйте такой инструмент, как [нвм](https://github.com/nvm-sh/nvm) или [асдф](https://asdf-vm.com) Установить и управлять несколькими версиями Node.js.
- Для пользователей Windows вам также понадобится Git Bash. На сайте Git есть [инструкции по загрузке и работе с Git для всех поддерживаемых операционных систем](https://git-scm.com/download).
- Actual использует пакеты из пряжи. [пряжка](https://yarnpkg.com/getting-started/install) Используя следующую команду:

  ```bash
  npm install --global yarn
  ```

## Установка фактического {#installing-actual}

1. После выполнения предпосылок откройте бэш и клонируйте [Actual](https://github.com/actualbudget/actual) проект в корневом каталоге проекта, где вы хотите установить Actual.

```bash
git clone https://github.com/actualbudget/actual.git
```

2. Перейдите к фактическому в корневом каталоге вашего проекта.
   ```bash
   cd actual
   ```
3. Установите все необходимые зависимости с помощью пряжи.
   ```bash
   yarn install
   ```
4. Создайте сервер с
   ```bash
   yarn build:server
   ```

## Реальный бег {#running-actual}

После установки и сборки Actual запустите Actual Server, выполнив следующую команду:

```bash
yarn start:server
```

Обратите внимание, что если вы перезагрузите компьютер, вам придется снова запустить эту команду, чтобы запустить сервер.

### Система Linux Setup {#linux-systemd-setup}

В системах Linux вы можете настроить файл системного блока для фактического запуска при запуске системы. Это должно быть сделано в качестве пользователя root (откройте сеанс root-терминала или представьте каждую команду с sudo для запуска команд ниже).

1. Создайте файл /etc/systemd/service/actual-server.service с приведенным ниже содержимым с помощью выбранного вами текстового редактора. `vi /etc/systemd/service/actual-server.service`Обратите внимание, что параметр WorkingDirectory= необходимо установить в папку Actual install.

```
[Unit]
Description=Actual-Server (https://actualbudget.org)
After=network.target

[Service]
WorkingDirectory=[Link to your actual-server install directory, ex. /var/www/html/actual]
ExecStart=/usr/bin/yarn start:server
Restart=on-watchdog

[Install]
WantedBy=multi-user.target
```

2. Систематизированное сканирование для созданного вами файла блока -> `systemctl daemon-reload`
3. Установите и запустите файл Systemd Unit `systemctl enable --now /etc/systemd/system/multi-user.target.wants/actual-server.service`
4. Подтвердите, что фактический сервер работает -> `systemctl status actual-server`

```
root@server:/etc/systemd/system# systemctl status actual-server
● actual-server.service - Actual-Server (https://actualbudget.org)
     Loaded: loaded (/lib/systemd/system/actual-server.service; enabled; vendor pres>
     Active: active (running) since Mon 2024-11-18 14:58:29 EST; 23h ago
   Main PID: 842857 (node)
      Tasks: 33 (limit: 38316)
     Memory: 45.9M
        CPU: 1.995s
     CGroup: /system.slice/actual-server.service
             ├─842857 node /usr/bin/yarn start:server
             ├─842870 /usr/bin/node /var/www/html/actual-server/.yarn/releases/yarn->
             └─842881 /usr/bin/node app
```

5. Вы должны увидеть выход, подобный выше. Главное, что нужно проверить - это раздел "Актив: активный (бег)". Отсюда вы можете рассмотреть [Настройка обратного прокси](https://actualbudget.org/docs/config/reverse-proxies) и [Активация HTTPS](https://actualbudget.org/docs/config/https)
6. Для остановки/запуска/перезапуска сервер использует команды
   - `systemctl stop actual-server`
   - `systemctl start actual-server`
   - `systemctl restart actual-server`
7. Чтобы увидеть системный журнал, показывающий состояние или ошибки, используйте команду из прошлого. Это может быть полезно для устранения неполадок.
   - `systemctl status actual-server`

## Доступ к реальным {#accessing-actual}

После того, как сервер был запущен, вы можете получить доступ к Actual с помощью своего браузера. [http://localhost:5006](http://localhost:5006).

При первом доступе к Actual вам может быть предложено предоставить URL-адрес сервера. Для локальной установки нажмите кнопку **Использование localhost: 5006** Кнопка для использования сервера, который у вас есть [сконфигурированный](https://actualbudget.org/docs/config/).

## Актуальное обновление {#updating-actual}

1. Остановите сервер, если он работает. <kbd>CTRL-C</kbd> (даже на macOS), чтобы остановить сервер или закрыть окно терминала.
2. В Баше, беги `git pull` из каталога, в который вы клонировали проект. Это загрузит последний код.
3. Беги. `yarn install` Из этого каталога будут загружаться все обновленные зависимости.
4. Беги. `yarn build:server` Создание сервера с использованием новейшего кода.
5. Перезагрузите сервер, запустив `yarn start:server`.

Actual постоянно развивается, чтобы включать новые функции и улучшать пользовательский опыт. Всегда рекомендуется, чтобы ваша локальная установка обновлялась с помощью нашего приложения. [Последние релизы](https://actualbudget.org/docs/releases).

## Переводы {#translations}

Если вы хотите использовать Actual на языке, отличном от английского, необходима дополнительная настройка.

1. Навигация к фактическому в корневом каталоге проекта и `packages/desktop-client` Внутри этого каталога.
   ```bash
   cd actual  # project root
   cd packages/desktop-client
   ```
2. Клонировать отдельное хранилище переводов.
   ```bash
   git clone https://github.com/actualbudget/translations locale
   ```
