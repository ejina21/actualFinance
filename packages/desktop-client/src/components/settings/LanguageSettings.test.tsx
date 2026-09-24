import { I18nextProvider } from 'react-i18next';

import { render, screen } from '@testing-library/react';
import { createInstance } from 'i18next';

import { LanguageSettings } from './LanguageSettings';

vi.mock('#hooks/useGlobalPref', () => ({
  useGlobalPref: () => [null, vi.fn()],
}));

test('shows Russian as the fixed interface language', async () => {
  const i18n = createInstance();
  await i18n.init({
    lng: 'ru',
    resources: {
      ru: { translation: { Language: 'Язык', Russian: 'Русский' } },
    },
  });

  render(
    <I18nextProvider i18n={i18n}>
      <LanguageSettings />
    </I18nextProvider>,
  );

  expect(screen.getByText('Русский')).toBeVisible();
  expect(screen.queryByRole('button')).toBeNull();
});
