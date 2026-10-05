import { Trans, useTranslation } from 'react-i18next';

import { theme } from '@actual-app/components/theme';
import { spacing } from '@actual-app/components/tokens';

import type { AccountMovement } from './accounts';
import { SummaryMoney } from './SummaryMoney';

export function AccountBalanceTable({
  movements,
}: {
  movements: readonly AccountMovement[];
}) {
  const { t } = useTranslation();
  const moneyCellStyle = {
    padding: `${spacing.sm}px ${spacing.md}px`,
    textAlign: 'right' as const,
    whiteSpace: 'nowrap' as const,
    borderBottom: `1px solid ${theme.tableBorder}`,
  };
  const labelCellStyle = {
    padding: `${spacing.sm}px ${spacing.md}px`,
    textAlign: 'left' as const,
    minWidth: 190,
    borderBottom: `1px solid ${theme.tableBorder}`,
  };
  const onBudget = movements.filter(account => !account.isOffBudget);
  const offBudget = movements.filter(account => account.isOffBudget);

  function renderAccount(row: AccountMovement) {
    return (
      <tr key={row.id}>
        <th scope="row" style={labelCellStyle}>
          {row.name}
        </th>
        <td style={moneyCellStyle}>
          <SummaryMoney value={row.opening} />
        </td>
        <td style={moneyCellStyle}>
          <SummaryMoney value={row.inflows} />
        </td>
        <td style={moneyCellStyle}>
          <SummaryMoney value={row.outflows} />
        </td>
        <td style={moneyCellStyle}>
          <SummaryMoney value={row.openingAdjustment} />
        </td>
        <td style={{ ...moneyCellStyle, fontWeight: 700 }}>
          <SummaryMoney value={row.closing} />
        </td>
      </tr>
    );
  }

  return (
    <div
      style={{
        overflowX: 'auto',
        maxWidth: '100%',
        border: `1px solid ${theme.tableBorder}`,
        borderRadius: 14,
      }}
    >
      <table
        aria-label={t('Account movements')}
        style={{
          borderCollapse: 'collapse',
          minWidth: '100%',
          width: 'max-content',
          color: theme.pageText,
          backgroundColor: theme.cardBackground,
          fontSize: 13,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <thead>
          <tr>
            <th scope="col" style={labelCellStyle}>
              <Trans>Account</Trans>
            </th>
            <th scope="col" style={moneyCellStyle}>
              <Trans>Opening balance</Trans>
            </th>
            <th scope="col" style={moneyCellStyle}>
              <Trans>Inflows</Trans>
            </th>
            <th scope="col" style={moneyCellStyle}>
              <Trans>Outflows</Trans>
            </th>
            <th scope="col" style={moneyCellStyle}>
              <Trans>Opening adjustment</Trans>
            </th>
            <th scope="col" style={moneyCellStyle}>
              <Trans>Closing balance</Trans>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th
              scope="rowgroup"
              colSpan={6}
              style={{
                ...labelCellStyle,
                backgroundColor: theme.financeSoftAccent,
              }}
            >
              <Trans>On-budget accounts</Trans>
            </th>
          </tr>
          {onBudget.map(renderAccount)}
          <tr>
            <th
              scope="rowgroup"
              colSpan={6}
              style={{
                ...labelCellStyle,
                backgroundColor: theme.financeSoftAccent,
              }}
            >
              <Trans>Off-budget accounts</Trans>
            </th>
          </tr>
          {offBudget.map(renderAccount)}
        </tbody>
      </table>
    </div>
  );
}
