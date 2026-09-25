import { getLocale } from '@actual-app/core/shared/locale';
import i18n from 'i18next';

import { useGlobalPref } from './useGlobalPref';

/** The user's language code (BCP 47), falling back to the browser's. */
export function useLanguage() {
  const [language] = useGlobalPref('language');
  if (i18n.language === 'ru') {
    return 'ru-RU';
  }
  return language || navigator.language || 'en-US';
}

export function useLocale() {
  return getLocale(useLanguage());
}
