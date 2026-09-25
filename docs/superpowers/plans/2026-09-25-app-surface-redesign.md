# App Surface Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Carry the approved Coinest-inspired Actual visual language from the finance summary across the complete web and desktop interface, including narrow-screen views, without losing any existing workflow.

**Architecture:** Reuse the semantic theme roles and surface styles established by the finance-summary foundation plan. Update shared layout and navigation before individual pages; keep data queries and business logic in their existing owners. Add a real Actual-backed trend to Overview, then restyle account, planning, report, schedule, settings, and mobile surfaces in small, independently reviewable groups.

**Tech Stack:** React, TypeScript, Emotion, Actual semantic CSS theme tokens, Vitest, Playwright, Linux Docker VRT.

**Spec:** `docs/superpowers/specs/2026-09-25-finance-summary-redesign-design.md`

## Global Constraints

- "Actual transactions, accounts, and category groups provide all live figures. The workbook is a layout and calculation reference, not a data source or a required upload."
- "New product text is translatable and has Russian translations. The Russian interface displays Russian labels throughout the redesigned surfaces."
- "Amounts use Actual's currency formatter, tabular numerals, privacy masking, and existing theme semantics."
- "Dense transaction and budget tables remain efficient for routine work: fixed or sticky labels where useful, aligned amounts, visible focus, full keyboard access, and no decorative loss of information."
- Preserve all account, transaction, planning, report, schedule, import, and settings commands, their route destinations, and desktop/mobile access.
- Run Yarn from the repository root. Read `running-vrts` before screenshot changes; generate changed snapshots only in Linux Docker. Never skip commit hooks; use `[AI]` on every commit.

## Review Focus

1. A visually collapsed sidebar must still expose every account and current balance by keyboard; Task 2 exercises this.
2. A long payee/category name and negative amount must remain readable and aligned at narrow width; Task 3 exercises this.
3. A dashboard with no transactions must not show a fabricated trend; Task 1 exercises this.
4. Report filters and date selection must remain operable after card/layout styling; Task 4 exercises this.
5. Mobile navigation must still reach accounts, schedules, reports, and settings with a 390-pixel viewport; Task 5 exercises this.

## File map

- `packages/desktop-client/src/components/overview/{OverviewPage,OverviewData,FinanceTrendChart}.tsx/ts`: real summary cards and trend.
- `packages/desktop-client/src/components/{Page,sidebar/redesign/SidebarRedesign,sidebar/redesign/NavRow}.tsx`: shared page shell, keyboard-visible navigation, and account tree presentation.
- `packages/desktop-client/src/components/{accounts/Account,accounts/Header,transactions/TransactionsTable,budget/BudgetTable,budget/expense-view/BudgetDisplay}.tsx`: dense working views with common spacing and amount hierarchy.
- `packages/desktop-client/src/components/{reports/ReportsDashboardRouter,reports/overview.scss,schedules/SchedulesTable,settings/UI}.tsx/scss`: report and secondary page styling.
- `packages/desktop-client/src/components/mobile/{MobileNavTabs,accounts/AccountsPage,transactions/TransactionList,budget/BudgetPage}.tsx`: narrow-screen navigation and legibility.
- `packages/desktop-client/e2e/overview.test.ts` and focused surface tests: interaction and theme screenshots; local Russian catalog for new copy.

---

### Task 1: Actual-Backed Overview

**Files:** Modify `overview/OverviewPage.tsx`, `overview/OverviewData.ts`, `overview/OverviewData.test.ts`, `e2e/overview.test.ts`; create `overview/FinanceTrendChart.tsx`.

**Interfaces:** Export `buildMonthlyTrend(summary: CashFlowSummary): Array<{ month: string; inflow: number; outflow: number }>` from `OverviewData.ts`, mapping the summary's year/month `columnTotals` without changing its inclusion rules. `FinanceTrendChart` receives those points and a loading/empty state; it does not fetch data.

- [ ] Write failing unit tests for a three-month series, a month with zero activity, a refund, and no transactions. For example:

```ts
const result = summarizeCashFlow(
  [],
  [],
  resolveSummaryPeriod({
    kind: 'year',
    year: 2026,
  }),
);
expect(buildMonthlyTrend(result).slice(0, 3)).toEqual([
  { month: '2026-01', inflow: 0, outflow: 0 },
  { month: '2026-02', inflow: 0, outflow: 0 },
  { month: '2026-03', inflow: 0, outflow: 0 },
]);
```

- [ ] Run `node .yarn/releases/yarn-4.17.1.cjs workspace @actual-app/web test src/components/overview/OverviewData.test.ts` and confirm failure. Implement the pure mapping of `CashFlowSummary.columnTotals`. Query only the displayed months and pass those Actual rows through the Budget summary's `summarizeCashFlow` so transfers and off-budget entries follow the same rules.
- [ ] Restyle real balance, budget progress, recent activity, and the new trend into the approved card grid. Use `FinancialText`, `PrivacyFilter`, readable chart labels, and an honest empty state. Do not add fake saving plans or unrelated Coinest controls.
- [ ] Update the e2e test to assert the real trend or empty state, then run focused tests, typecheck, and changed desktop/narrow VRTs in Linux Docker. Commit as `[AI] Refresh overview with real finance trend`.

### Task 2: Navigation and Page Shell

**Files:** Modify `Page.tsx`, `sidebar/redesign/SidebarRedesign.tsx`, `sidebar/redesign/NavRow.tsx`, `sidebar/redesign/SidebarHeader.tsx`, `sidebar/redesign/AccountRow.tsx`, `sidebar/redesign/PrimaryNav.tsx`, `sidebar/redesign/PrimaryNav.test.tsx`, and its focused e2e navigation coverage.

**Interfaces:** Existing navigation routes and account tree state remain unchanged. Styling uses the Task 1 foundation tokens. `NavRow` retains `title`, `Icon`, and `to`; active, hover, and `:focus-visible` states remain distinct in all themes.

- [ ] Run the existing `PrimaryNav.test.tsx` and overview/navigation e2e tests as the behavior baseline. Record every route, keyboard action, account balance, resize affordance, search, and sync indicator they exercise.
- [ ] Apply the lighter two-level visual hierarchy to the existing sidebar without removing those behaviors. Update `Page` headings and content padding consistently. Add focused interaction coverage only if an existing navigation behavior lacks a meaningful test.
- [ ] Verify collapsed and expanded widths, long names, keyboard focus, light/dark/midnight contrast, and pointer hit targets. Run targeted tests, typecheck, lint, and focused Linux VRTs. Commit as `[AI] Align navigation and page shell with finance design`.

### Task 3: Daily Money Workflows

**Files:** Modify `accounts/Account.tsx`, `accounts/Header.tsx`, `transactions/TransactionsTable.tsx`, `budget/BudgetTable.tsx`, `budget/expense-view/BudgetDisplay.tsx`, and focused account/budget e2e tests.

**Interfaces:** Keep existing transaction editing, reconcile, bank-import help, category editing, planning formulas, and mode-switch behavior. Styling changes may add reusable class names or surface wrappers, but they must not rewrite transaction or budget calculation code.

- [ ] Run the existing account, transaction, bank-import-help, and Budget e2e tests as the behavior baseline. Add a focused narrow-width fixture with a long payee and negative amount because clipping/alignment is a concrete regression risk.
- [ ] Apply consistent headers, filters, table density, sticky money columns/labels where feasible, and the shared card/control styles. Keep primary actions visually distinct from secondary controls without changing data handlers.
- [ ] Verify click and keyboard editing, reconciliation controls, account balance, Russian labels, and responsive horizontal scrolling. Run focused tests, typecheck, lint, and scoped Linux VRTs in all three themes. Commit as `[AI] Restyle account and budget working views`.

### Task 4: Reports, Schedules, and Settings

**Files:** Modify `reports/ReportsDashboardRouter.tsx`, `reports/overview.scss`, `reports/ReportCard.tsx`, `schedules/SchedulesTable.tsx`, `settings/UI.tsx`, and focused e2e tests for each route. Add local Russian translations only for changed copy.

**Interfaces:** Report definitions, date filtering, saved dashboards, schedule actions, and every settings form keep their existing handlers and persisted values. Cards and toolbars consume the common theme roles and spacing.

- [ ] Run the existing report, schedule, and settings route tests as the behavior baseline. Add a focused date-range interaction only if the existing report tests do not cover changing and retaining a selected range.
- [ ] Apply the shared page header, card, input, and table presentation to these routes. Preserve chart semantics, report filters, schedule warnings, and settings labels.
- [ ] Verify empty/loading/error states, long labels, keyboard focus, Russian copy, and light/dark/midnight rendering. Run focused tests, typecheck, lint, and scoped Linux VRTs. Commit as `[AI] Restyle reports schedules and settings`.

### Task 5: Mobile Completion and Whole-App Gate

**Files:** Modify `mobile/MobileNavTabs.tsx`, `mobile/accounts/AccountsPage.tsx`, `mobile/transactions/TransactionList.tsx`, `mobile/budget/BudgetPage.tsx`, and focused mobile e2e tests; update `DESIGN.md` only if execution reveals a documented design decision that changed.

**Interfaces:** Existing mobile routes and action handlers remain intact. The new narrow-screen surface styles use shared theme tokens and maintain at least 40-pixel touch targets.

- [ ] Run the existing mobile navigation, Budget, account, and transaction tests at 390 pixels as the behavior baseline. Add focused coverage for a missing destination, clipped text, or exposed private amount only where the baseline does not already test it.
- [ ] Align headers, bottom navigation, account rows, and transaction cards with the approved visual system. Do not hide destinations to achieve the reference's simplicity.
- [ ] Run the focused e2e suite, root typecheck and lint, and a browser build. Generate and inspect only affected Linux Docker snapshots for all three themes and one narrow viewport. Run the full test suite once; report any environmental native-binary failure separately from product failures. Commit as `[AI] Complete responsive finance interface redesign`.

## Completion gate

Review the complete branch against the spec and verify all original routes/actions still work. Check the app with the demo budget, then a disposable budget containing transfers, refunds, splits, off-budget accounts, and Russian category names. Do not change the user's live budget data or upload the private workbook. The final handoff distinguishes completed UI coverage from any environment-limited tests.
