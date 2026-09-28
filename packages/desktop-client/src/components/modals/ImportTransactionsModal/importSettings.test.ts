import {
  areCsvMappingsCompatible,
  getCsvImportProfile,
  getCsvImportProfileKey,
} from './importSettings';

describe('saved CSV import settings', () => {
  it('loads a saved profile for the selected account', () => {
    const profile = {
      columns: ['Дата операции', 'Описание', 'Сообщение'],
      mappings: {
        date: 'Дата операции',
        payee: 'Описание',
        notes: ['Описание', 'Сообщение'],
        amount: null,
        account: null,
        inOut: null,
        category: null,
        outflow: null,
        inflow: null,
      },
      dateFormat: 'dd mm yyyy',
      delimiter: ';',
      encoding: 'utf-8',
      hasHeaderRow: true,
      skipStartLines: 0,
      skipEndLines: 0,
      inOutMode: false,
      outValue: '',
      flipAmount: false,
      importNotes: true,
      autoExcludePairs: true,
      clearOnImport: true,
      reconcile: true,
      reimportDeleted: true,
      multiplierAmount: '',
    };
    const prefs = {
      [getCsvImportProfileKey('account-1')]: JSON.stringify(profile),
    };

    expect(getCsvImportProfile(prefs, 'account-1')).toEqual(profile);
    expect(getCsvImportProfile(prefs, 'account-2')).toBeNull();
  });

  it('does not apply malformed saved settings', () => {
    expect(
      getCsvImportProfile(
        { [getCsvImportProfileKey(undefined)]: '{invalid' },
        undefined,
      ),
    ).toBeNull();
  });

  it('offers a previously imported CSV mapping for editing', () => {
    const prefs = {
      'csv-mappings-account-1': JSON.stringify({
        date: 'Дата',
        amount: 'Сумма',
        payee: 'Описание',
        notes: ['Описание', 'Сообщение'],
        account: 'Имя счёта',
      }),
      'parse-date-account-1-csv': 'dd mm yyyy',
      'csv-delimiter-account-1': ';',
    };

    expect(getCsvImportProfile(prefs, 'account-1')).toMatchObject({
      columns: ['Дата', 'Сумма', 'Описание', 'Сообщение', 'Имя счёта'],
      dateFormat: 'dd mm yyyy',
      delimiter: ';',
      mappings: { notes: ['Описание', 'Сообщение'] },
      multiplierAmount: '',
    });
  });

  it('does not reuse column mappings for an unrelated file format', () => {
    const mappings = {
      date: 'Дата',
      amount: 'Сумма',
      payee: 'Описание',
      notes: ['Сообщение', 'Метка'],
      account: null,
      inOut: null,
      category: null,
      outflow: null,
      inflow: null,
    };
    expect(
      areCsvMappingsCompatible(mappings, [
        'Дата',
        'Сумма',
        'Описание',
        'Сообщение',
        'Метка',
      ]),
    ).toBe(true);
    expect(
      areCsvMappingsCompatible(mappings, ['Date', 'Amount', 'Payee']),
    ).toBe(false);
  });
});
