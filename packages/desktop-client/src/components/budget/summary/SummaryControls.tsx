import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { theme } from '@actual-app/components/theme';
import { spacing } from '@actual-app/components/tokens';
import * as monthUtils from '@actual-app/core/shared/months';

import { resolveSummaryPeriod, SummaryPeriodError } from './period';
import type { SummaryPeriod } from './period';
import { summaryControlStyle } from './summaryStyles';

type SummaryControlsProps = {
  period: SummaryPeriod;
  onPeriodChange: (period: SummaryPeriod) => void;
  baseMonth: string;
  onBaseMonthChange: (month: string) => void;
  compareMonths: readonly string[];
  onAddCompareMonth: (month: string) => void;
  onRemoveCompareMonth: (month: string) => void;
};

export function SummaryControls({
  period,
  onPeriodChange,
  baseMonth,
  onBaseMonthChange,
  compareMonths,
  onAddCompareMonth,
  onRemoveCompareMonth,
}: SummaryControlsProps) {
  const { t } = useTranslation();
  const current = resolveSummaryPeriod(period);
  const [rangeStart, setRangeStart] = useState(current.startDate);
  const [rangeEnd, setRangeEnd] = useState(current.endDate);
  const [candidateMonth, setCandidateMonth] = useState('');
  const [rangeError, setRangeError] = useState(false);

  function selectKind(kind: SummaryPeriod['kind']) {
    if (kind === 'month') {
      onPeriodChange({ kind, month: current.startDate.slice(0, 7) });
    } else if (kind === 'year') {
      onPeriodChange({ kind, year: Number(current.startDate.slice(0, 4)) });
    } else {
      setRangeStart(current.startDate);
      setRangeEnd(current.endDate);
      setRangeError(false);
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
      if (error instanceof SummaryPeriodError) {
        setRangeError(true);
      }
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

  const inputStyle = {
    ...summaryControlStyle,
    backgroundColor: theme.cardBackground,
    color: theme.pageText,
    minHeight: 40,
  };
  const buttonStyle = {
    ...summaryControlStyle,
    minHeight: 40,
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'grid', gap: spacing.md }}>
      <fieldset
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: spacing.sm,
          border: 0,
          padding: 0,
        }}
      >
        <legend>
          <Trans>Summary period</Trans>
        </legend>
        {(['month', 'year', 'range'] as const).map(kind => (
          <button
            key={kind}
            type="button"
            aria-pressed={period.kind === kind}
            onClick={() => selectKind(kind)}
            style={{
              ...buttonStyle,
              backgroundColor:
                period.kind === kind
                  ? theme.financeHeroBackground
                  : theme.cardBackground,
              color:
                period.kind === kind ? theme.financeHeroText : theme.pageText,
            }}
          >
            {kind === 'month' ? (
              <Trans>Month</Trans>
            ) : kind === 'year' ? (
              <Trans>Year</Trans>
            ) : (
              <Trans>Custom period</Trans>
            )}
          </button>
        ))}
      </fieldset>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'end',
          gap: spacing.sm,
        }}
      >
        {period.kind !== 'range' && (
          <button
            type="button"
            onClick={() => shift(-1)}
            style={buttonStyle}
            aria-label={t('Previous period')}
          >
            ←
          </button>
        )}
        {period.kind === 'month' && (
          <label style={{ display: 'grid', gap: spacing.xs }}>
            <Trans>Month</Trans>
            <input
              type="month"
              value={period.month}
              onChange={event => {
                const month = event.target.value;
                if (/^\d{4}-\d{2}$/.test(month)) {
                  onPeriodChange({ kind: 'month', month });
                }
              }}
              style={inputStyle}
            />
          </label>
        )}
        {period.kind === 'year' && (
          <label style={{ display: 'grid', gap: spacing.xs }}>
            <Trans>Year</Trans>
            <input
              type="number"
              min={1}
              max={9999}
              value={period.year}
              onChange={event => {
                const year = Number(event.target.value);
                if (Number.isInteger(year) && year >= 1 && year <= 9999) {
                  onPeriodChange({ kind: 'year', year });
                }
              }}
              style={inputStyle}
            />
          </label>
        )}
        {period.kind === 'range' && (
          <>
            <label style={{ display: 'grid', gap: spacing.xs }}>
              <Trans>From</Trans>
              <input
                type="date"
                value={rangeStart}
                onChange={event => {
                  setRangeStart(event.target.value);
                  selectRange(event.target.value, rangeEnd);
                }}
                style={inputStyle}
              />
            </label>
            <label style={{ display: 'grid', gap: spacing.xs }}>
              <Trans>To</Trans>
              <input
                type="date"
                value={rangeEnd}
                onChange={event => {
                  setRangeEnd(event.target.value);
                  selectRange(rangeStart, event.target.value);
                }}
                style={inputStyle}
              />
            </label>
            {rangeError && (
              <span role="alert" style={{ color: theme.numberNegative }}>
                <Trans>
                  Choose a valid date range with the start before the end.
                </Trans>
              </span>
            )}
          </>
        )}
        {period.kind !== 'range' && (
          <button
            type="button"
            onClick={() => shift(1)}
            style={buttonStyle}
            aria-label={t('Next period')}
          >
            →
          </button>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'end',
          gap: spacing.sm,
        }}
      >
        <label style={{ display: 'grid', gap: spacing.xs }}>
          <Trans>Base month</Trans>
          <input
            type="month"
            value={baseMonth}
            onChange={event => {
              if (/^\d{4}-\d{2}$/.test(event.target.value)) {
                onBaseMonthChange(event.target.value);
              }
            }}
            style={inputStyle}
          />
        </label>
        <label style={{ display: 'grid', gap: spacing.xs }}>
          <Trans>Compare with month</Trans>
          <input
            type="month"
            value={candidateMonth}
            onChange={event => setCandidateMonth(event.target.value)}
            style={inputStyle}
          />
        </label>
        <button
          type="button"
          disabled={
            !candidateMonth ||
            candidateMonth === baseMonth ||
            compareMonths.includes(candidateMonth)
          }
          onClick={() => {
            onAddCompareMonth(candidateMonth);
            setCandidateMonth('');
          }}
          style={buttonStyle}
        >
          <Trans>Add month</Trans>
        </button>
        {compareMonths.map(month => (
          <button
            key={month}
            type="button"
            onClick={() => onRemoveCompareMonth(month)}
            style={buttonStyle}
            aria-label={t('Remove comparison month {{month}}', { month })}
          >
            {month} ×
          </button>
        ))}
      </div>
    </div>
  );
}
