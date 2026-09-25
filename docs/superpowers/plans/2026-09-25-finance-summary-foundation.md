# Finance Summary and Visual Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reconcilable Russian **Итого** Budget view with month, year, custom-range, and month-comparison modes while establishing the Coinest-inspired visual foundation.

**Architecture:** Pure period, cash-flow, account-movement, and comparison functions own financial arithmetic. Live Actual queries supply transactions, accounts, and categories to those functions; React components only select periods and render results. Shared semantic tokens establish the visual language without changing Actual's budgeting engines.

**Tech Stack:** TypeScript, React, Actual AQL/live queries, Emotion, semantic CSS theme tokens, Vitest, Playwright, Linux Docker VRT.

**Spec:** `docs/superpowers/specs/2026-09-25-finance-summary-redesign-design.md`

## Global Constraints

- "Actual transactions, accounts, and category groups provide all live figures. The workbook is a layout and calculation reference, not a data source or a required upload."
- "New product text is translatable and has Russian translations. The Russian interface displays Russian labels throughout the redesigned surfaces."
- "Amounts use Actual's currency formatter, tabular numerals, privacy masking, and existing theme semantics."
- "Selecting it changes only presentation; it never changes `budgetType`, allocations, transactions, or reconciliation state."
- "All calculations use integer minor units and reconcile group, category, and headline totals."
- Run Yarn only from the repository root; do not edit the unrelated local docs/scripts changes. Every commit starts with `[AI]`; never skip hooks.
- Before UI edits, follow the local `impeccable` context/new-work/craft-floor instructions. For screenshot coverage, follow the `running-vrts` skill and generate only changed snapshots inside Linux Docker.

## Review Focus

1. A split parent and its children must contribute the children once, not the parent plus children; Task 3 pins this.
2. A starting-balance transaction may change an account balance but must not become household income; Tasks 3 and 4 pin this.
3. A transfer between own accounts must leave household net flow unchanged while updating both account rows; Tasks 3 and 4 pin this.
4. A custom range cutting through two months must include only selected dates and still show both partial months; Task 2 pins this.
5. A comparison whose base month is zero must show an unavailable percentage and a correct absolute change; Task 5 pins this.

## File map

- `packages/component-library/src/theme.ts` and `src/themes/{light,dark,midnight}.css`: semantic hero/soft-accent roles for all themes.
- `DESIGN.md`: durable palette and component rules; regenerate its local sidecar only if this checkout uses one.
- `packages/desktop-client/src/components/budget/summary/period.ts`: validated period boundaries and display columns.
- `packages/desktop-client/src/components/budget/summary/cashFlow.ts`: one-pass income/expense aggregation by category group.
- `packages/desktop-client/src/components/budget/summary/accounts.ts`: historical opening and closing account balances and period movements.
- `packages/desktop-client/src/components/budget/summary/comparison.ts`: base-month deltas and percentage semantics.
- `packages/desktop-client/src/components/budget/summary/useFinanceSummary.ts`: live queries and loading/error state, without presentation.
- `packages/desktop-client/src/components/budget/summary/{SummaryControls,SummaryCards,SummaryTable,AccountBalanceTable,FinanceSummaryPage}.tsx`: focused presentation components.
- `packages/desktop-client/src/components/budget/expense-view/BudgetDisplay.tsx`: view selection and persistence. Remove `ExpenseView.tsx` and its aggregation after parity is proven.
- Russian and English local translation catalogs, targeted unit/e2e tests, and one plain-language release note.

---

### Task 1: Semantic Visual Foundation

**Files:** Modify `DESIGN.md`, `packages/component-library/src/theme.ts`, `packages/component-library/src/themes/light.css`, `dark.css`, and `midnight.css`; create `packages/desktop-client/src/components/budget/summary/summaryStyles.ts`.

**Interfaces:** Produce `theme.financeHeroBackground`, `theme.financeHeroText`, and `theme.financeSoftAccent` semantic tokens. `summaryStyles.ts` exports reusable card, control, and sticky-cell styles that use those tokens and existing `theme.cardBackground`, `theme.tableBorder`, and spacing tokens.

- [ ] Read the Impeccable project context once, its new-work playbook, and craft floor with network/update/telemetry disabled. Compare the Pinterest reference to the current overview and Budget VRTs. Record the approved light, dark, and midnight mappings in `DESIGN.md`.
- [ ] Add the three token keys to `theme.ts` and define each `--color-finance*` variable in all three theme CSS files. Use CSS values only in the theme files. The light hero should read as deep green with readable white text; dark and midnight values must keep the same contrast role.
- [ ] Add `summaryStyles.ts` using the shared tokens, for example:

```ts
export const summaryCardStyle = {
  backgroundColor: theme.cardBackground,
  border: `1px solid ${theme.cardBorder}`,
  borderRadius: 16,
  padding: spacing.lg,
};
```

- [ ] Regenerate the local `DESIGN.json` sidecar from `DESIGN.md` only if this checkout already uses it. Run `node .yarn/releases/yarn-4.17.1.cjs exec oxfmt --check` on changed files and `node .yarn/releases/yarn-4.17.1.cjs typecheck`. Commit only these foundation files as `[AI] Establish finance summary visual tokens`.

### Task 2: Exact Period Model

**Files:** Create `packages/desktop-client/src/components/budget/summary/period.ts` and `period.test.ts`.

**Interfaces:** Export `SummaryPeriod = { kind: 'month'; month: string } | { kind: 'year'; year: number } | { kind: 'range'; startDate: string; endDate: string }`; export `ResolvedSummaryPeriod = { startDate: string; endDate: string; columns: Array<{ key: string; label: string; startDate: string; endDate: string }> }` and `resolveSummaryPeriod(period: SummaryPeriod): ResolvedSummaryPeriod`. Month columns are days; year/range columns are months, with range boundaries clipped to the selection.

- [ ] Write failing tests for February 2028 (29 day columns), 2026 annual columns (12), a `2026-01-15` to `2026-03-03` range (three clipped month columns), invalid dates, and start after end. A representative test is:

```ts
expect(
  resolveSummaryPeriod({
    kind: 'range',
    startDate: '2026-01-15',
    endDate: '2026-03-03',
  }).columns.map(({ startDate, endDate }) => [startDate, endDate]),
).toEqual([
  ['2026-01-15', '2026-01-31'],
  ['2026-02-01', '2026-02-28'],
  ['2026-03-01', '2026-03-03'],
]);
```

- [ ] Run `node .yarn/releases/yarn-4.17.1.cjs workspace @actual-app/web test src/components/budget/summary/period.test.ts` and confirm the expected failure.
- [ ] Implement strict ISO date parsing, inclusive boundaries, and chronological columns; return a typed validation error to the UI instead of accepting an invalid range. Rerun the test and typecheck; commit as `[AI] Model finance summary periods`.

### Task 3: Cash-Flow Aggregation

**Files:** Create `packages/desktop-client/src/components/budget/summary/cashFlow.ts` and `cashFlow.test.ts`.

**Interfaces:** Export `summarizeCashFlow(rows: readonly SummaryTransaction[], groups: readonly CategoryGroupEntity[], period: ResolvedSummaryPeriod): CashFlowSummary`. `CashFlowSummary` exposes `income`, `expenses`, `netFlow`, `columnTotals: Record<string, { income: number; expenses: number }>`, group/category rows, and uncategorised income/expense rows. `SummaryTransaction` includes `id`, `date`, `amount`, `category`, `account`, `accountOffBudget`, `categoryIsIncome`, `transferId`, `isParent`, and `startingBalanceFlag`.

- [ ] Write failing hand-calculated tests for category group totals, uncategorised inflow/outflow, expense refund, income reversal, own-account transfer, off-budget account, starting balance, and split parent plus child rows. Include:

```ts
const rows = [
  {
    id: 'food-1',
    date: '2026-09-01',
    amount: -7_500,
    category: null,
    account: 'checking',
    accountOffBudget: false,
    categoryIsIncome: false,
    transferId: null,
    isParent: false,
    startingBalanceFlag: false,
  },
];
const result = summarizeCashFlow(
  rows,
  [],
  resolveSummaryPeriod({
    kind: 'month',
    month: '2026-09',
  }),
);
expect(result.expenses).toBe(7_500);
expect(result.netFlow).toBe(-7_500);
```

- [ ] Run the targeted Vitest file and confirm failure. Build category-id lookups once, skip transfer/off-budget/starting-balance/parent rows, apply signed amounts to the matching income or expense row, and sum only selected dates. Preserve negative refunds. Assert each headline equals its groups plus uncategorised row, and each period total equals its columns.
- [ ] Run the targeted test, the old `expenseData.test.ts` during migration, and typecheck. Commit as `[AI] Aggregate income and expenses for summary`.

### Task 4: Account Balance Reconciliation

**Files:** Create `packages/desktop-client/src/components/budget/summary/accounts.ts`, `accounts.test.ts`, and `useFinanceSummary.ts`.

**Interfaces:** Export `AccountAmount = { account: string; amount: number }` and `buildAccountMovement(accounts: readonly AccountEntity[], beforePeriod: readonly AccountAmount[], inPeriod: readonly SummaryTransaction[]): AccountMovement[]`; each row contains `opening`, `inflows`, `outflows`, `openingAdjustment`, `closing`, and `isOffBudget`, with `closing = opening + inflows - outflows + openingAdjustment`. `useFinanceSummary(period, comparisonMonths: readonly string[])` returns `{ cashFlow, accountMovements, comparison, isLoading, error }` from live Actual queries; the on-budget sum of `closing` supplies the headline balance.

- [ ] Write failing tests in `accounts.test.ts` for `closing = opening + inflows - outflows`, two transfer legs across accounts, an account with no activity, a closed account with historical activity, an off-budget account shown separately, and a starting-balance entry. For example:

```ts
expect(buildAccountMovement(accounts, before, within)).toContainEqual(
  expect.objectContaining({ id: 'checking', opening: 10_000, closing: 8_500 }),
);
```

- [ ] Run the targeted test and confirm failure. Implement the pure builder. Query non-parent transaction rows within the chosen range and per-account sums before the start; include transfers in account movements. Keep starting-balance entries out of household cash flow, and expose them as an opening adjustment when they fall inside a range so the closing-balance equation stays visible.
- [ ] Connect `useFinanceSummary.ts` to `useAccounts`, `useCategories`, and `useQuery`/live AQL. Follow the existing net-worth spreadsheet and `api/account-balance` cutoff behavior to cross-check a historical closing value. Query only the selected range plus pre-period aggregates, not the entire transaction history in the UI.
- [ ] Rerun targeted tests and typecheck. Commit as `[AI] Reconcile account balances in finance summary`.

### Task 5: Month Comparison Arithmetic and Controls

**Files:** Create `comparison.ts`, `comparison.test.ts`, `SummaryControls.tsx`; complete the `comparisonMonths` branch of `useFinanceSummary.ts` to read selected months independently of the primary period.

**Interfaces:** Export `compareMonthValues(base: number, current: number): { absolute: number; percent: number | null }`; `SummaryControls` accepts `period`, `baseMonth`, `compareMonths`, and callbacks for selecting/removing months. Duplicate months cannot be added. The primary period remains unchanged while comparison is open.

- [ ] Write failing tests for positive/negative changes, zero base, identical months, and duplicate selection. Representative arithmetic:

```ts
expect(compareMonthValues(0, 2_000)).toEqual({
  absolute: 2_000,
  percent: null,
});
expect(compareMonthValues(4_000, 3_000)).toEqual({
  absolute: -1_000,
  percent: -25,
});
```

- [ ] Run the targeted test and confirm failure. Implement pure comparison helpers and controls with `type="month"`/date inputs, inclusive custom dates, explicit validation, removable month chips, and Russian labels through `t`/`Trans`.
- [ ] Add an e2e interaction to `packages/desktop-client/e2e/finance-summary.test.ts`: choose a year, choose a custom range, then add two comparison months; verify headings, deltas, and that the primary period remains selected. Run the targeted Chromium test and typecheck. Commit as `[AI] Compare selected months in finance summary`.

### Task 6: Budget Summary Screen and Final Verification

**Files:** Create `SummaryCards.tsx`, `SummaryTable.tsx`, `AccountBalanceTable.tsx`, `FinanceSummaryPage.tsx`; modify `BudgetDisplay.tsx`, `packages/desktop-client/local-russian/{en,ru}.json`, `packages/desktop-client/e2e/expense-view.test.ts`; remove superseded `ExpenseView.tsx`/`expenseData.ts` only after parity tests move; create `upcoming-release-notes/finance-summary.md`.

**Interfaces:** `FinanceSummaryPage` reads `useFinanceSummary(period, comparisonMonths)` and renders period cards, cash-flow rows, comparison columns, and account rows. It is read-only. `BudgetDisplay` offers **Итого**, **Конверты**, **Отслеживание** and remembers the selected display view locally without changing the stored planning engine when **Итого** is selected.

- [ ] Extend the failing e2e test: demo Budget opens **Итого** for a fresh display preference; Month shows day columns; Year shows 12 month columns and a monthly average calculated as the year total divided by 12, including zero months; switching to **Конверты** and back preserves planned values; narrow screen keeps the controls and row labels reachable. Add privacy-mode coverage for cards and comparison numbers.
- [ ] Implement focused components with `FinancialText`, `PrivacyFilter`, semantic tokens, proper table headers, sticky labels, keyboard-operable group expansion, and explicit loading/empty/error states. Retain the existing `budgetType` values and local display preference. Move expense-only tests to the new view before removing old files.
- [ ] Regenerate i18n keys with `node .yarn/releases/yarn-4.17.1.cjs generate:i18n`, preserve English sources and complete Russian catalog entries. Add a short release note following `writing-release-notes`. Check every new Russian-visible string.
- [ ] Run focused Vitest/e2e, root typecheck and lint. Add a focused VRT for the new table/cards and generate the changed snapshots in Linux Docker following `running-vrts`; inspect desktop and narrow layouts in light, dark, and midnight. Do not regenerate unrelated snapshots.
- [ ] Compare at least one hand-calculated workbook month and annual period against equivalent Actual transactions without copying private workbook data into tests. Record any unavailable investment-return calculation in the handoff. Commit as `[AI] Add finance summary budget view`.

## Handoff to the second plan

When Task 6 passes, continue with `docs/superpowers/plans/2026-09-25-app-surface-redesign.md`. The shared tokens and Budget summary from this plan are its inputs. Neither plan authorises uploading the private workbook or changing the user's live budget data.
