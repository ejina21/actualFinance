# Russian Bank Statement Import Guidance

## Purpose

Help a person who keeps a budget in Actual identify the bank behind a local account, find reliable instructions when they need them, and import a supported statement file without confusing file import with live bank sync. The initial bank list is T-Bank (formerly Tinkoff Bank), Alfa-Bank, Sberbank, Ozon Bank, and Yandex Bank. The primary scenario is a personal account, not a business current account.

Success means a person can create an account, associate one of these banks with it, return weeks later, find the account-specific help from the account screen without relying on hover, and get from that help to the existing file import flow. The help must never imply that a PDF is directly importable by Actual.

## Existing behavior and constraints

- A local account is created through `CreateLocalAccountModal`. File import starts from the account header and immediately opens a native file picker. The importer currently accepts CSV/TSV, QIF, OFX/QFX, and CAMT/XML; it does not accept PDF.
- `AccountEntity.bank` is the foreign key for an existing linked-bank record and drives bank sync indicators and actions. It must not be reused for a manually selected Russian bank.
- Account-scoped import settings already live in synced preferences, including CSV mappings. A new `manual-bank-${accountId}` preference can store the selected bank identifier without a database migration and will follow the budget across devices.
- The current mobile account page has no file import entry point, and the import preview is a fixed-width desktop modal. This project adds mobile-accessible guidance and a clear route to a wide-screen import; redesigning the preview for narrow screens is outside this change.
- The working tree contains unrelated documentation and local-launch edits. The implementation must preserve them.

## Chosen approach

Use an optional, separate bank association and an account-level help action. Keep foreign bank sync code and stored links intact, but hide its discovery and setup controls in this local fork. Do not create a new bank-connection API or try to use business APIs for personal accounts.

This is preferable to repurposing `AccountEntity.bank`, which would make local accounts look linked, and to a tooltip-only icon, which would hide the instructions from touch and keyboard users. A full PDF parsing system is deferred until representative, redacted statements are available; PDF layouts vary and a parser that silently drops transactions would undermine report accuracy.

## Account creation and bank association

- Add an optional `Bank` selector to the local-account form with the five named banks plus `Other / not listed`. Leaving it blank remains valid for cash and other nonbank accounts. The selection does not change the account name, type, balance, or budget status.
- Store a stable identifier, not display text, in `manual-bank-${accountId}` after account creation succeeds. Valid identifiers are `tbank`, `alfabank`, `sberbank`, `ozon`, and `yandex`. Missing, blank, and unrecognized values render as an unselected bank.
- Provide an edit action on the account screen or account menu so an existing local account can gain, change, or remove the association. The selection is a label for guidance only; changing it does not rewrite transactions or any import settings.
- When saving the association fails after the account itself is created, keep the account, show a clear error, and allow the person to set the bank later. Do not silently claim that the bank was saved.
- Do not show the selector for an existing foreign-linked account; preserve its present connection and sync status.

## Import and help experience

- On an open, local desktop account, place a visible `How to import` action beside the existing `Import` action. The label may be paired with a question-mark icon, but it must be readable without hover. Its disclosure shows the selected bank name, concise bank-specific export steps, accepted formats, and a primary `Choose file` action that invokes the existing file picker and import preview.
- The same help is reachable from the account menu, so it is findable after the first import and when the header is crowded. If no bank is selected, the help first offers the bank selector and generic Actual import guidance.
- On narrow/mobile screens, provide a tap target from the account page or account menu with the same export instructions. Explicitly direct the person to open the account on a wide screen for the current import preview; do not display a file-pick action that leads into the unusable fixed-width modal.
- The help remains available after importing and when a file is rejected. The normal account `Import` action and keyboard shortcut continue to work.
- The instruction catalog lives in one UI module keyed by the stable bank identifiers. Copy uses the app's translation mechanism. The text is short enough for the disclosure and includes an official bank help link when a relevant source exists. Do not present a business-account API or business statement export as a personal-account instruction.

## Instruction content and supported files

- Start with the general rule: Actual imports CSV/TSV, QIF, OFX/QFX, and CAMT/XML; it does not import PDF. Prefer a transaction export in a supported format. CSV import requires mapping date, payee/description, and amount; a positive amount is income and a negative amount is expense, subject to the importer's sign-flip control.
- T-Bank: direct the user to the desktop account's `Operations` page, select the date range and products, then use `Share` to export all operations. Tell them to choose CSV if it is offered. Do not assert that CSV is always present, because the bank's help page does not enumerate the available formats.
- Alfa-Bank: point to the personal card account's `Certificates and statements` area. The bank confirms PDF statements, but no compatible tabular format for personal accounts was verified. Show the PDF limitation clearly.
- Sberbank: point to the personal-account statement area in SberBank Online. A third-party Sberbank PDF/CSV-to-Actual utility exists, but must be labeled as community software and not treated as a built-in import route or given access to bank credentials.
- Ozon Bank: direct the user to request an account-movement statement in the app or support. The available machine-readable formats are unverified. Do not invent menu paths or formats.
- Yandex Bank: direct the user to Yandex Pay `Profile → Certificates → Contract statement`, select the product and period. The machine-readable format is unverified. Do not claim PDF is importable.
- For a PDF-only result, offer two honest next steps: request a supported transaction export from the bank, or enter the needed transactions manually. A future offline PDF converter requires test statements from each bank and explicit verification against statement totals.

## Hiding foreign bank sync

- Hide `Bank Sync` from wide and narrow navigation, the create-account chooser, setup/link actions for unlinked local accounts, the introductory tour, and setup shortcuts/settings that would otherwise invite a new foreign connection. Give the visibility policy one named flag or helper so it is easy to reverse without deleting integrations.
- Keep provider code, routes, credentials, stored links, and core sync behavior unchanged. Existing linked accounts must still show their sync state and keep their existing sync/unlink actions; the project must not strand a prior connection.
- The help distinguishes `budget sync between devices` from `importing bank statements`; hiding the bank-sync setup must not hide or disable server-based budget sync.

## Error handling and financial correctness

- Never accept a PDF into the existing importer or convert it silently. If the person selects an unsupported file, explain the accepted formats before any import mutation.
- Reuse Actual's import preview, field mapping, duplicate detection, and reconciliation. The help reminds the user to inspect the preview and compare the resulting balance with the bank statement.
- Keep transfers between the person's accounts as transfers during categorization so report totals do not count both sides as income and expense. Bank selection has no effect on category or transfer logic.
- The instructions should state when a claim is uncertain and link to its source; they should not promise an automatic bank connection.

## Verification and acceptance

- Focused tests cover optional/unknown bank values, persisted selection and edits, help lookup for all five banks, unsupported PDF behavior, and visibility of setup actions versus existing linked-account controls.
- Exercise creation and import on a wide screen, help discovery on a narrow screen, keyboard access and focus order, Russian text fit, and light/dark/midnight themes. Run root `yarn typecheck` and focused frontend tests.
- Acceptance requires that a new or existing local account can select a bank, rediscover bank-specific guidance later, and use the current file import path when it has a supported statement. PDF-only bank statements remain explicitly identified as unsupported until a verified conversion path exists.

## Source material for guidance

Reviewed on 2026-09-25. Bank interface labels and export formats may change; the in-product copy should be conservative and link to these sources where useful.

- Actual file import: https://actualbudget.org/docs/transactions/importing/
- T-Bank personal transaction export: https://www.tbank.ru/bank/help/debit-cards/tinkoff-black/get-statement/reference/
- Alfa-Bank personal card statements: https://alfabank.ru/help/t/retail/debitcards/alfacard/kak-polzovatsya-kartoi/kak-poluchit-spravku-ili-vipisku-po-debetovoi-karte/
- Sberbank community PDF/CSV importer for Actual: https://github.com/rvboris/sbertoactual
- Ozon Bank statement request confirmed by its support response: https://www-1.banki.ru/services/questions-answers/question/1036924/
- Yandex Pay statement help: https://pay.yandex.ru/help/savings/spravka-po-operatsiyam
