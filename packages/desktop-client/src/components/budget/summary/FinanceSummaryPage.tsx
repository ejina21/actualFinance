import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { theme } from '@actual-app/components/theme';
import { spacing } from '@actual-app/components/tokens';
import * as monthUtils from '@actual-app/core/shared/months';

import { MobilePageHeader, Page, PageHeader } from '#components/Page';

import { AccountBalanceTable } from './AccountBalanceTable';
import { addComparisonMonth } from './comparison';
import { ComparisonOverview } from './ComparisonOverview';
import { formatSummaryMonth } from './formatSummaryMonth';
import { resolveSummaryPeriod } from './period';
import type { SummaryPeriod } from './period';
import { SummaryCards } from './SummaryCards';
import { SummaryControls } from './SummaryControls';
import { SummaryTable } from './SummaryTable';
import { useFinanceSummary } from './useFinanceSummary';

export function FinanceSummaryPage() {
  const { t, i18n } = useTranslation();
  const { isNarrowWidth } = useResponsive();
  const [isComparing, setIsComparing] = useState(false);
  const [period, setPeriod] = useState<SummaryPeriod>({
    kind: 'month',
    month: monthUtils.currentMonth(),
  });
  const [baseMonth, setBaseMonth] = useState(monthUtils.currentMonth());
  const [compareMonths, setCompareMonths] = useState<string[]>([]);
  const {
    cashFlow,
    accountMovements,
    closingOnBudget,
    comparison,
    isLoading,
    error,
    period: resolvedPeriod,
  } = useFinanceSummary(
    period,
    isComparing && compareMonths.length ? [baseMonth, ...compareMonths] : [],
  );

  const periodLabel =
    period.kind === 'month'
      ? formatSummaryMonth(period.month, i18n.language)
      : period.kind === 'year'
        ? String(period.year)
        : `${new Intl.DateTimeFormat(i18n.language).format(new Date(`${period.startDate}T12:00:00`))} — ${new Intl.DateTimeFormat(i18n.language).format(new Date(`${period.endDate}T12:00:00`))}`;

  function changeComparing(value: boolean) {
    if (value && compareMonths.length === 0) {
      const month = resolveSummaryPeriod(period).startDate.slice(0, 7);
      setBaseMonth(month);
      setCompareMonths([monthUtils.addMonths(month, -1)]);
    }
    setIsComparing(value);
  }

  return (
    <Page
      header={
        isNarrowWidth ? (
          <MobilePageHeader title={t('Expenses')} />
        ) : (
          <PageHeader
            title={
              <h1 style={{ font: 'inherit', margin: 0 }}>
                <Trans>Expenses</Trans>
              </h1>
            }
          />
        )
      }
      padding={0}
    >
      <div
        data-testid="finance-summary"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gridAutoRows: 'max-content',
          alignContent: 'start',
          gap: spacing.lg,
          padding: spacing.lg,
          backgroundColor: theme.pageBackground,
          color: theme.pageText,
        }}
      >
        <SummaryControls
          period={period}
          onPeriodChange={setPeriod}
          isComparing={isComparing}
          onComparingChange={changeComparing}
          baseMonth={baseMonth}
          onBaseMonthChange={month => {
            setBaseMonth(month);
            setCompareMonths(current =>
              current.filter(selected => selected !== month),
            );
          }}
          compareMonths={compareMonths}
          onAddCompareMonth={month =>
            setCompareMonths(current =>
              addComparisonMonth(baseMonth, current, month),
            )
          }
          onRemoveCompareMonth={month =>
            setCompareMonths(current =>
              current.filter(selected => selected !== month),
            )
          }
        />
        {error ? (
          <p role="alert">
            <Trans>
              Could not load the summary. Check the selected dates and try
              again.
            </Trans>
          </p>
        ) : isLoading || !cashFlow || !resolvedPeriod ? (
          <output>
            <Trans>Loading summary…</Trans>
          </output>
        ) : (
          <>
            {isComparing ? (
              compareMonths.length > 0 && (
                <ComparisonOverview
                  comparison={comparison}
                  baseMonth={baseMonth}
                  compareMonths={compareMonths}
                />
              )
            ) : (
              <SummaryCards
                income={cashFlow.income}
                expenses={cashFlow.expenses}
                netFlow={cashFlow.netFlow}
                closingBalance={closingOnBudget}
                periodLabel={periodLabel}
              />
            )}
            {(!isComparing || compareMonths.length > 0) && (
              <section style={{ display: 'grid', gap: spacing.sm }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    flexWrap: 'wrap',
                    gap: spacing.sm,
                    justifyContent: 'space-between',
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: 18 }}>
                    {isComparing ? (
                      <Trans>Category comparison</Trans>
                    ) : (
                      <Trans>Cash flow</Trans>
                    )}
                  </h2>
                  {!isComparing && (
                    <span style={{ fontSize: 13, color: theme.pageTextLight }}>
                      {periodLabel}
                    </span>
                  )}
                </div>
                {!isComparing &&
                  cashFlow.income === 0 &&
                  cashFlow.expenses === 0 && (
                    <p style={{ margin: 0, color: theme.pageTextLight }}>
                      <Trans>No transactions in this period.</Trans>
                    </p>
                  )}
                <SummaryTable
                  key={`${isComparing}-${period.kind}-${resolvedPeriod.startDate}-${resolvedPeriod.endDate}`}
                  summary={cashFlow}
                  period={resolvedPeriod}
                  periodKind={period.kind}
                  comparison={comparison}
                  baseMonth={baseMonth}
                  compareMonths={isComparing ? compareMonths : []}
                />
              </section>
            )}
            {!isComparing && (
              <section style={{ display: 'grid', gap: spacing.sm }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>
                  <Trans>Account movements</Trans>
                </h2>
                <AccountBalanceTable movements={accountMovements} />
                <p
                  style={{
                    margin: 0,
                    color: theme.pageTextLight,
                    fontSize: 12,
                  }}
                >
                  <Trans>
                    Transfers between your accounts are shown in account
                    movements but excluded from income and expenses. Off-budget
                    accounts are separate from the closing balance.
                  </Trans>
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </Page>
  );
}
