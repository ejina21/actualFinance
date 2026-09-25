import { useEffect, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { spacing } from '@actual-app/components/tokens';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';
import { q } from '@actual-app/core/shared/query';
import { css } from '@emotion/css';

import { prewarmMonth } from '#components/budget/util';
import { Link } from '#components/common/Link';
import { FinancialText } from '#components/FinancialText';
import { Page } from '#components/Page';
import { PrivacyFilter } from '#components/PrivacyFilter';
import { useCategories } from '#hooks/useCategories';
import { useFormat } from '#hooks/useFormat';
import { useLocale } from '#hooks/useLocale';
import { useOverspentCategories } from '#hooks/useOverspentCategories';
import { usePayees } from '#hooks/usePayees';
import { usePrivacyMode } from '#hooks/usePrivacyMode';
import { SheetNameProvider } from '#hooks/useSheetName';
import { useSheetValue } from '#hooks/useSheetValue';
import { useSpreadsheet } from '#hooks/useSpreadsheet';
import { useSyncedPref } from '#hooks/useSyncedPref';
import { useTransactions } from '#hooks/useTransactions';
import * as bindings from '#spreadsheet/bindings';

import { buildRecentActivity, getBudgetProgress } from './OverviewData';

const cardClassName = css({
  minWidth: 0,
  padding: spacing.lg,
  border: `1px solid ${theme.tableBorder}`,
  borderRadius: 16,
  backgroundColor: theme.cardBackground,
  boxShadow: '0 8px 24px rgba(18, 35, 55, 0.04)',
});

const cardGridClassName = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: spacing.md,
  '@media (max-width: 1000px)': {
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },
  '@media (max-width: 650px)': {
    gridTemplateColumns: '1fr',
  },
});

function MoneyValue({ value }: { value: number | null }) {
  const format = useFormat();

  if (value === null) {
    return <FinancialText>—</FinancialText>;
  }

  return (
    <FinancialText>
      <PrivacyFilter>{format(value, 'financial')}</PrivacyFilter>
    </FinancialText>
  );
}

function SummaryCard({
  label,
  value,
  to,
  accent = false,
}: {
  label: string;
  value: number | null;
  to: string;
  accent?: boolean;
}) {
  return (
    <View
      className={cardClassName}
      style={{
        backgroundColor: accent
          ? theme.buttonPrimaryBackground
          : theme.cardBackground,
        color: accent ? theme.buttonPrimaryText : theme.pageText,
      }}
    >
      <Link
        variant="internal"
        to={to}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.sm,
          color: 'inherit',
          textDecoration: 'none',
        }}
      >
        <Text style={{ fontSize: 13, opacity: accent ? 0.85 : 0.75 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.15 }}>
          <MoneyValue value={value} />
        </Text>
      </Link>
    </View>
  );
}

function BudgetSnapshot({
  month,
  allBalance,
}: {
  month: string;
  allBalance: number | null;
}) {
  const { t } = useTranslation();
  const [budgetType = 'envelope'] = useSyncedPref('budgetType');
  const isPrivacyEnabled = usePrivacyMode();
  const envelopeToBudget = useSheetValue<'envelope-budget', 'to-budget'>(
    bindings.envelopeBudget.toBudget,
  );
  const envelopeSpent = useSheetValue<'envelope-budget', 'total-spent'>(
    bindings.envelopeBudget.totalSpent,
  );
  const envelopeBudgeted = useSheetValue<'envelope-budget', 'total-budgeted'>(
    bindings.envelopeBudget.totalBudgeted,
  );
  const trackingLeftover = useSheetValue<'tracking-budget', 'total-leftover'>(
    bindings.trackingBudget.totalLeftover,
  );
  const trackingSpent = useSheetValue<'tracking-budget', 'total-spent'>(
    bindings.trackingBudget.totalSpent,
  );
  const trackingBudgeted = useSheetValue<'tracking-budget', 'total-budgeted'>(
    bindings.trackingBudget.totalBudgetedExpense,
  );

  const remaining =
    budgetType === 'tracking' ? trackingLeftover : envelopeToBudget;
  const spent = budgetType === 'tracking' ? trackingSpent : envelopeSpent;
  const budgeted =
    budgetType === 'tracking' ? trackingBudgeted : envelopeBudgeted;
  const progress = getBudgetProgress(spent, budgeted);
  const { categories: overspentCategories } = useOverspentCategories({ month });

  return (
    <>
      <View className={cardGridClassName}>
        <SummaryCard
          label={t('All accounts')}
          value={allBalance}
          to="/accounts"
          accent
        />
        <SummaryCard
          label={budgetType === 'tracking' ? t('Leftover') : t('To Budget')}
          value={remaining}
          to="/budget"
        />
        <SummaryCard
          label={t('Spent this month')}
          value={spent === null ? null : Math.abs(spent)}
          to="/budget"
        />
      </View>

      <View className={cardClassName} style={{ gap: spacing.md }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: spacing.sm,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: 700 }}>
            <Trans>Budget progress</Trans>
          </Text>
          <Link variant="internal" to="/budget">
            <Trans>Open budget</Trans>
          </Link>
        </View>
        <Text style={{ color: theme.pageTextSubdued, fontSize: 13 }}>
          {progress.hasBudget ? (
            <Trans>Spent of planned amount</Trans>
          ) : (
            <Trans>No planned amount yet</Trans>
          )}
        </Text>
        {isPrivacyEnabled ? (
          <Text style={{ color: theme.pageTextSubdued, fontSize: 13 }}>
            <Trans>Hidden in private mode</Trans>
          </Text>
        ) : (
          <progress
            aria-label={t('Budget progress')}
            value={Math.round(progress.fraction * 100)}
            max={100}
            className={css({
              appearance: 'none',
              width: '100%',
              height: 10,
              overflow: 'hidden',
              borderRadius: 999,
              border: 0,
              backgroundColor: theme.tableBorder,
              '&::-webkit-progress-bar': {
                backgroundColor: theme.tableBorder,
                borderRadius: 999,
              },
              '&::-webkit-progress-value, &::-moz-progress-bar': {
                backgroundColor: progress.isOverspent
                  ? theme.budgetNumberNegative
                  : theme.buttonPrimaryBackground,
                borderRadius: 999,
              },
            })}
          />
        )}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: spacing.sm,
            fontSize: 13,
          }}
        >
          <Text>
            <MoneyValue value={spent === null ? null : Math.abs(spent)} />
          </Text>
          <Text>
            <MoneyValue value={budgeted === null ? null : Math.abs(budgeted)} />
          </Text>
        </View>
        {!isPrivacyEnabled && overspentCategories.length > 0 && (
          <Text style={{ color: theme.budgetNumberNegative, fontSize: 13 }}>
            {t('Overspent categories: {{count}}', {
              count: overspentCategories.length,
            })}
          </Text>
        )}
      </View>
    </>
  );
}

export function OverviewPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { isNarrowWidth } = useResponsive();
  const month = monthUtils.currentMonth();
  const spreadsheet = useSpreadsheet();
  const allBalance = useSheetValue<'account', 'accounts-balance'>(
    bindings.allAccountBalance(),
  );
  const [budgetType = 'envelope'] = useSyncedPref('budgetType');
  const { data: payees = [] } = usePayees();
  const { data: { list: categories = [] } = { list: [] } } = useCategories();
  const recentQuery = useMemo(
    () =>
      q('transactions')
        .options({ splits: 'grouped' })
        .orderBy([
          { date: 'desc' },
          'starting_balance_flag',
          { sort_order: 'desc' },
        ])
        .select('*'),
    [],
  );
  const { transactions, isPending } = useTransactions({
    query: recentQuery,
    options: { pageSize: 8 },
  });
  const activities = buildRecentActivity(
    transactions.filter(transaction => !transaction.is_child),
    payees,
  );
  const categoriesById = new Map(
    categories.map(category => [category.id, category]),
  );

  useEffect(() => {
    void prewarmMonth(budgetType, spreadsheet, month);
  }, [budgetType, month, spreadsheet]);

  return (
    <Page header={t('Overview')} padding={isNarrowWidth ? 16 : 32}>
      <View
        style={{
          gap: spacing.lg,
          maxWidth: 1240,
          width: '100%',
          margin: '0 auto',
          paddingBlock: spacing.lg,
        }}
      >
        <View style={{ gap: spacing.xs }}>
          <Text
            data-vrt-mask="true"
            style={{ color: theme.pageTextSubdued, fontSize: 13 }}
          >
            {monthUtils.format(month, 'MMMM yyyy', locale)}
          </Text>
          <Text style={{ fontSize: 16, color: theme.pageTextSubdued }}>
            <Trans>Your money at a glance</Trans>
          </Text>
        </View>

        <SheetNameProvider name={monthUtils.sheetForMonth(month)}>
          <BudgetSnapshot month={month} allBalance={allBalance} />
        </SheetNameProvider>

        <View className={cardClassName}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: spacing.sm,
              marginBottom: spacing.md,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: 700 }}>
              <Trans>Recent transactions</Trans>
            </Text>
            <Link variant="internal" to="/accounts">
              <Trans>All transactions</Trans>
            </Link>
          </View>
          {activities.length === 0 ? (
            <Text
              style={{ color: theme.pageTextSubdued, paddingBlock: spacing.md }}
            >
              {isPending ? t('Loading...') : t('No transactions yet')}
            </Text>
          ) : (
            <View data-vrt-mask="true">
              {activities.map(activity => (
                <Link
                  key={activity.id}
                  variant="internal"
                  to={`/accounts/${activity.accountId}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: spacing.md,
                    paddingBlock: spacing.sm,
                    borderTop: `1px solid ${theme.tableBorder}`,
                    color: theme.pageText,
                    textDecoration: 'none',
                  }}
                >
                  <View style={{ minWidth: 0, gap: spacing.xxs }}>
                    <Text
                      style={{
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {activity.payeeName ?? t('No payee')}
                    </Text>
                    <Text
                      style={{ color: theme.pageTextSubdued, fontSize: 12 }}
                    >
                      {monthUtils.format(activity.date, 'd MMM', locale)} ·{' '}
                      {activity.isTransfer
                        ? t('Transfer')
                        : (categoriesById.get(activity.categoryId ?? '')
                            ?.name ?? t('Uncategorized'))}
                    </Text>
                  </View>
                  <Text
                    style={{
                      flexShrink: 0,
                      fontWeight: 700,
                      color: activity.isExpense
                        ? theme.pageText
                        : theme.budgetNumberPositive,
                    }}
                  >
                    <MoneyValue value={activity.amount} />
                  </Text>
                </Link>
              ))}
            </View>
          )}
        </View>
      </View>
    </Page>
  );
}
