# Expense-only budget view

## Goal

Add a third, read-only view called «Расходы» to the Budget page. It shows how much was spent per expense group and category without plans, limits, overspending, or budget balances.

## Approved behavior

- Keep «Конверты» and «Отслеживание» available. Selecting «Расходы» changes the displayed view only and does not change existing transactions or budget allocations.
- Follow `export.xlsx` summary sheets: the monthly view has one column per day and a total; the annual view has one column per month and a total. Expense groups can expand to categories.
- The source is Actual transactions, not the workbook. All amounts use the app's currency formatting.
- Exclude transfers between accounts, income categories, off-budget accounts, and the imported `ПЕРЕВОДЫ` and `ЗАЙМЫ` groups, as in the workbook formulas. Include regular expense categories (including obligations and investment categories) and uncategorized outflows. Positive refunds in an expense category reduce its spending.
- Show zero for dates with no expenses. Users can navigate months and years. The view updates when transactions change and works on desktop and narrow screens.
- Preserve the current Actual visual system and Russian UI copy. Respect privacy mode.

## Boundaries

The existing `budgetType` preference remains the calculation engine for «Конверты» and «Отслеживание». «Расходы» is a display preference and must not add a third engine value. This prevents unrelated forecasting, goals, reports, and mobile budget logic from treating an unknown value as one of the existing types.
