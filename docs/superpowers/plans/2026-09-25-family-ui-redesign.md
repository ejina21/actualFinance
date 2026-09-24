# Family UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the selected dashboard design with live account balances in the sidebar across the Russian-language Actual Budget app, while retaining existing money workflows and responsive performance.

**Architecture:** Use Actual's existing theme tokens and experimental account-tree sidebar as the foundation. Add a lightweight `/overview` route that reads existing balance, budget, and transaction data; do not duplicate financial calculations. Restyle the shared shell and core working pages, then verify the other routes in all themes.

**Tech Stack:** React, TypeScript, React Router, Emotion, CSS custom properties, React Query, Actual spreadsheet bindings, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-25-family-ui-redesign-design.md`

## Global Constraints

- Keep the financial model, calculations, import/export formats, sync protocol, database schema, and account data unchanged.
- Preserve current routes and account, budget, transaction, report, rule, schedule, and settings workflows.
- Keep Russian product copy, the three built-in themes, private mode, keyboard access, and reduced-motion behavior.
- Reuse the component library and existing hooks. Add no charting or animation dependency.
- Benchmark on the same 12-account, 4,117-transaction local budget before and after UI changes.

## Review Focus

- A sidebar with many long Russian account names must show balances without clipping actions or hiding accounts.
- Zero, negative, loading, and private-mode balances must render without false financial claims.
- An offline sync server must not block overview, budget, or account navigation.
- The 4,117-transaction list must retain its existing windowing, search, editing, and keyboard behavior.
- Narrow layouts must still expose every existing route and maintain readable targets.

---

### Task 1: Theme foundation

**Files:** Modify `packages/component-library/src/themes/light.css`, `dark.css`, `midnight.css`; inspect `packages/component-library/src/theme.ts` and `packages/desktop-client/src/style/theme.tsx`.

**Interfaces:** Existing semantic `theme.*` references remain the only color API. The new colors are supplied by existing `--color-*` variables.

- [ ] **Step 1:** Record baseline screenshots and interaction timings for `/budget`, `/accounts`, `/reports`, and `/settings` using the 12-account budget. Record desktop and narrow widths before changing styles.
- [ ] **Step 2:** Update semantic page, card, table, sidebar, primary-button, and selected-state variables in all three theme CSS files. Keep positive/negative money colors semantically separate and preserve contrast. For example:

```css
--color-sidebarBackground: var(--palette-navy900);
--color-sidebarItemTextSelected: var(--palette-green150);
--color-pageBackground: var(--palette-navy50);
```

- [ ] **Step 3:** Run `yarn workspace @actual-app/components run typecheck` from the repository root and inspect `/budget` and `/accounts` in all three themes. Commit only the theme files with an `[AI]` message.

### Task 2: Navigation and live account sidebar

**Files:** Modify `packages/desktop-client/src/hooks/useFeatureFlag.ts`, `packages/desktop-client/src/components/sidebar/redesign/PrimaryNav.tsx`, `SidebarRedesign.tsx`, `AccountsHeaderRow.tsx`, `AccountsSection.tsx`, `NavRow.tsx`, `SidebarHeader.tsx`, `SidebarFooter.tsx`; add or update focused tests beside these files.

**Interfaces:** `PrimaryNav` maps Overview to `/overview`, Operations to `/accounts`, and retains every current route. `AccountsSection` continues using `useSidebarAccountTree`, `SidebarBalance`, and existing collapse/search handlers.

- [ ] **Step 1:** Add a test that expects the default sidebar to show Overview, Budget, Operations, Reports, Schedules, Payees, Rules, Tags, and Settings, and verifies the account header balance remains live. Run it and observe the expected failure before implementation.
- [ ] **Step 2:** Enable the new sidebar by default without deleting the legacy fallback. Add the two navigation shortcuts and restyle the existing sidebar rows and account header. Keep drag-and-drop, group collapse, search, sync status, add account, off-budget, and closed-account behavior. Core route additions follow the existing `NavRow` pattern:

```tsx
<NavRow title={t('Overview')} Icon={SvgReports} to="/overview" />
<NavRow title={t('Transactions')} Icon={SvgWallet} to="/accounts" />
```

- [ ] **Step 3:** Run the new focused test, `yarn typecheck`, and keyboard-check sidebar links and account controls at wide and narrow widths. Commit this task with an `[AI]` message.

### Task 3: Overview data and route

**Files:** Create `packages/desktop-client/src/components/overview/OverviewPage.tsx`, `OverviewData.ts`, and `OverviewData.test.ts`; modify `packages/desktop-client/src/components/FinancesApp.tsx`, `packages/desktop-client/src/components/mobile/MobileNavTabs.tsx`, and Russian i18n message catalog through `yarn generate:i18n` if extraction needs new strings.

**Interfaces:** The page consumes existing account balance bindings, category data, and a bounded recent-transactions query. It links to `/budget`, `/accounts`, and existing account routes; it writes no financial data.

- [ ] **Step 1:** Test the overview adapter with empty data, zero and negative balances, transfer rows, and an uncategorized transaction. Assert that summaries derive from supplied data and that transfers are not counted as spending. Run the test to see it fail.
- [ ] **Step 2:** Implement the adapter as pure functions and the page using existing hooks/bindings. Limit the recent query and render count; never fetch the entire transaction history for the overview. Use existing financial formatting and privacy components. A representative bounded query is:

```ts
q('transactions')
  .filter({ is_parent: false })
  .orderBy({ date: 'desc' })
  .limit(5)
  .select('*');
```

- [ ] **Step 3:** Register `/overview` inside the existing `FinancesApp` route tree, add a mobile navigation entry, and ensure the existing `/budget` default and deep links stay valid.
- [ ] **Step 4:** Run the adapter test, `yarn typecheck`, and manually verify overview in populated, empty, offline, and private-mode states. Commit this task with an `[AI]` message.

### Task 4: Working-page visual consistency

**Files:** Modify `packages/desktop-client/src/components/budget/BudgetPageHeader.tsx`, `BudgetTable.tsx`, `packages/desktop-client/src/components/accounts/Header.tsx`, `packages/desktop-client/src/components/reports/DashboardHeader.tsx`, and shared page/surface components only where the selected visual system cannot be achieved through theme tokens.

**Interfaces:** Retain current component props and existing editing callbacks. This task changes presentation, not financial actions or table data sources.

- [ ] **Step 1:** Record representative interaction assertions for budget allocation, transaction edit, transfer, reconciliation, report opening, and account selection. Run them before changes to establish the behavior baseline.
- [ ] **Step 2:** Apply the dashboard's spacing, typography, border, and hierarchy to page headers and table framing, using `theme.*` and `FinancialText` for money. Keep the budget grid and transaction table dimensions usable and retain virtualization.
- [ ] **Step 3:** Run the representative checks, `yarn typecheck`, and scoped lint on changed files. Compare the interaction timings and scrolling with Task 1's baseline. Commit this task with an `[AI]` message.

### Task 5: Cross-screen and responsive finish

**Files:** Modify only affected shared or route-specific UI files under `packages/desktop-client/src/components/`; update `DESIGN.md` after the implemented visual language is stable; add a short file under `upcoming-release-notes/`.

**Interfaces:** Existing report, schedule, payee, rule, tag, settings, modal, and mobile routes continue to use their current data and actions.

- [ ] **Step 1:** Check every named route in the spec at desktop and narrow widths in light, dark, and midnight themes. Capture screenshots and list any concrete contrast, overflow, or focus defects.
- [ ] **Step 2:** Fix the listed defects in one bounded pass, keeping shared fixes in shared components. Verify private mode and server-offline status. Add focused tests only for behavior changed by a fix.
- [ ] **Step 3:** Update `DESIGN.md` to reflect the shipped tokens and component rules, and write the plain-language release note. Run `yarn typecheck`, focused tests, scoped lint, and the browser build; run the repository's Docker VRT workflow for any updated screenshot tests.
- [ ] **Step 4:** Repeat the baseline interactions and screenshot comparison. Commit only project files related to this redesign with an `[AI]` message. Keep the user's unrelated worktree changes separate.

## Delivery

- Review the complete diff against the spec's acceptance list, then update the local Docker app on port 3004 only after the build and data-preserving deployment path are verified.
- Report actual measured performance and any limitations. Do not claim unchanged speed without a before/after comparison.
