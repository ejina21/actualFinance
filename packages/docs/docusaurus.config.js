// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const { themes } = require('prism-react-renderer');

const defaultOptions = {
  beforeDefaultRemarkPlugins: [
    require('./src/remark/mentions'),
    require('./src/remark/enforce-doc-links'),
  ],
};

/** @type {import('@docusaurus/types').Config} */
module.exports = {
  title: 'Actual Budget',
  tagline: 'Личные финансы под вашим контролем',
  url: 'https://actualbudget.org/',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  favicon: 'img/favicon.ico',

  projectName: 'actualbudget.github.io',
  organizationName: 'actualbudget',
  deploymentBranch: 'main',

  i18n: {
    defaultLocale: 'ru',
    locales: ['ru'],
  },

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: 'docs',
          sidebarPath: require.resolve('./docs-sidebar.js'),
          ...defaultOptions,
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/og.webp',
      navbar: {
        title: 'Actual Budget',
        logo: {
          alt: 'Actual Budget',
          src: 'img/logo.webp',
        },
        items: [
          {
            to: '/#features',
            // never render as active
            activeBaseRegex: '^$',
            label: 'Возможности',
            position: 'left',
          },
          {
            type: 'docSidebar',
            sidebarId: 'tourSidebar',
            label: 'Обзор',
            position: 'left',
          },
          {
            type: 'doc',
            docId: 'index',
            label: 'Документация',
            position: 'left',
          },
        ],
      },
      prism: {
        theme: themes.github,
        darkTheme: themes.dracula,
        additionalLanguages: ['nginx'],
      },

      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },

      zoom: {
        // See: https://github.com/timmywil/panzoom for available options
        disableZoom: true,
        // A list of selectors to look for elements to enable pan and zoom
        selectors: [
          'div.mermaid[data-processed="true"]:not(.panzoom-exclude *)',
          'div.docusaurus-mermaid-container:not(.panzoom-exclude *)',
          '.drawio',
          '.panzoom-example',
        ],

        // Whether to wrap the panzoom items in a div with overflow:hidden
        // This constrains the pan zoom detail into the original container
        wrap: true,

        // The amount of time to wait in MS before the plugin client module tries to look for
        // and alter pan zoom elements. Some renders take a little bit before they appear in the
        // dom to find.
        timeout: 2000,
        excludeClass: 'panzoom-exclude',

        toolbar: {
          enabled: true,
        },
      },
    }),
  plugins: [
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            from: '/docs/actual-server-repo-move',
            to: '/docs/install/',
          },
        ],
      },
    ],
    [
      '@docusaurus/plugin-ideal-image',
      {
        quality: 70,
        max: 1030, // max resized image's size.
        min: 640, // min resized image's size. if original is lower, use that size.
        steps: 2, // the max number of images generated between min and max (inclusive)
        disableInDev: false,
      },
    ],
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      /** @type {import("@easyops-cn/docusaurus-search-local").PluginOptions} */
      ({
        hashed: true,
        indexDocs: true,
        indexPages: false,
        language: 'ru',
      }),
    ],
    '@r74tech/docusaurus-plugin-panzoom',
  ],
};
