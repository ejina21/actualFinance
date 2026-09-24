# Вход через OpenID Connect {#authenticating-with-an-openid-provider}

## Настройка {#setup}

:::info
Эта особенность требует использования [Сервер Actual](./index.md)
:::

Если вам нужен более надежный метод аутентификации, чем пароль сервера, рекомендуется использовать провайдера OpenID. Большинство провайдеров OpenID поддерживают многофакторную аутентификацию, повышая безопасность вашего приложения. Кроме того, если вам нужна поддержка нескольких пользователей, вы должны включить эту функцию.

Чтобы включить эту функцию, вы можете использовать [конфигурационный файл](./index.md) `config.json` на реальном сервере или использовать UI.

### Конфигурация с использованием файла конфигурации {#configuration-using-a-configuration-file}

Если ваш провайдер OpenID поддерживает обнаружение, используйте следующий пример конфигурации:

```json title="config.json"
"openId": {
        "discoveryURL": "URL for the OpenID Provider",
        "client_id": "client_id given by the provider",
        "client_secret": "client_secret given by the provider",
        "server_hostname": "your Actual Server URL (so the provider redirects you to this)",
        "authMethod": "openid" // or "oauth2"
    }
```

Если ваш провайдер OpenID не поддерживает обнаружение, вы должны настроить каждую конечную точку вручную:

```json title="config.json"
"openId": {
        "issuer": {
            "name": "Friendly name for the issuer",
            "authorization_endpoint": "Provider's authorize endpoint",
            "token_endpoint": "Provider's access token endpoint",
            "userinfo_endpoint": "Provider's user info endpoint"
        },
        "client_id": "client_id given by the provider",
        "client_secret": "client_secret given by the provider",
        "server_hostname": "your Actual Server URL (so the provider redirects you to this)",
        "authMethod": "openid" // or "oauth2"
    }
```

:::tip
Использовать GitHub в качестве поставщика идентификационных данных можно только с помощью конфигурационных файлов. `"authMethod": "oauth2"`.
:::

### Конфигурация с использованием переменных среды {#configuration-using-environment-variables}

Если ваш провайдер OpenID поддерживает обнаружение, используйте следующие переменные:

- `ACTUAL_OPENID_DISCOVERY_URL`URL для провайдера OpenID
- `ACTUAL_OPENID_CLIENT_ID`Клиент id предоставлен провайдером
- `ACTUAL_OPENID_CLIENT_SECRET`Клиент секрет, предоставленный поставщиком
- `ACTUAL_OPENID_SERVER_HOSTNAME`Ваш фактический URL-адрес сервера (поэтому провайдер перенаправляет вас на это)

Если ваш провайдер OpenId не поддерживает обнаружение, используйте следующие переменные:

- `ACTUAL_OPENID_AUTHORIZATION_ENDPOINT`Конечная точка авторизации провайдера
- `ACTUAL_OPENID_TOKEN_ENDPOINT`: конечная точка доступа провайдера к токену
- `ACTUAL_OPENID_USERINFO_ENDPOINT`: конечная точка пользовательской информации провайдера
- `ACTUAL_OPENID_CLIENT_ID`Клиент id предоставлен провайдером
- `ACTUAL_OPENID_CLIENT_SECRET`Клиент секрет, предоставленный поставщиком
- `ACTUAL_OPENID_SERVER_HOSTNAME`Ваш фактический URL-адрес сервера (поэтому провайдер перенаправляет вас на это)

:::tip
Чтобы держать клиента в секрете от окружающей среды, установите `ACTUAL_OPENID_CLIENT_SECRET_FILE` на пути к файлу, содержащему его. [Конфигурирование сервера](index.md).
:::

### Конфигурация OpenID с помощью UI {#configuring-openid-using-the-ui}

Перейдите в любой бюджетный файл, затем в настройках нажмите на Start с помощью OpenID

![](/img/oauth/start-using-options.webp)

Как только вы нажмете Start с помощью OpenID , будет представлен модаль.

##### Инструкции {#instructions}

Заполните все необходимое поле для выбранного поставщика.

![Конфигурация из вариантов](/img/oauth/modal.webp)

Некоторые провайдеры не требуют заполнения всех полей.

Например, провайдеру passwordless.id не требуется `client_secret`.

Когда все настройки будут правильно заполнены, нажмите кнопку «ОК», и вы будете перенаправлены на страницу входа.

:::warning
Есть некоторые основные проверки конфигурации при нажатии «ОК», но если вы каким-то образом вводите неправильную информацию и данные сохраняются, при первом входе в систему с помощью OpenID у вас будет возможность просмотреть настройки.
:::

:::tip
При настройке вашего провайдера OpenID обязательно зарегистрируйте следующее: **перенаправить URI** с поставщиком: `https://<actual.myserver.com>/openid/callback`
:::

#### Проверенные поставщики {#tested-providers}

- Ауто
- Аутентик
- GitHub
- Аккаунты Google
- Кейлоак
- Microsoft Entra
- Passwordless.id
- Карманный ID

:::tip
Например, для Auth0 URL будет генерироваться по умолчанию, но вы должны изменить его своими собственными данными:

![](/img/oauth/provider-requirement.webp)
:::

#### После настройки {#after-setup}

После завершения настройки вы будете перенаправлены на страницу login :

![](/img/oauth/first-login.webp)

:::warning
Первый пользователь, который войдет в систему с OpenID/OAuth2, получит разрешение администратора и станет владельцем сервера. Владелец сервера не может быть изменен из пользовательского интерфейса после установки.
:::

### Переменные среды {#environment-variables}

#### `ACTUAL_OPENID_DISCOVERY_URL` {#actualopeniddiscoveryurl}

- **Цель:** Если ваш провайдер OpenID поддерживает обнаружение, это URL-адрес, по которому можно найти метаданные обнаружения.
  **Примерное значение:** `https://<openid-provider.com>/.well-known/openid-configuration`

#### `ACTUAL_OPENID_CLIENT_ID` {#actualopenidclientid}

- **Цель:** Клиентский идентификатор, выданный вашим провайдером OpenID.
  **Примерное значение:** `my-actual-app`

#### `ACTUAL_OPENID_CLIENT_SECRET` {#actualopenidclientsecret}

- **Цель:** Секрет клиента, выданный вашим провайдером OpenID.
  **Примерное значение:** `super-secret-value`

#### `ACTUAL_OPENID_SERVER_HOSTNAME` {#actualopenidserverhostname}

- **Цель:** Публичный URL вашего фактического сервера, на который провайдер перенаправляет после аутентификации.
  **Примерное значение:** `https://<actual.myserver.com>`

#### `ACTUAL_OPENID_AUTHORIZATION_ENDPOINT` {#actualopenidauthorizationendpoint}

- **Цель:** Конечная точка авторизации провайдера (для провайдеров, которые не поддерживают открытие).
  **Примерное значение:** `https://<openid-provider.com>/oauth2/authorize`

#### `ACTUAL_OPENID_TOKEN_ENDPOINT` {#actualopenidtokenendpoint}

- **Цель:** конечная точка маркера провайдера (для провайдеров, которые не поддерживают открытие).
  **Примерное значение:** `https://<openid-provider.com>/oauth2/token`

#### `ACTUAL_OPENID_USERINFO_ENDPOINT` {#actualopeniduserinfoendpoint}

- **Цель:** Конечная точка пользовательской информации провайдера (для провайдеров, которые не поддерживают обнаружение).
  **Примерное значение:** `https://<openid-provider.com>/oauth2/userinfo`

#### `ACTUAL_OPENID_AUTH_METHOD` {#actualopenidauthmethod}

- **Цель:** Сообщает серверу, следует ли использовать OpenID (OIDC) или более общий поток OAuth2.
  **Возможные ценности:**
  - `openid` (по умолчанию)
  - `oauth2`

:::tip
Использовать `oauth2` Для таких провайдеров, как GitHub, которые не полностью поддерживают OpenID.
:::

#### `ACTUAL_OPENID_ENFORCE` {#actualopenidenforce}

- **Цель:** Силы аутентификации OpenID/OAuth2 как единственный разрешенный метод входа в систему `true`.
  **Примерное значение:** `true` или `false` (по умолчанию) `false`)

#### `ACTUAL_TOKEN_EXPIRATION` {#actualtokenexpiration}

- **Цель:** Контролирует, как истекают токены доступа.
  **Возможные ценности:**
  - `"never"` (Токены никогда не истекают) **Текущий дефолт**)
  - `"openid-provider"` (Токены следуют за временем истечения срока действия от поставщика OpenID)
  - Цифровое значение в секундах (например, `3600` в течение 1 часа

#### `ACTUAL_USER_CREATION_MODE` {#actualusercreationmode}

- **Цель:** в `manual` Пользователи должны быть созданы вручную с соответствующими именами пользователей в Actual, прежде чем они смогут аутентифицироваться с OpenID / OAuth2. `login`Аутентификация пользователей с помощью OpenID/OAuth2 впервые будет производиться автоматически.

  **Возможные ценности:** `manual` или `login` (по умолчанию) `manual`)

:::tip
Настройка провайдера OpenID из опций поддерживает обнаружение; в противном случае используйте [Конфигурация файлов](./oauth-auth.md#configuration-using-a-configuration-file)
:::
