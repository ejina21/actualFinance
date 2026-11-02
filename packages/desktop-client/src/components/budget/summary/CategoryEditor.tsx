import type { FormEvent } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { InitialFocus } from '@actual-app/components/initial-focus';
import { Input } from '@actual-app/components/input';
import { theme } from '@actual-app/components/theme';
import { spacing } from '@actual-app/components/tokens';
import type { CategoryGroupEntity } from '@actual-app/core/types/models';

import { summaryControlClass } from './summaryStyles';

export type CategoryEditorDraft = {
  kind: 'group' | 'category' | 'move';
  id?: string;
  groupId: string;
  name: string;
};

type CategoryEditorProps = {
  draft: CategoryEditorDraft;
  groups: CategoryGroupEntity[];
  isSaving: boolean;
  error: string | null;
  onChange: (draft: CategoryEditorDraft) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function CategoryEditor({
  draft,
  groups,
  isSaving,
  error,
  onChange,
  onSave,
  onCancel,
}: CategoryEditorProps) {
  const { t } = useTranslation();
  const isGroup = draft.kind === 'group';
  const isMove = draft.kind === 'move';
  const nameLabel = isGroup ? t('Group name') : t('Category name');
  const title = isMove
    ? t('Move category')
    : draft.id
      ? t('Edit')
      : isGroup
        ? t('Add category group')
        : t('Add category');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave();
  }

  return (
    <form
      onSubmit={submit}
      aria-label={title}
      style={{
        display: 'grid',
        gap: spacing.md,
        padding: spacing.md,
        backgroundColor: theme.pageBackground,
        border: `1px solid ${theme.tableBorder}`,
        borderRadius: 8,
      }}
    >
      <h2 style={{ fontSize: 16, margin: 0 }}>
        {title}
        {isMove && `: ${draft.name}`}
      </h2>
      {!isMove && (
        <label style={{ display: 'grid', gap: spacing.xs }}>
          {nameLabel}
          <InitialFocus>
            <Input
              value={draft.name}
              onChangeValue={name => onChange({ ...draft, name })}
              disabled={isSaving}
              aria-label={nameLabel}
              required
              maxLength={200}
            />
          </InitialFocus>
        </label>
      )}
      {!isGroup && (isMove || !draft.id) && (
        <label style={{ display: 'grid', gap: spacing.xs }}>
          <Trans>Category group</Trans>
          <select
            className={summaryControlClass}
            value={draft.groupId}
            onChange={event =>
              onChange({ ...draft, groupId: event.currentTarget.value })
            }
            disabled={isSaving}
            required
          >
            <option value="">
              <Trans>Choose a group</Trans>
            </option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {error && (
        <p role="alert" style={{ color: theme.errorText, margin: 0 }}>
          {error}
        </p>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm }}>
        <Button
          type="submit"
          variant="primary"
          isDisabled={
            isSaving || !draft.name.trim() || (!isGroup && !draft.groupId)
          }
        >
          {isSaving ? t('Saving…') : t('Save')}
        </Button>
        <Button type="button" onPress={onCancel} isDisabled={isSaving}>
          <Trans>Cancel</Trans>
        </Button>
      </div>
    </form>
  );
}
