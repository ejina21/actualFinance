import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { theme } from '@actual-app/components/theme';
import { spacing } from '@actual-app/components/tokens';
import { View } from '@actual-app/components/view';
import { send } from '@actual-app/core/platform/client/connection';

import { NarrowAlternate } from '#components/responsive/index';
import { useLocalPref } from '#hooks/useLocalPref';
import { useSyncedPref } from '#hooks/useSyncedPref';

import { ExpenseView } from './ExpenseView';

type BudgetMode = 'envelope' | 'tracking' | 'spending';

export function BudgetDisplay() {
  const { t } = useTranslation();
  const [budgetType = 'envelope', setBudgetType] = useSyncedPref('budgetType');
  const [displayMode, setDisplayMode] = useLocalPref('budget.displayMode');
  const [isSwitching, setIsSwitching] = useState(false);
  const mode: BudgetMode =
    displayMode === 'spending'
      ? 'spending'
      : budgetType === 'tracking'
        ? 'tracking'
        : 'envelope';

  async function selectMode(nextMode: BudgetMode) {
    if (nextMode === 'spending') {
      setDisplayMode('spending');
      return;
    }

    if (nextMode !== budgetType) {
      setIsSwitching(true);
      try {
        setBudgetType(nextMode);
        await send('reset-budget-cache');
      } finally {
        setIsSwitching(false);
      }
    }
    setDisplayMode('planning');
  }

  const options: Array<{ mode: BudgetMode; label: string }> = [
    { mode: 'envelope', label: t('Envelope') },
    { mode: 'tracking', label: t('Tracking') },
    { mode: 'spending', label: t('Expenses only') },
  ];

  return (
    <View style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <View
        role="group"
        aria-label={t('Budget view')}
        style={{
          flexDirection: 'row',
          gap: spacing.xs,
          padding: `${spacing.sm}px ${spacing.md}px`,
          overflowX: 'auto',
          borderBottom: `1px solid ${theme.tableBorder}`,
          backgroundColor: theme.pageBackground,
        }}
      >
        {options.map(option => (
          <button
            key={option.mode}
            type="button"
            aria-pressed={mode === option.mode}
            disabled={isSwitching}
            onClick={() => void selectMode(option.mode)}
            style={{
              flexShrink: 0,
              border: 0,
              borderRadius: 8,
              padding: `${spacing.sm}px ${spacing.md}px`,
              backgroundColor:
                mode === option.mode
                  ? theme.buttonPrimaryBackground
                  : 'transparent',
              color:
                mode === option.mode ? theme.buttonPrimaryText : theme.pageText,
              fontWeight: mode === option.mode ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            {option.label}
          </button>
        ))}
      </View>
      <View style={{ flex: 1, minHeight: 0 }}>
        {mode === 'spending' ? (
          <ExpenseView />
        ) : (
          <NarrowAlternate name="Budget" />
        )}
      </View>
    </View>
  );
}
