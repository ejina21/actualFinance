import { Trans } from 'react-i18next';

import { theme } from '@actual-app/components/theme';
import { spacing } from '@actual-app/components/tokens';
import { css } from '@emotion/css';

import { SummaryMoney } from './SummaryMoney';
import { signedAmountColor } from './summaryStyles';

const gridClassName = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 0,
  overflow: 'hidden',
  minHeight: 'min-content',
  background: theme.cardBackground,
  border: `1px solid ${theme.cardBorder}`,
  borderRadius: 12,
  '@media (max-width: 1000px)': {
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },
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
    <div
      className={gridClassName}
      data-testid="finance-summary-cards"
      aria-label={periodLabel}
    >
      {cards.map(card => (
        <div
          key={card.id}
          style={{
            padding: spacing.md,
            background: card.hero ? theme.financeHeroBackground : undefined,
            display: 'grid',
            gap: spacing.sm,
            minWidth: 0,
            color: card.hero ? theme.financeHeroText : theme.pageText,
          }}
        >
          <span style={{ fontSize: 13, opacity: 0.85 }}>{card.label}</span>
          <strong
            style={{
              fontSize: 24,
              lineHeight: 1.15,
              fontVariantNumeric: 'tabular-nums',
              color:
                card.id === 'net' ? signedAmountColor(card.value) : undefined,
            }}
          >
            <SummaryMoney value={card.value} />
          </strong>
        </div>
      ))}
    </div>
  );
}
