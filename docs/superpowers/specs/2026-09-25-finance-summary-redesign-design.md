# Finance Summary and App Visual Redesign

## Purpose and scope

Make the entire local Actual interface feel closer to the Coinest finance dashboard reference through its visual hierarchy, spacious surfaces, restrained green palette, and clear financial summaries. Preserve Actual's local-first behavior and every existing money-management workflow. The Budget page receives the largest functional change: a new read-only **Итого** view modeled on the supplied workbook's **ИТОГО месяц** and **ИТОГО год** sheets, with selectable periods and month comparisons.

This is one coordinated redesign delivered in stages. The summary is the first product surface, followed by shared navigation and the remaining working pages. A stage is complete only when its desktop, narrow-screen, light, dark, and midnight states are usable. Existing account, transaction, budget-planning, report, import, and settings actions remain available throughout.

## Source of truth and product language

- Actual transactions, accounts, and category groups provide all live figures. The workbook is a layout and calculation reference, not a data source or a required upload.
- The reference's dashboard cards and charts guide presentation. They do not justify fictitious metrics, balances, activity, investment returns, or marketing content.
- New product text is translatable and has Russian translations. The Russian interface displays Russian labels throughout the redesigned surfaces.
- Amounts use Actual's currency formatter, tabular numerals, privacy masking, and existing theme semantics.

## App-wide visual direction

- Light mode uses a quiet neutral canvas, white content surfaces, fine borders, a deep green focal balance card, and a limited soft-green accent for selection or progress. Clear amount typography carries the hierarchy. Persistent cards have little or no shadow.
- Dark and midnight modes remap these roles through semantic theme tokens, keeping contrast and the same financial meaning. No literal palette colors are embedded in feature components.
- Desktop navigation remains a persistent, readable account tree with balances, plus the existing destinations. It may become visually lighter and more compact, but account access and sidebar resizing remain intact. Mobile keeps its bottom navigation and reachable account controls.
- Shared page headers, buttons, filters, cards, empty states, tables, and dialogs are updated before individual pages diverge. Budget, accounts and transactions, reports, schedules, and settings use the same spacing, radii, type scale, and interaction states.
- Dense transaction and budget tables remain efficient for routine work: fixed or sticky labels where useful, aligned amounts, visible focus, full keyboard access, and no decorative loss of information.
- The overview uses real balances, budget progress, and recent transactions. Any added trend chart must be calculated from Actual data and state its period and metric.

## Budget navigation

- **Итого**, **Конверты**, and **Отслеживание** are distinct views within Budget. **Итого** replaces the narrow **Расходы** display, incorporating its expense detail. Selecting it changes only presentation; it never changes `budgetType`, allocations, transactions, or reconciliation state.
- On a fresh local display preference, Budget opens **Итого**. The most recently chosen view is remembered locally. Existing saved planning modes remain available and retain their calculation engine.
- The planning views retain all editing controls and their current financial behavior. They receive the common visual styling without being converted into a report.

## Итого: data and layout

The top area has four directly traceable figures for the selected period: income, expenses, net flow (income minus expenses), and closing balance of on-budget accounts. Every figure has a clear label and period. The account balance is a point-in-time value, not another flow to add to income or expenses.

Below it, a financial table groups income and expenses by Actual category group and category. Groups expand to reveal categories. Rows show the selected period total and the applicable time columns. Uncategorised transactions have an explicit row. A separate account section shows each account's opening balance, inflows, outflows, and closing balance, with off-budget accounts clearly separated from the on-budget headline total. Internal transfers are excluded from income and expenses but remain visible in the movements of the affected accounts. Inclusion rules are shown in the UI so totals can be reconciled.

The workbook's personal category names and account names are not hardcoded. Actual's current categories and accounts determine the rows. Loan or investment accounts appear with their actual balances and movements. Investment yield is displayed only if Actual has the value and basis needed for a defensible return calculation; otherwise the summary shows cash movements without calling them returns.

For flow totals, own-account transfers and off-budget account transactions do not count as household income or spending. Income categories feed income; expense categories feed spending. Uncategorised inflows and outflows remain visible under their respective sections. Refunds in an expense category reduce spending. Split transactions are counted once. All calculations use integer minor units and reconcile group, category, and headline totals.

## Periods and comparison

- **Month:** choose any calendar month or step backward and forward. The table has one column per day plus the month total, matching the workbook's monthly grain.
- **Year:** choose any calendar year. The table has one column per month, a year total, and a monthly average. Months without data show zero rather than disappearing.
- **Custom period:** select inclusive start and end dates, with validation that start is no later than end. The table shows the total and monthly columns; partial boundary months include only days inside the selection. No user-visible fixed limit is imposed on the date range.
- **Compare months:** choose one base month and add or remove other calendar months. The same income, expense, net-flow, group, and category definitions are used for every month. The table shows each month's value and its absolute and percentage change from the base. When the base is zero, the percentage is shown as unavailable rather than infinity or a misleading zero. Comparison does not alter the selected primary period.
- Period and comparison controls are keyboard accessible. On narrow screens, summary figures stack and the time table scrolls horizontally while row labels remain discoverable.

## Loading, correctness, and safety

- Changing a period updates live results from Actual without importing or copying workbook data. Loading and query failures have Russian messages; an empty period distinguishes zero activity from a failed query.
- Privacy mode masks every amount and derived comparison, including chart labels, tooltips, and account balances.
- Existing report and account balance queries may be reused where their inclusion rules match the summary. A shared pure aggregation layer owns the new period and comparison arithmetic; the UI does not duplicate financial formulas.
- Long custom ranges must avoid rendering hundreds of daily columns or blocking the interface. The implementation plan will choose aggregation and rendering boundaries that preserve exact totals.

## Delivery and acceptance

1. Establish shared visual tokens and representative components in all three themes, then implement **Итого** and its period controls.
2. Apply the same visual system to overview, account and transaction pages, planning views, reports, schedules, settings, and mobile navigation. Keep each existing action discoverable.
3. Verify the summary against hand-calculated cases and representative workbook periods; test transfers, refunds, split transactions, off-budget accounts, missing months, leap years, custom boundaries, zero-base comparisons, privacy mode, and switching back to planning.
4. Verify desktop and narrow-screen interaction and visual states in light, dark, and midnight themes. Run repository type checking, linting, focused tests, and the project's Linux screenshot workflow for changed UI.

The redesign is complete when a user can carry out the same Actual tasks as before, see Russian UI text, and use **Итого** to inspect one month, a year, any chosen date range, and comparisons with selected months using figures that reconcile to Actual transactions and balances.
