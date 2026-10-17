import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import { useQuery } from '#hooks/useQuery';
import { useSyncedPref } from '#hooks/useSyncedPref';
import { TestProviders } from '#mocks';

import { InstallmentPlanCard } from './InstallmentPlanCard';

vi.mock('#hooks/useQuery', () => ({ useQuery: vi.fn() }));
vi.mock('#hooks/useSyncedPref', () => ({ useSyncedPref: vi.fn() }));

describe('InstallmentPlanCard', () => {
  it('saves dates for a debt account without creating transactions', () => {
    const savePlan = vi.fn();
    vi.mocked(useQuery).mockReturnValue({
      data: [
        {
          date: '2026-10-17',
          amount: -40_000,
          startingBalanceFlag: true,
        },
      ],
      isLoading: false,
    });
    vi.mocked(useSyncedPref).mockReturnValue([undefined, savePlan]);

    render(
      <TestProviders>
        <InstallmentPlanCard accountId="synthetic-debt" today="2026-10-17" />
      </TestProviders>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Installment plan' }));
    fireEvent.change(screen.getByLabelText('First payment'), {
      target: { value: '2026-11-10' },
    });
    fireEvent.change(screen.getByLabelText('Last payment'), {
      target: { value: '2027-02-10' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save plan' }));

    expect(savePlan).toHaveBeenCalledWith(
      JSON.stringify({
        firstPaymentDate: '2026-11-10',
        lastPaymentDate: '2027-02-10',
      }),
    );
  });
});
