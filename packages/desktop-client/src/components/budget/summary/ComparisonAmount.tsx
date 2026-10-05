import { Trans } from 'react-i18next';

import { theme } from '@actual-app/components/theme';

import { compareMonthValues } from './comparison';
import { SummaryMoney, SummaryPercent } from './SummaryMoney';
import { signedAmountColor } from './summaryStyles';

export function ComparisonAmount({
  base,
  value,
  colorizeBySign = false,
}: {
  base: number;
  value: number;
  colorizeBySign?: boolean;
}) {
  const change = compareMonthValues(base, value);
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <strong
        data-testid="comparison-value"
        style={colorizeBySign ? { color: signedAmountColor(value) } : undefined}
      >
        <SummaryMoney value={value} />
      </strong>
      <span
        style={{
          color: colorizeBySign
            ? signedAmountColor(change.absolute)
            : theme.pageTextLight,
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
