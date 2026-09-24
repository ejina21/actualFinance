import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useFeatureFlag } from './useFeatureFlag';

vi.mock('./useSyncedPref', () => ({
  useSyncedPref: () => [undefined],
}));

describe('useFeatureFlag', () => {
  it('uses the redesigned sidebar when no preference has been set', () => {
    const { result } = renderHook(() => useFeatureFlag('newSidebarUI'));

    expect(result.current).toBe(true);
  });
});
