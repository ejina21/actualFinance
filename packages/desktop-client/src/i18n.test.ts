import i18n from 'i18next';

import { availableLanguages, setI18NextLanguage } from './i18n';

vi.mock('i18next', () => {
  const i18nMock = {
    use: vi.fn().mockReturnThis(),
    init: vi.fn().mockResolvedValue(undefined),
    changeLanguage: vi.fn(),
  };
  return { default: i18nMock };
});

vi.mock('./languages', () => ({
  languages: {
    '/locale/ru.json': vi.fn(),
  },
}));

vi.hoisted(vi.resetModules);

describe('Russian-only language selection', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(vi.unstubAllGlobals);

  test('offers only Russian', () => {
    expect(availableLanguages).toEqual(['ru']);
  });

  test('uses Russian when the system language is English', () => {
    vi.stubGlobal('navigator', { language: 'en' });

    setI18NextLanguage(null);

    expect(vi.mocked(i18n).changeLanguage).toHaveBeenCalledWith('ru');
  });

  test('ignores a stored English preference', () => {
    vi.stubGlobal('navigator', { language: 'en' });

    setI18NextLanguage('en');

    expect(vi.mocked(i18n).changeLanguage).toHaveBeenCalledWith('ru');
  });
});
