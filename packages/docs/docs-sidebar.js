/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tourSidebar: [
    'tour/index',
    'tour/user-interface',
    'tour/budget',
    'tour/accounts',
    'tour/reports',
    'tour/schedules',
    'tour/payees',
    'tour/rules',
  ],
  docs: [
    'index',
    {
      type: 'category',
      label: 'Начало работы',
      collapsed: false,
      className: 'no-indent section-header',
      items: [
        'getting-started/roadmap-for-new-users',
        {
          type: 'category',
          label: 'Установка Actual',
          collapsed: true,
          link: {
            type: 'doc',
            id: 'install/index',
          },
          items: [
            {
              type: 'category',
              label: 'На своём устройстве',
              collapsible: false,
              className: 'no-indent',
              items: [
                'install/docker',
                'install/cli-tool',
                'install/desktop-app',
                'install/build-from-source',
              ],
            },
            {
              type: 'category',
              label: 'В облаке',
              collapsible: false,
              className: 'no-indent',
              items: ['install/pikapods', 'install/fly'],
            },
          ],
        },
        'getting-started/starting-fresh',
        'getting-started/envelope-budgeting',
        'getting-started/tracking-budget',
        {
          type: 'category',
          label: 'Переход из другого приложения',
          link: {
            type: 'doc',
            id: 'migration/index',
          },
          items: ['migration/ynab4', 'migration/nynab'],
        },
        'getting-started/tips-tricks',
      ],
    },

    {
      type: 'category',
      label: 'Работа с Actual',
      collapsed: true,
      className: 'no-indent section-header',
      items: [
        {
          type: 'category',
          label: 'Бюджет',
          collapsed: true,
          link: {
            type: 'doc',
            id: 'budgeting/index',
          },
          items: [
            'budgeting/categories',
            'budgeting/returns-and-reimbursements',
            {
              type: 'category',
              label: 'Кредитные карты',
              collapsible: true,
              link: {
                type: 'doc',
                id: 'budgeting/credit-cards/index',
              },
              items: [
                'budgeting/credit-cards/paying-in-full',
                'budgeting/credit-cards/carrying-debt',
              ],
            },
            'budgeting/multi-currency',
            'budgeting/joint-accounts',
            'advanced/restart',
          ],
        },

        // End of Budgeting

        'schedules',

        {
          type: 'category',
          label: 'Счета и операции',
          collapsed: true,
          link: {
            type: 'doc',
            id: 'accounts/index',
          },
          items: [
            'accounts/reconciliation',
            {
              type: 'category',
              label: 'Импорт операций',
              collapsible: false,
              className: 'no-indent',
              items: [
                'transactions/importing',
                {
                  type: 'category',
                  label: 'Подключение банка',
                  link: {
                    type: 'doc',
                    id: 'advanced/bank-sync',
                  },
                  items: [
                    'advanced/bank-sync/akahu',
                    'advanced/bank-sync/enable-banking',
                    'advanced/bank-sync/gocardless',
                    'advanced/bank-sync/simplefin',
                    'advanced/bank-sync/pluggyai',
                  ],
                },
                'advanced/scripts/modify-transfers',
              ],
            },
            {
              type: 'category',
              label: 'Работа с операциями',
              collapsible: false,
              className: 'no-indent',
              items: [
                'transactions/filters',
                'transactions/transfers',
                'transactions/merging',
                'transactions/bulk-editing',
                'transactions/split-transactions',
                'transactions/tags',
              ],
            },
            {
              type: 'category',
              label: 'Получатели платежей',
              collapsible: false,
              className: 'no-indent',
              items: ['transactions/payees', 'transactions/payee-locations'],
            },
            {
              type: 'category',
              label: 'Правила',
              collapsed: true,
              link: {
                type: 'doc',
                id: 'budgeting/rules/index',
              },
              items: ['budgeting/rules/custom'],
            },
          ],
        },
        {
          type: 'category',
          label: 'Отчёты',
          collapsed: true,
          link: {
            type: 'doc',
            id: 'reports/index',
          },
          items: ['reports/custom-reports'],
        },
        'settings/index',
        'custom-themes',
        'notifications',
        {
          type: 'category',
          label: 'Экспериментальные функции',
          collapsed: true,
          link: {
            type: 'doc',
            id: 'experimental/index',
          },
          items: [
            'experimental/budget-automation',
            'experimental/goal-templates',
            'experimental/monthly-cleanup',
            'experimental/rule-templating',
            'experimental/formulas',
            'experimental/balance-forecast-report',
            'experimental/budget-analysis-report',
            'experimental/monte-carlo-analysis',
            'experimental/sankey-report',
          ],
        },
      ],
    },

    {
      type: 'category',
      label: 'Синхронизация и защита данных',
      collapsed: true,
      className: 'no-indent section-header',
      items: [
        'getting-started/sync',
        'getting-started/manage-files',
        {
          type: 'category',
          label: 'Резервное копирование и восстановление',
          collapsed: true,
          items: ['backup-restore/backup', 'backup-restore/restore'],
        },
      ],
    },

    {
      type: 'category',
      label: 'Собственный сервер',
      collapsed: true,
      className: 'no-indent section-header',
      items: [
        {
          type: 'category',
          label: 'Настройка сервера',
          collapsed: true,
          link: {
            type: 'doc',
            id: 'config/index',
          },
          items: [
            'config/https',
            'config/reverse-proxies',
            'config/oauth-auth',
            'config/multi-user',
            'advanced/http-header-auth',
          ],
        },
      ],
    },

    {
      type: 'category',
      label: 'Разработчикам',
      collapsed: true,
      className: 'no-indent section-header',
      items: [
        {
          type: 'category',
          label: 'API',
          link: { type: 'doc', id: 'api/index' },
          items: [
            'api/reference',
            'api/cli',
            {
              type: 'category',
              label: 'ActualQL',
              collapsed: true,
              link: {
                type: 'doc',
                id: 'api/actual-ql/index',
              },
              items: ['api/actual-ql/functions', 'api/actual-ql/examples'],
            },
          ],
        },
      ],
    },

    {
      type: 'category',
      label: 'Помощь и поддержка',
      collapsed: true,
      className: 'no-indent section-header',
      items: [
        'faq',
        {
          type: 'category',
          label: 'Решение проблем',
          collapsed: true,
          items: [
            'troubleshooting/server',
            'troubleshooting/shared-array-buffer',
            'troubleshooting/data-folder-access',
            'troubleshooting/reset_password',
            'troubleshooting/edge-browser',
          ],
        },
      ],
    },
  ],
  communitySidebar: [
    'community/index',
    'vision',
    'community-repos',
    {
      type: 'category',
      label: 'Участие в проекте',
      link: {
        type: 'doc',
        id: 'contributing/index',
      },
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'Структура проекта Actual',
          link: {
            type: 'doc',
            id: 'contributing/project-details/index',
          },
          items: [
            'contributing/project-details/database',
            'contributing/project-details/architecture',
            'contributing/project-details/feature-flags',
            'contributing/project-details/electron',
            'contributing/project-details/migrations',
            'contributing/project-details/advice',
          ],
        },
        'contributing/ai-usage-policy',
        'contributing/development-setup',
        'contributing/testing',
        'contributing/code-style',
        'contributing/troubleshooting',
        'contributing/i18n',
        'contributing/preview-builds',
        'contributing/releasing',
        'contributing/windows',
        {
          type: 'category',
          label: 'Документация',
          collapsible: false,
          className: 'no-indent',
          items: ['contributing/writing-docs'],
        },
        {
          type: 'category',
          label: 'Управление проектом',
          collapsible: false,
          className: 'no-indent',
          items: [
            'contributing/leadership/funding',
            'contributing/leadership/triaging-issues',
            'contributing/leadership/new-core-contributors-guide',
            'contributing/leadership/architecture-decision-records',
            'contributing/leadership/cursor-ide',
            'contributing/leadership/paying-contributors',
          ],
        },
      ],
    },
    'releases',
    'upcoming-release-notes',
  ],
};
module.exports = sidebars;
