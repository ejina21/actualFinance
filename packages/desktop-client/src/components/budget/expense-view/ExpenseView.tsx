import { Fragment, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { spacing } from '@actual-app/components/tokens';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';
import { q } from '@actual-app/core/shared/query';

import { FinancialText } from '#components/FinancialText';
import { Page } from '#components/Page';
import { PrivacyFilter } from '#components/PrivacyFilter';
import { useCategories } from '#hooks/useCategories';
import { useFormat } from '#hooks/useFormat';
import { useQuery } from '#hooks/useQuery';

import { buildExpenseSummary } from './expenseData';
import type {
  ExpensePeriod,
  ExpenseRow,
  ExpenseTransaction,
} from './expenseData';

function Money({ value }: { value: number }) {
  const format = useFormat();
  return (
    <FinancialText>
      <PrivacyFilter>{format(value, 'financial')}</PrivacyFilter>
    </FinancialText>
  );
}

export function ExpenseView() {
  const { t, i18n } = useTranslation();
  const { isNarrowWidth } = useResponsive();
  const [period, setPeriod] = useState<ExpensePeriod>('month');
  const [month, setMonth] = useState(monthUtils.currentMonth());
  const [year, setYear] = useState(month.slice(0, 4));
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );
  const anchor = period === 'month' ? month : year;
  const startDate = period === 'month' ? `${anchor}-01` : `${anchor}-01-01`;
  const endDate =
    period === 'month'
      ? `${anchor}-${String(
          new Date(
            Number(anchor.slice(0, 4)),
            Number(anchor.slice(5, 7)),
            0,
          ).getDate(),
        ).padStart(2, '0')}`
      : `${anchor}-12-31`;
  const { data: categoryData } = useCategories();
  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery<ExpenseTransaction>(
    () =>
      q('transactions')
        .filter({ date: { $gte: startDate, $lte: endDate } })
        .select([
          'date',
          'amount',
          { category: { $id: '$category' } },
          { transferId: { $id: '$payee.transfer_acct.id' } },
          { accountOffBudget: { $id: '$account.offbudget' } },
          { categoryIsIncome: { $id: '$category.is_income' } },
        ]),
    [startDate, endDate],
  );
  const summary = buildExpenseSummary(
    transactions ?? [],
    categoryData?.grouped ?? [],
    period,
    anchor,
  );

  function shiftPeriod(direction: number) {
    if (period === 'month') {
      setMonth(monthUtils.addMonths(month, direction));
    } else {
      setYear(String(Number(year) + direction));
    }
  }

  function toggleGroup(id: string) {
    setCollapsedGroups(current => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const monthName = (key: string) => {
    const language = i18n.language.startsWith('ru') ? 'ru-RU' : 'en-US';
    const label = new Intl.DateTimeFormat(language, { month: 'long' }).format(
      new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1),
    );
    return label.charAt(0).toUpperCase() + label.slice(1);
  };
  const columnTitle = (key: string, label: string) =>
    period === 'month' ? label : monthName(key);

  const stickyCellStyle = {
    position: 'sticky' as const,
    left: 0,
    zIndex: 1,
    minWidth: 235,
    maxWidth: 300,
    padding: `${spacing.sm}px ${spacing.md}px`,
    textAlign: 'left' as const,
    borderBottom: `1px solid ${theme.tableBorder}`,
    backgroundColor: theme.cardBackground,
  };
  const amountCellStyle = {
    minWidth: period === 'month' ? 94 : 110,
    padding: `${spacing.sm}px ${spacing.md}px`,
    textAlign: 'right' as const,
    borderBottom: `1px solid ${theme.tableBorder}`,
    whiteSpace: 'nowrap' as const,
  };

  function renderRow(row: ExpenseRow, isCategory = false) {
    return (
      <tr key={row.id}>
        <th
          scope="row"
          style={{
            ...stickyCellStyle,
            paddingLeft: isCategory ? spacing.xl : spacing.md,
            fontWeight: isCategory ? 400 : 600,
          }}
        >
          {row.name}
        </th>
        <td style={{ ...amountCellStyle, fontWeight: 600 }}>
          <Money value={row.total} />
        </td>
        {summary.columns.map(column => (
          <td key={column.key} style={amountCellStyle}>
            <Money value={row.values[column.key]} />
          </td>
        ))}
      </tr>
    );
  }

  return (
    <Page
      header={isNarrowWidth ? t('Expenses only') : t('Expenses by category')}
      padding={0}
    >
      <View
        data-testid="expense-summary"
        style={{
          flex: 1,
          minHeight: 0,
          gap: spacing.md,
          padding: spacing.md,
          backgroundColor: theme.pageBackground,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          {(['month', 'year'] as const).map(option => (
            <button
              key={option}
              type="button"
              aria-pressed={period === option}
              onClick={() => setPeriod(option)}
              style={{
                border: `1px solid ${theme.tableBorder}`,
                borderRadius: 8,
                padding: `${spacing.sm}px ${spacing.md}px`,
                backgroundColor:
                  period === option
                    ? theme.buttonPrimaryBackground
                    : theme.cardBackground,
                color:
                  period === option ? theme.buttonPrimaryText : theme.pageText,
                cursor: 'pointer',
              }}
            >
              {option === 'month' ? t('Month') : t('Year')}
            </button>
          ))}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            <button
              type="button"
              aria-label={t('Previous period')}
              onClick={() => shiftPeriod(-1)}
              style={{
                border: `1px solid ${theme.tableBorder}`,
                borderRadius: 8,
                padding: spacing.sm,
                color: theme.pageText,
                backgroundColor: theme.cardBackground,
                cursor: 'pointer',
              }}
            >
              ‹
            </button>
            {period === 'month' && (
              <select
                aria-label={t('Month')}
                value={month.slice(5, 7)}
                onChange={event =>
                  setMonth(`${month.slice(0, 4)}-${event.target.value}`)
                }
                style={{
                  border: `1px solid ${theme.tableBorder}`,
                  borderRadius: 8,
                  padding: spacing.sm,
                  color: theme.pageText,
                  backgroundColor: theme.cardBackground,
                }}
              >
                {Array.from({ length: 12 }, (_, index) => {
                  const value = String(index + 1).padStart(2, '0');
                  return (
                    <option key={value} value={value}>
                      {monthName(`2026-${value}`)}
                    </option>
                  );
                })}
              </select>
            )}
            <input
              aria-label={t('Period')}
              type="number"
              min="1900"
              max="2100"
              value={period === 'month' ? month.slice(0, 4) : year}
              onChange={event => {
                if (/^\d{4}$/.test(event.target.value)) {
                  if (period === 'month') {
                    setMonth(`${event.target.value}-${month.slice(5, 7)}`);
                  } else {
                    setYear(event.target.value);
                  }
                }
              }}
              style={{
                width: 82,
                border: `1px solid ${theme.tableBorder}`,
                borderRadius: 8,
                padding: spacing.sm,
                color: theme.pageText,
                backgroundColor: theme.cardBackground,
              }}
            />
            <button
              type="button"
              aria-label={t('Next period')}
              onClick={() => shiftPeriod(1)}
              style={{
                border: `1px solid ${theme.tableBorder}`,
                borderRadius: 8,
                padding: spacing.sm,
                color: theme.pageText,
                backgroundColor: theme.cardBackground,
                cursor: 'pointer',
              }}
            >
              ›
            </button>
          </View>
        </View>

        {isNarrowWidth && (
          <Text style={{ color: theme.pageTextSubdued, fontSize: 12 }}>
            <Trans>Swipe horizontally to see dates.</Trans>
          </Text>
        )}

        {error ? (
          <Text role="alert">
            <Trans>Could not load expenses. Please try again.</Trans>
          </Text>
        ) : isLoading || !categoryData ? (
          <Text>
            <Trans>Loading expenses…</Trans>
          </Text>
        ) : (
          <>
            {summary.total === 0 && (
              <Text style={{ color: theme.pageTextSubdued }}>
                <Trans>No expenses in this period.</Trans>
              </Text>
            )}
            <View
              data-testid="expense-summary-scroll"
              style={{ overflow: 'auto', flex: 1, minHeight: 0 }}
            >
              <table
                data-testid="expense-summary-table"
                aria-label={t('Expenses by category')}
                style={{
                  borderCollapse: 'collapse',
                  width: 'max-content',
                  minWidth: '100%',
                  color: theme.pageText,
                  backgroundColor: theme.cardBackground,
                  fontSize: 13,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <thead>
                  <tr>
                    <th
                      scope="col"
                      style={{ ...stickyCellStyle, top: 0, zIndex: 3 }}
                    >
                      <Trans>Category</Trans>
                    </th>
                    <th scope="col" style={amountCellStyle}>
                      <Trans>Total</Trans>
                    </th>
                    {summary.columns.map(column => (
                      <th key={column.key} scope="col" style={amountCellStyle}>
                        {columnTitle(column.key, column.label)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr
                    style={{ backgroundColor: theme.tableRowBackgroundHover }}
                  >
                    <th
                      scope="row"
                      style={{ ...stickyCellStyle, fontWeight: 700 }}
                    >
                      <Trans>Expenses</Trans>
                    </th>
                    <td style={{ ...amountCellStyle, fontWeight: 700 }}>
                      <Money value={summary.total} />
                    </td>
                    {summary.columns.map(column => (
                      <td
                        key={column.key}
                        style={{ ...amountCellStyle, fontWeight: 700 }}
                      >
                        <Money
                          value={summary.groups.reduce(
                            (sum, group) => sum + group.values[column.key],
                            summary.uncategorized.values[column.key],
                          )}
                        />
                      </td>
                    ))}
                  </tr>
                  {summary.groups.map(group => (
                    <Fragment key={group.id}>
                      <tr>
                        <th
                          scope="row"
                          style={{ ...stickyCellStyle, fontWeight: 700 }}
                        >
                          <button
                            type="button"
                            aria-expanded={!collapsedGroups.has(group.id)}
                            onClick={() => toggleGroup(group.id)}
                            style={{
                              border: 0,
                              background: 'transparent',
                              color: 'inherit',
                              cursor: 'pointer',
                              fontWeight: 700,
                            }}
                          >
                            {collapsedGroups.has(group.id) ? '›' : '⌄'}{' '}
                            {group.name}
                          </button>
                        </th>
                        <td style={{ ...amountCellStyle, fontWeight: 700 }}>
                          <Money value={group.total} />
                        </td>
                        {summary.columns.map(column => (
                          <td
                            key={column.key}
                            style={{ ...amountCellStyle, fontWeight: 700 }}
                          >
                            <Money value={group.values[column.key]} />
                          </td>
                        ))}
                      </tr>
                      {!collapsedGroups.has(group.id) &&
                        group.categories.map(category =>
                          renderRow(category, true),
                        )}
                    </Fragment>
                  ))}
                  {summary.uncategorized.total !== 0 &&
                    renderRow({
                      ...summary.uncategorized,
                      name: t('Uncategorized'),
                    })}
                </tbody>
              </table>
            </View>
          </>
        )}
      </View>
    </Page>
  );
}
