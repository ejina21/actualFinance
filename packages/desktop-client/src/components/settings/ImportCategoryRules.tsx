import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ButtonWithLoading } from '@actual-app/components/button';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import {
  findImportCategory,
  parseCategoryRuleTable,
  readCategoryRules,
} from '#components/modals/ImportTransactionsModal/categoryRules';
import { useCategories } from '#hooks/useCategories';
import { useSyncedPrefs } from '#hooks/useSyncedPrefs';
import { saveSyncedPrefs } from '#prefs/prefsSlice';
import { useDispatch } from '#redux';

import { Setting } from './UI';

function formatRules(raw: string | undefined) {
  const rules = readCategoryRules({ 'csv-category-rules': raw });
  return rules
    .map(rule => `| ${rule.payee} | ${rule.group} | ${rule.category} |`)
    .join('\n');
}

export function ImportCategoryRules() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [prefs] = useSyncedPrefs();
  const {
    data: { list: categories, grouped: groups } = { list: [], grouped: [] },
  } = useCategories();
  const savedRules = prefs['csv-category-rules'];
  const [text, setText] = useState('');
  const [saveState, setSaveState] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');

  useEffect(() => {
    setText(formatRules(savedRules));
    setSaveState('idle');
  }, [savedRules]);

  const rules = parseCategoryRuleTable(text);
  const unresolved = rules.filter(
    rule => !findImportCategory(rule.payee, [rule], categories, groups),
  );

  async function saveRules() {
    setSaveState('saving');
    try {
      await dispatch(
        saveSyncedPrefs({
          prefs: { 'csv-category-rules': JSON.stringify(rules) },
        }),
      ).unwrap();
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }

  return (
    <View data-testid="import-category-settings" style={{ width: '100%' }}>
      <Setting>
        <Text style={{ fontSize: 17, fontWeight: 650 }}>
          {t('Автоматические категории при импорте')}
        </Text>
        <Text style={{ color: theme.tableTextInactive }}>
          {t(
            'Вставьте таблицу: получатель | группа категорий | категория. Таблица с дополнительным столбцом «ДОМ» тоже подходит. Совпадения по получателю проверяются без учёта регистра; указанная в выписке категория имеет приоритет.',
          )}
        </Text>
        <label htmlFor="import-category-rules">
          {t('Справочник получателей и категорий')}
        </label>
        <textarea
          id="import-category-rules"
          value={text}
          onChange={event => {
            setText(event.currentTarget.value);
            setSaveState('idle');
          }}
          rows={8}
          spellCheck={false}
          placeholder={t(
            '| Магазин | Расходы | Продукты |',
          )}
          style={{
            width: '100%',
            minHeight: 150,
            resize: 'vertical',
            padding: 10,
            border: `1px solid ${theme.formInputBorder}`,
            borderRadius: 6,
            backgroundColor: theme.formInputBackground,
            color: theme.pageText,
            font: 'inherit',
            lineHeight: 1.45,
          }}
        />
        <Text style={{ color: theme.tableTextInactive }}>
          {t('Правил: {{total}} · категории найдены: {{matched}}', {
            total: rules.length,
            matched: rules.length - unresolved.length,
          })}
        </Text>
        {unresolved.length > 0 && (
          <Text style={{ color: theme.errorText }}>
            {t('Не найдены категории для: {{names}}', {
              names: unresolved
                .slice(0, 8)
                .map(rule => rule.payee)
                .join(', '),
            })}
            {unresolved.length > 8 ? '…' : ''}
          </Text>
        )}
        <View style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ButtonWithLoading
            variant="primary"
            isLoading={saveState === 'saving'}
            onPress={() => void saveRules()}
          >
            {t('Сохранить справочник')}
          </ButtonWithLoading>
          {saveState === 'saved' && (
            <Text style={{ color: theme.pageTextPositive }}>
              {t('Сохранено')}
            </Text>
          )}
          {saveState === 'error' && (
            <Text style={{ color: theme.errorText }}>
              {t('Не удалось сохранить справочник')}
            </Text>
          )}
        </View>
      </Setting>
    </View>
  );
}
