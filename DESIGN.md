---
name: Actual Budget
description: Local-first personal finance, built around envelope budgeting
# All color values are the light-theme palette mapping; dark and midnight
# remap the same semantic roles via `theme.*` tokens (see The Semantic Token Rule).
colors:
  primary-teal: '#087a74'
  primary-teal-hover: '#096a65'
  sidebar-blue: '#1e3651'
  sidebar-hover: '#31506a'
  sidebar-selection: '#34526d'
  navy-slate: '#607681'
  navy-mist: '#e3eaec'
  navy-frost: '#f3f6f7'
  page-text: '#172b36'
  surface-white: '#ffffff'
  positive-green: '#147d64'
  negative-red: '#e12d39'
  link-blue: '#1980d4'
  warning-gold: '#b88115'
typography:
  display:
    fontFamily: 'Inter Variable, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
    fontSize: '30px'
    fontWeight: 600
  headline:
    fontFamily: 'Inter Variable, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
    fontSize: '20px'
    fontWeight: 700
    letterSpacing: '0.5px'
  title:
    fontFamily: 'Inter Variable, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
    fontSize: '15px'
    fontWeight: 500
  body:
    fontFamily: 'Inter Variable, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
    fontSize: '16px'
    fontWeight: 400
    fontFeature: 'tnum, ss01, ss04'
  label:
    fontFamily: 'Inter Variable, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
    fontSize: '13px'
    fontWeight: 400
rounded:
  sm: '4px'
  md: '6px'
spacing:
  xs: '5px'
  sm: '10px'
  md: '16px'
  lg: '20px'
components:
  button-primary:
    backgroundColor: '{colors.primary-teal}'
    textColor: '{colors.surface-white}'
    rounded: '{rounded.sm}'
    padding: '5px 10px'
  button-primary-hover:
    backgroundColor: '{colors.primary-teal-hover}'
    textColor: '{colors.surface-white}'
  button-normal:
    backgroundColor: '{colors.surface-white}'
    textColor: '{colors.page-text}'
    rounded: '{rounded.sm}'
    padding: '5px 10px'
  input:
    backgroundColor: '{colors.surface-white}'
    textColor: '{colors.page-text}'
    rounded: '{rounded.sm}'
    padding: '5px'
---

# Design System: Actual Budget

## 1. Overview

**Creative North Star: "The Family Dashboard"**

Actual presents the family's finances clearly at first glance, while keeping the detailed tables close at hand. The overview surfaces balances, current-month budget progress, and recent activity. The account sidebar keeps every account and its live balance visible. Working pages remain compact enough for regular budgeting and reconciliation.

The system is calm and practical. It uses a dark blue navigation rail and restrained teal accents in light mode, with corresponding dark and midnight palettes. The three themes preserve the same hierarchy and financial semantics.

**Key Characteristics:**

- Table-first layouts with tabular numerals everywhere money appears
- One teal accent used for primary actions and the dashboard highlight
- Semantic color tokens only; components never hardcode hex values
- Utilitarian, compact components built for daily repetition
- Bordered cards with soft ambient shadows on the overview; tables remain dense

## 2. Colors

A dark blue navigation rail, light neutral page, teal primary accent, and separate semantic colors for money.

All hex values in this file (frontmatter included) are the light-theme palette mapping. The dark and midnight themes remap the same semantic roles to different palette values, so never use these hexes directly in components — route every color through the `theme.*` semantic tokens (see The Semantic Token Rule below).

### Primary

- **Primary Teal** (#087a74): Primary buttons, dashboard highlights, and progress bars. Hover uses #096a65.
- **Sidebar Blue** (#1e3651): Persistent navigation in the light theme. Hover uses #31506a; selection uses #34526d with white text.

### Neutral

- **Page Ink** (#172b36): Default body text on light surfaces.
- **Navy Slate** (#607681): Secondary and subdued text.
- **Navy Mist** (#e3eaec): Table borders and dividers.
- **Navy Frost** (#f3f6f7): Page background and quiet surfaces.
- **Surface White** (#ffffff): Tables, cards, menus, modals.

### Tertiary (semantic money and status colors)

- **Positive Green** (#147d64): Positive amounts and funded budgets.
- **Negative Red** (#e12d39): Negative amounts, overspending, failures.
- **Link Blue** (#1980d4): Links and informational highlights.
- **Warning Gold** (#b88115): Underfunded templates, pending states.

### Named Rules

**The Semantic Token Rule.** Components never use raw palette values or hex codes. Every color goes through the `theme.*` semantic layer (`--color-*` custom properties) so all three themes (light, dark, midnight) stay correct. A hardcoded hex in a component is a bug.

**The One Accent Rule.** Teal marks primary actions and the highlighted summary card. Sidebar selection relies on contrast and a blue background so balance text stays legible.

**The Never-Color-Alone Rule.** Positive/negative money state is conveyed by sign and context as well as color; green/red are reinforcement, never the only signal.

## 3. Typography

**Body Font:** Inter Variable (with system-ui fallback stack)
**Label/Mono behavior:** Same family; financial figures switch on tabular OpenType features

**Character:** One workhorse sans at compact sizes. No display serif, no font pairing games: hierarchy comes from weight and size, and the typographic star is the number column.

### Hierarchy

- **Display** (600, 30px): Page-level headings and large balances. Rare.
- **Headline** (700, 20px, 0.5px letter-spacing): Section titles.
- **Title** (500, 15px): Emphasized in-table and card text.
- **Body** (400, 16px): Default text.
- **Label** (400, 13px): Table meta, menus, dense secondary text; 12px and 10px steps exist for the tightest spots.

### Named Rules

**The Tabular Number Rule.** Every standalone financial figure renders with `font-feature-settings: "tnum", "ss01", "ss04"` (via `FinancialText` or `styles.tnum`) so digits align in columns and disambiguate. A proportional-figure money column is a bug.

## 4. Elevation

Structure comes from 1px borders (Navy Mist) and background shifts (White on Frost, Frost on hover). The overview cards carry a faint ambient shadow; working tables stay flat. Transient surfaces such as menus and popovers use stronger elevation.

### Shadow Vocabulary

- **Card** (`box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)`): Resting cards and small raised widgets.
- **Ambient** (`box-shadow: 0 2px 4px 0 rgba(0,0,0,0.1)`): Focused inputs, subtle lift.
- **Large** (`box-shadow: 0 15px 30px 0 rgba(0,0,0,0.11), 0 5px 15px 0 rgba(0,0,0,0.08)`): Tooltips, popovers, floating panels.

### Named Rules

**The Surface Rule.** Persistent cards use a border and at most a soft ambient shadow. Menus, tooltips, and popovers can use stronger elevation.

## 5. Components

Utilitarian and quick: compact paddings, instant state feedback, built for daily repetition. All values below are the light theme; every color routes through the semantic token layer.

### Buttons

- **Shape:** Gently rounded (4px radius), compact padding (5px 10px)
- **Primary:** Teal background, white text; hover uses a deeper teal
- **Normal:** White background, Page Ink text, 1px navy border
- **Bare:** Transparent, 5px padding; background tint on hover/press. The workhorse for in-table actions

### Inputs / Fields

- **Style:** White background, 1px border, 4px radius, 5px padding
- **Focus:** Border switches to the selected accent; big inputs drop the border and take the ambient shadow instead
- **Big variant:** 10px padding for mobile and prominent forms (40px minimum touch height on mobile)

### Cards / Containers

- **Corner Style:** 12–16px on dashboard cards, 12px on budget summary and table headers, 4px on compact controls
- **Background:** Surface White on Navy Frost page background
- **Shadow Strategy:** Card shadow at most; structure via 1px Navy Mist border
- **Internal Padding:** 16-20px

### Navigation

- **Sidebar:** Dark blue background, light blue text, white selected text. The fixed account total sits above a scrolling tree with every account balance.
- **Mobile:** Dark blue header and a bottom navigation tray with Overview, Budget, transaction entry, accounts, and every secondary destination.

### Pills / Chips

- **Style:** Editor pills: tinted background, 4px radius, 3px 5px padding. Used for rule conditions and inline tokens

### Signature Component: The Money Table

The core surface of the app. White rows on 1px Navy Mist borders, Frost hover, teal-bordered selection, sticky header with Slate 13px text, amounts right-aligned in tabular figures colored by the semantic money tokens. Alternate-row striping is theme-controlled, never hardcoded.

## 6. Do's and Don'ts

### Do:

- **Do** route every color through `theme.*` semantic tokens so light, dark, and midnight themes all work. Test all three.
- **Do** wrap standalone financial numbers in `FinancialText` or apply `styles.tnum`.
- **Do** keep working controls compact and quick: 4px radii, 5-10px paddings, instant hover/press states.
- **Do** reuse the existing component library (`@actual-app/components`) before writing new UI.
- **Do** keep teal accents scarce: primary action, one summary card, and progress only.
- **Do** respect the breakpoints: 512px (small), 730px (medium), 1100px (wide); mobile touch targets are at least 40px tall.

### Don't:

- **Don't** use fintech-startup gloss: gradient heroes, glassmorphism, neon accents, crypto-dashboard styling (PRODUCT.md anti-reference).
- **Don't** use corporate banking UI patterns: navy-and-gold, enterprise-portal density, legalese energy (PRODUCT.md anti-reference).
- **Don't** hardcode hex values or raw `--palette-*` colors in components; the semantic layer is the only entry point.
- **Don't** rely on color alone for positive/negative amounts.
- **Don't** use strong shadows on persistent surfaces; keep overview card shadows subtle.
- **Don't** use `border-left`/`border-right` thicker than 1px as a colored accent stripe.
- **Don't** animate layout properties; transitions are for color, opacity, and shadow (like the button's `box-shadow .25s`).
