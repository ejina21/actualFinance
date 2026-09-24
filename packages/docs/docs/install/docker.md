---
title: 'Установка через Docker'
sidebar_position: 2
---

## Хостинг Actual на домашнем сервере с Docker {#hosting-actual-on-a-home-server-with-docker}

Actual также доступен в виде изображения Docker, готового к запуску в вашей собственной пользовательской среде. [Docker Hub](https://hub.docker.com/r/actualbudget/actual-server) (как `actualbudget/actual-server`) и [Контейнерный реестр GitHub](https://ghcr.io/actualbudget/actual) (как `ghcr.io/actualbudget/actual`Фактическое должно функционировать одинаково, когда вынимается из любого реестра, поэтому вы можете выбрать тот, который вы предпочитаете.

## Docker Tags {#docker-tags}

Мы публикуем ряд тегов в официальном хранилище, чтобы пользователи, которые хотят получить последние изменения края кровотечения, могли сделать это, не дожидаясь обновления последнего изображения.

### `latest` Тег {#latest-tag}

The `latest` Тег указывает на последний официальный выпуск Actual. Это рекомендуемый тег для использования большинством пользователей.

- `latest`
- `latest-alpine` Основан на Alpine Linux, который является крошечным, поэтому он отлично подходит для устройств с низким энергопотреблением.

### `nightly` Тег {#nightly-tag}

The `nightly` Тег обновляется каждый раз, когда обязательство нажимается на `master` Хотя мы приветствуем людей, чтобы попробовать это, может быть больше ошибок, чем официальный релиз (пожалуйста, сообщите, что вы нашли!). Если вы решите попробовать этот тег, убедитесь, что вы сохраняете резервные копии своего бюджета на случай, если что-то пойдет не так.

- `nightly`
- `nightly-alpine` - Основан на Alpine Linux, который крошечный, поэтому он отлично подходит для устройств с низким энергопотреблением.

## Контейнер для запуска Docker Compose {#launch-container-using-docker-compose}

Предпосылки: Docker

Вы можете использовать [`docker-compose.yml` Файл, включенный в `actual` хранилище](https://github.com/actualbudget/actual/blob/master/packages/sync-server/docker-compose.yml) Запуск последней стабильной версии сервера.

Для создания и запуска контейнера:

```bash
$ docker compose up --detach
```

Вы можете дополнительно настроить контейнер, используя переменные среды - см. [конфигурационный раздел](../config/index.md) для более подробной информации.

### Обновление Docker Compose Container {#update-docker-compose-container}

```bash
$ docker compose pull && docker compose up -d
```

## Запуск контейнера с помощью команды Docker {#launch-container-using-docker-command}

Предпосылки: Docker

В качестве альтернативы использованию Docker Compose вы также можете запустить Docker с помощью этой команды. Эта команда, как показано, запустит последнюю стабильную сборку Actual.

```bash
$ docker run --pull=always --restart=unless-stopped -d -p 5006:5006 -v YOUR/PATH/TO/DATA:/data --name my_actual_budget actualbudget/actual-server:latest
```

`--pull=always` Всегда вытаскивает последние изображения

`--restart=unless-stopped` - устанавливает политику перезапуска контейнера

`-d` - запускает контейнер в качестве фонового приложения

`-p 5006:5006` - устанавливает порт для доступа к Актуальному.

`-v YOUR/PATH/TO/DATA:/data` - сообщает контейнеру, где хранить ваши бюджетные данные. Это сохраняет данные на вашем жестком диске, чтобы он не терялся, если вы удалите контейнер. Измените текущее значение на папку на вашем хост-компьютере. Сервер создаст `server-files` и `user-files` Подпапки в этом месте.

`--name my_actual_budget` Дайте вашему новому контейнеру докера имя (измените это на то, что вы хотите)

`actualbudget/actual-server:latest` - определяет, какое изображение вы хотите вытащить и запустить.

### Обновление контейнера Docker с помощью команды Docker {#update-docker-container-using-docker-command}

```bash
$ docker stop my_actual_budget
```

```bash
$ docker container rm my_actual_budget
```

```bash
$ docker run --pull=always --restart=unless-stopped -d -p 5006:5006 -v YOUR/PATH/TO/DATA:/data --name my_actual_budget actualbudget/actual-server:latest
```

Вы можете разместить все это в пакетном скрипте для 1 клика или одного обновления команды.

```bash
$ docker stop my_actual_budget && docker container rm my_actual_budget && docker run --pull=always --restart=unless-stopped -d -p 5006:5006 -v YOUR/PATH/TO/DATA:/data --name my_actual_budget actualbudget/actual-server:latest
```

## Тестовое соединение в локальной сети {#test-connection-within-local-network}

На другом ПК в локальной сети подключайтесь http://_serverIP_:_chosenPort_
