import { useState } from 'react';
import { Trans } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';
import { q } from '@actual-app/core/shared/query';

import { FinancialText } from '#components/FinancialText';
import { useFormat } from '#hooks/useFormat';
import { useQuery } from '#hooks/useQuery';
import { useSyncedPref } from '#hooks/useSyncedPref';

import {
  buildInstallmentPlan,
  isValidInstallmentPlanConfig,
  parseInstallmentPlanConfig,
} from './installmentPlan';
import type { InstallmentTransaction } from './installmentPlan';

type QueryTransaction = {
  date: string;
  amount: number;
  starting_balance_flag?: boolean | number;
  startingBalanceFlag?: boolean;
};

type InstallmentPlanCardProps = {
  accountId: string;
  today?: string;
};

function monthName(month: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T00:00:00Z`));
}

const cardStyle = {
  backgroundColor: theme.cardBackground,
  border: `1px solid ${theme.cardBorder}`,
  borderRadius: 12,
  padding: 20,
  marginTop: 12,
  marginBottom: 12,
};

export function InstallmentPlanCard({
  accountId,
  today = monthUtils.currentDay(),
}: InstallmentPlanCardProps) {
  const format = useFormat();
  const [savedValue, savePlan] = useSyncedPref(`installment-plan-${accountId}`);
  const saved = parseInstallmentPlanConfig(savedValue);
  const [isEditing, setIsEditing] = useState(false);
  const [firstPaymentDate, setFirstPaymentDate] = useState(
    saved?.firstPaymentDate ?? '',
  );
  const [lastPaymentDate, setLastPaymentDate] = useState(
    saved?.lastPaymentDate ?? '',
  );
  const transactions = useQuery<QueryTransaction>(
    () =>
      q('transactions')
        .filter({ account: accountId, is_parent: false })
        .select(['date', 'amount', 'starting_balance_flag']),
    [accountId],
  );
  const rows: InstallmentTransaction[] = (transactions.data ?? []).map(tx => ({
    date: tx.date,
    amount: tx.amount,
    startingBalanceFlag:
      Boolean(tx.starting_balance_flag) || tx.startingBalanceFlag === true,
  }));
  const debt = Math.max(
    0,
    -rows
      .filter(tx => tx.date <= today)
      .reduce((total, tx) => total + tx.amount, 0),
  );
  const plan = saved ? buildInstallmentPlan(saved, rows, today) : null;
  const current = plan?.rows.find(row => row.month === today.slice(0, 7));
  const next = plan?.rows.find(row => row.isProjected && row.target > 0);
  const currentDifference = current ? current.target - current.paid : 0;
  const hasValidInput = isValidInstallmentPlanConfig({
    firstPaymentDate,
    lastPaymentDate,
  });

  if (transactions.isLoading) {
    return null;
  }
  if (transactions.error) {
    return (
      <View style={cardStyle}>
        <Trans>Could not load installment plan transactions.</Trans>
      </View>
    );
  }
  if (!saved && !isEditing && debt === 0) {
    return null;
  }
  if (!saved && !isEditing) {
    return (
      <View style={cardStyle}>
        <Button variant="bare" onPress={() => setIsEditing(true)}>
          <Trans>Installment plan</Trans>
        </Button>
        <View style={{ color: theme.pageTextLight, marginTop: 4 }}>
          <Trans>Split this debt across the remaining months.</Trans>
        </View>
      </View>
    );
  }

  return (
    <View data-testid="installment-plan-card" style={cardStyle}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, color: theme.pageText }}>
          <Trans>Installment plan</Trans>
        </h2>
        {saved && !isEditing && (
          <Button
            variant="bare"
            onPress={() => {
              setFirstPaymentDate(saved.firstPaymentDate);
              setLastPaymentDate(saved.lastPaymentDate);
              setIsEditing(true);
            }}
          >
            <Trans>Edit plan</Trans>
          </Button>
        )}
      </View>
      {saved && !isEditing && (
        <View style={{ color: theme.pageTextLight, marginTop: 4 }}>
          <Trans
            i18nKey="Payment period: {{from}} – {{to}}"
            values={{
              from: new Date(
                `${saved.firstPaymentDate}T00:00:00Z`,
              ).toLocaleDateString('ru-RU', { timeZone: 'UTC' }),
              to: new Date(
                `${saved.lastPaymentDate}T00:00:00Z`,
              ).toLocaleDateString('ru-RU', { timeZone: 'UTC' }),
            }}
          />
        </View>
      )}
      {isEditing ? (
        <View style={{ marginTop: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <label style={{ display: 'grid', gap: 5, minWidth: 170 }}>
              <Trans>First payment</Trans>
              <Input
                type="date"
                value={firstPaymentDate}
                onChangeValue={setFirstPaymentDate}
              />
            </label>
            <label style={{ display: 'grid', gap: 5, minWidth: 170 }}>
              <Trans>Last payment</Trans>
              <Input
                type="date"
                value={lastPaymentDate}
                onChangeValue={setLastPaymentDate}
              />
            </label>
          </View>
          <View style={{ color: theme.pageTextLight }}>
            <Trans>
              The balance of this account is the remaining debt. Only recorded
              payments change it.
            </Trans>
          </View>
          {!hasValidInput && firstPaymentDate && lastPaymentDate && (
            <View role="alert" style={{ color: theme.warningText }}>
              <Trans>
                The last payment date must not precede the first payment date.
              </Trans>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              variant="primary"
              isDisabled={!hasValidInput}
              onPress={() => {
                savePlan(JSON.stringify({ firstPaymentDate, lastPaymentDate }));
                setIsEditing(false);
              }}
            >
              <Trans>Save plan</Trans>
            </Button>
            <Button variant="bare" onPress={() => setIsEditing(false)}>
              <Trans>Cancel</Trans>
            </Button>
            {saved && (
              <Button
                variant="bare"
                onPress={() => {
                  savePlan('');
                  setIsEditing(false);
                }}
              >
                <Trans>Remove plan</Trans>
              </Button>
            )}
          </View>
        </View>
      ) : (
        plan && (
          <>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 28,
                marginTop: 16,
              }}
            >
              <View>
                <div style={{ color: theme.pageTextLight }}>
                  <Trans>Remaining debt</Trans>
                </div>
                <FinancialText style={{ fontSize: 24, fontWeight: 650 }}>
                  {format(plan.currentDebt, 'financial')}
                </FinancialText>
              </View>
              {current && (
                <View>
                  <div style={{ color: theme.pageTextLight }}>
                    <Trans>This month's target</Trans>
                  </div>
                  <FinancialText style={{ fontSize: 20, fontWeight: 600 }}>
                    {format(current.target, 'financial')}
                  </FinancialText>
                  <div style={{ color: theme.pageTextLight }}>
                    <Trans>Paid:</Trans>{' '}
                    <FinancialText>
                      {format(current.paid, 'financial')}
                    </FinancialText>
                  </div>
                  {currentDifference !== 0 && (
                    <div
                      style={{
                        color:
                          currentDifference > 0
                            ? theme.warningText
                            : theme.numberPositive,
                      }}
                    >
                      {currentDifference > 0 ? (
                        <Trans>Until target:</Trans>
                      ) : (
                        <Trans>Above target:</Trans>
                      )}{' '}
                      <FinancialText>
                        {format(Math.abs(currentDifference), 'financial')}
                      </FinancialText>
                    </div>
                  )}
                </View>
              )}
              {next && (
                <View>
                  <div style={{ color: theme.pageTextLight }}>
                    <Trans>Next payment forecast</Trans>
                  </div>
                  <FinancialText style={{ fontSize: 20, fontWeight: 600 }}>
                    {format(next.target, 'financial')}
                  </FinancialText>
                </View>
              )}
            </View>
            {plan.overdueDebt > 0 && (
              <View
                role="status"
                style={{ color: theme.warningText, marginTop: 12 }}
              >
                <Trans>The payment period has ended, but debt remains.</Trans>
              </View>
            )}
            <View
              style={{
                color: theme.pageTextLight,
                marginTop: 12,
                marginBottom: 12,
              }}
            >
              <Trans>
                To record a payment, link the bank withdrawal as a transfer to
                this debt account. Future targets will update automatically.
              </Trans>
            </View>
            <details style={{ marginTop: 8 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                <Trans>Monthly payment plan</Trans>
              </summary>
              <div
                style={{
                  overflowX: 'auto',
                  maxHeight: 320,
                  overflowY: 'auto',
                  marginTop: 10,
                }}
              >
                <table
                  style={{
                    borderCollapse: 'collapse',
                    width: '100%',
                    minWidth: 530,
                    color: theme.pageText,
                  }}
                >
                  <thead>
                    <tr
                      style={{ borderBottom: `1px solid ${theme.tableBorder}` }}
                    >
                      <th
                        scope="col"
                        style={{ textAlign: 'left', padding: '8px 6px' }}
                      >
                        <Trans>Payment month</Trans>
                      </th>
                      <th
                        scope="col"
                        style={{ textAlign: 'right', padding: '8px 6px' }}
                      >
                        <Trans>Target</Trans>
                      </th>
                      <th
                        scope="col"
                        style={{ textAlign: 'right', padding: '8px 6px' }}
                      >
                        <Trans>Paid</Trans>
                      </th>
                      <th
                        scope="col"
                        style={{ textAlign: 'right', padding: '8px 6px' }}
                      >
                        <Trans>Debt after month</Trans>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.rows.map(row => (
                      <tr
                        key={row.month}
                        style={{
                          borderBottom: `1px solid ${theme.tableBorder}`,
                        }}
                      >
                        <th
                          scope="row"
                          style={{
                            textAlign: 'left',
                            fontWeight: 500,
                            padding: '8px 6px',
                          }}
                        >
                          {monthName(row.month)}
                        </th>
                        <td style={{ textAlign: 'right', padding: '8px 6px' }}>
                          <FinancialText>
                            {format(row.target, 'financial')}
                          </FinancialText>
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px 6px' }}>
                          {row.isProjected ? (
                            '—'
                          ) : (
                            <FinancialText>
                              {format(row.paid, 'financial')}
                            </FinancialText>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px 6px' }}>
                          <FinancialText>
                            {format(row.closingDebt, 'financial')}
                          </FinancialText>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )
      )}
    </View>
  );
}
