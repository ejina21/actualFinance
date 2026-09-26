import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { theme } from '@actual-app/components/theme';
import { spacing } from '@actual-app/components/tokens';

import type { CashFlowGroup, CashFlowRow, CashFlowSummary } from './cashFlow';
import { monthlyAverage } from './cashFlow';
import { ComparisonAmount } from './ComparisonAmount';
import { formatSummaryMonth } from './formatSummaryMonth';
import { paginateSummaryColumns } from './period';
import type { ResolvedSummaryPeriod, SummaryPeriod } from './period';
import { SummaryMoney } from './SummaryMoney';
import {
  signedAmountColor,
  summaryControlStyle,
  summaryStickyCellStyle,
} from './summaryStyles';

type SummaryTableProps = {
  summary: CashFlowSummary;
  period: ResolvedSummaryPeriod;
  periodKind: SummaryPeriod['kind'];
  comparison: Record<string, CashFlowSummary>;
  baseMonth: string;
  compareMonths: readonly string[];
};

const LABEL_COLUMN_WIDTH = 'clamp(150px, 22vw, 225px)';
type SummarySection = 'income' | 'expenses' | 'loans';

function comparisonValue(
  summary: CashFlowSummary | undefined,
  section: SummarySection,
  groupId: string | null,
  categoryId: string | null,
): number {
  if (!summary) {
    return 0;
  }
  if (groupId === null) {
    return section === 'income'
      ? summary.uncategorizedIncome.total
      : section === 'expenses'
        ? summary.uncategorizedExpenses.total
        : 0;
  }
  const groups =
    section === 'income'
      ? summary.incomeGroups
      : section === 'expenses'
        ? summary.expenseGroups
        : summary.loanGroups;
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
  const comparisonScroll = useRef<HTMLDivElement>(null);
  const lastComparisonMonth = compareMonths.at(-1);
  useLayoutEffect(() => {
    if (lastComparisonMonth && comparisonScroll.current) {
      comparisonScroll.current.scrollLeft =
        comparisonScroll.current.scrollWidth;
    }
  }, [lastComparisonMonth]);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [columnPage, setColumnPage] = useState(0);
  const hasComparison = compareMonths.length > 0;
  const baseNetFlow = comparison[baseMonth]?.netFlow ?? 0;
  const isAnnual = !hasComparison && periodKind === 'year';
  const hasPagedColumns =
    !hasComparison && periodKind === 'range' && period.columns.length > 24;
  const { columns: periodColumns, pageCount } = hasPagedColumns
    ? paginateSummaryColumns(period.columns, columnPage, 12)
    : { columns: period.columns, pageCount: 1 };
  const visibleColumns = hasComparison ? [] : periodColumns;
  const moneyCellStyle = {
    minWidth: 104,
    padding: `${spacing.sm}px ${spacing.md}px`,
    textAlign: 'right' as const,
    borderBottom: `1px solid ${theme.tableBorder}`,
    whiteSpace: 'nowrap' as const,
  };
  const labelCellStyle = {
    ...summaryStickyCellStyle,
    width: hasComparison ? undefined : LABEL_COLUMN_WIDTH,
    minWidth: hasComparison ? 180 : LABEL_COLUMN_WIDTH,
    maxWidth: hasComparison ? 320 : LABEL_COLUMN_WIDTH,
    boxSizing: 'border-box' as const,
    overflowWrap: 'anywhere' as const,
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderBottom: `1px solid ${theme.tableBorder}`,
    textAlign: 'left' as const,
  };
  const totalCellStyle = {
    ...moneyCellStyle,
    ...summaryStickyCellStyle,
    left: LABEL_COLUMN_WIDTH,
  };
  const sectionCellStyle = {
    ...moneyCellStyle,
    backgroundColor: theme.financeSoftAccent,
    fontWeight: 700,
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
    section: SummarySection,
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
        {!hasComparison && (
          <td style={{ ...totalCellStyle, fontWeight: 700 }}>
            <SummaryMoney value={row.total} />
          </td>
        )}
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
          return (
            <td key={month} style={moneyCellStyle}>
              <ComparisonAmount base={baseValue} value={currentValue} />
            </td>
          );
        })}
      </tr>
    );
  }

  function renderGroup(group: CashFlowGroup, section: SummarySection) {
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

  function sectionTotal(
    source: CashFlowSummary | undefined,
    section: SummarySection,
  ) {
    return section === 'loans'
      ? (source?.loanMovement ?? 0)
      : (source?.[section] ?? 0);
  }

  function renderSectionRow(section: SummarySection) {
    const total = sectionTotal(summary, section);
    const backgroundColor =
      section === 'loans'
        ? theme.tableHeaderBackground
        : theme.financeSoftAccent;
    return (
      <tr
        key={section}
        data-testid={section === 'loans' ? 'finance-summary-loans' : undefined}
      >
        <th
          scope="rowgroup"
          style={{
            ...labelCellStyle,
            backgroundColor,
          }}
        >
          {section === 'income' ? (
            <Trans>Income</Trans>
          ) : section === 'expenses' ? (
            <Trans>Expenses</Trans>
          ) : (
            <Trans>Outside income and expenses</Trans>
          )}
        </th>
        {!hasComparison && (
          <td
            style={{
              ...totalCellStyle,
              backgroundColor,
              fontWeight: 700,
            }}
          >
            <SummaryMoney value={total} />
          </td>
        )}
        {isAnnual && (
          <td style={{ ...sectionCellStyle, backgroundColor }}>
            <SummaryMoney value={monthlyAverage(total)} />
          </td>
        )}
        {visibleColumns.map(column => (
          <td key={column.key} style={{ ...sectionCellStyle, backgroundColor }}>
            <SummaryMoney
              value={
                section === 'loans'
                  ? (summary.loanColumnTotals[column.key] ?? 0)
                  : (summary.columnTotals[column.key]?.[section] ?? 0)
              }
            />
          </td>
        ))}
        {hasComparison && (
          <td style={{ ...sectionCellStyle, backgroundColor }}>
            <SummaryMoney
              value={sectionTotal(comparison[baseMonth], section)}
            />
          </td>
        )}
        {compareMonths.map(month => (
          <td key={month} style={{ ...sectionCellStyle, backgroundColor }}>
            <SummaryMoney value={sectionTotal(comparison[month], section)} />
          </td>
        ))}
      </tr>
    );
  }

  return (
    <div
      ref={comparisonScroll}
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
          borderCollapse: 'separate',
          borderSpacing: 0,
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
            {!hasComparison && (
              <th scope="col" style={totalCellStyle}>
                <Trans>Total</Trans>
              </th>
            )}
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
                {formatSummaryMonth(baseMonth, i18n.language)}
              </th>
            )}
            {compareMonths.map(month => (
              <th key={month} scope="col" style={moneyCellStyle}>
                {formatSummaryMonth(month, i18n.language)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {renderSectionRow('income')}
          {summary.incomeGroups.flatMap(group => renderGroup(group, 'income'))}
          {renderRow(
            summary.uncategorizedIncome,
            'income',
            null,
            null,
            <Trans>Uncategorized income</Trans>,
          )}
          {renderSectionRow('expenses')}
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
            {!hasComparison && (
              <td
                style={{
                  ...totalCellStyle,
                  backgroundColor: theme.financeSoftAccent,
                  color: signedAmountColor(summary.netFlow, true),
                  fontWeight: 700,
                }}
              >
                <SummaryMoney value={summary.netFlow} />
              </td>
            )}
            {isAnnual && (
              <td
                style={{
                  ...moneyCellStyle,
                  color: signedAmountColor(monthlyAverage(summary.netFlow)),
                }}
              >
                <SummaryMoney value={monthlyAverage(summary.netFlow)} />
              </td>
            )}
            {visibleColumns.map(column => {
              const totals = summary.columnTotals[column.key];
              return (
                <td
                  key={column.key}
                  style={{
                    ...moneyCellStyle,
                    color: signedAmountColor(
                      (totals?.income ?? 0) - (totals?.expenses ?? 0),
                    ),
                  }}
                >
                  <SummaryMoney
                    value={(totals?.income ?? 0) - (totals?.expenses ?? 0)}
                  />
                </td>
              );
            })}
            {hasComparison && (
              <td
                style={{
                  ...moneyCellStyle,
                  color: signedAmountColor(baseNetFlow),
                }}
              >
                <SummaryMoney value={baseNetFlow} />
              </td>
            )}
            {compareMonths.map(month => {
              const currentNetFlow = comparison[month]?.netFlow ?? 0;
              return (
                <td key={month} style={moneyCellStyle}>
                  <ComparisonAmount
                    base={baseNetFlow}
                    value={currentNetFlow}
                    colorizeBySign
                  />
                </td>
              );
            })}
          </tr>
          {summary.loanGroups.length > 0 && (
            <>
              {renderSectionRow('loans')}
              {summary.loanGroups.flatMap(group => renderGroup(group, 'loans'))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
