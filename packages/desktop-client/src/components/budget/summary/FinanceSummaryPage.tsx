import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { styles } from '@actual-app/components/styles';
import { theme } from '@actual-app/components/theme';
import { spacing } from '@actual-app/components/tokens';
import * as monthUtils from '@actual-app/core/shared/months';

import { Page } from '#components/Page';

import { AccountBalanceTable } from './AccountBalanceTable';
import { addComparisonMonth } from './comparison';
import type { SummaryPeriod } from './period';
import { SummaryCards } from './SummaryCards';
import { SummaryControls } from './SummaryControls';
import { SummaryTable } from './SummaryTable';
import { useFinanceSummary } from './useFinanceSummary';

export function FinanceSummaryPage() {
  const { i18n } = useTranslation();
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
    compareMonths.length ? [baseMonth, ...compareMonths] : [],
  );

  const locale = i18n.language.startsWith('ru') ? 'ru-RU' : 'en-US';
  const periodLabel =
    period.kind === 'month'
      ? new Intl.DateTimeFormat(locale, {
          month: 'long',
          year: 'numeric',
        }).format(
          new Date(
            Number(period.month.slice(0, 4)),
            Number(period.month.slice(5, 7)) - 1,
            1,
          ),
        )
      : period.kind === 'year'
        ? String(period.year)
        : `${period.startDate} — ${period.endDate}`;

  return (
    <Page
      header={
        <h1 style={styles.visuallyHidden}>
          <Trans>Budget</Trans>
        </h1>
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
            <SummaryCards
              income={cashFlow.income}
              expenses={cashFlow.expenses}
              netFlow={cashFlow.netFlow}
              closingBalance={closingOnBudget}
              periodLabel={periodLabel}
            />
            <section style={{ display: 'grid', gap: spacing.sm }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>
                <Trans>Cash flow</Trans>
              </h2>
              {cashFlow.income === 0 && cashFlow.expenses === 0 && (
                <p style={{ margin: 0, color: theme.pageTextLight }}>
                  <Trans>No transactions in this period.</Trans>
                </p>
              )}
              <SummaryTable
                key={`${period.kind}-${resolvedPeriod.startDate}-${resolvedPeriod.endDate}`}
                summary={cashFlow}
                period={resolvedPeriod}
                periodKind={period.kind}
                comparison={comparison}
                baseMonth={baseMonth}
                compareMonths={compareMonths}
              />
            </section>
            <section style={{ display: 'grid', gap: spacing.sm }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>
                <Trans>Account movements</Trans>
              </h2>
              <AccountBalanceTable movements={accountMovements} />
              <p
                style={{ margin: 0, color: theme.pageTextLight, fontSize: 12 }}
              >
                <Trans>
                  Transfers between your accounts are shown in account movements
                  but excluded from income and expenses. Off-budget accounts are
                  separate from the closing balance.
                </Trans>
              </p>
            </section>
          </>
        )}
      </div>
    </Page>
  );
}
