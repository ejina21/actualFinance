import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { ButtonWithLoading } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { Select } from '@actual-app/components/select';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { LabeledCheckbox } from '#components/forms/LabeledCheckbox';
import {
  getCsvImportProfile,
  getCsvImportProfileKey,
} from '#components/modals/ImportTransactionsModal/importSettings';
import type { CsvImportProfile } from '#components/modals/ImportTransactionsModal/importSettings';
import { dateFormats } from '#components/modals/ImportTransactionsModal/utils';
import type { FieldMapping } from '#components/modals/ImportTransactionsModal/utils';
import { useAccounts } from '#hooks/useAccounts';
import { useSyncedPrefs } from '#hooks/useSyncedPrefs';
import { saveSyncedPrefs } from '#prefs/prefsSlice';
import { useDispatch } from '#redux';

import { Setting } from './UI';

const mappingFields = [
  ['date', 'Дата'],
  ['payee', 'Получатель'],
  ['amount', 'Сумма'],
  ['account', 'Счёт в файле'],
  ['category', 'Категория'],
  ['inOut', 'Приход / расход'],
  ['outflow', 'Расход'],
  ['inflow', 'Доход'],
] as const satisfies ReadonlyArray<readonly [keyof FieldMapping, string]>;

function readRoutes(raw: string | undefined): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(raw ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

export function ImportSettings() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const [prefs] = useSyncedPrefs();
  const { data: accounts = [] } = useAccounts();
  const [scope, setScope] = useState(
    () => searchParams.get('importAccount') ?? 'all',
  );
  const accountId = scope === 'all' ? undefined : scope;
  const savedRoutes = prefs['csv-account-routes'];
  const [draft, setDraft] = useState<CsvImportProfile | null>(null);
  const [routes, setRoutes] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');

  useEffect(() => {
    setDraft(getCsvImportProfile(prefs, accountId));
    setSaveState('idle');
  }, [accountId, prefs]);

  useEffect(() => {
    setRoutes(readRoutes(savedRoutes));
  }, [savedRoutes]);

  function changeProfile(changes: Partial<CsvImportProfile>) {
    setDraft(previous => (previous ? { ...previous, ...changes } : null));
    setSaveState('idle');
  }

  function changeMapping(field: keyof FieldMapping, value: string | string[]) {
    if (!draft) {
      return;
    }
    changeProfile({
      mappings: {
        ...draft.mappings,
        [field]: value === '' ? null : value,
      },
    });
  }

  async function saveProfile() {
    if (!draft) {
      return;
    }
    setSaveState('saving');
    try {
      await dispatch(
        saveSyncedPrefs({
          prefs: {
            [getCsvImportProfileKey(accountId)]: JSON.stringify(draft),
            'csv-account-routes': JSON.stringify(routes),
          },
        }),
      ).unwrap();
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }

  const fieldOptions = [
    ['', t('Не выбрано')] as const,
    ...(draft?.columns.map(column => [column, column] as const) ?? []),
  ];

  return (
    <Setting>
      <View id="statement-import-settings" style={{ gap: 5 }}>
        <Text style={{ fontSize: 17, fontWeight: 650 }}>
          {t('Настройки импорта выписок')}
        </Text>
        <Text style={{ color: theme.tableTextInactive }}>
          {t(
            'Сохранённый шаблон применяется автоматически при следующей загрузке CSV для выбранного счёта.',
          )}
        </Text>
      </View>

      <label htmlFor="import-settings-account">{t('Шаблон для')}</label>
      <Select
        id="import-settings-account"
        options={[
          ['all', t('Все счета')],
          ...accounts.map(account => [account.id, account.name] as const),
        ]}
        value={scope}
        onChange={setScope}
        style={{ width: '100%' }}
      />

      {!draft ? (
        <Text style={{ color: theme.tableTextInactive }}>
          {t(
            'Для этого счёта пока нет шаблона. Откройте выписку и выберите «Настроить импорт» — столбцы файла появятся здесь.',
          )}
        </Text>
      ) : (
        <View style={{ gap: 18, width: '100%' }}>
          <View style={{ gap: 9 }}>
            <Text style={{ fontWeight: 600 }}>{t('Столбцы выписки')}</Text>
            <View
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 10,
              }}
            >
              {mappingFields.map(([field, label]) => (
                <label key={field} style={{ display: 'grid', gap: 4 }}>
                  {t(label)}
                  <Select
                    options={fieldOptions}
                    value={draft.mappings[field] ?? ''}
                    onChange={value => changeMapping(field, value)}
                    style={{ width: '100%' }}
                  />
                </label>
              ))}
            </View>
            <details>
              <summary style={{ cursor: 'pointer' }}>
                {t('Поля заметки')}:{' '}
                {Array.isArray(draft.mappings.notes)
                  ? draft.mappings.notes.length
                  : draft.mappings.notes
                    ? 1
                    : 0}
              </summary>
              <View style={{ maxHeight: 180, overflowY: 'auto', marginTop: 8 }}>
                {draft.columns.map(column => {
                  const selected = Array.isArray(draft.mappings.notes)
                    ? draft.mappings.notes
                    : draft.mappings.notes
                      ? [draft.mappings.notes]
                      : [];
                  return (
                    <LabeledCheckbox
                      key={column}
                      id={`saved-import-notes-${scope}-${column}`}
                      checked={selected.includes(column)}
                      onChange={() =>
                        changeMapping(
                          'notes',
                          selected.includes(column)
                            ? selected.filter(item => item !== column)
                            : [...selected, column],
                        )
                      }
                    >
                      {column}
                    </LabeledCheckbox>
                  );
                })}
              </View>
            </details>
          </View>

          <View style={{ gap: 9 }}>
            <Text style={{ fontWeight: 600 }}>{t('Формат файла')}</Text>
            <View
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 10,
              }}
            >
              <label style={{ display: 'grid', gap: 4 }}>
                {t('Формат даты')}
                <Select
                  options={dateFormats.map(item => [item.format, item.label])}
                  value={draft.dateFormat}
                  onChange={value =>
                    changeProfile({
                      dateFormat: value as CsvImportProfile['dateFormat'],
                    })
                  }
                  style={{ width: '100%' }}
                />
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                {t('Разделитель')}
                <Select
                  options={[
                    ['auto', t('Авто')],
                    [';', ';'],
                    [',', ','],
                    ['\t', t('Табуляция')],
                    ['|', '|'],
                    ['~', '~'],
                  ]}
                  value={draft.delimiter}
                  onChange={delimiter => changeProfile({ delimiter })}
                  style={{ width: '100%' }}
                />
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                {t('Кодировка')}
                <Select
                  options={[
                    ['auto', t('Авто')],
                    ['utf-8', 'UTF-8'],
                    ['utf-16le', 'UTF-16 LE'],
                    ['utf-16be', 'UTF-16 BE'],
                    ['windows-1252', 'Windows-1252'],
                    ['windows-1250', 'Windows-1250'],
                    ['iso-8859-2', 'ISO-8859-2'],
                  ]}
                  value={draft.encoding}
                  onChange={encoding => changeProfile({ encoding })}
                  style={{ width: '100%' }}
                />
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                {t('Пропустить строк сверху')}
                <Input
                  type="number"
                  min="0"
                  value={draft.skipStartLines}
                  onChangeValue={value =>
                    changeProfile({
                      skipStartLines: Math.max(0, parseInt(value, 10) || 0),
                    })
                  }
                />
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                {t('Пропустить строк снизу')}
                <Input
                  type="number"
                  min="0"
                  value={draft.skipEndLines}
                  onChangeValue={value =>
                    changeProfile({
                      skipEndLines: Math.max(0, parseInt(value, 10) || 0),
                    })
                  }
                />
              </label>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: 600 }}>{t('Правила импорта')}</Text>
            <LabeledCheckbox
              id={`saved-import-header-${scope}`}
              checked={draft.hasHeaderRow}
              onChange={() =>
                changeProfile({ hasHeaderRow: !draft.hasHeaderRow })
              }
            >
              {t('Первая строка содержит названия столбцов')}
            </LabeledCheckbox>
            <LabeledCheckbox
              id={`saved-import-notes-enabled-${scope}`}
              checked={draft.importNotes}
              onChange={() =>
                changeProfile({ importNotes: !draft.importNotes })
              }
            >
              {t('Импортировать заметки')}
            </LabeledCheckbox>
            <LabeledCheckbox
              id={`saved-import-pairs-${scope}`}
              checked={draft.autoExcludePairs}
              onChange={() =>
                changeProfile({ autoExcludePairs: !draft.autoExcludePairs })
              }
            >
              {t('Исключать встречные операции с одинаковым описанием')}
            </LabeledCheckbox>
            <LabeledCheckbox
              id={`saved-import-flip-${scope}`}
              checked={draft.flipAmount}
              onChange={() => changeProfile({ flipAmount: !draft.flipAmount })}
            >
              {t('Поменять знак суммы')}
            </LabeledCheckbox>
            <label style={{ display: 'grid', gap: 4 }}>
              {t('Множитель суммы (если нужен)')}
              <Input
                value={draft.multiplierAmount}
                onChangeValue={multiplierAmount => {
                  if (
                    !multiplierAmount ||
                    /^\d+(\.\d{0,4})?$/.test(multiplierAmount)
                  ) {
                    changeProfile({ multiplierAmount });
                  }
                }}
              />
            </label>
            <LabeledCheckbox
              id={`saved-import-clear-${scope}`}
              checked={draft.clearOnImport}
              onChange={() =>
                changeProfile({ clearOnImport: !draft.clearOnImport })
              }
            >
              {t('Отмечать операции как проведённые')}
            </LabeledCheckbox>
            <LabeledCheckbox
              id={`saved-import-merge-${scope}`}
              checked={draft.reconcile}
              onChange={() => changeProfile({ reconcile: !draft.reconcile })}
            >
              {t('Объединять с существующими операциями')}
            </LabeledCheckbox>
            <LabeledCheckbox
              id={`saved-import-deleted-${scope}`}
              checked={draft.reimportDeleted}
              onChange={() =>
                changeProfile({ reimportDeleted: !draft.reimportDeleted })
              }
            >
              {t('Повторно импортировать удалённые операции')}
            </LabeledCheckbox>
            <LabeledCheckbox
              id={`saved-import-inout-${scope}`}
              checked={draft.inOutMode}
              onChange={() => changeProfile({ inOutMode: !draft.inOutMode })}
            >
              {t('Направление операции в отдельном столбце')}
            </LabeledCheckbox>
            {draft.inOutMode && (
              <label style={{ display: 'grid', gap: 4 }}>
                {t('Значение для расхода')}
                <Input
                  value={draft.outValue}
                  onChangeValue={outValue => changeProfile({ outValue })}
                />
              </label>
            )}
          </View>

          {scope === 'all' && Object.keys(routes).length > 0 && (
            <View style={{ gap: 9 }}>
              <Text style={{ fontWeight: 600 }}>{t('Счета в файле')}</Text>
              {Object.entries(routes).map(([source, destination]) => (
                <label key={source} style={{ display: 'grid', gap: 4 }}>
                  {source}
                  <Select
                    options={[
                      ['', t('Не выбран')],
                      ['skip', t('Пропустить')],
                      ...accounts.map(
                        account => [account.id, account.name] as const,
                      ),
                    ]}
                    value={destination}
                    onChange={value => {
                      setRoutes(previous => ({ ...previous, [source]: value }));
                      setSaveState('idle');
                    }}
                    style={{ width: '100%' }}
                  />
                </label>
              ))}
            </View>
          )}

          <View style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <ButtonWithLoading
              variant="primary"
              isLoading={saveState === 'saving'}
              onPress={() => void saveProfile()}
            >
              {t('Сохранить шаблон')}
            </ButtonWithLoading>
            {saveState === 'saved' && (
              <Text style={{ color: theme.pageTextPositive }}>
                {t('Сохранено')}
              </Text>
            )}
            {saveState === 'error' && (
              <Text style={{ color: theme.errorText }}>
                {t('Не удалось сохранить шаблон')}
              </Text>
            )}
          </View>
        </View>
      )}
    </Setting>
  );
}
