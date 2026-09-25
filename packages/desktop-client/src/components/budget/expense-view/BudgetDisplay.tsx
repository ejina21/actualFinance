import { View } from '@actual-app/components/view';

import { FinanceSummaryPage } from '#components/budget/summary/FinanceSummaryPage';
import { NarrowAlternate } from '#components/responsive/index';
import { useLocalPref } from '#hooks/useLocalPref';
import { useSyncedPref } from '#hooks/useSyncedPref';

export function BudgetDisplay() {
  const [budgetType = 'envelope'] = useSyncedPref('budgetType');
  const [displayMode] = useLocalPref('budget.displayMode');

  return (
    <View style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {displayMode === 'planning' ? (
        <NarrowAlternate name="Budget" key={budgetType} />
      ) : (
        <FinanceSummaryPage />
      )}
    </View>
  );
}
