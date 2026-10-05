import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, ButtonWithLoading } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { Select } from '@actual-app/components/select';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { getManualBank, MANUAL_BANKS } from '#components/manual-bank/banks';
import type { ManualBankId } from '#components/manual-bank/banks';
import {
  detectCsvImportBankId,
  readCategoryRules,
} from '#components/modals/ImportTransactionsModal/categoryRules';
import type {
  ImportCategoryCondition,
  ImportCategoryRule,
} from '#components/modals/ImportTransactionsModal/categoryRules';
import { getCsvImportProfile } from '#components/modals/ImportTransactionsModal/importSettings';
import { useAccounts } from '#hooks/useAccounts';
import { useCategories } from '#hooks/useCategories';
import { useSyncedPrefs } from '#hooks/useSyncedPrefs';
import { saveSyncedPrefs } from '#prefs/prefsSlice';
import { useDispatch } from '#redux';

import { ImportCategoryPicker } from './ImportCategoryPicker';
import { ImportCategoryRuleRow } from './ImportCategoryRuleRow';
import { Setting } from './UI';

const emptyCondition: ImportCategoryCondition = {
  field: 'payee',
  op: 'is',
  value: '',
};

const tBankCondition: ImportCategoryCondition = {
  field: 'csv',
  column: 'Описание',
  op: 'contains',
  value: '',
};

const tBankColumns = [
  'Описание',
  'Сообщение',
  'MCC',
  'Имя счёта',
  'Категория по-умолчанию',
  'Ваша категория',
];

const bankNames: Record<ManualBankId, string> = {
  tbank: 'Т-Банк',
  alfabank: 'Альфа-Банк',
  sberbank: 'Сбербанк',
  ozon: 'Ozon Банк',
  yandex: 'Яндекс Банк',
};

function validCondition(condition: ImportCategoryCondition) {
  if (!condition.value.trim()) {
    return false;
  }
  if (condition.field === 'amount') {
    return Number.isFinite(
      Number(condition.value.replace(/\s/g, '').replace(',', '.')),
    );
  }
  return true;
}

function normalize(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru');
}

export function ImportCategoryRules() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [prefs] = useSyncedPrefs();
  const {
    data: { list: categories, grouped: groups } = { list: [], grouped: [] },
  } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const savedRules = prefs['csv-category-rules'];
  const [rules, setRules] = useState<ImportCategoryRule[]>([]);
  const [search, setSearch] = useState('');
  const [bankId, setBankId] = useState<ManualBankId | ''>('tbank');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [conditions, setConditions] = useState<ImportCategoryCondition[]>([
    { ...emptyCondition },
  ]);
  const [categoryId, setCategoryId] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'error'>(
    'idle',
  );
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setRules(readCategoryRules({ 'csv-category-rules': savedRules }));
  }, [savedRules]);

  useEffect(() => {
    if (isEditorOpen) {
      editorRef.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [isEditorOpen, editingIndex]);

  const groupName = (groupId: string) =>
    groups.find(group => group.id === groupId)?.name ?? '';
  const categoryForRule = (rule: ImportCategoryRule) =>
    categories.find(
      category =>
        normalize(category.name) === normalize(rule.category) &&
        normalize(groupName(category.group)) === normalize(rule.group),
    ) ??
    (rule.group
      ? undefined
      : categories.filter(
            category => normalize(category.name) === normalize(rule.category),
          ).length === 1
        ? categories.find(
            category => normalize(category.name) === normalize(rule.category),
          )
        : undefined);
  const fieldLabels = {
    payee: t('Получатель'),
    notes: t('Заметки'),
    account: t('Счёт в выписке'),
    amount: t('Сумма'),
    csv: t('Столбец CSV'),
  };
  const operatorLabels = {
    is: t('совпадает'),
    contains: t('содержит'),
    startsWith: t('начинается с'),
    lessThan: t('меньше'),
    greaterThan: t('больше'),
  };
  const conditionLabel = (condition: ImportCategoryCondition) =>
    `${condition.field === 'csv' ? condition.column : fieldLabels[condition.field]} ${operatorLabels[condition.op]} ${condition.value}`;
  const ruleBankName = (rule: ImportCategoryRule) => {
    const bank = getManualBank(rule.bankId);
    return bank ? t(bankNames[bank.id]) : t('Любой CSV');
  };
  const ruleTitle = (rule: ImportCategoryRule) =>
    rule.conditions.length === 1 &&
    rule.conditions[0].field === 'payee' &&
    rule.conditions[0].op === 'is'
      ? rule.conditions[0].value
      : rule.conditions.map(conditionLabel).join(` ${t('и')} `);
  const visibleRules = rules
    .map((rule, index) => ({ rule, index }))
    .filter(({ rule }) =>
      [
        rule.group,
        rule.category,
        ruleBankName(rule),
        ...rule.conditions.map(conditionLabel),
      ]
        .join(' ')
        .toLocaleLowerCase('ru')
        .includes(search.trim().toLocaleLowerCase('ru')),
    );
  const sourceColumns = new Set(bankId === 'tbank' ? tBankColumns : []);
  if (bankId) {
    const allProfile = getCsvImportProfile(prefs);
    if (
      allProfile &&
      detectCsvImportBankId(
        Object.fromEntries(allProfile.columns.map(column => [column, ''])),
      ) === bankId
    ) {
      allProfile.columns.forEach(column => sourceColumns.add(column));
    }
    accounts.forEach(account => {
      if (prefs[`manual-bank-${account.id}`] === bankId) {
        getCsvImportProfile(prefs, account.id)?.columns.forEach(column =>
          sourceColumns.add(column),
        );
      }
    });
  }
  const fieldOptions: Array<
    readonly [
      'payee' | 'notes' | 'account' | 'amount' | `csv:${string}`,
      string,
    ]
  > = [
    ...(bankId === 'tbank'
      ? []
      : [
          ['payee', fieldLabels.payee] as const,
          ['notes', fieldLabels.notes] as const,
          ['account', fieldLabels.account] as const,
        ]),
    ['amount', fieldLabels.amount],
    ...Array.from(sourceColumns).map(
      column =>
        [`csv:${column}` as const, t('CSV: {{column}}', { column })] as const,
    ),
  ];
  const canSave =
    conditions.length > 0 &&
    conditions.every(validCondition) &&
    !!categories.find(category => category.id === categoryId);

  function startAdding() {
    setEditingIndex(null);
    setBankId('tbank');
    setConditions([{ ...tBankCondition }]);
    setCategoryId('');
    setSaveState('idle');
    setIsEditorOpen(true);
  }

  function startEditing(index: number) {
    const rule = rules[index];
    setEditingIndex(index);
    setBankId(getManualBank(rule.bankId)?.id ?? '');
    setConditions(rule.conditions.map(condition => ({ ...condition })));
    setCategoryId(categoryForRule(rule)?.id ?? '');
    setSaveState('idle');
    setIsEditorOpen(true);
  }

  function changeCondition(
    index: number,
    changes: Partial<ImportCategoryCondition>,
  ) {
    setConditions(previous =>
      previous.map((condition, currentIndex) =>
        index === currentIndex ? { ...condition, ...changes } : condition,
      ),
    );
  }

  function selectConditionField(index: number, value: string) {
    if (value.startsWith('csv:')) {
      changeCondition(index, {
        field: 'csv',
        column: value.slice(4),
        op: 'contains',
        value: '',
      });
    } else if (value === 'amount') {
      changeCondition(index, {
        field: 'amount',
        column: undefined,
        op: 'is',
        value: '',
      });
    } else if (value === 'payee' || value === 'notes' || value === 'account') {
      changeCondition(index, {
        field: value,
        column: undefined,
        op: 'is',
        value: '',
      });
    }
  }

  async function persistRules(nextRules: ImportCategoryRule[]) {
    setSaveState('saving');
    try {
      await dispatch(
        saveSyncedPrefs({
          prefs: { 'csv-category-rules': JSON.stringify(nextRules) },
        }),
      ).unwrap();
      setRules(nextRules);
      setIsEditorOpen(false);
      setSaveState('idle');
    } catch {
      setSaveState('error');
    }
  }

  function saveRule() {
    const category = categories.find(item => item.id === categoryId);
    if (!category || !canSave) {
      return;
    }
    const rule: ImportCategoryRule = {
      conditions: conditions.map(condition => ({
        ...condition,
        value: condition.value.trim(),
      })),
      ...(bankId ? { bankId } : {}),
      group: groupName(category.group),
      category: category.name,
    };
    const nextRules =
      editingIndex == null
        ? [rule, ...rules]
        : rules.map((item, index) => (index === editingIndex ? rule : item));
    void persistRules(nextRules);
  }

  function moveRule(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= rules.length) {
      return;
    }
    const nextRules = [...rules];
    [nextRules[index], nextRules[targetIndex]] = [
      nextRules[targetIndex],
      nextRules[index],
    ];
    void persistRules(nextRules);
  }

  return (
    <View data-testid="import-category-settings" style={{ width: '100%' }}>
      <Setting>
        <View style={{ width: '100%', gap: 4 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: 650, flex: '1 1 auto' }}>
              {t('Автоматические категории при импорте')}
            </Text>
            <Text style={{ fontSize: 13, color: theme.tableTextInactive }}>
              {t('Правил: {{total}}', { total: rules.length })}
            </Text>
          </View>
          <Text style={{ color: theme.tableTextInactive }}>
            {t(
              'Правила проверяются сверху вниз. Категория из файла имеет приоритет.',
            )}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 8,
            width: '100%',
          }}
        >
          {rules.length > 0 && (
            <Input
              aria-label={t('Поиск по правилам')}
              placeholder={t('Найти правило')}
              value={search}
              onChangeValue={setSearch}
              style={{ flex: '1 1 220px', minWidth: 0 }}
            />
          )}
          <Button
            variant="primary"
            onPress={startAdding}
            style={{ flexShrink: 0 }}
          >
            {t('Добавить правило')}
          </Button>
        </View>

        {isEditorOpen && (
          <View
            innerRef={editorRef}
            data-testid="import-category-rule-editor"
            style={{
              width: '100%',
              gap: 12,
              paddingTop: 14,
              borderTop: `1px solid ${theme.tableBorder}`,
            }}
          >
            <Text style={{ fontWeight: 650 }}>
              {editingIndex == null
                ? t('Новое правило')
                : t('Изменить правило')}
            </Text>
            <View style={{ display: 'grid', gap: 4 }}>
              <Text>{t('Банк выписки')}</Text>
              <Select
                aria-label={t('Банк для правила')}
                options={[
                  ['', t('Любой CSV')],
                  ...MANUAL_BANKS.map(
                    bank => [bank.id, t(bankNames[bank.id])] as const,
                  ),
                ]}
                value={bankId}
                onChange={value => {
                  setBankId(value);
                  setConditions([
                    value === 'tbank'
                      ? { ...tBankCondition }
                      : { ...emptyCondition },
                  ]);
                }}
                style={{ width: '100%' }}
              />
            </View>
            {conditions.map((condition, index) => (
              <View
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 8,
                  alignItems: 'end',
                }}
              >
                <View style={{ display: 'grid', gap: 4 }}>
                  <Text>{index === 0 ? t('Если поле') : t('И поле')}</Text>
                  <Select
                    aria-label={t('Поле условия {{number}}', {
                      number: index + 1,
                    })}
                    options={fieldOptions}
                    value={
                      condition.field === 'csv'
                        ? `csv:${condition.column}`
                        : condition.field
                    }
                    onChange={field => selectConditionField(index, field)}
                    style={{ width: '100%' }}
                  />
                </View>
                <View style={{ display: 'grid', gap: 4 }}>
                  <Text>{t('Сравнение')}</Text>
                  <Select
                    aria-label={t('Сравнение условия {{number}}', {
                      number: index + 1,
                    })}
                    options={
                      condition.field === 'amount'
                        ? [
                            ['is', operatorLabels.is],
                            ['lessThan', operatorLabels.lessThan],
                            ['greaterThan', operatorLabels.greaterThan],
                          ]
                        : [
                            ['is', operatorLabels.is],
                            ['contains', operatorLabels.contains],
                            ['startsWith', operatorLabels.startsWith],
                          ]
                    }
                    value={condition.op}
                    onChange={op => changeCondition(index, { op })}
                    style={{ width: '100%' }}
                  />
                </View>
                <View style={{ display: 'grid', gap: 4 }}>
                  <Text>{t('Значение')}</Text>
                  <Input
                    aria-label={t('Значение условия {{number}}', {
                      number: index + 1,
                    })}
                    type="text"
                    inputMode={
                      condition.field === 'amount' ? 'decimal' : 'text'
                    }
                    value={condition.value}
                    onChangeValue={value => changeCondition(index, { value })}
                    style={{ width: '100%' }}
                  />
                </View>
                {conditions.length > 1 && (
                  <Button
                    onPress={() =>
                      setConditions(previous =>
                        previous.filter(
                          (_, currentIndex) => currentIndex !== index,
                        ),
                      )
                    }
                  >
                    {t('Убрать условие')}
                  </Button>
                )}
              </View>
            ))}
            <Button
              variant="bare"
              onPress={() =>
                setConditions(previous => [
                  ...previous,
                  bankId === 'tbank'
                    ? { ...tBankCondition }
                    : { ...emptyCondition },
                ])
              }
              style={{ alignSelf: 'flex-start' }}
            >
              {t('Добавить условие')}
            </Button>
            <View style={{ display: 'grid', gap: 7 }}>
              <Text style={{ fontWeight: 600 }}>{t('Тогда категория')}</Text>
              <ImportCategoryPicker
                categories={categories}
                groups={groups}
                value={categoryId}
                onSelect={setCategoryId}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <ButtonWithLoading
                variant="primary"
                isDisabled={!canSave}
                isLoading={saveState === 'saving'}
                onPress={saveRule}
              >
                {t('Сохранить правило')}
              </ButtonWithLoading>
              <Button onPress={() => setIsEditorOpen(false)}>
                {t('Отмена')}
              </Button>
            </View>
          </View>
        )}

        {saveState === 'error' && (
          <Text style={{ color: theme.errorText }}>
            {t('Не удалось сохранить правила')}
          </Text>
        )}

        <View
          data-testid="import-category-rule-list"
          style={{
            display: 'block',
            width: '100%',
            borderTop:
              rules.length > 0 ? `1px solid ${theme.tableBorder}` : undefined,
            ...(visibleRules.length > 8
              ? { maxHeight: 360, overflowY: 'auto', overflowX: 'hidden' }
              : {}),
          }}
        >
          {visibleRules.map(({ rule, index }) => (
            <ImportCategoryRuleRow
              key={index}
              title={ruleTitle(rule)}
              group={rule.group}
              category={rule.category}
              bankName={ruleBankName(rule)}
              isCategoryMissing={!categoryForRule(rule)}
              isFirst={index === 0}
              isLast={index === rules.length - 1}
              isSaving={saveState === 'saving'}
              onEdit={() => startEditing(index)}
              onMoveUp={() => moveRule(index, -1)}
              onMoveDown={() => moveRule(index, 1)}
              onDelete={() =>
                void persistRules(
                  rules.filter((_, ruleIndex) => ruleIndex !== index),
                )
              }
            />
          ))}
          {rules.length > 0 && visibleRules.length === 0 && (
            <Text style={{ color: theme.tableTextInactive }}>
              {t('Правила не найдены')}
            </Text>
          )}
        </View>
      </Setting>
    </View>
  );
}
