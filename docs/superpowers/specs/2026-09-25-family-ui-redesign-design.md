# Family Budget UI Redesign

## Purpose and scope

Refresh the local Actual Budget interface around the selected **Home Dashboard** visual direction, with the account balances and account list from the **Clear Table** direction in its left sidebar. The primary user manages a Russian-language family budget with 12 accounts and more than 4,000 transactions. The result should make balances, the monthly plan, recent activity, and the next useful action easy to find while retaining the complete existing Actual workflow.

This is a presentation and navigation project. The financial model, calculations, import/export formats, synchronization protocol, database schema, and account data remain unchanged. The new overview may compose already available values, but it must not introduce a second source of truth for money.

## Approved visual direction

- Use the selected dashboard composition: dark blue sidebar, light main surface, teal accents, clear summary blocks, restrained progress bars, and readable transaction rows. Avoid animation and decorative effects that compete with financial data.
- Put accounts and their balances directly beneath the main navigation. Show the all-accounts balance, existing on-budget and off-budget groups, and every open account. The mockup's “show more” control is only a compact preview; production must let the user access all accounts, including closed accounts through the existing disclosure.
- Keep financial figures aligned and legible with tabular numerals. Show signs, labels, and states in text; color only reinforces meaning.
- Preserve the current Russian product copy and theme support. The new palette must map through semantic theme tokens for light, dark, and midnight modes.

## Navigation and screen composition

1. **Application shell and sidebar.** Restyle the existing `Sidebar`, `PrimaryButtons`, `Accounts`, and related components instead of replacing their data hooks. Keep budget switching, sidebar resizing/floating, account grouping and reordering, sync indicators, add-account, and the links for Reports, Schedules, Payees, Rules, Bank Sync where available, Tags, Settings, and tools. The “Operations” shortcut opens the existing all-accounts transaction page (`/accounts`); each account continues to open its existing route.
2. **Overview.** Add `/overview` as a presentation-only page of existing balances, current-month budget status, categories, and recent transactions. Its values must come from the same selectors/bindings used by current screens. The existing `/budget` view remains the complete budget editor, and all existing deep links stay available. Empty, loading, negative-balance, overspent, offline, and private-mode states must remain understandable.
3. **Budget.** Apply the new typography, spacing, controls, and surface treatment to the current budget page without replacing its month grid, category editing, allocation, carryover, automation, or multi-month behavior. The grid stays the fast path for regular planning.
4. **Accounts and operations.** Apply the same visual language to account pages and the transaction table while preserving filtering, search, inline edits, splits, transfers, reconciliation, import/export, and keyboard workflows.
5. **Remaining screens.** Extend the shared tokens and shell to reports, schedules, payees, rules, tags, settings, and dialogs. Preserve their controls, data, and routes. Mobile navigation retains feature parity and uses the same hierarchy in a narrow layout.

## Interaction and performance requirements

- Do not truncate the account list to a fixed number in production. Long lists scroll within the sidebar while navigation and account totals remain understandable. Preserve drag-and-drop ordering and visible sync/error states.
- Keep the main user actions discoverable without hover. Maintain keyboard focus visibility, readable contrast, scalable text, and reduced-motion behavior.
- Reuse the existing component library and data hooks. Do not add a charting or animation dependency solely for the redesign. Retain current transaction-table virtualization and avoid per-row expensive decoration.
- Measure baseline and redesigned behavior with the same local data set: first budget render, account switching, transaction search/edit, and long-list scrolling. Investigate any material slowdown before completion.

## Verification and acceptance

- Confirm that all existing navigation destinations and representative workflows still work: budget allocation, category edit, transaction edit, transfer, reconciliation, account management, reports, rules, schedules, and settings.
- Verify the sidebar with the user's 12-account structure, including nonzero and zero balances, narrow and wide widths, private mode, and online/offline states.
- Check responsive layouts and all three themes, keyboard access, Russian text overflow, and screen-reader labels. Run type checking and focused automated tests; use visual regression coverage for changed shared screens.
- The redesign is complete when the new appearance is coherent across the app and the above workflows remain available without a meaningful performance regression.

## Decisions and exclusions

- The selected dashboard is a visual composition of existing financial data, not a new budgeting method.
- No changes to the user's stored transactions, balances, categories, or synchronization data are part of this project.
- Account balances shown in the mockup are illustrative; the implemented sidebar uses live application values and current privacy controls.
