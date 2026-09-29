import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import type {
  CategoryEntity,
  CategoryGroupEntity,
} from '@actual-app/core/types/models';

type ImportCategoryPickerProps = {
  categories: CategoryEntity[];
  groups: CategoryGroupEntity[];
  value: string;
  onSelect: (id: string) => void;
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('ru');
}

export function ImportCategoryPicker({
  categories,
  groups,
  value,
  onSelect,
}: ImportCategoryPickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const groupNames = new Map(groups.map(group => [group.id, group.name]));
  const selectedCategory = categories.find(category => category.id === value);

  useEffect(() => {
    if (selectedCategory) {
      setQuery(selectedCategory.name);
      setIsOpen(false);
    } else if (!isOpen) {
      setQuery('');
    }
  }, [isOpen, selectedCategory]);

  const search = normalize(query);
  const matches = search
    ? categories
        .filter(category =>
          normalize(
            `${groupNames.get(category.group) ?? ''} ${category.name}`,
          ).includes(search),
        )
        .slice(0, 50)
    : [];

  function selectCategory(category: CategoryEntity) {
    onSelect(category.id);
    setQuery(category.name);
    setIsOpen(false);
  }

  return (
    <View style={{ width: '100%', gap: 4 }}>
      <Input
        aria-label={t('Поиск категории')}
        placeholder={t('Найти категорию')}
        value={query}
        onChangeValue={nextQuery => {
          setQuery(nextQuery);
          setIsOpen(true);
          setHighlightedIndex(0);
          onSelect('');
        }}
        onFocus={() => {
          if (query && !value) {
            setIsOpen(true);
          }
        }}
        onKeyDown={event => {
          if (event.key === 'Escape') {
            setIsOpen(false);
          } else if (event.key === 'ArrowDown' && matches.length) {
            event.preventDefault();
            setHighlightedIndex(index => (index + 1) % matches.length);
          } else if (event.key === 'ArrowUp' && matches.length) {
            event.preventDefault();
            setHighlightedIndex(
              index => (index - 1 + matches.length) % matches.length,
            );
          } else if (event.key === 'Enter' && isOpen && matches.length) {
            event.preventDefault();
            selectCategory(matches[highlightedIndex] ?? matches[0]);
          }
        }}
        style={{ width: '100%' }}
      />
      {isOpen && search && (
        <View
          data-testid="import-category-results"
          style={{
            maxHeight: 180,
            overflowY: 'auto',
            border: `1px solid ${theme.tableBorder}`,
            borderRadius: 6,
            backgroundColor: theme.tableBackground,
          }}
        >
          {matches.length ? (
            matches.map((category, index) => (
              <Button
                key={category.id}
                variant="bare"
                data-testid="import-category-result"
                onPress={() => selectCategory(category)}
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  padding: '8px 10px',
                  backgroundColor:
                    index === highlightedIndex
                      ? theme.tableRowBackgroundHover
                      : undefined,
                }}
              >
                {groupNames.get(category.group)} · {category.name}
              </Button>
            ))
          ) : (
            <Text
              style={{ padding: '8px 10px', color: theme.tableTextInactive }}
            >
              {t('Категории не найдены')}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
