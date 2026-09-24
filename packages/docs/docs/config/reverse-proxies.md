---
title: Использование обратного прокси
---

# Использование обратного прокси {#using-a-reverse-proxy}

Если вы хотите открыть Actual для Интернета, вы должны спрятать его за обратным прокси с включенным SSL.
Существует ряд инструментов, которые можно использовать для этой цели. Эта страница конфигурации динамична, так что новые инструменты и их конфигурация могут быть добавлены непрерывно.

В наших примерах фактический сервер должен быть опубликован под доменом. **budget.example.org**.

:::note
The **Основные конфигурации** В этом случае должны быть активированы/реализованы дополнительные механизмы безопасности для инструмента, выбранного в каждом случае.
:::

## КАДДИ {#caddy}

Ниже приведен пример `Caddyfile` Caddy - это простой обратный прокси-сервер для использования, поскольку он автоматически получает и обновляет SSL-сертификаты для вас.

```yaml title="docker-compose.yml"
services:
  caddy:
    image: caddy:alpine
    container_name: caddy
    restart: unless-stopped
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - ./caddy/data:/data
      - ./caddy/config:/config
    ports:
      - '80:80'
      - '443:443'

  actual-server:
    image: actualbudget/actual-server:latest
    container_name: actual_server
    restart: unless-stopped
    volumes:
      - ./actual-data:/data
```

Каддифил:

```
budget.example.org {
    encode gzip zstd
    reverse_proxy actual_server:5006
}
```

## Траефик {#traefik}

Наш пример показывает рабочую конфигурацию для Traefik и Actual Server с использованием Docker. [Установить Actual/Docker](../install/docker.md)

```yaml title="docker-compose.yml"
services:
  traefik:
    image: traefik:latest
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - './traefik.yaml:/etc/traefik/traefik.yaml'
      - './traefik/data:/data'
      - '/var/run/docker.sock:/var/run/docker.sock'

  actual-server:
    image: actualbudget/actual-server:latest
    restart: unless-stopped
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.actual-server.rule=Host(`budget.example.org`)'
      - 'traefik.http.routers.actual-server.entrypoints=websecure'
      - 'traefik.http.services.actual-server.loadbalancer.server.port=5006'
    volumes:
      - ./actual-data:/data
```

```yaml title="traefik.yaml"
entryPoints:
  web:
    address: ':80'
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
          permanent: true
  websecure:
    address: ':443'
    http:
      tls:
        certResolver: le

providers:
  docker: {}

certificatesResolvers:
  letsencrypt:
    acme:
      email: you@example.com
      storage: /data/letsencrypt.json
      httpChallenge:
        entryPoint: web
```

Пожалуйста, обратитесь к [официальная документация](https://doc.traefik.io/traefik/user-guides/docker-compose/basic-example/) Для более подробной информации.

## NGINX {#nginx}

### Кросс-оригинальная изоляция и столкновения заголовков {#note-on-cross-origin-isolation-header-collisions}

Actual Budget требует «безопасного контекста» и конкретных заголовков.`COOP/COEP`) дать возможность `SharedArrayBuffer` Хотя приложение пытается установить эти заголовки автоматически, реализация ручной конфигурации Nginx, как предложено выше, может привести к **дублирующие заголовки** (e.g., `require-corp, require-corp`).

Современные браузеры аннулируют политики безопасности, если заголовки дублируются, что приводит к `SharedArrayBufferMissing` фатальная ошибка.

Для решения «дополнительных механизмов безопасности», упомянутых в примечании выше, используйте `proxy_hide_header` Директива для обеспечения того, чтобы Nginx действовал как единственный источник истины:

```nginx
location / {
    proxy_pass http://actual_server:5006;

    # Prevents header duplication between Upstream and Proxy
    proxy_hide_header Cross-Origin-Embedder-Policy;
    proxy_hide_header Cross-Origin-Opener-Policy;

    # Explicitly set mandatory security headers
    add_header Cross-Origin-Embedder-Policy "require-corp" always;
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Origin-Agent-Cluster "?1" always;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

SSL-сертификат выдается Let's Encrypt. [Сертбот](https://certbot.eff.org/instructions) Инструмент предоставляет опции автоматического обновления по истечении срока действия.
По крайней мере, вам придется адаптироваться. `server_name` и `ssl_certificate/ssl_certificate_key` Пути, чтобы соответствовать вашей установке.
Пожалуйста, обратитесь к их [официальная документация](https://nginx.org/en/docs/) Для более подробной информации.

```nginx title="NGINX Example Config"
server {
  listen 443 ssl;
  listen [::]:443 ssl;
  server_name budget.*;

  include /config/nginx/ssl.conf;
  client_max_body_size 0;

  # With SSL via Let's Encrypt
  ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem; # managed by Certbot
  ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem; # managed by Certbot
  include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

  location / {
    include /config/nginx/proxy.conf;
    include /config/nginx/resolver.conf;

    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $host;

    set $upstream_app actual-server;
    set $upstream_port 5006;
    set $upstream_proto http;
    proxy_pass $upstream_proto://$upstream_app:$upstream_port;
  }
}
```

## Apache httpd {#apache-httpd}

HTTP-сервер Apache может служить обратным прокси [Виртуальные хосты](https://httpd.apache.org/docs/2.4/vhosts/examples.html)Этот фрагмент будет добавлен в нижней части httpd.conf или на новом сайте.conf в папке, доступной для сайтов. Certbot поддерживается на httpd, но не используется в этом примере

```
<VirtualHost *:443>
  ServerName budget.example.com
  SSLProxyCheckPeerName off
	SSLProxyVerify none
  SSLEngine on
  SSLProxyEngine on
  SSLCertificateFile /etc/letsencrypt/live/example.com/fullchain.pem
  SSLCertificateKeyFile /etc/letsencrypt/live/example.com/privkey.pem

  ProxyPreserveHost On
  RequestHeader set X-Forwarded-Proto "https"
  RequestHeader set X-Forwarded-Port "443"

  # IP in the following lines can be a remote host, or a container IP
  ProxyPass / http://127.0.0.1:5006/
  ProxyPassReverse / http://127.0.0.1:5006/
</VirtualHost>
```

## Нгрок {#ngrok}

[Нгрок](https://ngrok.com/) предлагает обратный прокси и статический домен для [свободный](https://ngrok.com/docs/pricing-limits/free-plan-limits/)Вам нужно будет создать учетную запись с ними и следовать инструкциям на их [приборная панель](https://dashboard.ngrok.com/) Инструкции помогут вам настроить ngrok.

Создание бесплатного домена Ngrok очень просто: просто перейдите в раздел «Домены» сайта. Для получения дополнительной информации ознакомьтесь с [Пользовательский домен Docs](https://ngrok.com/docs/guides/other-guides/how-to-set-up-a-custom-domain/).

После того, как все это будет сделано, вы можете открыть Actual в Интернете с помощью своего пользовательского домена и бесплатного SSL с простой командой:

```
ngrok http --url=your-custom-domain.ngrok-free.app 5006
```

Если вы используете Actual на своем ПК, вам может быть полезно запустить эту команду при запуске вашего компьютера. Есть много способов сделать это. Ниже приведен не полный список:

- В Windows вы можете использовать [Расписание задач](https://www.technipages.com/scheduled-task-windows/)
  - Создайте Basic Task , дайте ему имя, а затем нажмите на At system startup
  - В разделе Action выберите программу ngrok.exe и добавьте аргументы. `http --url=your-custom-domain.ngrok-free.app 5006`.
  - После завершения вы можете выбрать бесшумный запуск в фоновом режиме, перейдя к properties , выбрав Run, зарегистрирован ли пользователь или нет , и тикая Hidden box.

- Linux можно использовать [системный](https://systemd.io/)
  - Перейдите в каталог: `/etc/systemd/system/` Создать файл сервиса `expose-actual-server.service`
  - Добавить следующий контент (и изменить в соответствии с вашими потребностями):

    ```
    [Unit]
    Description=Run my Bash script at startup
    After=network.target

    [Service]
    ExecStart=ngrok http --url=<your-custom-domain>.ngrok-free.app 5006
    Restart=always
    User=<your user>

    [Install]
    WantedBy=multi-user.target
    ```

  - Предоставить услугу с `sudo systemctl enable expose-actual-server.service`
