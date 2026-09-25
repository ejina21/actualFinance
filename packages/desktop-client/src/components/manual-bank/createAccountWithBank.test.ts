import { describe, expect, it, vi } from 'vitest';

import { createAccountWithBank } from './createAccountWithBank';

describe('creating an account with a manual bank', () => {
  it('keeps the created account when saving its bank fails', async () => {
    const create = vi.fn().mockResolvedValue('new-account');
    const saveBank = vi.fn().mockRejectedValue(new Error('offline'));

    await expect(
      createAccountWithBank(create, saveBank, 'tbank'),
    ).resolves.toEqual({
      id: 'new-account',
      bankSaved: false,
    });
    expect(saveBank).toHaveBeenCalledWith('new-account', 'tbank');
  });

  it('does not write a bank preference when no bank is selected', async () => {
    const create = vi.fn().mockResolvedValue('cash-account');
    const saveBank = vi.fn();

    await expect(createAccountWithBank(create, saveBank, '')).resolves.toEqual({
      id: 'cash-account',
      bankSaved: true,
    });
    expect(saveBank).not.toHaveBeenCalled();
  });
});
