# Доступ к SharedArrayBuffer {#enabling-sharedarraybuffer-access}

Actual требует доступа к веб-технологии, называемой [`SharedArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer) Из-за уязвимостей безопасности в современных процессорах эта функция отключена до тех пор, пока не будут выполнены определенные условия. Actual не сможет работать, если ваш сервер не соответствует этим условиям.

## HTTPS {#https}

Действительный должен обслуживаться через HTTPS для `SharedArrayBuffer` Если вы используете облачный провайдер, это обычно делается для вас. [Активация HTTPS](../config/https.md) За дополнительной информацией.

## HTTP заголовки {#http-headers}

В дополнение к требованиям HTTPS, `Cross-Origin-Embedder-Policy` и `Cross-Origin-Opener-Policy` Заголовки должны быть установлены `require-corp` и `same-origin` Если вы используете дефолт `actual-server` Если вы используете другой сервер, вам не нужно беспокоиться об этом (заголовки всегда будут включены). Если вы используете другой сервер, вам нужно убедиться, что эти заголовки установлены.

## Поддерживаемый браузер {#supported-browser}

Браузер, который вы используете для доступа к серверу, также должен поддерживать `SharedArrayBuffer`Последние версии Chrome, Firefox, Safari и Edge поддерживают эту функцию. ["Могу я использовать?"](https://caniuse.com/sharedarraybuffer) для подробной разбивки, какие версии браузера поддерживают эту функцию.
