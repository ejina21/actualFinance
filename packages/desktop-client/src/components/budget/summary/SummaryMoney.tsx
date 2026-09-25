import { FinancialText } from '#components/FinancialText';
import { PrivacyFilter } from '#components/PrivacyFilter';
import { useFormat } from '#hooks/useFormat';
import { usePrivacyMode } from '#hooks/usePrivacyMode';

export function SummaryMoney({ value }: { value: number }) {
  const format = useFormat();
  const isPrivate = usePrivacyMode();
  return (
    <FinancialText>
      <PrivacyFilter>
        {isPrivate ? '••••' : format(value, 'financial')}
      </PrivacyFilter>
    </FinancialText>
  );
}

export function SummaryPercent({ value }: { value: number | null }) {
  const isPrivate = usePrivacyMode();
  if (value === null) {
    return <FinancialText>—</FinancialText>;
  }
  return (
    <FinancialText>
      <PrivacyFilter>
        {isPrivate ? '••••' : `${value.toFixed(1)} %`}
      </PrivacyFilter>
    </FinancialText>
  );
}
