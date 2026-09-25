import { useLayoutEffect, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { theme } from '@actual-app/components/theme';
import { css } from '@emotion/css';

import type { CashFlowSummary } from './cashFlow';
import { ComparisonAmount } from './ComparisonAmount';
import { formatSummaryMonth } from './formatSummaryMonth';
import { SummaryMoney } from './SummaryMoney';

const tableClass = css({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
  'th, td': {
    padding: '14px 16px',
    textAlign: 'right',
    borderBottom: `1px solid ${theme.tableBorder}`,
  },
  'th:first-child': {
    textAlign: 'left',
    position: 'sticky',
    left: 0,
    background: theme.cardBackground,
  },
  'thead th': { color: theme.pageTextLight, fontWeight: 500 },
  'tbody td': { minWidth: 145, fontSize: 20 },
  'tbody tr:last-child th, tbody tr:last-child td': { borderBottom: 0 },
  '@media (max-width: 600px)': {
    'th, td': { padding: '12px 8px', fontSize: 12 },
    'tbody td': { minWidth: 105, fontSize: 15 },
  },
});

export function ComparisonOverview({
  comparison,
  baseMonth,
  compareMonths,
}: {
  comparison: Record<string, CashFlowSummary>;
  baseMonth: string;
  compareMonths: readonly string[];
}) {
  const { t, i18n } = useTranslation();
  const comparisonScroll = useRef<HTMLDivElement>(null);
  const lastComparisonMonth = compareMonths.at(-1);
  useLayoutEffect(() => {
    if (lastComparisonMonth && comparisonScroll.current) {
      comparisonScroll.current.scrollLeft =
        comparisonScroll.current.scrollWidth;
    }
  }, [lastComparisonMonth]);

  const metrics = [
    { key: 'expenses', label: <Trans>Expenses</Trans> },
    { key: 'income', label: <Trans>Income</Trans> },
    { key: 'netFlow', label: <Trans>Net flow</Trans> },
  ] as const;
  return (
    <section
      data-testid="finance-comparison-overview"
      style={{ display: 'grid', gap: 10 }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          gap: 8,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>
          <Trans>Month comparison</Trans>
        </h2>
        <span style={{ color: theme.pageTextLight, fontSize: 12 }}>
          <Trans>Difference is shown relative to the base month.</Trans>
        </span>
      </div>
      <div
        ref={comparisonScroll}
        style={{
          overflowX: 'auto',
          border: `1px solid ${theme.tableBorder}`,
          borderRadius: 12,
          background: theme.cardBackground,
        }}
      >
        <table
          className={tableClass}
          aria-label={t('Monthly comparison totals')}
        >
          <thead>
            <tr>
              <th scope="col">
                <Trans>Metric</Trans>
              </th>
              <th scope="col">
                {formatSummaryMonth(baseMonth, i18n.language)}
                <div style={{ fontSize: 11, marginTop: 4 }}>
                  <Trans>Base month</Trans>
                </div>
              </th>
              {compareMonths.map(month => (
                <th scope="col" key={month}>
                  {formatSummaryMonth(month, i18n.language)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map(({ key, label }) => (
              <tr key={key} data-testid={`comparison-${key}`}>
                <th scope="row">{label}</th>
                <td>
                  <SummaryMoney value={comparison[baseMonth]?.[key] ?? 0} />
                </td>
                {compareMonths.map(month => (
                  <td key={month}>
                    <ComparisonAmount
                      base={comparison[baseMonth]?.[key] ?? 0}
                      value={comparison[month]?.[key] ?? 0}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
