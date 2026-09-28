// @ts-strict-ignore
import type {
  ComponentProps,
  Dispatch,
  ReactNode,
  SetStateAction,
} from 'react';
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button, ButtonWithLoading } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { Select } from '@actual-app/components/select';
import { SpaceBetween } from '@actual-app/components/space-between';
import { styles } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { send } from '@actual-app/core/platform/client/connection';
import type { ParseFileOptions } from '@actual-app/core/server/transactions/import/parse-file';
import { amountToInteger } from '@actual-app/core/shared/util';
import type { TransactionEntity } from '@actual-app/core/types/models';
import { useQueryClient } from '@tanstack/react-query';

import {
  useImportPreviewTransactionsMutation,
  useImportTransactionsMutation,
} from '#accounts';
import { Modal, ModalCloseButton, ModalHeader } from '#components/common/Modal';
import { SectionLabel } from '#components/forms';
import { LabeledCheckbox } from '#components/forms/LabeledCheckbox';
import { TableHeader, TableWithNavigator } from '#components/table';
import { useAccounts } from '#hooks/useAccounts';
import { useCategories } from '#hooks/useCategories';
import { useDateFormat } from '#hooks/useDateFormat';
import { useSyncedPrefs } from '#hooks/useSyncedPrefs';
import { payeeQueries } from '#payees';

import { AccountRouting } from './AccountRouting';
import { DateFormatSelect } from './DateFormatSelect';
import { FieldMappings } from './FieldMappings';
import { InOutOption } from './InOutOption';
import { MultiplierOption } from './MultiplierOption';
import { Transaction } from './Transaction';
import type { DateFormat, FieldMapping, ImportTransaction } from './utils';
import {
  applyFieldMappings,
  dateFormats,
  filterByStartDate,
  findOpposingPairIds,
  isDateFormat,
  parseAmountFields,
  parseCategoryFields,
  parseDate,
  stripCsvImportTransaction,
  suggestAccountRoutes,
} from './utils';

function CheckboxToggle({
  id,
  checked,
  onChange,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: Dispatch<SetStateAction<boolean>>;
  children: ReactNode;
}) {
  return (
    <LabeledCheckbox
      id={id}
      checked={checked}
      onChange={() => onChange(prev => !prev)}
    >
      {children}
    </LabeledCheckbox>
  );
}

function getFileType(filepath: string): string {
  const m = filepath.match(/\.([^.]*)$/);
  if (!m) return 'ofx';
  const rawType = m[1].toLowerCase();
  if (rawType === 'tsv') return 'csv';
  return rawType;
}

function getInitialDateFormat(transactions, mappings) {
  if (transactions.length === 0 || mappings.date == null) {
    return 'yyyy mm dd';
  }

  const transaction = transactions[0];
  const date = transaction[mappings.date];

  const found =
    date == null
      ? null
      : dateFormats.find(f => parseDate(date, f.format) != null);
  return found ? found.format : 'mm dd yyyy';
}

function getInitialMappings(transactions) {
  if (transactions.length === 0) {
    return {};
  }

  const transaction = stripCsvImportTransaction(transactions[0]);
  const fields = Object.entries(transaction);

  function key(entry) {
    return entry ? entry[0] : null;
  }

  const dateField = key(
    fields.find(([name]) => name === 'Дата операции') ||
      fields.find(([name]) => name.toLowerCase().includes('date')) ||
      fields.find(([, value]) => String(value)?.match(/^\d+[-/]\d+[-/]\d+$/)),
  );

  const amountField = key(
    fields.find(([name]) => name === 'Сумма в валюте счёта') ||
      fields.find(([name]) => name.toLowerCase().includes('amount')) ||
      fields.find(([, value]) => String(value)?.match(/^-?[.,\d]+$/)),
  );

  const categoryField = key(
    fields.find(([name]) => name.toLowerCase().includes('category')),
  );

  const payeeField = key(
    fields.find(([name]) => name === 'Описание') ||
      fields.find(([name]) => name.toLowerCase().includes('payee')) ||
      fields.find(
        ([name]) =>
          name !== dateField && name !== amountField && name !== categoryField,
      ),
  );

  const notesField = key(
    fields.find(([name]) => name === 'Сообщение') ||
      fields.find(([name]) => name.toLowerCase().includes('notes')) ||
      fields.find(
        ([name]) =>
          name !== dateField &&
          name !== amountField &&
          name !== categoryField &&
          name !== payeeField,
      ),
  );

  const inOutField = key(
    fields.find(
      ([name]) =>
        name !== dateField &&
        name !== amountField &&
        name !== payeeField &&
        name !== notesField,
    ),
  );

  const accountField = key(
    fields.find(([name]) => name === 'Имя счёта') ||
      fields.find(([name]) => name.toLowerCase() === 'account'),
  );

  return {
    date: dateField,
    amount: amountField,
    payee: payeeField,
    notes: notesField,
    inOut: inOutField,
    category: categoryField,
    account: accountField,
  };
}

type LastParse = {
  filename: string;
  fileType: string;
  options: ParseFileOptions;
};

const parseOptionKeys = [
  'hasHeaderRow',
  'delimiter',
  'encoding',
  'fallbackMissingPayeeToMemo',
  'swapPayeeAndMemo',
  'skipStartLines',
  'skipEndLines',
  'importNotes',
] satisfies Array<keyof ParseFileOptions>;

function shouldPreserveImportSettingsForParse(
  lastParse: LastParse | null,
  filename: string,
  fileType: string,
  options: ParseFileOptions,
) {
  return (
    fileType === 'csv' &&
    lastParse?.filename === filename &&
    lastParse.fileType === fileType &&
    parseOptionKeys.every(key =>
      key === 'skipEndLines'
        ? lastParse.options[key] !== options[key]
        : lastParse.options[key] === options[key],
    )
  );
}

export function ImportTransactionsModal({
  filename: originalFileName,
  accountId,
  onImported,
}: {
  filename: string;
  accountId?: string;
  onImported?: (didChange: boolean) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const dateFormat = useDateFormat() || ('MM/dd/yyyy' as const);
  const [prefs, savePrefs] = useSyncedPrefs();
  const initialPrefs = useRef(prefs).current;
  const { data: allAccounts = [] } = useAccounts();
  const availableAccounts = allAccounts.filter(account => !account.closed);
  const { data: { list: categories } = { list: [] } } = useCategories();

  const [multiplierAmount, setMultiplierAmount] = useState('');
  const [loadingState, setLoadingState] = useState<
    null | 'parsing' | 'importing'
  >('parsing');
  const [error, setError] = useState<{
    parsed: boolean;
    message: string;
  } | null>(null);
  const [filename, setFilename] = useState(originalFileName);
  const [transactions, setTransactions] = useState<ImportTransaction[]>([]);
  const [parsedTransactions, setParsedTransactions] = useState<
    ImportTransaction[]
  >([]);
  const [filetype, setFileType] = useState('unknown');
  const [fieldMappings, setFieldMappings] = useState<FieldMapping | null>(null);
  const [splitMode, setSplitMode] = useState(false);
  const [flipAmount, setFlipAmount] = useState(false);
  const [multiplierEnabled, setMultiplierEnabled] = useState(false);
  const [reconcile, setReconcile] = useState(true);
  const [importNotes, setImportNotes] = useState(true);
  const [autoExcludePairs, setAutoExcludePairs] = useState(true);
  const [accountRoutes, setAccountRoutes] = useState<Record<string, string>>(
    {},
  );
  const [autoExcludedIds, setAutoExcludedIds] = useState<Set<string>>(
    new Set(),
  );
  const [isPreviewing, setIsPreviewing] = useState(false);
  const selectionOverridesRef = useRef(
    new Map<string, { selected: boolean; selected_merge: boolean }>(),
  );
  const previewGenerationRef = useRef(0);
  const parseGenerationRef = useRef(0);
  const completedAccountsRef = useRef(new Set<string>());
  const importDidChangeRef = useRef(false);

  // This cannot be set after parsing the file, because changing it
  // requires re-parsing the file. This is different from the other
  // options which are simple post-processing. That means if you
  // parsed different files without closing the modal, it wouldn't
  // re-read this.
  const [delimiter, setDelimiter] = useState(
    prefs[`csv-delimiter-${accountId}`] ||
      (filename.endsWith('.tsv') ? '\t' : 'auto'),
  );
  const [csvEncoding, setCsvEncoding] = useState(
    prefs[`csv-encoding-${accountId}`] || 'auto',
  );
  const [skipStartLines, setSkipStartLines] = useState(
    parseInt(prefs[`csv-skip-start-lines-${accountId}`], 10) || 0,
  );
  const [skipEndLines, setSkipEndLines] = useState(
    parseInt(prefs[`csv-skip-end-lines-${accountId}`], 10) || 0,
  );
  const [inOutMode, setInOutMode] = useState(
    String(prefs[`csv-in-out-mode-${accountId}`]) === 'true',
  );
  const [outValue, setOutValue] = useState(
    prefs[`csv-out-value-${accountId}`] ?? '',
  );
  const [hasHeaderRow, setHasHeaderRow] = useState(
    String(prefs[`csv-has-header-${accountId}`]) !== 'false',
  );
  const [fallbackMissingPayeeToMemo, setFallbackMissingPayeeToMemo] = useState(
    String(prefs[`ofx-fallback-missing-payee-${accountId}`]) !== 'false',
  );
  const [ofxSwapPayeeAndMemo, setOfxSwapPayeeAndMemo] = useState(
    String(prefs[`ofx-swap-payee-memo-${accountId}`]) === 'true',
  );
  const [qifSwapPayeeAndMemo, setQifSwapPayeeAndMemo] = useState(
    String(prefs[`qif-swap-payee-memo-${accountId}`]) === 'true',
  );
  const [camtSwapPayeeAndMemo, setCamtSwapPayeeAndMemo] = useState(
    String(prefs[`camt-swap-payee-memo-${accountId}`]) === 'true',
  );
  const [reimportDeleted, setReimportDeleted] = useState(
    String(prefs[`import-reimport-deleted-${accountId}`] || 'true') === 'true',
  );

  const [parseDateFormat, setParseDateFormat] = useState<DateFormat | null>(
    null,
  );

  const [clearOnImport, setClearOnImport] = useState(true);
  const [startDate, setStartDate] = useState('');
  const lastParseRef = useRef<LastParse | null>(null);

  const sourceField = fieldMappings?.account;
  const sourceCounts = new Map<string, number>();
  if (sourceField) {
    for (const transaction of parsedTransactions) {
      const sourceName = String(transaction[sourceField] ?? '').trim();
      if (sourceName) {
        sourceCounts.set(sourceName, (sourceCounts.get(sourceName) ?? 0) + 1);
      }
    }
  }
  const sources = Array.from(sourceCounts, ([name, count]) => ({
    name,
    count,
  }));
  const routingRequired =
    filetype === 'csv' && (!accountId || sources.length > 1);
  const effectiveReconcile = routingRequired || reconcile;
  const hasMissingSource =
    routingRequired &&
    !!sourceField &&
    parsedTransactions.some(
      transaction => !String(transaction[sourceField] ?? '').trim(),
    );
  const hasUnresolvedRoutes =
    routingRequired &&
    (!sourceField ||
      sources.length === 0 ||
      hasMissingSource ||
      sources.some(source => !accountRoutes[source.name]));

  useEffect(() => {
    if (!fieldMappings?.account || parsedTransactions.length === 0) {
      return;
    }
    const sourceNames = Array.from(
      new Set(
        parsedTransactions
          .map(transaction =>
            String(transaction[fieldMappings.account] ?? '').trim(),
          )
          .filter(Boolean),
      ),
    );
    let savedRoutes: Record<string, string> = {};
    try {
      savedRoutes = JSON.parse(initialPrefs['csv-account-routes'] ?? '{}');
    } catch {
      savedRoutes = {};
    }
    const suggestions = suggestAccountRoutes(
      sourceNames,
      allAccounts.filter(account => !account.closed),
      savedRoutes,
    );
    setAccountRoutes(previous => {
      const next = { ...suggestions, ...previous };
      const keys = Object.keys(next);
      return keys.length === Object.keys(previous).length &&
        keys.every(key => next[key] === previous[key])
        ? previous
        : next;
    });
  }, [allAccounts, fieldMappings?.account, initialPrefs, parsedTransactions]);

  const getImportPreview = useCallback(
    async (
      transactions: ImportTransaction[],
      filetype: string,
      flipAmount: boolean,
      fieldMappings: FieldMapping | null,
      splitMode: boolean,
      parseDateFormat: DateFormat,
      inOutMode: boolean,
      outValue: string,
      multiplierAmount: string,
    ) => {
      const previewTransactions = [];
      const inOutModeEnabled = isOfxFile(filetype) ? false : inOutMode;
      const getTransDate: (trans: ImportTransaction) => string | null =
        isOfxFile(filetype)
          ? trans => trans.date ?? null
          : trans => parseDate(trans.date, parseDateFormat);

      // Note that the sort will behave unpredictably if any date fails to parse.
      transactions.sort((a, b) => {
        const aDate = getTransDate(a);
        const bDate = getTransDate(b);

        return aDate < bDate ? 1 : aDate === bDate ? 0 : -1;
      });

      for (let trans of transactions) {
        if (trans.isMatchedTransaction) {
          // skip transactions that are matched transaction (existing transaction added to show update changes)
          continue;
        }

        trans = fieldMappings
          ? applyFieldMappings(trans, fieldMappings)
          : trans;

        const date = getTransDate(trans);
        if (date == null) {
          console.log(
            `Unable to parse date ${
              trans.date || '(empty)'
            } with given date format`,
          );
          break;
        }
        if (trans.payee_name == null || typeof trans.payee_name !== 'string') {
          console.log(`Unable·to·parse·payee·${trans.payee_name || '(empty)'}`);
          break;
        }

        const { amount } = parseAmountFields(
          trans,
          splitMode,
          inOutModeEnabled,
          outValue,
          flipAmount,
          multiplierAmount,
        );
        if (amount == null) {
          console.log(`Transaction on ${trans.date} has no amount`);
          break;
        }

        const category_id = parseCategoryFields(trans, categories);
        trans.category = category_id;

        const {
          inflow: _inflow,
          outflow: _outflow,
          inOut: _inOut,
          existing: _existing,
          ignored: _ignored,
          selected: _selected,
          selected_merge: _selected_merge,
          tombstone: _tombstone,
          ...finalTransaction
        } = trans;
        previewTransactions.push({
          ...finalTransaction,
          date,
          amount: amountToInteger(amount),
          cleared: clearOnImport,
        });
      }

      return previewTransactions;
    },
    [categories, clearOnImport],
  );

  const parse = useCallback(
    async (
      filename: string,
      options: ParseFileOptions,
      { preserveImportSettings = false } = {},
    ) => {
      const generation = ++parseGenerationRef.current;
      setLoadingState('parsing');

      if (!preserveImportSettings) {
        selectionOverridesRef.current.clear();
      }

      const filetype = getFileType(filename);
      setFilename(filename);
      setFileType(filetype);

      const { errors, transactions: parsedTransactions = [] } = await send(
        'transactions-parse-file',
        {
          filepath: filename,
          options,
        },
      );
      if (generation !== parseGenerationRef.current) {
        return;
      }

      let index = 0;
      const transactions = parsedTransactions.map(trans => {
        // Add a transient transaction id to match preview with imported transactions
        // @ts-expect-error - trans is unknown type, adding properties dynamically
        trans.trx_id = String(index++);
        // Select all parsed transactions before first preview run
        // @ts-expect-error - trans is unknown type, adding properties dynamically
        trans.selected = true;
        return trans;
      });

      setError(null);

      /// Do fine grained reporting between the old and new OFX importers.
      if (errors.length > 0) {
        setError({
          parsed: true,
          message: errors[0].message || 'Internal error',
        });
      } else {
        if (
          !preserveImportSettings &&
          (filetype === 'csv' || filetype === 'qif')
        ) {
          const flipAmount =
            String(initialPrefs[`flip-amount-${accountId}-${filetype}`]) ===
            'true';
          setFlipAmount(flipAmount);
        }

        if (filetype === 'csv') {
          if (!preserveImportSettings) {
            let mappings = initialPrefs[`csv-mappings-${accountId}`];
            mappings = mappings
              ? JSON.parse(mappings)
              : getInitialMappings(transactions);

            // @ts-expect-error - mappings might not have outflow/inflow properties
            setFieldMappings(mappings);

            // Set initial split mode based on any saved mapping
            // @ts-expect-error - mappings might not have outflow/inflow properties
            const splitMode = !!(mappings.outflow || mappings.inflow);
            setSplitMode(splitMode);

            const parseDateFormat =
              initialPrefs[`parse-date-${accountId}-${filetype}`] ||
              getInitialDateFormat(transactions, mappings);
            setParseDateFormat(
              isDateFormat(parseDateFormat) ? parseDateFormat : null,
            );
          }
        } else if (filetype === 'qif') {
          if (!preserveImportSettings) {
            const parseDateFormat =
              initialPrefs[`parse-date-${accountId}-${filetype}`] ||
              getInitialDateFormat(transactions, { date: 'date' });
            setParseDateFormat(
              isDateFormat(parseDateFormat) ? parseDateFormat : null,
            );
          }
        } else {
          setFieldMappings(null);
          setParseDateFormat(null);
        }

        setParsedTransactions(transactions as ImportTransaction[]);
      }

      setLoadingState(null);
    },
    // We use some state variables from the component, but do not want to re-parse when they change
    [accountId, initialPrefs],
  );

  function onMultiplierChange(e) {
    const amt = e;
    if (!amt || amt.match(/^\d{1,}(\.\d{0,4})?$/)) {
      setMultiplierAmount(amt);
    }
  }

  useEffect(() => {
    const fileType = getFileType(filename);
    const parseOptions = getParseOptions(fileType, {
      delimiter,
      encoding: csvEncoding,
      hasHeaderRow,
      skipStartLines,
      skipEndLines,
      fallbackMissingPayeeToMemo,
      importNotes,
      swapPayeeAndMemo: getSwapOption(
        fileType,
        ofxSwapPayeeAndMemo,
        qifSwapPayeeAndMemo,
        camtSwapPayeeAndMemo,
      ),
    });
    const lastParse = lastParseRef.current;
    const shouldPreserveImportSettings = shouldPreserveImportSettingsForParse(
      lastParse,
      filename,
      fileType,
      parseOptions,
    );

    lastParseRef.current = {
      filename,
      fileType,
      options: parseOptions,
    };

    void parse(filename, parseOptions, {
      preserveImportSettings: shouldPreserveImportSettings,
    });
  }, [
    filename,
    delimiter,
    csvEncoding,
    hasHeaderRow,
    skipStartLines,
    skipEndLines,
    fallbackMissingPayeeToMemo,
    importNotes,
    ofxSwapPayeeAndMemo,
    qifSwapPayeeAndMemo,
    camtSwapPayeeAndMemo,
    parse,
  ]);

  function onSplitMode() {
    if (fieldMappings == null) {
      return;
    }

    const isSplit = !splitMode;
    setSplitMode(isSplit);

    // Run auto-detection on the fields to try to detect the fields
    // automatically
    const mappings = getInitialMappings(transactions);

    const newFieldMappings = isSplit
      ? {
          amount: null,
          outflow: mappings.amount,
          inflow: null,
        }
      : {
          amount: mappings.amount,
          outflow: null,
          inflow: null,
        };
    setFieldMappings({ ...fieldMappings, ...newFieldMappings });
  }

  async function onNewFile() {
    const res = await window.Actual.openFileDialog({
      filters: [
        {
          name: 'Financial Files',
          extensions: ['qif', 'ofx', 'qfx', 'csv', 'tsv', 'xml'],
        },
      ],
    });

    if (!res?.[0]) {
      return;
    }
    selectionOverridesRef.current.clear();
    completedAccountsRef.current.clear();
    importDidChangeRef.current = false;
    setAccountRoutes({});
    setFilename(res[0]);
  }

  function onUpdateFields(field, name) {
    const newFieldMappings = {
      ...fieldMappings,
      [field]: name === '' ? null : name,
    };
    setFieldMappings(newFieldMappings);
  }

  function onCheckTransaction(trx_id: string) {
    const transaction = transactions.find(trans => trans.trx_id === trx_id);
    if (transaction && routingRequired) {
      const source = sourceField
        ? String(transaction[sourceField] ?? '').trim()
        : '';
      if (!accountRoutes[source] || accountRoutes[source] === 'skip') {
        return;
      }
    }
    const newTransactions = transactions.map(trans => {
      if (trans.trx_id === trx_id) {
        if (trans.existing) {
          // 3-states management for transactions with existing (merged transactions)
          // flow of states:
          // (selected true && selected_merge true)
          //   => (selected true && selected_merge false)
          //     => (selected false)
          //       => back to (selected true && selected_merge true)
          if (!trans.selected) {
            return {
              ...trans,
              selected: true,
              selected_merge: true,
            };
          } else if (trans.selected_merge) {
            return {
              ...trans,
              selected: true,
              selected_merge: false,
            };
          } else {
            return {
              ...trans,
              selected: false,
              selected_merge: false,
            };
          }
        } else {
          return {
            ...trans,
            selected: !trans.selected,
          };
        }
      }
      return trans;
    });

    const updated = newTransactions.find(trans => trans.trx_id === trx_id);
    if (updated) {
      selectionOverridesRef.current.set(trx_id, {
        selected: updated.selected,
        selected_merge: updated.selected_merge,
      });
    }
    setTransactions(newTransactions);
  }

  const importTransactions = useImportTransactionsMutation();

  async function onImport(close) {
    if (hasUnresolvedRoutes) {
      return;
    }
    setLoadingState('importing');

    const transactionsByAccount = new Map<string, Record<string, unknown>[]>();
    let errorMessage;

    for (let trans of transactions) {
      if (
        trans.isMatchedTransaction ||
        (!trans.selected &&
          (!effectiveReconcile ||
            !trans.ignored ||
            autoExcludedIds.has(trans.trx_id)))
      ) {
        // Keep ignored rows for reconciliation, but never import a deselected
        // row in direct-add mode or an automatically excluded offsetting pair.
        continue;
      }

      const sourceName = sourceField
        ? String(trans[sourceField] ?? '').trim()
        : '';
      const destinationAccountId = routingRequired
        ? accountRoutes[sourceName]
        : accountId;
      if (!destinationAccountId || destinationAccountId === 'skip') {
        continue;
      }

      trans = fieldMappings ? applyFieldMappings(trans, fieldMappings) : trans;

      const date =
        isOfxFile(filetype) || isCamtFile(filetype)
          ? trans.date
          : parseDate(trans.date, parseDateFormat);
      if (date == null) {
        errorMessage = t(
          'Unable to parse date {{date}} with given date format',
          { date: trans.date || t('(empty)') },
        );
        break;
      }

      const { amount } = parseAmountFields(
        trans,
        splitMode,
        isOfxFile(filetype) ? false : inOutMode,
        outValue,
        flipAmount,
        multiplierAmount,
      );
      if (amount == null) {
        errorMessage = t('Transaction on {{date}} has no amount', {
          date: trans.date,
        });
        break;
      }

      const category_id = parseCategoryFields(trans, categories);
      trans.category = category_id;

      const {
        inflow: _inflow,
        outflow: _outflow,
        inOut: _inOut,
        existing: _existing,
        ignored: _ignored,
        selected: _selected,
        selected_merge: _selected_merge,
        trx_id: _trx_id,
        ...finalTransaction
      } = trans;

      if (
        effectiveReconcile &&
        ((trans.ignored && trans.selected) ||
          (trans.existing && trans.selected && !trans.selected_merge))
      ) {
        // in reconcile mode, force transaction add for
        // - ignored transactions (aleardy existing) that are checked
        // - transactions with existing (merged transactions) that are not selected_merge
        finalTransaction.forceAddTransaction = true;
      }

      const finalTransactions =
        transactionsByAccount.get(destinationAccountId) ?? [];
      finalTransactions.push({
        ...finalTransaction,
        date,
        amount: amountToInteger(amount),
        cleared: clearOnImport,
        notes: importNotes ? finalTransaction.notes : null,
      });
      transactionsByAccount.set(destinationAccountId, finalTransactions);
    }

    if (errorMessage) {
      setLoadingState(null);
      setError({ parsed: false, message: errorMessage });
      return;
    }

    if (!isOfxFile(filetype) && !isCamtFile(filetype)) {
      const key = `parse-date-${accountId}-${filetype}`;
      savePrefs({ [key]: parseDateFormat });
    }

    if (isOfxFile(filetype)) {
      savePrefs({
        [`ofx-fallback-missing-payee-${accountId}`]: String(
          fallbackMissingPayeeToMemo,
        ),
        [`ofx-swap-payee-memo-${accountId}`]: String(ofxSwapPayeeAndMemo),
      });
    }

    if (filetype === 'csv') {
      savePrefs({
        [`csv-mappings-${accountId}`]: JSON.stringify(fieldMappings),
      });
      savePrefs({ [`csv-delimiter-${accountId}`]: delimiter });
      savePrefs({ [`csv-encoding-${accountId}`]: csvEncoding });
      savePrefs({ [`csv-has-header-${accountId}`]: String(hasHeaderRow) });
      savePrefs({
        [`csv-skip-start-lines-${accountId}`]: String(skipStartLines),
      });
      savePrefs({ [`csv-skip-end-lines-${accountId}`]: String(skipEndLines) });
      savePrefs({ [`csv-in-out-mode-${accountId}`]: String(inOutMode) });
      savePrefs({ [`csv-out-value-${accountId}`]: String(outValue) });
    }

    if (filetype === 'csv' || filetype === 'qif') {
      savePrefs({
        [`flip-amount-${accountId}-${filetype}`]: String(flipAmount),
        [`import-notes-${accountId}-${filetype}`]: String(importNotes),
      });
    }

    if (filetype === 'qif') {
      savePrefs({
        [`qif-swap-payee-memo-${accountId}`]: String(qifSwapPayeeAndMemo),
      });
    }

    if (isCamtFile(filetype)) {
      savePrefs({
        [`camt-swap-payee-memo-${accountId}`]: String(camtSwapPayeeAndMemo),
      });
    }

    savePrefs({
      [`import-reimport-deleted-${accountId}`]: String(reimportDeleted),
    });

    try {
      for (const [
        destinationAccountId,
        accountTransactions,
      ] of transactionsByAccount) {
        if (completedAccountsRef.current.has(destinationAccountId)) {
          continue;
        }
        const changed = await importTransactions.mutateAsync({
          accountId: destinationAccountId,
          transactions: accountTransactions as TransactionEntity[],
          reconcile: effectiveReconcile,
          reimportDeleted,
        });
        completedAccountsRef.current.add(destinationAccountId);
        importDidChangeRef.current = importDidChangeRef.current || changed;
      }
      if (routingRequired) {
        let savedRoutes: Record<string, string> = {};
        try {
          savedRoutes = JSON.parse(initialPrefs['csv-account-routes'] ?? '{}');
        } catch {
          savedRoutes = {};
        }
        savePrefs({
          'csv-account-routes': JSON.stringify({
            ...savedRoutes,
            ...accountRoutes,
          }),
        });
      }
      if (importDidChangeRef.current) {
        void queryClient.invalidateQueries(payeeQueries.list());
      }
      onImported?.(importDidChangeRef.current);
      close();
    } catch (importError) {
      setError({
        parsed: false,
        message:
          importError instanceof Error
            ? importError.message
            : t(
                'Не удалось импортировать операции. Проверьте сопоставление счетов.',
              ),
      });
      setLoadingState(null);
    }
  }

  const importPreviewTransactions = useImportPreviewTransactionsMutation();

  const onImportPreview = useEffectEvent(async () => {
    const generation = ++previewGenerationRef.current;
    setIsPreviewing(true);
    // Filter by start date before preview and deduplication
    const isPreParsed = isOfxFile(filetype) || isCamtFile(filetype);
    const filteredTransactions = filterByStartDate(
      parsedTransactions,
      startDate,
      isPreParsed,
      fieldMappings,
      parseDateFormat,
    );

    // always start from the original parsed transactions, not the previewed ones to ensure rules run
    const previewTransactionsToImport = await getImportPreview(
      filteredTransactions,
      filetype,
      flipAmount,
      fieldMappings,
      splitMode,
      parseDateFormat,
      inOutMode,
      outValue,
      multiplierAmount,
    );

    const originalById = new Map(
      filteredTransactions.map(transaction => [
        transaction.trx_id,
        transaction,
      ]),
    );
    const destinationFor = (transaction: ImportTransaction) => {
      if (!routingRequired) {
        return accountId;
      }
      const original = originalById.get(transaction.trx_id);
      const source = sourceField
        ? String(original?.[sourceField] ?? '').trim()
        : '';
      const destination = accountRoutes[source];
      return destination && destination !== 'skip' ? destination : null;
    };

    const pairedIds = autoExcludePairs
      ? findOpposingPairIds(
          previewTransactionsToImport.map(transaction => ({
            id: transaction.trx_id,
            accountId: destinationFor(transaction) ?? '',
            sourceAccount: sourceField
              ? String(
                  originalById.get(transaction.trx_id)?.[sourceField] ?? '',
                )
              : '',
            date: transaction.date,
            amount: transaction.amount,
            description: String(transaction.payee_name ?? ''),
          })),
        )
      : new Set<string>();

    const byAccount = new Map<string, ImportTransaction[]>();
    for (const transaction of previewTransactionsToImport) {
      const destination = destinationFor(transaction);
      if (destination && !pairedIds.has(transaction.trx_id)) {
        const group = byAccount.get(destination) ?? [];
        group.push(transaction);
        byAccount.set(destination, group);
      }
    }

    try {
      const previewResults = [];
      for (const [destination, group] of byAccount) {
        previewResults.push(
          await importPreviewTransactions.mutateAsync({
            accountId: destination,
            transactions: group as unknown as TransactionEntity[],
            reimportDeleted,
          }),
        );
      }
      if (generation !== previewGenerationRef.current) {
        return;
      }
      setAutoExcludedIds(pairedIds);
      const previewTrx = previewResults.flat();
      const matchedUpdateMap = previewTrx.reduce((map, entry) => {
        map[entry.transaction.trx_id] = entry;
        return map;
      }, {});

      const previewTransactions = filteredTransactions
        .filter(trans => !trans.isMatchedTransaction)
        .reduce((previous, currentTrx) => {
          let next = previous;
          const entry = matchedUpdateMap[currentTrx.trx_id];
          const existingTrx = entry?.existing;

          // if the transaction is matched with an existing one for update
          currentTrx.existing = !!existingTrx;
          // if the transaction is an update that will be ignored
          // (reconciled transactions or no change detected)
          currentTrx.ignored = entry?.ignored || false;

          currentTrx.tombstone = entry?.tombstone || false;

          const selection = selectionOverridesRef.current.get(
            currentTrx.trx_id,
          );
          currentTrx.selected =
            selection?.selected ??
            (!currentTrx.ignored &&
              !pairedIds.has(currentTrx.trx_id) &&
              !!destinationFor(currentTrx));
          currentTrx.selected_merge =
            selection?.selected_merge ?? currentTrx.existing;

          next = next.concat({ ...currentTrx });

          if (existingTrx) {
            // add the updated existing transaction in the list, with the
            // isMatchedTransaction flag to identify it in display and not send it again
            existingTrx.isMatchedTransaction = true;
            existingTrx.category = categories.find(
              cat => cat.id === existingTrx.category,
            )?.name;
            // add parent transaction attribute to mimic behaviour
            existingTrx.trx_id = currentTrx.trx_id;
            existingTrx.existing = currentTrx.existing;
            existingTrx.selected = currentTrx.selected;
            existingTrx.selected_merge = currentTrx.selected_merge;

            next = next.concat({ ...existingTrx });
          }

          return next;
        }, []);

      setTransactions(previewTransactions);
      setIsPreviewing(false);
    } catch (previewError) {
      if (generation === previewGenerationRef.current) {
        setIsPreviewing(false);
        setError({
          parsed: false,
          message:
            previewError instanceof Error
              ? previewError.message
              : t('Не удалось подготовить предварительный просмотр.'),
        });
      }
    }
  });

  useEffect(() => {
    if (parsedTransactions.length === 0 || loadingState !== null) {
      return;
    }

    void onImportPreview();
  }, [
    loadingState,
    parsedTransactions.length,
    startDate,
    fieldMappings,
    parseDateFormat,
    reimportDeleted,
    accountRoutes,
    autoExcludePairs,
    flipAmount,
    splitMode,
    inOutMode,
    outValue,
    multiplierAmount,
    clearOnImport,
  ]);

  const headers: ComponentProps<typeof TableHeader>['headers'] = [
    { name: t('Date'), width: 200 },
    { name: t('Payee'), width: 'flex' },
    { name: t('Notes'), width: 'flex' },
    { name: t('Category'), width: 'flex' },
  ];

  if (effectiveReconcile) {
    headers.unshift({ name: ' ', width: 31 });
  }
  if (inOutMode) {
    headers.push({
      name: t('In/Out'),
      width: 90,
      style: { textAlign: 'left' },
    });
  }
  if (splitMode) {
    headers.push({
      name: t('Outflow'),
      width: 90,
      style: { textAlign: 'right' },
    });
    headers.push({
      name: t('Inflow'),
      width: 90,
      style: { textAlign: 'right' },
    });
  } else {
    headers.push({
      name: t('Amount'),
      width: 90,
      style: { textAlign: 'right' },
    });
  }

  return (
    <Modal
      name="import-transactions"
      isDismissable={false}
      isLoading={loadingState === 'parsing'}
      containerProps={{ style: { width: 800 } }}
    >
      {({ state }) => (
        <>
          <ModalHeader
            title={
              t('Import transactions') +
              (filetype ? ` (${filetype.toUpperCase()})` : '')
            }
            rightContent={<ModalCloseButton onPress={() => state.close()} />}
          />
          {error && !error.parsed && (
            <View style={{ alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ marginRight: 10, color: theme.errorText }}>
                <strong>
                  <Trans>Error:</Trans>
                </strong>{' '}
                {error.message}
              </Text>
            </View>
          )}
          {(!error || !error.parsed) && (
            <View
              style={{ ...styles.tableContainer, height: 300, flex: 'unset' }}
            >
              <TableHeader headers={headers} />

              {/* @ts-expect-error - ImportTransaction is not a TableItem */}
              <TableWithNavigator<ImportTransaction>
                items={transactions.filter(
                  trans =>
                    !trans.isMatchedTransaction ||
                    (trans.isMatchedTransaction && effectiveReconcile),
                )}
                fields={['payee', 'category', 'amount']}
                style={{ backgroundColor: theme.tableHeaderBackground }}
                getItemKey={index => String(index)}
                renderEmpty={() => {
                  return (
                    <View
                      style={{
                        textAlign: 'center',
                        marginTop: 25,
                        color: theme.tableHeaderText,
                        fontStyle: 'italic',
                      }}
                    >
                      <Trans>No transactions found</Trans>
                    </View>
                  );
                }}
                renderItem={({ item, index }) => (
                  <View>
                    <Transaction
                      transaction={item}
                      index={index}
                      showParsed={filetype === 'csv' || filetype === 'qif'}
                      parseDateFormat={parseDateFormat}
                      dateFormat={dateFormat}
                      fieldMappings={fieldMappings}
                      splitMode={splitMode}
                      inOutMode={inOutMode}
                      outValue={outValue}
                      flipAmount={flipAmount}
                      multiplierAmount={multiplierAmount}
                      categories={categories}
                      onCheckTransaction={onCheckTransaction}
                      reconcile={effectiveReconcile}
                      canSelect={
                        !routingRequired ||
                        !!(
                          sourceField &&
                          accountRoutes[
                            String(item[sourceField] ?? '').trim()
                          ] &&
                          accountRoutes[
                            String(item[sourceField] ?? '').trim()
                          ] !== 'skip'
                        )
                      }
                    />
                  </View>
                )}
              />
            </View>
          )}
          {error && error.parsed && (
            <View
              style={{
                color: theme.errorText,
                alignItems: 'center',
                marginTop: 10,
              }}
            >
              <Text style={{ maxWidth: 450, marginBottom: 15 }}>
                <strong>Error:</strong> {error.message}
              </Text>
              {error.parsed && (
                <Button onPress={() => onNewFile()}>
                  <Trans>Select new file...</Trans>
                </Button>
              )}
            </View>
          )}

          <View
            style={{
              marginTop: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <label
              htmlFor="start-date-filter"
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 5,
                alignItems: 'baseline',
              }}
            >
              <Trans>Only import transactions since:</Trans>
              <Input
                id="start-date-filter"
                type="date"
                value={startDate}
                onChangeValue={value => setStartDate(value)}
                style={{ width: 150 }}
              />
            </label>
            {startDate && (
              <Button onPress={() => setStartDate('')}>
                <Trans>Clear</Trans>
              </Button>
            )}
          </View>

          {filetype === 'csv' && (
            <View style={{ marginTop: 10 }}>
              <FieldMappings
                transactions={transactions}
                onChange={onUpdateFields}
                mappings={fieldMappings || undefined}
                splitMode={splitMode}
                inOutMode={inOutMode}
                hasHeaderRow={hasHeaderRow}
              />
            </View>
          )}

          {routingRequired &&
            (sourceField && sources.length > 0 ? (
              <AccountRouting
                sources={sources}
                accounts={availableAccounts}
                routes={accountRoutes}
                onChange={(source, destination) =>
                  setAccountRoutes(previous => ({
                    ...previous,
                    [source]: destination,
                  }))
                }
              />
            ) : (
              <Text style={{ marginTop: 12, color: theme.errorText }}>
                {t('Для общего файла выберите поле «Счёт в файле».')}
              </Text>
            ))}

          {filetype === 'csv' && (
            <View style={{ marginTop: 12, gap: 4 }}>
              <CheckboxToggle
                id="auto-exclude-pairs"
                checked={autoExcludePairs}
                onChange={setAutoExcludePairs}
              >
                {t(
                  'Исключать встречные операции с одинаковыми датой, суммой и описанием на одном счёте',
                )}
                {hasMissingSource && (
                  <Text style={{ marginTop: 8, color: theme.errorText }}>
                    {t(
                      'В файле есть операции без названия счёта. Выберите другой столбец счёта или исправьте файл.',
                    )}
                  </Text>
                )}
              </CheckboxToggle>
              {autoExcludePairs && autoExcludedIds.size > 0 && (
                <Text style={{ color: theme.tableTextInactive }}>
                  {t('Исключено встречных операций: {{count}}', {
                    count: autoExcludedIds.size,
                  })}
                </Text>
              )}
            </View>
          )}

          {isOfxFile(filetype) && (
            <>
              <CheckboxToggle
                id="form_fallback_missing_payee"
                checked={fallbackMissingPayeeToMemo}
                onChange={setFallbackMissingPayeeToMemo}
              >
                <Trans>Use Memo as a fallback for empty Payees</Trans>
              </CheckboxToggle>
              <CheckboxToggle
                id="form_ofx_swap_payee_memo"
                checked={ofxSwapPayeeAndMemo}
                onChange={setOfxSwapPayeeAndMemo}
              >
                <Trans>Swap Payee and Memo</Trans>
              </CheckboxToggle>
            </>
          )}

          {filetype !== 'csv' && (
            <CheckboxToggle
              id="import_notes"
              checked={importNotes}
              onChange={setImportNotes}
            >
              <Trans>Import notes from file</Trans>
            </CheckboxToggle>
          )}

          {filetype === 'qif' && (
            <CheckboxToggle
              id="form_qif_swap_payee_memo"
              checked={qifSwapPayeeAndMemo}
              onChange={setQifSwapPayeeAndMemo}
            >
              <Trans>Swap Payee and Memo</Trans>
            </CheckboxToggle>
          )}

          {isCamtFile(filetype) && (
            <CheckboxToggle
              id="form_camt_swap_payee_memo"
              checked={camtSwapPayeeAndMemo}
              onChange={setCamtSwapPayeeAndMemo}
            >
              <Trans>Swap Payee and Memo</Trans>
            </CheckboxToggle>
          )}

          {(isOfxFile(filetype) || isCamtFile(filetype)) && (
            <CheckboxToggle
              id="form_dont_reconcile"
              checked={reconcile}
              onChange={setReconcile}
            >
              <Trans>Merge with existing transactions</Trans>
            </CheckboxToggle>
          )}

          {(isOfxFile(filetype) || isCamtFile(filetype)) && reconcile && (
            <CheckboxToggle
              id="form_reimport_deleted"
              checked={reimportDeleted}
              onChange={setReimportDeleted}
            >
              <Trans>Reimport deleted transactions</Trans>
            </CheckboxToggle>
          )}

          {/*Import Options */}
          {(filetype === 'qif' || filetype === 'csv') && (
            <View style={{ marginTop: 10 }}>
              <SpaceBetween
                gap={5}
                style={{ marginTop: 5, alignItems: 'flex-start' }}
              >
                {/* Date Format */}
                <View>
                  {(filetype === 'qif' || filetype === 'csv') && (
                    <DateFormatSelect
                      transactions={transactions}
                      fieldMappings={fieldMappings || undefined}
                      parseDateFormat={parseDateFormat || undefined}
                      onChange={value => {
                        setParseDateFormat(isDateFormat(value) ? value : null);
                      }}
                    />
                  )}
                </View>

                {/* CSV Options */}
                {filetype === 'csv' && (
                  <View style={{ marginLeft: 10, gap: 5 }}>
                    <SectionLabel title={t('CSV OPTIONS')} />
                    <label
                      htmlFor="csv-delimiter-select"
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: 5,
                        alignItems: 'baseline',
                      }}
                    >
                      <Trans>Delimiter:</Trans>
                      <Select
                        id="csv-delimiter-select"
                        options={[
                          ['auto', t('Авто')],
                          [',', ','],
                          [';', ';'],
                          ['|', '|'],
                          ['\t', 'tab'],
                          ['~', '~'],
                        ]}
                        value={delimiter}
                        onChange={value => {
                          setDelimiter(value);
                        }}
                        style={{ width: 50 }}
                      />
                    </label>
                    <label
                      htmlFor="csv-encoding-select"
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: 5,
                        alignItems: 'baseline',
                      }}
                    >
                      <Trans>Encoding:</Trans>
                      <Select
                        id="csv-encoding-select"
                        options={[
                          ['auto', t('Auto (detect)')],
                          ['utf-8', t('UTF-8')],
                          ['utf-16le', t('UTF-16 LE')],
                          ['utf-16be', t('UTF-16 BE')],
                          ['windows-1252', t('Windows-1252')],
                          ['windows-1250', t('Windows-1250')],
                          ['iso-8859-2', t('ISO-8859-2')],
                        ]}
                        value={csvEncoding}
                        onChange={value => {
                          setCsvEncoding(value);
                        }}
                        style={{ width: 130 }}
                      />
                    </label>
                    <label
                      htmlFor="csv-skip-start-lines"
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: 5,
                        alignItems: 'baseline',
                      }}
                    >
                      <Trans>Skip start lines:</Trans>
                      <Input
                        id="csv-skip-start-lines"
                        type="number"
                        value={skipStartLines}
                        min="0"
                        step="1"
                        onChangeValue={value => {
                          setSkipStartLines(Math.abs(parseInt(value, 10) || 0));
                        }}
                        style={{ width: 50 }}
                      />
                    </label>
                    <label
                      htmlFor="csv-skip-end-lines"
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: 5,
                        alignItems: 'baseline',
                      }}
                    >
                      <Trans>Skip end lines:</Trans>
                      <Input
                        id="csv-skip-end-lines"
                        type="number"
                        value={skipEndLines}
                        min="0"
                        step="1"
                        onChangeValue={value => {
                          setSkipEndLines(Math.abs(parseInt(value, 10) || 0));
                        }}
                        style={{ width: 50 }}
                      />
                    </label>
                    <CheckboxToggle
                      id="form_has_header"
                      checked={hasHeaderRow}
                      onChange={setHasHeaderRow}
                    >
                      <Trans>File has header row</Trans>
                    </CheckboxToggle>
                    <CheckboxToggle
                      id="clear_on_import"
                      checked={clearOnImport}
                      onChange={setClearOnImport}
                    >
                      <Trans>Clear transactions on import</Trans>
                    </CheckboxToggle>
                    {routingRequired ? (
                      <Text>
                        {t(
                          'Для общего файла совпадающие операции объединяются автоматически.',
                        )}
                      </Text>
                    ) : (
                      <CheckboxToggle
                        id="form_dont_reconcile"
                        checked={reconcile}
                        onChange={setReconcile}
                      >
                        <Trans>Merge with existing transactions</Trans>
                      </CheckboxToggle>
                    )}
                    {effectiveReconcile && (
                      <CheckboxToggle
                        id="form_reimport_deleted_csv"
                        checked={reimportDeleted}
                        onChange={setReimportDeleted}
                      >
                        <Trans>Reimport deleted transactions</Trans>
                      </CheckboxToggle>
                    )}
                  </View>
                )}

                <View style={{ flex: 1 }} />

                <View style={{ marginRight: 10, gap: 5 }}>
                  <SectionLabel title={t('AMOUNT OPTIONS')} />
                  <CheckboxToggle
                    id="form_flip"
                    checked={flipAmount}
                    onChange={setFlipAmount}
                  >
                    <Trans>Flip amount</Trans>
                  </CheckboxToggle>
                  <MultiplierOption
                    multiplierEnabled={multiplierEnabled}
                    multiplierAmount={multiplierAmount}
                    onToggle={() => {
                      setMultiplierEnabled(!multiplierEnabled);
                      setMultiplierAmount('');
                    }}
                    onChangeAmount={onMultiplierChange}
                  />
                  {filetype === 'csv' && (
                    <>
                      <LabeledCheckbox
                        id="form_split"
                        checked={splitMode}
                        onChange={() => {
                          onSplitMode();
                        }}
                      >
                        <Trans>
                          Split amount into separate inflow/outflow columns
                        </Trans>
                      </LabeledCheckbox>
                      <InOutOption
                        inOutMode={inOutMode}
                        outValue={outValue}
                        onToggle={() => {
                          setInOutMode(!inOutMode);
                        }}
                        onChangeText={setOutValue}
                      />
                    </>
                  )}
                </View>
              </SpaceBetween>
            </View>
          )}

          <View style={{ flexDirection: 'row', marginTop: 5 }}>
            {/*Submit Button */}
            <View
              style={{
                alignSelf: 'flex-end',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '1em',
              }}
            >
              {(() => {
                const count = transactions?.filter(
                  trans =>
                    !trans.isMatchedTransaction &&
                    trans.selected &&
                    !trans.tombstone &&
                    (!routingRequired ||
                      !!(
                        sourceField &&
                        accountRoutes[
                          String(trans[sourceField] ?? '').trim()
                        ] &&
                        accountRoutes[
                          String(trans[sourceField] ?? '').trim()
                        ] !== 'skip'
                      )),
                ).length;

                return (
                  <ButtonWithLoading
                    variant="primary"
                    autoFocus
                    isDisabled={
                      count === 0 || hasUnresolvedRoutes || isPreviewing
                    }
                    isLoading={loadingState === 'importing'}
                    onPress={() => {
                      void onImport(() => state.close());
                    }}
                  >
                    <Trans count={count}>Import {{ count }} transactions</Trans>
                  </ButtonWithLoading>
                );
              })()}
            </View>
          </View>
        </>
      )}
    </Modal>
  );
}

function getParseOptions(fileType: string, options: ParseFileOptions = {}) {
  if (fileType === 'csv') {
    const { delimiter, encoding, hasHeaderRow, skipStartLines, skipEndLines } =
      options;
    return { delimiter, encoding, hasHeaderRow, skipStartLines, skipEndLines };
  }
  if (isOfxFile(fileType)) {
    const { fallbackMissingPayeeToMemo, importNotes, swapPayeeAndMemo } =
      options;
    return { fallbackMissingPayeeToMemo, importNotes, swapPayeeAndMemo };
  }
  if (fileType === 'qif') {
    const { importNotes, swapPayeeAndMemo } = options;
    return { importNotes, swapPayeeAndMemo };
  }
  if (isCamtFile(fileType)) {
    const { importNotes, swapPayeeAndMemo } = options;
    return { importNotes, swapPayeeAndMemo };
  }
  const { importNotes } = options;
  return { importNotes };
}

function getSwapOption(
  fileType: string,
  ofxSwapPayeeAndMemo: boolean,
  qifSwapPayeeAndMemo: boolean,
  camtSwapPayeeAndMemo: boolean,
) {
  if (isOfxFile(fileType)) {
    return ofxSwapPayeeAndMemo;
  }

  if (fileType === 'qif') {
    return qifSwapPayeeAndMemo;
  }

  if (isCamtFile(fileType)) {
    return camtSwapPayeeAndMemo;
  }

  return false;
}

function isOfxFile(fileType: string) {
  return fileType === 'ofx' || fileType === 'qfx';
}

function isCamtFile(fileType: string) {
  return fileType === 'xml';
}
