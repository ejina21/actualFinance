import { I18nextProvider } from 'react-i18next';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createInstance } from 'i18next';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type * as StyleModule from '#style';

import { ThemeSettings } from './Themes';

const mockSwitchTheme = vi.fn();
const mockSwitchDarkTheme = vi.fn();
const mockSetLight = vi.fn();
const mockSetDark = vi.fn();
const mockSetOverride = vi.fn();

let mockTheme: string = 'light';
let mockInstalledLight: string | undefined = undefined;
let mockInstalledDark: string | undefined = undefined;
let mockCustomCssOverride: string | undefined = undefined;
const englishI18n = createInstance();

function renderInEnglish() {
  render(
    <I18nextProvider i18n={englishI18n}>
      <ThemeSettings />
    </I18nextProvider>,
  );
}

vi.mock('#hooks/useGlobalPref', () => ({
  useGlobalPref: (key: string) => {
    switch (key) {
      case 'installedCustomLightTheme':
        return [mockInstalledLight, mockSetLight];
      case 'installedCustomDarkTheme':
        return [mockInstalledDark, mockSetDark];
      case 'customCssOverride':
        return [mockCustomCssOverride, mockSetOverride];
      default:
        return [undefined, vi.fn()];
    }
  },
}));

vi.mock('#style', async () => {
  const actual = await vi.importActual<typeof StyleModule>('#style');
  return {
    ...actual,
    useTheme: () => [mockTheme, mockSwitchTheme],
    usePreferredDarkTheme: () => ['dark', mockSwitchDarkTheme],
  };
});

vi.mock('#components/sidebar/SidebarProvider', () => ({
  useSidebar: () => ({ floating: false }),
}));

vi.mock('#hooks/useThemeCatalog', () => ({
  useThemeCatalog: () => ({ data: [], isLoading: false, error: null }),
}));

describe('ThemeSettings', () => {
  beforeAll(async () => {
    await englishI18n.init({
      lng: 'en',
      resources: { en: { translation: {} } },
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockTheme = 'light';
    mockInstalledLight = undefined;
    mockInstalledDark = undefined;
    mockCustomCssOverride = undefined;
  });

  describe('custom CSS override indicator', () => {
    it('is hidden when customCssOverride is undefined', () => {
      renderInEnglish();
      expect(
        screen.queryByLabelText('Custom CSS override active — click to edit'),
      ).toBeNull();
    });

    it('is hidden when customCssOverride is an empty string', () => {
      mockCustomCssOverride = '';
      renderInEnglish();
      expect(
        screen.queryByLabelText('Custom CSS override active — click to edit'),
      ).toBeNull();
    });

    it('is hidden when customCssOverride is only whitespace', () => {
      mockCustomCssOverride = '   \n  ';
      renderInEnglish();
      expect(
        screen.queryByLabelText('Custom CSS override active — click to edit'),
      ).toBeNull();
    });

    it('is visible when customCssOverride has non-whitespace content', () => {
      mockCustomCssOverride = ':root { --color-accent: #ff00aa; }';
      renderInEnglish();
      expect(
        screen.getByLabelText('Custom CSS override active — click to edit'),
      ).toBeVisible();
    });

    it('opens the installer when clicked', async () => {
      const user = userEvent.setup();
      mockCustomCssOverride = ':root { --color-accent: #ff00aa; }';
      renderInEnglish();
      await user.click(
        screen.getByLabelText('Custom CSS override active — click to edit'),
      );
      // Installer heading appears on open
      expect(screen.getByText('Install Custom Theme')).toBeVisible();
    });
  });

  describe('built-in theme selection preserves override', () => {
    it('does not call setCustomCssOverride when switching to a built-in theme', async () => {
      const user = userEvent.setup();
      mockCustomCssOverride = ':root { --color-accent: #ff00aa; }';
      renderInEnglish();

      // The Select trigger is the only "Light" button before the dropdown
      // is opened. Click it to reveal the menu.
      const select = screen.getByRole('button', { name: 'Light' });
      await user.click(select);
      // The Select component renders menu items as buttons (not options).
      // After opening, "Dark" appears as a button in the popover.
      const darkOption = await screen.findByRole('button', { name: 'Dark' });
      await user.click(darkOption);

      expect(mockSetOverride).not.toHaveBeenCalled();
      expect(mockSwitchTheme).toHaveBeenCalledWith('dark');
    });
  });

  it('translates built-in theme names', async () => {
    const i18n = createInstance();
    await i18n.init({
      lng: 'ru',
      resources: {
        ru: {
          translation: {
            Light: 'Светлая',
            Dark: 'Тёмная',
            'System default': 'Как в системе',
          },
        },
      },
    });

    render(
      <I18nextProvider i18n={i18n}>
        <ThemeSettings />
      </I18nextProvider>,
    );

    expect(screen.getByRole('button', { name: 'Светлая' })).toBeVisible();
  });
});
