# Сброс пароля {#resetting-actual-login-password}

Если вы забыли свой пароль для входа в систему - не все потеряно, так как пароль может быть сброшен без потери каких-либо ваших файлов / данных.

Функция сброса пароля доступна из версии 23.4.2.

## Если `actual-server` устанавливается на хосте {#if-actual-server-is-installed-on-the-host}

Развёрнутая серверная среда может не иметь Yarn, поэтому существующий скрипт npm
Это самый простой путь перезагрузки:

```sh
npm run reset-password
```

Новый `actual-server` Команда CLI делает тот же сброс с более дружелюбной подсказкой:

```sh
actual-server --reset-password
```

Если вы запускаете синхронизирующий сервер из проверки источника вместо развернутого сервера,
Запустите скрипт рабочего пространства из корня хранилища:

```sh
yarn workspace @actual-app/sync-server reset-password
```

## Из контейнера Docker {#from-a-docker-container}

```sh
docker exec -it <actual_container> /bin/sh
node /app/src/scripts/reset-password.js
```

## Из кубернецкого положения {#from-a-kubernetes-instance}

```sh
kubectl exec --stdin --tty <actual_pod_name> -- /bin/sh
node /app/src/scripts/reset-password.js
```

Обе команды подскажут новый пароль и попросят вас подтвердить его.
Заполнив, вы можете войти с новым паролем.
