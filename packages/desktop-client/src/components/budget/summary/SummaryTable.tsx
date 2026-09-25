import { useState } from 'react';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { theme } from '@actual-app/components/theme';
import { spacing } from '@actual-app/components/tokens';

import type { CashFlowGroup, CashFlowRow, CashFlowSummary } from './cashFlow';
import { monthlyAverage } from './cashFlow';
import { compareMonthValues } from './comparison';
import { paginateSummaryColumns } from './period';
import type { ResolvedSummaryPeriod, SummaryPeriod } from './period';
import { SummaryMoney, SummaryPercent } from './SummaryMoney';
import { summaryControlStyle, summaryStickyCellStyle } from './summaryStyles';

type SummaryTableProps = {
  summary: CashFlowSummary;
  period: ResolvedSummaryPeriod;
  periodKind: SummaryPeriod['kind'];
  comparison: Record<string, CashFlowSummary>;
  baseMonth: string;
  compareMonths: readonly string[];
};

function comparisonValue(
  summary: CashFlowSummary | undefined,
  section: 'income' | 'expenses',
  groupId: string | null,
  categoryId: string | null,
): number {
  if (!summary) {
    return 0;
  }
  if (groupId === null) {
    return section === 'income'
      ? summary.uncategorizedIncome.total
      : summary.uncategorizedExpenses.total;
  }
  const groups =
    section === 'income' ? summary.incomeGroups : summary.expenseGroups;
  const group = groups.find(row => row.id === groupId);
  if (categoryId === null) {
    return group?.total ?? 0;
  }
  return group?.categories.find(row => row.id === categoryId)?.total ?? 0;
}

export function SummaryTable({
  summary,
  period,
  periodKind,
  comparison,
  baseMonth,
  compareMonths,
}: SummaryTableProps) {
  const { t, i18n } = useTranslation();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [columnPage, setColumnPage] = useState(0);
  const hasComparison = compareMonths.length > 0;
  const baseNetFlow = comparison[baseMonth]?.netFlow ?? 0;
  const isAnnual = periodKind === 'year';
  const hasPagedColumns = periodKind === 'range' && period.columns.length > 24;
  const { columns: visibleColumns, pageCount } = hasPagedColumns
    ? paginateSummaryColumns(period.columns, columnPage, 12)
    : { columns: period.columns, pageCount: 1 };
  const columnCount =
    2 +
    Number(isAnnual) +
    visibleColumns.length +
    (hasComparison ? 1 + compareMonths.length * 3 : 0);
  const moneyCellStyle = {
    minWidth: 104,
    padding: `${spacing.sm}px ${spacing.md}px`,
    textAlign: 'right' as const,
    borderBottom: `1px solid ${theme.tableBorder}`,
    whiteSpace: 'nowrap' as const,
  };
  const labelCellStyle = {
    ...summaryStickyCellStyle,
    minWidth: 225,
    maxWidth: 320,
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderBottom: `1px solid ${theme.tableBorder}`,
    textAlign: 'left' as const,
  };

  function monthLabel(key: string) {
    return new Intl.DateTimeFormat(
      i18n.language.startsWith('ru') ? 'ru-RU' : 'en-US',
      {
        month: 'long',
      },
    ).format(new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1));
  }

  function toggleGroup(id: string) {
    setCollapsed(current => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function renderRow(
    row: CashFlowRow,
    section: 'income' | 'expenses',
    groupId: string | null,
    categoryId: string | null,
    label: ReactNode,
    depth = 0,
  ) {
    const baseValue = comparisonValue(
      comparison[baseMonth],
      section,
      groupId,
      categoryId,
    );
    return (
      <tr key={`${section}-${row.id}-${categoryId ?? 'group'}`}>
        <th
          scope="row"
          style={{
            ...labelCellStyle,
            paddingLeft: spacing.md + depth * spacing.lg,
            fontWeight: depth ? 400 : 600,
          }}
        >
          {label}
        </th>
        <td style={{ ...moneyCellStyle, fontWeight: 700 }}>
          <SummaryMoney value={row.total} />
        </td>
        {isAnnual && (
          <td style={moneyCellStyle}>
            <SummaryMoney value={monthlyAverage(row.total)} />
          </td>
        )}
        {visibleColumns.map(column => (
          <td key={column.key} style={moneyCellStyle}>
            <SummaryMoney value={row.values[column.key] ?? 0} />
          </td>
        ))}
        {hasComparison && (
          <td style={moneyCellStyle}>
            <SummaryMoney value={baseValue} />
          </td>
        )}
        {compareMonths.map(month => {
          const currentValue = comparisonValue(
            comparison[month],
            section,
            groupId,
            categoryId,
          );
          const change = compareMonthValues(baseValue, currentValue);
          return [
            <td key={`${month}-value`} style={moneyCellStyle}>
              <SummaryMoney value={currentValue} />
            </td>,
            <td key={`${month}-absolute`} style={moneyCellStyle}>
              <SummaryMoney value={change.absolute} />
            </td>,
            <td key={`${month}-percent`} style={moneyCellStyle}>
              <SummaryPercent value={change.percent} />
            </td>,
          ];
        })}
      </tr>
    );
  }

  function renderGroup(group: CashFlowGroup, section: 'income' | 'expenses') {
    const isCollapsed = collapsed.has(`${section}-${group.id}`);
    return [
      renderRow(
        group,
        section,
        group.id,
        null,
        <button
          type="button"
          aria-expanded={!isCollapsed}
          onClick={() => toggleGroup(`${section}-${group.id}`)}
          style={{
            border: 0,
            padding: 0,
            background: 'transparent',
            color: 'inherit',
            font: 'inherit',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {isCollapsed ? '▸' : '▾'} {group.name}
        </button>,
      ),
      ...(!isCollapsed
        ? group.categories.map(category =>
            renderRow(
              category,
              section,
              group.id,
              category.id,
              category.name,
              1,
            ),
          )
        : []),
    ];
  }

  return (
    <div
      data-testid="finance-summary-scroll"
      style={{
        overflowX: 'auto',
        maxWidth: '100%',
        border: `1px solid ${theme.tableBorder}`,
        borderRadius: 14,
      }}
    >
      {hasPagedColumns && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: spacing.sm,
            padding: spacing.sm,
            backgroundColor: theme.cardBackground,
          }}
        >
          <button
            type="button"
            aria-label={t('Previous months')}
            disabled={columnPage <= 0}
            onClick={() => setColumnPage(page => page - 1)}
            style={{ ...summaryControlStyle, minHeight: 40, cursor: 'pointer' }}
          >
            <Trans>Previous months</Trans>
          </button>
          <span>
            {visibleColumns[0]?.key} — {visibleColumns.at(-1)?.key} (
            {columnPage + 1}/{pageCount})
          </span>
          <button
            type="button"
            aria-label={t('Next months')}
            disabled={columnPage >= pageCount - 1}
            onClick={() => setColumnPage(page => page + 1)}
            style={{ ...summaryControlStyle, minHeight: 40, cursor: 'pointer' }}
          >
            <Trans>Next months</Trans>
          </button>
        </div>
      )}
      <table
        aria-label={t('Cash flow by category')}
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
        <thead style={{ backgroundColor: theme.tableHeaderBackground }}>
          <tr>
            <th scope="col" style={labelCellStyle}>
              <Trans>Category</Trans>
            </th>
            <th scope="col" style={moneyCellStyle}>
              <Trans>Total</Trans>
            </th>
            {isAnnual && (
              <th scope="col" style={moneyCellStyle}>
                <Trans>Monthly average</Trans>
              </th>
            )}
            {visibleColumns.map(column => (
              <th key={column.key} scope="col" style={moneyCellStyle}>
                {periodKind === 'month' ? column.label : monthLabel(column.key)}
              </th>
            ))}
            {hasComparison && (
              <th scope="col" style={moneyCellStyle}>
                {baseMonth}
              </th>
            )}
            {compareMonths.map(month => [
              <th key={`${month}-value`} scope="col" style={moneyCellStyle}>
                {month}
              </th>,
              <th key={`${month}-absolute`} scope="col" style={moneyCellStyle}>
                {t('Change from {{month}}', { month: baseMonth })}
              </th>,
              <th key={`${month}-percent`} scope="col" style={moneyCellStyle}>
                {t('Change % from {{month}}', { month: baseMonth })}
              </th>,
            ])}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th
              scope="rowgroup"
              colSpan={columnCount}
              style={{
                ...labelCellStyle,
                backgroundColor: theme.financeSoftAccent,
              }}
            >
              <Trans>Income</Trans> · <SummaryMoney value={summary.income} />
            </th>
          </tr>
          {summary.incomeGroups.flatMap(group => renderGroup(group, 'income'))}
          {renderRow(
            summary.uncategorizedIncome,
            'income',
            null,
            null,
            <Trans>Uncategorized income</Trans>,
          )}
          <tr>
            <th
              scope="rowgroup"
              colSpan={columnCount}
              style={{
                ...labelCellStyle,
                backgroundColor: theme.financeSoftAccent,
              }}
            >
              <Trans>Expenses</Trans> ·{' '}
              <SummaryMoney value={summary.expenses} />
            </th>
          </tr>
          {summary.expenseGroups.flatMap(group =>
            renderGroup(group, 'expenses'),
          )}
          {renderRow(
            summary.uncategorizedExpenses,
            'expenses',
            null,
            null,
            <Trans>Uncategorized expenses</Trans>,
          )}
          <tr data-testid="finance-summary-net-flow-row">
            <th
              scope="row"
              style={{
                ...labelCellStyle,
                backgroundColor: theme.financeSoftAccent,
                fontWeight: 700,
              }}
            >
              <Trans>Net flow</Trans>
            </th>
            <td style={{ ...moneyCellStyle, fontWeight: 700 }}>
              <SummaryMoney value={summary.netFlow} />
            </td>
            {isAnnual && (
              <td style={moneyCellStyle}>
                <SummaryMoney value={monthlyAverage(summary.netFlow)} />
              </td>
            )}
            {visibleColumns.map(column => {
              const totals = summary.columnTotals[column.key];
              return (
                <td key={column.key} style={moneyCellStyle}>
                  <SummaryMoney
                    value={(totals?.income ?? 0) - (totals?.expenses ?? 0)}
                  />
                </td>
              );
            })}
            {hasComparison && (
              <td style={moneyCellStyle}>
                <SummaryMoney value={baseNetFlow} />
              </td>
            )}
            {compareMonths.map(month => {
              const currentNetFlow = comparison[month]?.netFlow ?? 0;
              const change = compareMonthValues(baseNetFlow, currentNetFlow);
              return [
                <td key={`${month}-value`} style={moneyCellStyle}>
                  <SummaryMoney value={currentNetFlow} />
                </td>,
                <td key={`${month}-absolute`} style={moneyCellStyle}>
                  <SummaryMoney value={change.absolute} />
                </td>,
                <td key={`${month}-percent`} style={moneyCellStyle}>
                  <SummaryPercent value={change.percent} />
                </td>,
              ];
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
