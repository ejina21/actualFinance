import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { Input } from '@actual-app/components/input';
import { Select } from '@actual-app/components/select';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';
import { q } from '@actual-app/core/shared/query';
import type { AccountEntity } from '@actual-app/core/types/models';

import {
  buildInstallmentPlan,
  isValidInstallmentPlanConfig,
  parseInstallmentPlanConfig,
} from '#components/accounts/installmentPlan';
import type { InstallmentTransaction } from '#components/accounts/installmentPlan';
import { FinancialText } from '#components/FinancialText';
import { MobilePageHeader, Page } from '#components/Page';
import { PrivacyFilter } from '#components/PrivacyFilter';
import { useAccounts } from '#hooks/useAccounts';
import { useDashboardPages } from '#hooks/useDashboardPages';
import { useFormat } from '#hooks/useFormat';
import { useNavigate } from '#hooks/useNavigate';
import { useQuery } from '#hooks/useQuery';
import { useSheetValue } from '#hooks/useSheetValue';
import { useSyncedPref } from '#hooks/useSyncedPref';
import { saveSyncedPrefs } from '#prefs/prefsSlice';
import { useDispatch, useSelector } from '#redux';
import * as bindings from '#spreadsheet/bindings';

import { DashboardSelector } from './DashboardSelector';
import { buildInstallmentDashboard } from './installmentDashboard';

type QueryTransaction = InstallmentTransaction & {
  starting_balance_flag?: boolean | number;
};

const surfaceStyle = {
  backgroundColor: theme.cardBackground,
  border: `1px solid ${theme.cardBorder}`,
  borderRadius: 12,
  padding: 20,
  flexShrink: 0,
  minHeight: 'auto',
};

function Money({ value }: { value: number | null }) {
  const format = useFormat();

  return (
    <FinancialText>
      {value === null ? (
        '—'
      ) : (
        <PrivacyFilter>{format(value, 'financial')}</PrivacyFilter>
      )}
    </FinancialText>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | null;
  hint?: string;
}) {
  return (
    <View style={{ gap: 5, minWidth: 0 }}>
      <View style={{ color: theme.pageTextLight, fontSize: 13 }}>{label}</View>
      <View
        style={{
          color: theme.pageText,
          fontSize: 24,
          fontWeight: 650,
          lineHeight: 1.2,
          overflowWrap: 'anywhere',
        }}
      >
        <Money value={value} />
      </View>
      {hint && (
        <View style={{ color: theme.pageTextLight, fontSize: 12 }}>{hint}</View>
      )}
    </View>
  );
}

function InstallmentDashboardContent({ account }: { account: AccountEntity }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const today = monthUtils.currentDay();
  const [savedValue] = useSyncedPref(`installment-plan-${account.id}`);
  const dispatch = useDispatch();
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const savedConfig = parseInstallmentPlanConfig(savedValue);
  const [draftDate, setDraftDate] = useState<string | null>(null);
  const candidate = savedConfig && {
    ...savedConfig,
    lastPaymentDate: draftDate ?? savedConfig.lastPaymentDate,
  };
  const isValidDate =
    candidate !== null && isValidInstallmentPlanConfig(candidate);
  const config = isValidDate ? candidate : savedConfig;
  const hasChanges =
    draftDate !== null && draftDate !== savedConfig?.lastPaymentDate;
  const onBudgetBalance = useSheetValue<'account', 'onbudget-accounts-balance'>(
    bindings.onBudgetAccountBalance(),
  );
  const transactions = useQuery<QueryTransaction>(
    () =>
      q('transactions')
        .filter({ account: account.id, is_parent: false })
        .select(['date', 'amount', 'starting_balance_flag']),
    [account.id],
  );

  if (transactions.isLoading) {
    return <View style={surfaceStyle}>{t('Loading reports...')}</View>;
  }
  if (transactions.error) {
    return (
      <View role="alert" style={surfaceStyle}>
        <Trans>Could not load installment plan transactions.</Trans>
      </View>
    );
  }
  if (!config) {
    return null;
  }

  const rows: InstallmentTransaction[] = (transactions.data ?? []).map(tx => ({
    date: tx.date,
    amount: tx.amount,
    startingBalanceFlag:
      Boolean(tx.starting_balance_flag) || tx.startingBalanceFlag === true,
  }));
  const plan = buildInstallmentPlan(config, rows, today);
  const data = buildInstallmentDashboard(plan, rows, onBudgetBalance, today);
  const paymentDate = new Date(
    `${config.lastPaymentDate}T00:00:00Z`,
  ).toLocaleDateString('ru-RU', { timeZone: 'UTC' });

  return (
    <View
      data-testid="installment-report-dashboard"
      style={{ gap: 16, flexShrink: 0, minHeight: 'auto' }}
    >
      <View style={{ ...surfaceStyle, gap: 10 }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'end',
            gap: 12,
          }}
        >
          <label
            htmlFor="installment-report-deadline"
            style={{ display: 'grid', gap: 6 }}
          >
            <Trans>Last payment</Trans>
            <Input
              id="installment-report-deadline"
              type="date"
              disabled={saveStatus === 'saving'}
              min={config.firstPaymentDate}
              value={draftDate ?? config.lastPaymentDate}
              onChangeValue={value => {
                setDraftDate(value);
                setSaveStatus('idle');
              }}
              aria-invalid={!isValidDate}
              aria-describedby="installment-deadline-hint"
            />
          </label>
          <Button
            variant="primary"
            isDisabled={!hasChanges || !isValidDate || saveStatus === 'saving'}
            onPress={async () => {
              setSaveStatus('saving');
              try {
                await dispatch(
                  saveSyncedPrefs({
                    prefs: {
                      [`installment-plan-${account.id}`]:
                        JSON.stringify(config),
                    },
                  }),
                ).unwrap();
                setDraftDate(null);
                setSaveStatus('saved');
              } catch {
                setSaveStatus('error');
              }
            }}
          >
            <Trans>Save deadline</Trans>
          </Button>
          {hasChanges && (
            <Button
              variant="bare"
              isDisabled={saveStatus === 'saving'}
              onPress={() => {
                setDraftDate(null);
                setSaveStatus('idle');
              }}
            >
              <Trans>Cancel</Trans>
            </Button>
          )}
        </View>
        <View
          id="installment-deadline-hint"
          style={{ color: theme.pageTextLight, fontSize: 12 }}
        >
          <Trans>
            Changing the deadline previews the monthly target. Save it to update
            the account plan.
          </Trans>
        </View>
        {saveStatus === 'saved' && (
          <output>
            <Trans>Deadline saved</Trans>
          </output>
        )}
        {saveStatus === 'error' && (
          <View role="alert">
            <Trans>Could not save the deadline. Try again.</Trans>
          </View>
        )}
        {hasChanges && isValidDate && (
          <View style={{ color: theme.pageTextLight, fontSize: 12 }}>
            <Trans>Preview — deadline not saved yet</Trans>
          </View>
        )}
        {!isValidDate && (
          <View role="alert" style={{ color: theme.warningText }}>
            <Trans>
              Choose a valid deadline on or after the first payment, within 50
              years.
            </Trans>
          </View>
        )}
      </View>
      <View
        style={{
          ...surfaceStyle,
          backgroundColor: theme.financeHeroBackground,
          color: theme.financeHeroText,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 20,
        }}
      >
        <View style={{ gap: 7 }}>
          <View style={{ fontSize: 13, opacity: 0.85 }}>
            <Trans>Remaining debt</Trans>
          </View>
          <View
            style={{
              fontSize: 34,
              fontWeight: 700,
              lineHeight: 1.15,
              overflowWrap: 'anywhere',
            }}
          >
            <Money value={data.remainingDebt} />
          </View>
          <View style={{ fontSize: 13, opacity: 0.85 }}>
            <Trans
              i18nKey="Last payment: {{date}}"
              values={{ date: paymentDate }}
            />
          </View>
        </View>
        <View
          style={{
            alignSelf: 'center',
            borderTop: `1px solid ${theme.financeHeroText}`,
            paddingTop: 10,
            opacity: 0.9,
          }}
        >
          <View style={{ fontSize: 13 }}>
            <Trans>Repaid through account transactions</Trans>
          </View>
          <View style={{ fontSize: 24, fontWeight: 650 }}>
            <Money value={data.paid} />
          </View>
        </View>
      </View>

      <View
        style={{
          ...surfaceStyle,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 20,
        }}
      >
        <Metric label={t('Next planned payment')} value={data.nextPayment} />
        <View style={{ gap: 5 }}>
          <View style={{ color: theme.pageTextLight, fontSize: 13 }}>
            <Trans>Months remaining</Trans>
          </View>
          <View
            style={{ color: theme.pageText, fontSize: 24, fontWeight: 650 }}
          >
            {data.monthsRemaining}
          </View>
          <View style={{ color: theme.pageTextLight, fontSize: 12 }}>
            <Trans>Including the current month</Trans>
          </View>
        </View>
        <Metric
          label={t('Saving target per month')}
          value={data.monthlySavingTarget}
          hint={t('Amount still to save ÷ remaining months')}
        />
      </View>

      <View style={{ ...surfaceStyle, gap: 14 }}>
        <View style={{ fontSize: 18, fontWeight: 650, color: theme.pageText }}>
          <Trans>How much is still to save</Trans>
        </View>
        <View
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 18,
            alignItems: 'end',
          }}
        >
          <Metric label={t('Remaining debt')} value={data.remainingDebt} />
          <Metric
            label={t('Balance of budget accounts')}
            value={data.budgetBalance}
          />
          <View
            style={{
              backgroundColor: theme.financeSoftAccent,
              borderRadius: 6,
              padding: 12,
            }}
          >
            <Metric label={t('Still to save')} value={data.stillToSave} />
          </View>
        </View>
        <View style={{ color: theme.pageTextLight, fontSize: 13 }}>
          <Trans>
            This is a scenario if the entire balance of budget accounts is used
            for the debt. It may already be assigned to other expenses.
          </Trans>
        </View>
      </View>

      {data.remainingDebt > 0 && data.monthsRemaining === 0 && (
        <output style={{ ...surfaceStyle, color: theme.warningText }}>
          <Trans>The payment period has ended, but debt remains.</Trans>{' '}
          <Button
            variant="bare"
            onPress={() => navigate(`/accounts/${account.id}`)}
          >
            <Trans>Edit plan</Trans>
          </Button>
        </output>
      )}
    </View>
  );
}

export function InstallmentDashboardPage() {
  const { t } = useTranslation();
  const { isNarrowWidth } = useResponsive();
  const { data: accounts = [] } = useAccounts();
  const { data: dashboards = [] } = useDashboardPages();
  const prefs = useSelector(state => state.prefs.synced);
  const [selectedAccountId, setSelectedAccountId] = useSyncedPref(
    'installment-report-account',
  );
  const plannedAccounts = accounts.filter(
    account =>
      account.offbudget &&
      !account.closed &&
      parseInstallmentPlanConfig(prefs[`installment-plan-${account.id}`]),
  );
  const account =
    plannedAccounts.find(item => item.id === selectedAccountId) ??
    plannedAccounts[0];
  const title = t('Installment dashboard');

  return (
    <Page
      header={
        isNarrowWidth ? (
          <View>
            <MobilePageHeader title={`${t('Reports')}: ${title}`} />
            <View
              style={{
                padding: 5,
                borderBottom: `1px solid ${theme.pillBorder}`,
                backgroundColor: theme.mobilePageBackground,
              }}
            >
              <DashboardSelector
                dashboards={dashboards}
                currentDashboard={{ name: title }}
              />
            </View>
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              padding: '8px 24px',
            }}
          >
            <View style={{ fontSize: 25, fontWeight: 650 }}>
              <Trans>Reports</Trans>: {title}
            </View>
            <DashboardSelector
              dashboards={dashboards}
              currentDashboard={{ name: title }}
            />
          </View>
        )
      }
    >
      <View
        style={{
          maxWidth: 1100,
          width: '100%',
          margin: '20px auto 60px',
          gap: 16,
          flexShrink: 0,
          minHeight: 'auto',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View style={{ color: theme.pageTextLight, fontSize: 14 }}>
            <Trans>Debt plan and savings at a glance</Trans>
          </View>
          {account && (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <label htmlFor="installment-report-account">
                <Trans>Debt account</Trans>
              </label>
              <Select
                id="installment-report-account"
                options={plannedAccounts.map(item => [item.id, item.name])}
                value={account.id}
                onChange={setSelectedAccountId}
              />
            </View>
          )}
        </View>
        {account ? (
          <InstallmentDashboardContent key={account.id} account={account} />
        ) : (
          <View style={{ ...surfaceStyle, gap: 6 }}>
            <View style={{ fontWeight: 650, fontSize: 18 }}>
              <Trans>No installment plan yet</Trans>
            </View>
            <View style={{ color: theme.pageTextLight }}>
              <Trans>
                Create a plan for an off-budget debt account to see its
                dashboard.
              </Trans>
            </View>
          </View>
        )}
      </View>
    </Page>
  );
}
