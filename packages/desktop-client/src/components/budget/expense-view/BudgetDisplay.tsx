import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { theme } from '@actual-app/components/theme';
import { spacing } from '@actual-app/components/tokens';
import { View } from '@actual-app/components/view';
import { send } from '@actual-app/core/platform/client/connection';

import { FinanceSummaryPage } from '#components/budget/summary/FinanceSummaryPage';
import { NarrowAlternate } from '#components/responsive/index';
import { useLocalPref } from '#hooks/useLocalPref';
import { useSyncedPref } from '#hooks/useSyncedPref';

type BudgetMode = 'envelope' | 'tracking' | 'summary';

export function BudgetDisplay() {
  const { t } = useTranslation();
  const [budgetType = 'envelope', setBudgetType] = useSyncedPref('budgetType');
  const [displayMode, setDisplayMode] = useLocalPref('budget.displayMode');
  const [isSwitching, setIsSwitching] = useState(false);
  const mode: BudgetMode =
    displayMode !== 'planning'
      ? 'summary'
      : budgetType === 'tracking'
        ? 'tracking'
        : 'envelope';

  async function selectMode(nextMode: BudgetMode) {
    if (nextMode === 'summary') {
      setDisplayMode('summary');
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
    { mode: 'summary', label: t('Finance summary') },
    { mode: 'envelope', label: t('Envelope') },
    { mode: 'tracking', label: t('Tracking') },
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
          backgroundColor: theme.cardBackground,
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
                  ? theme.buttonNormalBackground
                  : 'transparent',
              color: theme.pageText,
              fontWeight: mode === option.mode ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            {option.label}
          </button>
        ))}
      </View>
      <View style={{ flex: 1, minHeight: 0 }}>
        {mode === 'summary' ? (
          <FinanceSummaryPage />
        ) : (
          <NarrowAlternate name="Budget" />
        )}
      </View>
    </View>
  );
}
