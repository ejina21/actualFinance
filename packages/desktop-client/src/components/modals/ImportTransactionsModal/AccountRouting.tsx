import { useTranslation } from 'react-i18next';

import { Select } from '@actual-app/components/select';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

type AccountRoutingProps = {
  sources: { name: string; count: number }[];
  accounts: { id: string; name: string }[];
  routes: Record<string, string>;
  onChange: (source: string, accountId: string) => void;
};

export function AccountRouting({
  sources,
  accounts,
  routes,
  onChange,
}: AccountRoutingProps) {
  const { t } = useTranslation();

  return (
    <View
      data-testid="account-routing"
      style={{
        marginTop: 14,
        padding: 14,
        gap: 9,
        border: `1px solid ${theme.tableBorder}`,
        borderRadius: 8,
        backgroundColor: theme.tableBackground,
      }}
    >
      <Text style={{ fontWeight: 600 }}>{t('Сопоставление счетов')}</Text>
      <Text style={{ color: theme.tableTextInactive }}>
        {t(
          'Проверьте, в какой счёт приложения попадут операции. Счета, которых здесь нет, можно пропустить.',
        )}
      </Text>
      {sources.map(source => (
        <View
          key={source.name}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Text style={{ flex: 1 }}>
            {source.name} · {source.count}
          </Text>
          <Select
            aria-label={t('Счёт для {{source}}', { source: source.name })}
            options={[
              ['', t('Не выбран')],
              ['skip', t('Пропустить')],
              ...accounts.map(account => [account.id, account.name] as const),
            ]}
            value={routes[source.name] ?? ''}
            onChange={value => onChange(source.name, value)}
            style={{ width: 260 }}
          />
        </View>
      ))}
    </View>
  );
}
