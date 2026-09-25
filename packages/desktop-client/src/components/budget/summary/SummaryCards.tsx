import { Trans } from 'react-i18next';

import { theme } from '@actual-app/components/theme';
import { spacing } from '@actual-app/components/tokens';
import { css } from '@emotion/css';

import { SummaryMoney } from './SummaryMoney';
import { summaryCardStyle, summaryHeroStyle } from './summaryStyles';

const gridClassName = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: spacing.md,
  '@media (max-width: 1000px)': {
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },
  '@media (max-width: 600px)': { gridTemplateColumns: '1fr' },
});

type SummaryCardsProps = {
  income: number;
  expenses: number;
  netFlow: number;
  closingBalance: number;
  periodLabel: string;
};

export function SummaryCards({
  income,
  expenses,
  netFlow,
  closingBalance,
  periodLabel,
}: SummaryCardsProps) {
  const cards = [
    { id: 'income', label: <Trans>Income</Trans>, value: income },
    { id: 'expenses', label: <Trans>Expenses</Trans>, value: expenses },
    { id: 'net', label: <Trans>Net flow</Trans>, value: netFlow },
    {
      id: 'balance',
      label: <Trans>Closing balance</Trans>,
      value: closingBalance,
      hero: true,
    },
  ];
  return (
    <div className={gridClassName} data-testid="finance-summary-cards">
      {cards.map(card => (
        <div
          key={card.id}
          style={{
            ...(card.hero ? summaryHeroStyle : summaryCardStyle),
            display: 'grid',
            gap: spacing.sm,
            minWidth: 0,
            color: card.hero ? theme.financeHeroText : theme.pageText,
          }}
        >
          <span style={{ fontSize: 13, opacity: 0.85 }}>{card.label}</span>
          <strong
            style={{
              fontSize: 28,
              lineHeight: 1.15,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <SummaryMoney value={card.value} />
          </strong>
          <span style={{ fontSize: 12, opacity: 0.8 }}>{periodLabel}</span>
        </div>
      ))}
    </div>
  );
}
