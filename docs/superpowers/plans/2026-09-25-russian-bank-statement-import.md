# Russian Bank Statement Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a local Actual account remember one of five Russian banks, show accurate Russian-language statement import guidance from that account, and hide foreign bank-sync setup in this fork.

**Architecture:** Store an optional bank code in an account-scoped synced preference, separate from the existing `AccountEntity.bank` sync link. A shared help modal reads that code and the five-bank instruction catalog; desktop can invoke the current file importer, while narrow screens show guidance and the wide-screen limitation. A single visibility constant suppresses foreign sync discovery while keeping previously linked accounts operational.

**Tech Stack:** React, TypeScript, Redux Toolkit, synced preferences, react-i18next, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-25-russian-bank-statement-import-design.md`

## Global Constraints

- Personal accounts only; do not present business APIs as personal transaction feeds.
- Keep `AccountEntity.bank` exclusively for the existing foreign bank-sync relationship.
- All new user-facing text must display in Russian in the running app. Add every source key to `packages/desktop-client/local-russian/en.json` and a complete translation to `ru.json`.
- Use existing component-library controls and semantic theme tokens. Help must be operable without hover and with keyboard or touch.
- PDF is unsupported by the importer; never offer a PDF upload path or claim automatic Russian bank sync.
- Keep existing linked foreign accounts usable and keep budget sync between devices unchanged.
- Preserve unrelated working-tree changes. Run every Yarn command from the repository root through the checked-in Yarn release if the `yarn` shim is unavailable.

## Review Focus

1. An existing linked foreign account must retain its sync and unlink actions when new-link setup is hidden — pin with a focused visibility test in Task 3.
2. An unknown or removed bank code must show generic guidance and remain editable — pin with a catalog test in Task 1.
3. A failure to save the bank preference after account creation must leave the account intact and tell the user how to set the bank later — pin with a form test in Task 1.
4. Mobile help must not open the current 800 px import modal — pin with a narrow-viewport interaction test in Task 2.
5. Choosing a PDF must not reach an import mutation — pin with a file-acceptance test in Task 2.

---

### Task 1: Persist the optional bank choice

**Files:**

- Modify: `packages/loot-core/src/types/prefs.ts`
- Create: `packages/desktop-client/src/components/manual-bank/banks.ts`
- Create: `packages/desktop-client/src/components/manual-bank/banks.test.ts`
- Modify: `packages/desktop-client/src/components/modals/CreateLocalAccountModal.tsx`
- Modify: `packages/desktop-client/local-russian/en.json`
- Modify: `packages/desktop-client/local-russian/ru.json`
- Test: `packages/desktop-client/src/components/modals/CreateLocalAccountModal.test.tsx`

**Interfaces:**

- Produces `type ManualBankId = 'tbank' | 'alfabank' | 'sberbank' | 'ozon' | 'yandex'` and `getManualBank(id: string | null | undefined): ManualBank | null` in `banks.ts`.
- Produces preference key `manual-bank-${accountId}` whose value is a bank ID or `''`.
- Task 2 consumes the bank catalog and preference key; Task 3 does not modify them.

- [ ] **Step 1: Write failing tests for lookup, missing values, and form save failure.** The catalog test must assert all five IDs, `null` for `undefined`, `''`, and an unknown code. The form test must mock account creation and `saveSyncedPrefs` failure and assert that the created account is retained and an error is announced.

```ts
expect(MANUAL_BANKS.map(bank => bank.id)).toEqual([
  'tbank',
  'alfabank',
  'sberbank',
  'ozon',
  'yandex',
]);
expect(getManualBank('unknown')).toBeNull();
expect(getManualBank('')).toBeNull();
```

- [ ] **Step 2: Run the focused tests and confirm they fail for the missing catalog/field.** Run from root: `node .yarn/releases/yarn-4.17.1.cjs workspace @actual-app/web test src/components/manual-bank/banks.test.ts src/components/modals/CreateLocalAccountModal.test.tsx`.
- [ ] **Step 3: Implement stable IDs and a bank selector.** Add `` `manual-bank-${string}` `` to `SyncedPrefs`. Export the bank list and lookup from `banks.ts`. Add an optional `Select` to the creation form. After `createAccount.mutateAsync` resolves, dispatch `saveSyncedPrefs({ prefs: { [\`manual-bank-${id}\`]: selectedBank } })`and call`.unwrap()` before closing. If this preference save fails, show a Russian-translated error that the account was created but the bank must be set later; navigate to that created account. Keep the existing balance/name validation.
- [ ] **Step 4: Add exact source and Russian translation keys for the form and error.** Include `Bank`, `Not selected`, the five bank names, and the save-failure message; use `t` or `Trans` in UI code. Ensure the `en.json` and `ru.json` catalogs have the same new keys.
- [ ] **Step 5: Re-run the focused tests and `node packages/desktop-client/local-russian.test.mjs`.** Both must pass.
- [ ] **Step 6: Commit only Task 1 files with `[AI]` prefix and active hooks.**

### Task 2: Add bank-specific help and import entry points

**Files:**

- Create: `packages/desktop-client/src/components/manual-bank/instructions.ts`
- Create: `packages/desktop-client/src/components/manual-bank/instructions.test.ts`
- Create: `packages/desktop-client/src/components/modals/ManualBankImportHelpModal.tsx`
- Modify: `packages/desktop-client/src/modals/modalsSlice.ts`
- Modify: `packages/desktop-client/src/components/Modals.tsx`
- Modify: `packages/desktop-client/src/components/accounts/Header.tsx`
- Modify: `packages/desktop-client/src/components/accounts/Account.tsx`
- Modify: `packages/desktop-client/src/components/mobile/accounts/AccountPage.tsx`
- Modify: `packages/desktop-client/src/components/modals/AccountMenuModal.tsx`
- Modify: `packages/desktop-client/local-russian/en.json`
- Modify: `packages/desktop-client/local-russian/ru.json`
- Test: `packages/desktop-client/e2e/bank-import-help.test.ts`

**Interfaces:**

- Consumes `getManualBank` and `manual-bank-${accountId}` from Task 1.
- Produces modal `manual-bank-import-help` with `{ accountId: string; onChooseFile?: () => void }`.
- The desktop account supplies its existing `onImport` callback; mobile omits the callback.

- [ ] **Step 1: Write failing catalog and interaction tests.** Verify that each bank has export steps and a source URL when known, that PDF is listed as unsupported, and that unknown bank IDs show generic guidance. In the e2e flow, create/select a local account, open `How to import` by keyboard and on a narrow viewport, and confirm that mobile has no `Choose file` control.

```ts
for (const bank of MANUAL_BANKS) {
  expect(getImportInstructions(bank.id).steps.length).toBeGreaterThan(0);
}
expect(ACCEPTED_IMPORT_EXTENSIONS).not.toContain('pdf');
```

- [ ] **Step 2: Run focused tests and confirm the missing module or modal makes them fail.** Use root Yarn and the existing Vitest/Playwright commands; run the Playwright interaction without VRT first.
- [ ] **Step 3: Implement the instruction catalog with conservative copy.** Use the exact five bank notes and source URLs from the spec. Include the generic supported-format rule, CSV mapping guidance, preview/balance check, PDF limitation, and own-account transfer reminder. Keep bank guidance data separate from JSX.
- [ ] **Step 4: Implement the shared modal and entry points.** Read the synced bank code with `useSyncedPref`; offer an editable selector, save it through `saveSyncedPrefs` with visible failure feedback, and render the selected bank's steps. Add a visible desktop action beside `Import`, a desktop account-menu item, and a mobile account-menu or page action. The modal's desktop `Choose file` closes help then calls `onChooseFile`; mobile states that file import needs a wide screen and never calls it. Preserve the existing `Import` hotkey.
- [ ] **Step 5: Make unsupported files explicit without changing the importer.** Keep the current file filter free of PDF; if the browser file dialog returns an unsupported extension, show the help/error message and do not dispatch `import-transactions`. Test that path. Do not parse or mutate PDF content.
- [ ] **Step 6: Add all new translation keys to `en.json` and fully translated values to `ru.json`; run the catalog test, focused unit tests, typecheck, and non-VRT Playwright flow.**
- [ ] **Step 7: Add a tight VRT assertion on the help modal to the e2e test.** Generate only this test's three Linux theme snapshots in Docker as instructed by the `running-vrts` skill. If Docker is unavailable, retain the e2e test and report the missing snapshots for CI generation.
- [ ] **Step 8: Commit only Task 2 files and any generated Linux snapshots with `[AI]` prefix and active hooks.**

### Task 3: Hide new foreign sync setup and finish the user-facing change

**Files:**

- Create: `packages/desktop-client/src/components/banksync/visibility.ts`
- Create: `packages/desktop-client/src/components/banksync/visibility.test.ts`
- Modify: `packages/desktop-client/src/components/modals/CreateAccountModal.tsx`
- Modify: `packages/desktop-client/src/components/sidebar/PrimaryButtons.tsx`
- Modify: `packages/desktop-client/src/components/sidebar/redesign/PrimaryNav.tsx`
- Modify: `packages/desktop-client/src/components/mobile/MobileNavTabs.tsx`
- Modify: `packages/desktop-client/src/components/accounts/Header.tsx`
- Modify: `packages/desktop-client/src/components/tour/steps.tsx`
- Modify: `packages/desktop-client/src/components/modals/KeyboardShortcutModal.tsx`
- Modify: `packages/desktop-client/src/components/settings/Experimental.tsx`
- Create: `upcoming-release-notes/russian-bank-statement-guidance.md`

**Interfaces:**

- Produces `isForeignBankSyncSetupVisible = false` and `canShowExistingBankSync(account)` so discovery is suppressed but linked-account controls remain.
- Task 2's help and import actions stay independent of this policy.

- [ ] **Step 1: Write failing visibility tests.** Assert that unlinked accounts expose no new-link setup and linked accounts retain sync/unlink controls; assert that normal budget/server sync remains available.

```ts
expect(canShowExistingBankSync({ account_id: 'linked' })).toBe(true);
expect(canShowExistingBankSync({ account_id: null })).toBe(false);
expect(isForeignBankSyncSetupVisible).toBe(false);
```

- [ ] **Step 2: Run the focused test and confirm failure before implementation.**
- [ ] **Step 3: Apply the single visibility policy.** Remove foreign setup navigation, tours, shortcut/setup prompts, and creation choices for unlinked accounts on both sidebar variants and mobile tabs. Make `CreateAccountModal` proceed to local creation when no `upgradingAccountId` is supplied. Retain routes and actions for previously linked accounts. Do not remove server budget sync.
- [ ] **Step 4: Add a one-sentence Russian-facing release note per the `writing-release-notes` skill.** Choose the author from the repository's configured GitHub identity; the note's content is about choosing a bank and finding statement import help.
- [ ] **Step 5: Run root `yarn typecheck`, focused frontend tests, Russian catalog coverage, and relevant e2e flows.** Run the Impeccable detector once on changed UI files. Verify no new text falls back to English and no unintentional change appears in light, dark, or midnight themes.
- [ ] **Step 6: Commit only Task 3 files with `[AI]` prefix and active hooks.** Recheck the complete diff against the spec and preserve all unrelated files.

## Final review and handoff

- Re-read the spec against Tasks 1–3 and the resulting diff. Check every Review Focus case with test evidence. Run `git status --short` and report any unchanged pre-existing modifications separately.
- Use a fresh read-only reviewer only if the active instructions authorize delegation; otherwise perform a second in-thread pass. Apply one focused fix pass for any material finding and re-run relevant verification.
- Report what works, the PDF and narrow-screen limitations, test commands/results, commit IDs, and the exact workspace or branch containing the change.
