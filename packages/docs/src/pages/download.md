---
title: Загрузка Actual
hide_table_of_contents: true
---

<div className="container" style={{maxWidth: '800px', margin: '0 auto'}}>

import Winsvg from '../../static/img/win.svg'
import Macsvg from '../../static/img/apple.svg'
import Linuxsvg from '../../static/img/linux.svg'
import { DownloadCard } from '../components/DownloadCard'

# Загрузка Actual

Проще всего начать с приложения для компьютера. В нём доступны основные функции бюджета. О возможностях, которым нужен сервер, читайте в [руководстве по установке](../docs/install).

## Приложение для компьютера

<div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '2rem', marginBottom: '2rem'}}>
<DownloadCard
    icon={<Winsvg width="100" height="100" fill="#6B46C1" />}
    platform="Windows"
    links={[
      {
        label: 'Microsoft Store',
        url: 'https://apps.microsoft.com/detail/9p2hmlhsdbrm?cid=actualbudget.org&mode=direct'
      },
      {
        label: 'Скачать вручную (x64)',
        url: 'https://github.com/actualbudget/actual/releases/latest/download/Actual-windows-x64.exe'
      },
      {
        label: 'Скачать вручную (arm64)',
        url: 'https://github.com/actualbudget/actual/releases/latest/download/Actual-windows-arm64.exe'
      },
    ]}
  />

<DownloadCard
icon={<Macsvg width="100" height="100" fill="#6B46C1" />}
platform="macOS"
links={[
{
label: 'Intel (x64)',
url: 'https://github.com/actualbudget/actual/releases/latest/download/Actual-mac-x64.dmg'
},
{
label: 'Apple Silicon (arm64)',
url: 'https://github.com/actualbudget/actual/releases/latest/download/Actual-mac-arm64.dmg'
}
]}
/>

<DownloadCard
icon={<Linuxsvg width="100" height="100" fill="#6B46C1" />}
platform="Linux"
links={[
{
label: 'Flathub',
url: 'https://flathub.org/en/apps/com.actualbudget.actual'
},
{
label: 'AppImage (x64)',
url: 'https://github.com/actualbudget/actual/releases/latest/download/Actual-linux-x86_64.AppImage'
},
{
label: 'AppImage (arm64)',
url: 'https://github.com/actualbudget/actual/releases/latest/download/Actual-linux-arm64.AppImage'
}
]}
/>

</div>

:::tip Предварительные сборки
Чтобы попробовать новые функции до официального выпуска, используйте [предварительные сборки приложения](/docs/contributing/preview-builds#nightly-desktop-builds).
:::

## Установка сервера

Actual состоит из приложения и сервера синхронизации. Сервер позволяет пользоваться одним бюджетом на разных устройствах и подключать банки. Прежде чем устанавливать сервер, прочитайте, [нужен ли он вам](../docs/install/). Доступны такие способы установки:

- [PikaPods](../docs/install/pikapods)
- [Fly.io](../docs/install/fly)
- [Командная строка](../docs/install/cli-tool)
- [Docker](../docs/install/docker)
- [Сборка из исходного кода](../docs/install/build-from-source)

</div>
