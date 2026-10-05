import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgDotsHorizontalTriple } from '@actual-app/components/icons/v1';
import { Menu } from '@actual-app/components/menu';
import { Popover } from '@actual-app/components/popover';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

type ImportCategoryRuleRowProps = {
  title: string;
  group: string;
  category: string;
  bankName: string;
  isCategoryMissing: boolean;
  isFirst: boolean;
  isLast: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
};

export function ImportCategoryRuleRow({
  title,
  group,
  category,
  bankName,
  isCategoryMissing,
  isFirst,
  isLast,
  isSaving,
  onEdit,
  onMoveUp,
  onMoveDown,
  onDelete,
}: ImportCategoryRuleRowProps) {
  const { t } = useTranslation();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <View
      data-testid="import-category-rule-row"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: 62,
        padding: '7px 8px',
        borderBottom: `1px solid ${theme.tableBorder}`,
        '&:hover': { backgroundColor: theme.tableRowBackgroundHover },
      }}
    >
      <Button
        variant="bare"
        aria-label={t('Изменить правило: {{name}}', { name: title })}
        onPress={onEdit}
        style={{
          flex: '1 1 auto',
          minWidth: 0,
          justifyContent: 'flex-start',
          textAlign: 'left',
          padding: '2px 0',
        }}
      >
        <View style={{ minWidth: 0, width: '100%', gap: 2 }}>
          <Text
            style={{
              fontWeight: 600,
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
            }}
          >
            {title}
          </Text>
          <Text style={{ fontSize: 12, color: theme.tableTextInactive }}>
            {bankName}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: isCategoryMissing
                ? theme.errorText
                : theme.tableTextInactive,
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
            }}
          >
            → {group ? `${group} · ` : ''}
            {category}
            {isCategoryMissing && ` · ${t('Категория не найдена')}`}
          </Text>
        </View>
      </Button>
      <Button
        ref={triggerRef}
        variant="bare"
        aria-label={t('Действия с правилом: {{name}}', { name: title })}
        isDisabled={isSaving}
        onPress={() => setIsMenuOpen(true)}
        style={{
          width: 36,
          height: 36,
          flexShrink: 0,
          padding: 8,
        }}
      >
        <SvgDotsHorizontalTriple width={18} height={18} />
      </Button>
      <Popover
        triggerRef={triggerRef}
        isOpen={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        style={{ minWidth: 170 }}
      >
        <Menu
          items={[
            { name: 'edit', text: t('Изменить') },
            { name: 'up', text: t('Выше'), disabled: isFirst },
            { name: 'down', text: t('Ниже'), disabled: isLast },
            Menu.line,
            { name: 'delete', text: t('Удалить') },
          ]}
          onMenuSelect={action => {
            setIsMenuOpen(false);
            switch (action) {
              case 'edit':
                onEdit();
                break;
              case 'up':
                onMoveUp();
                break;
              case 'down':
                onMoveDown();
                break;
              case 'delete':
                onDelete();
                break;
              default:
                break;
            }
          }}
        />
      </Popover>
    </View>
  );
}
