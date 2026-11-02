import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { theme } from '@actual-app/components/theme';
import { spacing } from '@actual-app/components/tokens';

import {
  useCreateCategoryGroupMutation,
  useCreateCategoryMutation,
  useMoveCategoryMutation,
  useUpdateCategoryGroupMutation,
  useUpdateCategoryMutation,
} from '#budget';
import { Modal, ModalHeader } from '#components/common/Modal';
import { useCategories } from '#hooks/useCategories';

import { CategoryEditor } from './CategoryEditor';
import type { CategoryEditorDraft } from './CategoryEditor';

export function CategoryManagerModal() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useCategories();
  const groups = (data?.grouped ?? []).map(group => ({
    ...group,
    categories: group.categories ?? [],
  }));
  const categories = data?.list ?? [];
  const createGroup = useCreateCategoryGroupMutation();
  const updateGroup = useUpdateCategoryGroupMutation();
  const createCategory = useCreateCategoryMutation();
  const updateCategory = useUpdateCategoryMutation();
  const moveCategory = useMoveCategoryMutation();
  const [draft, setDraft] = useState<CategoryEditorDraft | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const query = search.trim().toLocaleLowerCase();
  const activeCategory = categories.find(category => category.id === draft?.id);
  const compatibleGroups =
    draft?.kind === 'move'
      ? groups.filter(
          group =>
            Boolean(group.is_income) === Boolean(activeCategory?.is_income) &&
            group.id !== activeCategory?.group,
        )
      : groups;
  const visibleGroups = groups.filter(
    group =>
      group.name.toLocaleLowerCase().includes(query) ||
      group.categories.some(category =>
        category.name.toLocaleLowerCase().includes(query),
      ),
  );

  function edit(value: CategoryEditorDraft | null) {
    setDraft(value);
    setError(null);
  }

  async function save() {
    if (!draft || isSaving) return;
    const name = draft.name.trim();
    if (!name) return;
    setError(null);
    const group = groups.find(item => item.id === draft.groupId);
    if (draft.kind === 'group') {
      if (
        groups.some(
          item =>
            item.id !== draft.id &&
            item.name.trim().toUpperCase() === name.toUpperCase(),
        )
      ) {
        setError(
          t('A category group with name "{{name}}" already exists.', { name }),
        );
        return;
      }
    } else {
      if (!group || (draft.id && !activeCategory)) {
        setError(
          t(
            'The category or group is no longer available. Reopen the editor and try again.',
          ),
        );
        return;
      }
      if (
        draft.kind === 'move' &&
        Boolean(group.is_income) !== Boolean(activeCategory?.is_income)
      ) {
        setError(
          t('Categories can only move between groups of the same type.'),
        );
        return;
      }
      if (
        group.categories.some(
          item =>
            item.id !== draft.id &&
            item.name.trim().toUpperCase() === name.toUpperCase(),
        )
      ) {
        setError(
          t('A category with name "{{name}}" already exists in this group.', {
            name,
          }),
        );
        return;
      }
    }
    setIsSaving(true);
    try {
      if (draft.kind === 'group') {
        const existing = groups.find(item => item.id === draft.id);
        if (draft.id && !existing) {
          throw new Error('Category group was removed');
        }
        if (existing) {
          await updateGroup.mutateAsync({ group: { ...existing, name } });
        } else {
          await createGroup.mutateAsync({ name });
        }
      } else if (draft.kind === 'move' && activeCategory) {
        await moveCategory.mutateAsync({
          id: activeCategory.id,
          groupId: draft.groupId,
          targetId: null,
        });
      } else if (activeCategory) {
        await updateCategory.mutateAsync({
          category: { ...activeCategory, name },
        });
      } else if (group) {
        await createCategory.mutateAsync({
          name,
          groupId: group.id,
          isIncome: Boolean(group.is_income),
          isHidden: Boolean(group.hidden),
        });
      }
      setDraft(null);
    } catch {
      setError(
        t('Could not save changes. Your input is preserved. Please try again.'),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      name="budget-categories"
      isDismissable={!isSaving}
      isKeyboardDismissDisabled={isSaving}
      ariaLabelledBy="budget-categories-title"
      containerProps={{
        style: { width: 720, minWidth: 0, maxWidth: 'calc(100vw - 24px)' },
      }}
    >
      {({ state }) => (
        <>
          <ModalHeader
            title={
              <span id="budget-categories-title">
                <Trans>Categories</Trans>
              </span>
            }
            rightContent={
              <Button
                variant="bare"
                aria-label={t('Close categories')}
                onPress={() => state.close()}
                isDisabled={isSaving}
              >
                <Trans>Close</Trans>
              </Button>
            }
          />
          <div
            style={{ display: 'grid', gap: spacing.md, padding: spacing.sm }}
          >
            <p
              style={{
                color: theme.pageTextLight,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              <Trans>
                Groups organize your categories. Changes apply to transactions,
                import rules and reports.
              </Trans>
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm }}>
              <Button
                variant="primary"
                isDisabled={Boolean(draft)}
                onPress={() => edit({ kind: 'group', groupId: '', name: '' })}
              >
                <Trans>Add group</Trans>
              </Button>
              <Button
                isDisabled={Boolean(draft) || groups.length === 0}
                onPress={() =>
                  edit({
                    kind: 'category',
                    groupId:
                      groups.find(group => !group.is_income)?.id ??
                      groups[0]?.id ??
                      '',
                    name: '',
                  })
                }
              >
                <Trans>Add category</Trans>
              </Button>
            </div>
            {draft && (
              <CategoryEditor
                key={`${draft.kind}-${draft.id ?? 'new'}`}
                draft={draft}
                groups={compatibleGroups}
                isSaving={isSaving}
                error={error}
                onChange={value => {
                  setDraft(value);
                  setError(null);
                }}
                onSave={() => void save()}
                onCancel={() => edit(null)}
              />
            )}
            <Input
              aria-label={t('Search groups and categories')}
              placeholder={t('Search groups and categories')}
              value={search}
              onChangeValue={setSearch}
            />
            {isLoading ? (
              <output>
                <Trans>Loading…</Trans>
              </output>
            ) : isError ? (
              <p role="alert">
                <Trans>
                  Could not load categories. Close this window and try again.
                </Trans>
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gap: spacing.md,
                  maxHeight: draft ? '30vh' : '55vh',
                  overflowY: 'auto',
                  minHeight: 0,
                }}
              >
                {visibleGroups.length === 0 && (
                  <p style={{ color: theme.pageTextLight }}>
                    <Trans>No matching groups or categories.</Trans>
                  </p>
                )}
                {visibleGroups.map(group => (
                  <section
                    key={group.id}
                    aria-label={group.name}
                    style={{
                      border: `1px solid ${theme.tableBorder}`,
                      borderRadius: 8,
                      overflow: 'clip',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: spacing.sm,
                        padding: spacing.sm,
                        backgroundColor: theme.tableHeaderBackground,
                      }}
                    >
                      <div
                        style={{
                          flex: '1 1 150px',
                          minWidth: 0,
                          overflowWrap: 'anywhere',
                        }}
                      >
                        <h2 style={{ fontSize: 15, margin: 0 }}>
                          {group.name}
                        </h2>
                        <span
                          style={{ color: theme.pageTextLight, fontSize: 12 }}
                        >
                          {group.is_income ? t('Income') : t('Expenses')}
                          {group.hidden ? ` · ${t('Hidden')}` : ''}
                        </span>
                      </div>
                      <Button
                        size="small"
                        isDisabled={Boolean(draft)}
                        aria-label={t('Edit group {{name}}', {
                          name: group.name,
                        })}
                        onPress={() =>
                          edit({
                            kind: 'group',
                            id: group.id,
                            groupId: '',
                            name: group.name,
                          })
                        }
                      >
                        <Trans>Edit</Trans>
                      </Button>
                      <Button
                        size="small"
                        isDisabled={Boolean(draft)}
                        onPress={() =>
                          edit({
                            kind: 'category',
                            groupId: group.id,
                            name: '',
                          })
                        }
                      >
                        <Trans>Add category</Trans>
                      </Button>
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {group.categories
                        .filter(
                          category =>
                            group.name.toLocaleLowerCase().includes(query) ||
                            category.name.toLocaleLowerCase().includes(query),
                        )
                        .map(category => (
                          <li
                            key={category.id}
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              gap: spacing.sm,
                              padding: spacing.sm,
                              borderTop: `1px solid ${theme.tableBorder}`,
                            }}
                          >
                            <span
                              style={{
                                flex: '1 1 160px',
                                minWidth: 0,
                                overflowWrap: 'anywhere',
                              }}
                            >
                              {category.name}
                              {category.hidden ? ` · ${t('Hidden')}` : ''}
                            </span>
                            <Button
                              size="small"
                              isDisabled={Boolean(draft)}
                              aria-label={t('Edit category {{name}}', {
                                name: category.name,
                              })}
                              onPress={() =>
                                edit({
                                  kind: 'category',
                                  id: category.id,
                                  groupId: group.id,
                                  name: category.name,
                                })
                              }
                            >
                              <Trans>Edit</Trans>
                            </Button>
                            <Button
                              size="small"
                              isDisabled={
                                Boolean(draft) ||
                                groups.filter(
                                  item =>
                                    Boolean(item.is_income) ===
                                    Boolean(group.is_income),
                                ).length < 2
                              }
                              aria-label={t('Move category {{name}}', {
                                name: category.name,
                              })}
                              onPress={() =>
                                edit({
                                  kind: 'move',
                                  id: category.id,
                                  groupId: '',
                                  name: category.name,
                                })
                              }
                            >
                              <Trans>Move</Trans>
                            </Button>
                          </li>
                        ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
