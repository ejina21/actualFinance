import { useState } from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { send } from '@actual-app/core/platform/client/connection';

import { Link } from '#components/common/Link';
import { useLocalPref } from '#hooks/useLocalPref';
import { useSyncedPref } from '#hooks/useSyncedPref';

import { Setting } from './UI';

export function BudgetTypeSettings() {
  const [budgetType = 'envelope', setBudgetType] = useSyncedPref('budgetType');
  const [displayMode, setDisplayMode] = useLocalPref('budget.displayMode');
  const [isLoading, setIsLoading] = useState(false);
  const selectedMode =
    displayMode === 'spending'
      ? 'spending'
      : displayMode === 'planning'
        ? budgetType
        : 'summary';

  async function selectMode(
    mode: 'summary' | 'envelope' | 'spending' | 'tracking',
  ) {
    if (mode === 'summary' || mode === 'spending') {
      setDisplayMode(mode);
      return;
    }

    if (mode !== budgetType) {
      setIsLoading(true);
      try {
        setBudgetType(mode);
        await send('reset-budget-cache');
      } finally {
        setIsLoading(false);
      }
    }
    setDisplayMode('planning');
  }

  return (
    <Setting>
      <div
        data-testid="budget-view-setting"
        style={{ display: 'grid', gap: 8 }}
      >
        <label htmlFor="budget-view-select">
          <Trans>Budget view</Trans>
        </label>
        <select
          id="budget-view-select"
          value={selectedMode}
          disabled={isLoading}
          onChange={event => {
            const value = event.currentTarget.value;
            if (
              value === 'summary' ||
              value === 'envelope' ||
              value === 'spending' ||
              value === 'tracking'
            ) {
              void selectMode(value);
            }
          }}
          style={{
            minHeight: 40,
            padding: '8px 12px',
            border: `1px solid ${theme.formInputBorder}`,
            borderRadius: 8,
            backgroundColor: theme.formInputBackground,
            color: theme.pageText,
          }}
        >
          <option value="summary">
            <Trans>Finance summary</Trans>
          </option>
          <option value="envelope">
            <Trans>Envelope</Trans>
          </option>
          <option value="spending">
            <Trans>Expenses only</Trans>
          </option>
          <option value="tracking">
            <Trans>Tracking</Trans>
          </option>
        </select>
      </div>
      <Text>
        <Trans>
          <strong>Envelope budgeting</strong> (recommended) digitally mimics
          physical envelope budgeting system by allocating funds into virtual
          envelopes for different expenses. It helps track spending and ensure
          you don't overspend in any category.
        </Trans>{' '}
        <Link
          variant="external"
          to="https://actualbudget.org/docs/getting-started/envelope-budgeting"
          linkColor="purple"
        >
          <Trans>Learn more</Trans>
        </Link>
      </Text>
      <Text>
        <Trans>
          With <strong>tracking budgeting</strong>, category balances reset each
          month, and funds are managed using a "Saved" metric instead of "To Be
          Budgeted." Income is forecasted to plan future spending, rather than
          relying on current available funds.
        </Trans>{' '}
        <Link
          variant="external"
          to="https://actualbudget.org/docs/getting-started/tracking-budget"
          linkColor="purple"
        >
          <Trans>Learn more</Trans>
        </Link>
      </Text>
    </Setting>
  );
}
