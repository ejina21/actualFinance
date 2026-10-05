import { Trans, useTranslation } from 'react-i18next';

import { theme } from '@actual-app/components/theme';
import { spacing } from '@actual-app/components/tokens';
import * as monthUtils from '@actual-app/core/shared/months';

import { FinancialText } from '#components/FinancialText';
import { PrivacyFilter } from '#components/PrivacyFilter';
import { useFormat } from '#hooks/useFormat';
import { useLocale } from '#hooks/useLocale';
import { usePrivacyMode } from '#hooks/usePrivacyMode';

import type { MonthlyTrendPoint } from './OverviewData';

type FinanceTrendChartProps = {
  points: readonly MonthlyTrendPoint[];
  isLoading: boolean;
  error?: Error;
};

export function FinanceTrendChart({
  points,
  isLoading,
  error,
}: FinanceTrendChartProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const format = useFormat();
  const isPrivate = usePrivacyMode();
  const hasActivity = points.some(
    point => point.inflow !== 0 || point.outflow !== 0,
  );
  const maximum = Math.max(
    1,
    ...points.flatMap(point => [
      Math.abs(point.inflow),
      Math.abs(point.outflow),
    ]),
  );
  const totalInflow = points.reduce((sum, point) => sum + point.inflow, 0);
  const totalOutflow = points.reduce((sum, point) => sum + point.outflow, 0);

  return (
    <section data-testid="overview-trend" style={{ minWidth: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: spacing.sm,
          marginBottom: spacing.md,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>
          <Trans>Income and expenses by month</Trans>
        </h2>
        {!isLoading && !error && hasActivity && !isPrivate && (
          <div
            style={{
              display: 'flex',
              gap: spacing.md,
              color: theme.pageTextSubdued,
              fontSize: 12,
            }}
          >
            <span>
              <span
                aria-hidden="true"
                style={{ color: theme.budgetNumberPositive }}
              >
                ●
              </span>{' '}
              <Trans>Income</Trans>
            </span>
            <span>
              <span
                aria-hidden="true"
                style={{ color: theme.budgetNumberNegative }}
              >
                ●
              </span>{' '}
              <Trans>Expenses</Trans>
            </span>
          </div>
        )}
      </div>
      {error ? (
        <p
          role="alert"
          style={{ margin: 0, color: theme.budgetNumberNegative }}
        >
          <Trans>Could not load the income and expense chart.</Trans>
        </p>
      ) : isLoading ? (
        <output>
          <Trans>Loading summary…</Trans>
        </output>
      ) : isPrivate ? (
        <p style={{ margin: 0, color: theme.pageTextSubdued }}>
          <Trans>Hidden in private mode</Trans>
        </p>
      ) : !hasActivity ? (
        <p style={{ margin: 0, color: theme.pageTextSubdued }}>
          <Trans>No transactions in this period.</Trans>
        </p>
      ) : (
        <div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: spacing.lg,
              marginBottom: spacing.md,
              fontSize: 13,
            }}
          >
            <span>
              <Trans>Income</Trans>:{' '}
              <FinancialText>
                <PrivacyFilter>
                  {format(totalInflow, 'financial')}
                </PrivacyFilter>
              </FinancialText>
            </span>
            <span>
              <Trans>Expenses</Trans>:{' '}
              <FinancialText>
                <PrivacyFilter>
                  {format(totalOutflow, 'financial')}
                </PrivacyFilter>
              </FinancialText>
            </span>
          </div>
          <div style={{ overflowX: 'auto', paddingTop: spacing.sm }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${points.length}, minmax(54px, 1fr))`,
                minWidth: Math.max(points.length * 54, 350),
                gap: spacing.xs,
              }}
            >
              {points.map(point => {
                const monthLabel = monthUtils.format(
                  point.month,
                  'MMM',
                  locale,
                );
                return (
                  <div
                    key={point.month}
                    role="img"
                    aria-label={t(
                      '{{month}}: income {{income}}, expenses {{expenses}}',
                      {
                        month: monthLabel,
                        income: format(point.inflow, 'financial'),
                        expenses: format(point.outflow, 'financial'),
                      },
                    )}
                    title={t(
                      '{{month}}: income {{income}}, expenses {{expenses}}',
                      {
                        month: monthLabel,
                        income: format(point.inflow, 'financial'),
                        expenses: format(point.outflow, 'financial'),
                      },
                    )}
                    style={{ minWidth: 0, textAlign: 'center' }}
                  >
                    <div
                      aria-hidden="true"
                      style={{
                        height: 138,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'end',
                        gap: 5,
                        borderBottom: `1px solid ${theme.tableBorder}`,
                      }}
                    >
                      <span
                        style={{
                          width: 15,
                          height: (Math.max(0, point.inflow) / maximum) * 128,
                          borderRadius: '4px 4px 0 0',
                          backgroundColor: theme.budgetNumberPositive,
                        }}
                      />
                      <span
                        style={{
                          width: 15,
                          height: (Math.max(0, point.outflow) / maximum) * 128,
                          borderRadius: '4px 4px 0 0',
                          backgroundColor: theme.budgetNumberNegative,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        display: 'block',
                        marginTop: spacing.xs,
                        color: theme.pageTextSubdued,
                        fontSize: 12,
                      }}
                    >
                      {monthLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
