import { getManualBank } from './banks';

export const ACCEPTED_IMPORT_EXTENSIONS = [
  'csv',
  'tsv',
  'qif',
  'ofx',
  'qfx',
  'xml',
] as const;

export function isSupportedImportFilename(filename: string): boolean {
  const extension = filename.split('.').at(-1)?.toLowerCase();
  return ACCEPTED_IMPORT_EXTENSIONS.some(accepted => accepted === extension);
}

type ImportInstructions = {
  steps: readonly string[];
  sourceUrl?: string;
  sourceLabel?: string;
};

const genericInstructions: ImportInstructions = {
  steps: [
    'Find an export of your transactions in CSV, TSV, QIF, OFX, QFX, or CAMT/XML.',
    'Choose the account and date range, then download the file.',
  ],
};

const bankInstructions: Record<string, ImportInstructions> = {
  tbank: {
    steps: [
      'Open Operations in the T-Bank web account.',
      'Select the date range and products, then choose Share to export all operations.',
      'If CSV is offered, choose it. Check the downloaded format before importing.',
    ],
    sourceUrl:
      'https://www.tbank.ru/bank/help/debit-cards/tinkoff-black/get-statement/reference/',
    sourceLabel: 'T-Bank help',
  },
  alfabank: {
    steps: [
      'Open Certificates and statements for your card in Alfa-Bank.',
      'The confirmed personal statement format is PDF. Ask the bank for a supported transaction export, or enter the needed transactions manually.',
    ],
    sourceUrl:
      'https://alfabank.ru/help/t/retail/debitcards/alfacard/kak-polzovatsya-kartoi/kak-poluchit-spravku-ili-vipisku-po-debetovoi-karte/',
    sourceLabel: 'Alfa-Bank help',
  },
  sberbank: {
    steps: [
      'Find a statement for the account and period in SberBank Online.',
      'If only PDF is available, request a supported transaction export or enter the needed transactions manually.',
      'A community converter exists, but it is separate software. Do not give it your bank login.',
    ],
    sourceUrl: 'https://github.com/rvboris/sbertoactual',
    sourceLabel: 'Community converter',
  },
  ozon: {
    steps: [
      'Request an account-movement statement in Ozon Bank or through its support.',
      'Check which format is provided. A compatible machine-readable format for personal accounts is not confirmed.',
    ],
    sourceUrl:
      'https://www-1.banki.ru/services/questions-answers/question/1036924/',
    sourceLabel: 'Statement request information',
  },
  yandex: {
    steps: [
      'In Yandex Pay, open Profile → Certificates → Contract statement.',
      'Select the product and period, then check the downloaded file format before importing.',
    ],
    sourceUrl: 'https://pay.yandex.ru/help/savings/spravka-po-operatsiyam',
    sourceLabel: 'Yandex Pay help',
  },
};

export function getImportInstructions(
  bankId: string | null | undefined,
): ImportInstructions {
  const bank = getManualBank(bankId);
  return bank ? bankInstructions[bank.id] : genericInstructions;
}
