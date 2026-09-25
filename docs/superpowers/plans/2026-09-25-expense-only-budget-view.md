# Expense-only Budget View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an expense-only Budget view modeled on the monthly and annual Excel summaries.

**Architecture:** Query Actual transactions by date and category with a live AQL query. A pure aggregation function constructs day/month columns and group/category totals. A Budget route wrapper switches between the two existing engines and the read-only view using a separate local display preference.

**Tech Stack:** React, TypeScript, AQL, Vitest, Playwright, Actual UI components.

**Spec:** `docs/superpowers/specs/2026-09-25-expense-only-budget-view.md`

## Global Constraints

- All yarn commands run from the repository root.
- Russian user-facing copy via `Trans`/`t` and `FinancialText` for money.
- The existing `budgetType` stays `'envelope' | 'tracking'`.
- Do not modify the unrelated existing docs/scripts worktree changes.
- Every commit message starts with `[AI]`; do not skip hooks.

## Review Focus

- Transfers paired between own accounts must contribute zero spending.
- A positive refund in an expense category must reduce the category total.
- An uncategorized outflow must appear in the total and a visible row.
- Empty periods and leap-year February must render the right number of columns.
- Switching views must preserve the stored budget engine and previously entered plans.

---

### Task 1: Expense aggregation

**Files:** Create `packages/desktop-client/src/components/budget/expense-view/expenseData.ts` and `expenseData.test.ts`.

**Interfaces:** `buildExpenseSummary(rows, categoryGroups, period, anchor)` returns columns, total, and grouped/category rows. Input row contains date, amount, category id, transfer id, account off-budget state, and category income state. Amounts are stored integer cents.

- [ ] Write tests with hand-calculated rows for group totals, refunds, transfers, off-budget transactions, uncategorized spending, empty dates, and February 2028.
- [ ] Run the targeted Vitest file and observe expected failures.
- [ ] Implement the pure aggregator with one pass over rows and category lookup maps.
- [ ] Run the targeted tests and typecheck.

### Task 2: Live expense table and controls

**Files:** Create `packages/desktop-client/src/components/budget/expense-view/ExpenseView.tsx`; modify `packages/desktop-client/src/components/FinancesApp.tsx` and `packages/loot-core/src/types/prefs.ts`; add an interaction test in `packages/desktop-client/e2e/`.

**Interfaces:** `ExpenseView` reads live query rows, derives the summary from Task 1, and renders month/year controls and collapsible category groups. `BudgetRoute` selects the view and stores `'budget.displayMode'` locally.

- [ ] Write a failing interaction test for selecting «Расходы», seeing no planning columns, and switching back without losing the budget type.
- [ ] Run the targeted Playwright test to observe the failure.
- [ ] Implement the route wrapper, query, table, navigation, responsive overflow, loading/empty/error states, and privacy formatting.
- [ ] Run the interaction test, targeted unit tests, typecheck, lint, and UI detector.
- [ ] Add a focused VRT of the expense table; generate and verify Linux snapshots using Docker.

### Task 3: Deployment and final verification

**Files:** Only changed feature and test files; preserve unrelated worktree changes.

- [ ] Run the full test suite, typecheck, lint, and browser build from the root.
- [ ] Compare a known workbook period with Actual transactions and inspect desktop/mobile rendering.
- [ ] Commit with `[AI]`, push to the user's fork `master`, rebuild the Docker instance on port 3004, and verify the route with the user's budget without changing its data.
