import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, ButtonWithLoading } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { Select } from '@actual-app/components/select';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { readCategoryRules } from '#components/modals/ImportTransactionsModal/categoryRules';
import type {
  ImportCategoryCondition,
  ImportCategoryRule,
} from '#components/modals/ImportTransactionsModal/categoryRules';
import { useCategories } from '#hooks/useCategories';
import { useSyncedPrefs } from '#hooks/useSyncedPrefs';
import { saveSyncedPrefs } from '#prefs/prefsSlice';
import { useDispatch } from '#redux';

import { Setting } from './UI';

const emptyCondition: ImportCategoryCondition = {
  field: 'payee',
  op: 'is',
  value: '',
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
  const savedRules = prefs['csv-category-rules'];
  const [rules, setRules] = useState<ImportCategoryRule[]>([]);
  const [search, setSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [conditions, setConditions] = useState<ImportCategoryCondition[]>([
    { ...emptyCondition },
  ]);
  const [categoryId, setCategoryId] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'error'>(
    'idle',
  );

  useEffect(() => {
    setRules(readCategoryRules({ 'csv-category-rules': savedRules }));
  }, [savedRules]);

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
  };
  const operatorLabels = {
    is: t('совпадает'),
    contains: t('содержит'),
    startsWith: t('начинается с'),
    lessThan: t('меньше'),
    greaterThan: t('больше'),
  };
  const conditionLabel = (condition: ImportCategoryCondition) =>
    `${fieldLabels[condition.field]} ${operatorLabels[condition.op]} ${condition.value}`;
  const visibleRules = rules
    .map((rule, index) => ({ rule, index }))
    .filter(({ rule }) =>
      [rule.group, rule.category, ...rule.conditions.map(conditionLabel)]
        .join(' ')
        .toLocaleLowerCase('ru')
        .includes(search.trim().toLocaleLowerCase('ru')),
    );
  const categoryOptions = categories
    .filter(category =>
      `${groupName(category.group)} ${category.name}`
        .toLocaleLowerCase('ru')
        .includes(categorySearch.trim().toLocaleLowerCase('ru')),
    )
    .map(
      category =>
        [
          category.id,
          `${groupName(category.group)} · ${category.name}`,
        ] as const,
    );
  const canSave =
    conditions.length > 0 &&
    conditions.every(validCondition) &&
    !!categories.find(category => category.id === categoryId);

  function startAdding() {
    setEditingIndex(null);
    setConditions([{ ...emptyCondition }]);
    setCategoryId('');
    setCategorySearch('');
    setSaveState('idle');
    setIsEditorOpen(true);
  }

  function startEditing(index: number) {
    const rule = rules[index];
    setEditingIndex(index);
    setConditions(rule.conditions.map(condition => ({ ...condition })));
    setCategoryId(categoryForRule(rule)?.id ?? '');
    setCategorySearch('');
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
        <View style={{ gap: 5 }}>
          <Text style={{ fontSize: 17, fontWeight: 650 }}>
            {t('Автоматические категории при импорте')}
          </Text>
          <Text style={{ color: theme.tableTextInactive }}>
            {t(
              'Добавьте условия по полям операции и выберите категорию. Все условия правила должны выполняться одновременно. Правила проверяются сверху вниз; категория из файла имеет приоритет.',
            )}
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            width: '100%',
          }}
        >
          <Text style={{ color: theme.tableTextInactive }}>
            {t('Правил: {{total}}', { total: rules.length })}
          </Text>
          <Button variant="primary" onPress={startAdding}>
            {t('Добавить правило')}
          </Button>
        </View>

        {isEditorOpen && (
          <View
            data-testid="import-category-rule-editor"
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: 14,
              border: `1px solid ${theme.formInputBorder}`,
              borderRadius: 8,
              backgroundColor: theme.formInputBackground,
            }}
          >
            <Text style={{ fontWeight: 650 }}>
              {editingIndex == null
                ? t('Новое правило')
                : t('Изменить правило')}
            </Text>
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
                    options={[
                      ['payee', fieldLabels.payee],
                      ['notes', fieldLabels.notes],
                      ['account', fieldLabels.account],
                      ['amount', fieldLabels.amount],
                    ]}
                    value={condition.field}
                    onChange={field =>
                      changeCondition(index, {
                        field,
                        op: 'is',
                        value: '',
                      })
                    }
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
                setConditions(previous => [...previous, { ...emptyCondition }])
              }
              style={{ alignSelf: 'flex-start' }}
            >
              {t('Добавить условие')}
            </Button>
            <View style={{ display: 'grid', gap: 7 }}>
              <Text style={{ fontWeight: 600 }}>{t('Тогда категория')}</Text>
              <Input
                aria-label={t('Поиск категории')}
                placeholder={t('Найти категорию')}
                value={categorySearch}
                onChangeValue={setCategorySearch}
                style={{ width: '100%' }}
              />
              <Select
                aria-label={t('Категория для правила')}
                options={categoryOptions}
                value={categoryId}
                defaultLabel={t('Выберите категорию')}
                onChange={setCategoryId}
                style={{ width: '100%' }}
              />
            </View>
            <View style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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

        {rules.length > 0 && (
          <Input
            aria-label={t('Поиск по правилам')}
            placeholder={t('Найти правило по условию или категории')}
            value={search}
            onChangeValue={setSearch}
            style={{ width: '100%' }}
          />
        )}
        <View
          style={{
            width: '100%',
            ...(visibleRules.length > 8
              ? { maxHeight: 360, overflowY: 'auto' }
              : {}),
          }}
        >
          {visibleRules.map(({ rule, index }) => (
            <View
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 8,
                padding: '10px 0',
                borderBottom: `1px solid ${theme.formInputBorder}`,
              }}
            >
              <View style={{ minWidth: 0, gap: 3 }}>
                <Text
                  style={{
                    fontWeight: 600,
                    whiteSpace: 'normal',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {rule.conditions.map(conditionLabel).join(` ${t('и')} `)}
                </Text>
                <Text style={{ color: theme.tableTextInactive }}>
                  → {rule.group ? `${rule.group} · ` : ''}
                  {rule.category}
                  {!categoryForRule(rule) && ` · ${t('Категория не найдена')}`}
                </Text>
              </View>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 6,
                }}
              >
                <Button
                  isDisabled={index === 0 || saveState === 'saving'}
                  onPress={() => moveRule(index, -1)}
                >
                  {t('Выше')}
                </Button>
                <Button
                  isDisabled={
                    index === rules.length - 1 || saveState === 'saving'
                  }
                  onPress={() => moveRule(index, 1)}
                >
                  {t('Ниже')}
                </Button>
                <Button onPress={() => startEditing(index)}>
                  {t('Изменить')}
                </Button>
                <Button
                  isDisabled={saveState === 'saving'}
                  onPress={() =>
                    void persistRules(
                      rules.filter((_, ruleIndex) => ruleIndex !== index),
                    )
                  }
                >
                  {t('Удалить')}
                </Button>
              </View>
            </View>
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
