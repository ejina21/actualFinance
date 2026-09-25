import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { Select } from '@actual-app/components/select';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { Link } from '#components/common/Link';
import {
  Modal,
  ModalButtons,
  ModalCloseButton,
  ModalHeader,
} from '#components/common/Modal';
import { useSyncedPref } from '#hooks/useSyncedPref';
import { closeModal } from '#modals/modalsSlice';
import { saveSyncedPrefs } from '#prefs/prefsSlice';
import { useDispatch } from '#redux';

import { getManualBank, MANUAL_BANKS } from './banks';
import type { ManualBankId } from './banks';
import { getImportInstructions } from './instructions';

type Props = {
  accountId: string;
  onChooseFile?: () => void;
};

export function ManualBankImportHelpModal({ accountId, onChooseFile }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isNarrowWidth } = useResponsive();
  const [storedBankId] = useSyncedPref(`manual-bank-${accountId}`);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const bank = getManualBank(storedBankId);
  const instructions = getImportInstructions(bank?.id);

  async function setBank(bankId: ManualBankId | '') {
    setIsSaving(true);
    setSaveError(false);
    try {
      await dispatch(
        saveSyncedPrefs({ prefs: { [`manual-bank-${accountId}`]: bankId } }),
      ).unwrap();
    } catch {
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      name="manual-bank-import-help"
      containerProps={{ style: { width: 'min(560px, 100vw)' } }}
    >
      {({ state }) => (
        <>
          <ModalHeader
            title={t('How to import a bank statement')}
            rightContent={<ModalCloseButton onPress={() => state.close()} />}
          />
          <View style={{ gap: 16, lineHeight: 1.5 }}>
            <View style={{ gap: 6 }}>
              <label htmlFor="manual-bank-select">
                <Trans>Bank</Trans>
              </label>
              <Select<ManualBankId | ''>
                id="manual-bank-select"
                value={bank?.id ?? ''}
                disabled={isSaving}
                onChange={value => void setBank(value)}
                options={[
                  ['', t('Other or not listed')],
                  ...MANUAL_BANKS.map(item => [item.id, t(item.name)] as const),
                ]}
                style={{ width: '100%' }}
              />
              {saveError && (
                <Text role="alert" style={{ color: theme.warningText }}>
                  {t('The bank could not be saved. Try again.')}
                </Text>
              )}
            </View>
            <View>
              <Text style={{ fontWeight: 600 }}>
                {bank
                  ? t('Statement export: {{bank}}', { bank: t(bank.name) })
                  : t('Export a statement')}
              </Text>
              <ol style={{ paddingLeft: 22, margin: '8px 0' }}>
                {instructions.steps.map(step => (
                  <li key={step}>{t(step)}</li>
                ))}
              </ol>
              {instructions.sourceUrl && (
                <Link variant="external" to={instructions.sourceUrl}>
                  {t(instructions.sourceLabel ?? 'Bank instructions')}
                </Link>
              )}
            </View>
            <View style={{ gap: 6 }}>
              <Text>
                {t(
                  'Actual accepts CSV, TSV, QIF, OFX, QFX, and CAMT/XML. PDF files cannot be imported directly.',
                )}
              </Text>
              <Text>
                {t(
                  'For CSV, map the date, description, and amount columns in the import preview. Check the signs and compare the resulting balance with your statement.',
                )}
              </Text>
              <Text>
                <Trans>
                  After import, transactions are included in reports according
                  to their categories.
                </Trans>
              </Text>
              <Text>
                <Trans>
                  Categorize transfers between your own accounts as transfers so
                  reports do not count them as income or expenses.
                </Trans>
              </Text>
              {isNarrowWidth && (
                <Text>
                  {t(
                    'To upload the statement, open this account on a wide screen.',
                  )}
                </Text>
              )}
            </View>
          </View>
          <ModalButtons>
            <Button onPress={() => state.close()}>
              <Trans>Close</Trans>
            </Button>
            {!isNarrowWidth && onChooseFile && (
              <Button
                variant="primary"
                onPress={() => {
                  dispatch(closeModal());
                  onChooseFile();
                }}
              >
                <Trans>Choose file</Trans>
              </Button>
            )}
          </ModalButtons>
        </>
      )}
    </Modal>
  );
}
