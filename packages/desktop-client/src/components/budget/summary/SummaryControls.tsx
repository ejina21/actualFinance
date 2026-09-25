import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { theme } from '@actual-app/components/theme';
import { spacing } from '@actual-app/components/tokens';
import * as monthUtils from '@actual-app/core/shared/months';
import { css } from '@emotion/css';

import { formatSummaryMonth } from './formatSummaryMonth';
import { resolveSummaryPeriod, SummaryPeriodError } from './period';
import type { SummaryPeriod } from './period';
import { summaryControlClass } from './summaryStyles';

type SummaryControlsProps = {
  period: SummaryPeriod;
  onPeriodChange: (period: SummaryPeriod) => void;
  isComparing: boolean;
  onComparingChange: (value: boolean) => void;
  baseMonth: string;
  onBaseMonthChange: (month: string) => void;
  compareMonths: readonly string[];
  onAddCompareMonth: (month: string) => void;
  onRemoveCompareMonth: (month: string) => void;
};

const rowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'end',
  gap: spacing.sm,
} as const;
const labelStyle = {
  display: 'grid',
  gap: spacing.xs,
  fontSize: 12,
  color: theme.pageTextLight,
} as const;
const modeClass = css({
  display: 'flex',
  gap: spacing.xs,
  padding: 4,
  background: theme.pageBackground,
  borderRadius: 10,
  button: {
    flex: 1,
    minHeight: 40,
    padding: '8px 14px',
    border: 0,
    borderRadius: 7,
    font: 'inherit',
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    color: theme.pageTextLight,
    background: 'transparent',
    '&:hover': { color: theme.pageText, background: theme.cardBackground },
    '&[aria-pressed="true"]': {
      background: theme.financeHeroBackground,
      color: theme.financeHeroText,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.buttonPrimaryBackground}`,
      outlineOffset: 2,
    },
  },
  '@media (max-width: 600px)': { width: '100%' },
});

export function SummaryControls({
  period,
  onPeriodChange,
  isComparing,
  onComparingChange,
  baseMonth,
  onBaseMonthChange,
  compareMonths,
  onAddCompareMonth,
  onRemoveCompareMonth,
}: SummaryControlsProps) {
  const { t, i18n } = useTranslation();
  const current = resolveSummaryPeriod(period);
  const [rangeStart, setRangeStart] = useState(current.startDate);
  const [rangeEnd, setRangeEnd] = useState(current.endDate);
  const [candidateMonth, setCandidateMonth] = useState('');
  const [rangeError, setRangeError] = useState(false);

  function selectKind(kind: SummaryPeriod['kind']) {
    setRangeError(false);
    if (kind === 'month') {
      onPeriodChange({ kind, month: current.startDate.slice(0, 7) });
    } else if (kind === 'year') {
      onPeriodChange({ kind, year: Number(current.startDate.slice(0, 4)) });
    } else {
      setRangeStart(current.startDate);
      setRangeEnd(current.endDate);
      onPeriodChange({
        kind,
        startDate: current.startDate,
        endDate: current.endDate,
      });
    }
  }

  function selectRange(startDate: string, endDate: string) {
    try {
      resolveSummaryPeriod({ kind: 'range', startDate, endDate });
      setRangeError(false);
      onPeriodChange({ kind: 'range', startDate, endDate });
    } catch (error) {
      if (error instanceof SummaryPeriodError) setRangeError(true);
    }
  }

  function shift(direction: number) {
    if (period.kind === 'month') {
      onPeriodChange({
        kind: 'month',
        month: monthUtils.addMonths(period.month, direction),
      });
    } else if (period.kind === 'year') {
      onPeriodChange({ kind: 'year', year: period.year + direction });
    }
  }

  return (
    <div
      data-testid="finance-summary-controls"
      style={{ display: 'grid', gap: spacing.md }}
    >
      <div
        style={{
          ...rowStyle,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div className={modeClass} role="group" aria-label={t('Report mode')}>
          <button
            type="button"
            aria-pressed={!isComparing}
            onClick={() => onComparingChange(false)}
          >
            <Trans>Period overview</Trans>
          </button>
          <button
            type="button"
            aria-pressed={isComparing}
            onClick={() => onComparingChange(true)}
          >
            <Trans>Month comparison</Trans>
          </button>
        </div>
        <div style={rowStyle}>
          {!isComparing ? (
            <>
              <label style={labelStyle}>
                <Trans>Summary period</Trans>
                <select
                  className={summaryControlClass}
                  value={period.kind}
                  onChange={event => {
                    const kind = event.currentTarget.value;
                    if (
                      kind === 'month' ||
                      kind === 'year' ||
                      kind === 'range'
                    ) {
                      selectKind(kind);
                    }
                  }}
                >
                  <option value="month">
                    <Trans>Month</Trans>
                  </option>
                  <option value="year">
                    <Trans>Year</Trans>
                  </option>
                  <option value="range">
                    <Trans>Custom period</Trans>
                  </option>
                </select>
              </label>
              <div
                data-testid="finance-summary-period-navigation"
                style={{
                  ...rowStyle,
                  flexWrap: period.kind === 'range' ? 'wrap' : 'nowrap',
                  gap: 4,
                  maxWidth: '100%',
                }}
              >
                {period.kind !== 'range' && (
                  <button
                    type="button"
                    className={summaryControlClass}
                    onClick={() => shift(-1)}
                    aria-label={t('Previous period')}
                  >
                    ←
                  </button>
                )}
                {period.kind === 'month' && (
                  <label style={labelStyle}>
                    <Trans>Month</Trans>
                    <input
                      className={summaryControlClass}
                      type="month"
                      value={period.month}
                      onChange={event => {
                        const month = event.currentTarget.value;
                        if (/^\d{4}-\d{2}$/.test(month)) {
                          onPeriodChange({ kind: 'month', month });
                        }
                      }}
                    />
                  </label>
                )}
                {period.kind === 'year' && (
                  <label style={labelStyle}>
                    <Trans>Year</Trans>
                    <input
                      className={summaryControlClass}
                      style={{ width: 100 }}
                      type="number"
                      min={1}
                      max={9999}
                      value={period.year}
                      onChange={event => {
                        const year = Number(event.currentTarget.value);
                        if (
                          Number.isInteger(year) &&
                          year >= 1 &&
                          year <= 9999
                        ) {
                          onPeriodChange({ kind: 'year', year });
                        }
                      }}
                    />
                  </label>
                )}
                {period.kind === 'range' && (
                  <>
                    <label style={labelStyle}>
                      <Trans>From</Trans>
                      <input
                        className={summaryControlClass}
                        type="date"
                        value={rangeStart}
                        aria-invalid={rangeError}
                        onChange={event => {
                          setRangeStart(event.currentTarget.value);
                          selectRange(event.currentTarget.value, rangeEnd);
                        }}
                      />
                    </label>
                    <label style={labelStyle}>
                      <Trans>To</Trans>
                      <input
                        className={summaryControlClass}
                        type="date"
                        value={rangeEnd}
                        aria-invalid={rangeError}
                        onChange={event => {
                          setRangeEnd(event.currentTarget.value);
                          selectRange(rangeStart, event.currentTarget.value);
                        }}
                      />
                    </label>
                  </>
                )}
                {period.kind !== 'range' && (
                  <button
                    type="button"
                    className={summaryControlClass}
                    onClick={() => shift(1)}
                    aria-label={t('Next period')}
                  >
                    →
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <label style={labelStyle}>
                <Trans>Base month</Trans>
                <input
                  className={summaryControlClass}
                  type="month"
                  value={baseMonth}
                  onChange={event => {
                    if (/^\d{4}-\d{2}$/.test(event.currentTarget.value)) {
                      onBaseMonthChange(event.currentTarget.value);
                    }
                  }}
                />
              </label>
              <form
                style={rowStyle}
                onSubmit={event => {
                  event.preventDefault();
                  if (
                    candidateMonth &&
                    candidateMonth !== baseMonth &&
                    !compareMonths.includes(candidateMonth)
                  ) {
                    onAddCompareMonth(candidateMonth);
                    setCandidateMonth('');
                  }
                }}
              >
                <label style={labelStyle}>
                  <Trans>Compare with month</Trans>
                  <input
                    className={summaryControlClass}
                    type="month"
                    value={candidateMonth}
                    onChange={event =>
                      setCandidateMonth(event.currentTarget.value)
                    }
                  />
                </label>
                <button
                  type="submit"
                  className={summaryControlClass}
                  disabled={
                    !candidateMonth ||
                    candidateMonth === baseMonth ||
                    compareMonths.includes(candidateMonth)
                  }
                >
                  <Trans>Add month</Trans>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      {isComparing && (
        <div style={{ ...rowStyle, alignItems: 'center', fontSize: 13 }}>
          <span style={{ color: theme.pageTextLight }}>
            <Trans>Compared with the base month:</Trans>
          </span>
          {compareMonths.map(month => (
            <button
              key={month}
              type="button"
              className={summaryControlClass}
              style={{ background: theme.financeSoftAccent }}
              aria-label={t('Remove comparison month {{month}}', { month })}
              onClick={() => onRemoveCompareMonth(month)}
            >
              {formatSummaryMonth(month, i18n.language)}{' '}
              <span aria-hidden="true">×</span>
            </button>
          ))}
          {compareMonths.length === 0 && (
            <span>
              <Trans>Choose a month to compare.</Trans>
            </span>
          )}
        </div>
      )}
      {!isComparing && rangeError && (
        <span role="alert" style={{ color: theme.numberNegative }}>
          <Trans>
            Choose a valid date range with the start before the end.
          </Trans>
        </span>
      )}
    </div>
  );
}
