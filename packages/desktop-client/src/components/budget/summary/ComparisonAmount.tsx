import { Trans } from 'react-i18next';

import { theme } from '@actual-app/components/theme';

import { compareMonthValues } from './comparison';
import { SummaryMoney, SummaryPercent } from './SummaryMoney';

export function ComparisonAmount({
  base,
  value,
}: {
  base: number;
  value: number;
}) {
  const change = compareMonthValues(base, value);
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <strong data-testid="comparison-value">
        <SummaryMoney value={value} />
      </strong>
      <span
        style={{
          color: theme.pageTextLight,
          fontSize: 11,
          fontWeight: 400,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'end',
          gap: '2px 6px',
        }}
      >
        <span style={{ whiteSpace: 'nowrap' }}>
          <Trans>Difference:</Trans>{' '}
          <span data-testid="comparison-change">
            <SummaryMoney value={change.absolute} />
          </span>
        </span>
        <span style={{ whiteSpace: 'nowrap' }}>
          <SummaryPercent value={change.percent} />
        </span>
      </span>
    </div>
  );
}
