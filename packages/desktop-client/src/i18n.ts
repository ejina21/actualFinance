import { initReactI18next } from 'react-i18next';

import * as Platform from '@actual-app/core/shared/platform';
import i18n from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';

import english from '#local-russian/en';

import { languages } from './languages';

const isTestEnvironment = import.meta.env.MODE === 'test';

export const availableLanguages = Platform.isPlaywright
  ? []
  : Object.keys(languages).map(path => path.split('/')[2].split('.')[0]);

const loadLanguage = (language: string) => {
  if (language !== 'ru') {
    throw new Error(`Unknown locale ${language}`);
  }
  return languages['/locale/ru.json']();
};

void i18n
  .use(initReactI18next)
  .use(resourcesToBackend(loadLanguage))
  .init({
    lng: isTestEnvironment ? 'en' : 'ru',
    resources: isTestEnvironment ? { en: { translation: english } } : undefined,

    // allow keys to be phrases having `:`, `.`
    nsSeparator: false,
    keySeparator: false,
    fallbackLng: isTestEnvironment ? 'en' : 'ru',
    interpolation: {
      escapeValue: false,
    },
    react: {
      transSupportBasicHtmlNodes: false,
    },
  });

export const setI18NextLanguage = (_language: string | null) => {
  if (i18n.language === 'ru') {
    return; // language is already set
  }

  void i18n.changeLanguage('ru');
};
