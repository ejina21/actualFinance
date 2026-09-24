# Сборка в Windows {#building-on-windows}

Многие скрипты сборки являются скриптами bash и не являются нативными в Windows. Для решения этой задачи можно построить проект с помощью Git Bash.

1. устанавливать [Git & Git Bash для Windows](https://git-scm.com/downloads).
2. Убедитесь, что вы активировали [Режим разработчика](https://docs.microsoft.com/en-us/windows/apps/get-started/enable-your-device-for-development).
3. Установите Node v22.x или выше.
4. Клонируйте это репо.
5. Используя Git Bash (запуск в качестве администратора), измените корень этого репо.
6. Изнутри раковины Баш, беги `yarn install`.
7. Из неподвижной оболочки, бегите `yarn start:browser`.
8. Откройте свой браузер для [http://localhost:3001](http://localhost:3001).

## Как создать приложение Electron на Windows {#how-to-build-the-electron-app-on-windows}

1. Следуйте шагам 1 - 6 выше.
2. Беги. `yarn start`Если вы обнаружили ошибку в файле bundle.desktop.js, просто <Key mod="ctrl" k="c" /> и повторить `yarn start`.
3. Если вы получили ошибку от электрона, бегите `yarn rebuild-electron` и повторить `yarn start`.

# ошибки {#errors}

## `rsync: command not found` {#rsync-command-not-found}

Если вы столкнетесь с этой ошибкой, вам нужно будет установить rsync бинарный на Git Bash. [направления](https://prasaz.medium.com/add-rsync-to-windows-git-bash-f42736bae1b3).

## `ln: failed to create symbolic link '../../desktop-client/public/kcab': Operation not permitted` {#ln-failed-to-create-symbolic-link-desktop-clientpublickcab-operation-not-permitted}

Баш должен управляться как администратор.
