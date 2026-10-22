import { MemoryRouter } from 'react-router';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createTestAppStore, TestProviders } from '#mocks';
import { mergeSyncedPrefs } from '#prefs/prefsSlice';

import { PrimaryNav } from './PrimaryNav';

vi.mock('#hooks/useSyncServerStatus', () => ({
  useSyncServerStatus: () => 'online',
}));
vi.mock('#hooks/useIsTestEnv', () => ({ useIsTestEnv: () => false }));

function renderNav(showRules = false) {
  const store = createTestAppStore();
  if (showRules) {
    store.dispatch(
      mergeSyncedPrefs({
        'sidebar-menu-items': JSON.stringify([{ id: 'rules', hidden: false }]),
      }),
    );
  }
  return render(
    <TestProviders store={store}>
      <MemoryRouter>
        <PrimaryNav />
      </MemoryRouter>
    </TestProviders>,
  );
}

describe('PrimaryNav', () => {
  it('preserves overview and operations alongside upstream configurable pages', () => {
    renderNav();
    for (const destination of [
      '/overview',
      '/budget',
      '/accounts',
      '/reports',
      '/schedules',
    ]) {
      expect(document.querySelector(`a[href="${destination}"]`)).not.toBeNull();
    }
    expect(screen.getByRole('link', { name: 'Overview' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Transactions' })).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Bank Sync' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Rules' }),
    ).not.toBeInTheDocument();
  });
  it('shows a secondary destination when enabled in sidebar settings', () => {
    renderNav(true);
    expect(screen.getByRole('link', { name: 'Rules' })).toHaveAttribute(
      'href',
      '/rules',
    );
  });
});
