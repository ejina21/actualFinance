import { MemoryRouter } from 'react-router';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PrimaryNav } from './PrimaryNav';

vi.mock('#hooks/useSyncServerStatus', () => ({
  useSyncServerStatus: () => 'no-server',
}));
vi.mock('#hooks/useIsTestEnv', () => ({
  useIsTestEnv: () => false,
}));

describe('PrimaryNav', () => {
  it('keeps every main destination reachable and adds overview and operations', () => {
    render(
      <MemoryRouter>
        <PrimaryNav />
      </MemoryRouter>,
    );

    const mainDestinations = [
      '/overview',
      '/budget',
      '/accounts',
      '/reports',
      '/schedules',
    ];

    for (const destination of mainDestinations) {
      expect(document.querySelector(`a[href="${destination}"]`)).not.toBeNull();
    }
    expect(screen.getByRole('link', { name: 'Overview' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Transactions' })).toBeVisible();

    const more = screen.getByRole('button', { name: 'More' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(more);
    expect(more).toHaveAttribute('aria-expanded', 'true');

    for (const destination of ['/payees', '/rules', '/tags']) {
      expect(document.querySelector(`a[href="${destination}"]`)).not.toBeNull();
    }
  });

  it('opens secondary navigation for the active route', () => {
    render(
      <MemoryRouter initialEntries={['/rules']}>
        <PrimaryNav />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'More' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('link', { name: 'Rules' })).toBeVisible();
  });
});
