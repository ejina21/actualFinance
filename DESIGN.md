---
name: Actual Budget
description: Local-first personal finance with Apple macOS warm neutral aesthetic
# All color values are the light-theme palette mapping; dark and midnight
# remap the same semantic roles via `theme.*` tokens (see The Semantic Token Rule).
colors:
  primary-warm: '#c25e3e'
  primary-warm-hover: '#ab5034'
  sidebar-warm: '#ede8df'
  sidebar-hover: '#e3ddd2'
  sidebar-selection: '#d8d1c4'
  stone-slate: '#57534e'
  stone-mist: '#e5dfd5'
  linen-frost: '#f7f5f0'
  page-text: '#1c1917'
  surface-white: '#ffffff'
  positive-green: '#15803d'
  finance-accent-positive: '#15803d'
  finance-hero: '#ede8df'
  finance-soft-accent: '#fbf0eb'
  finance-accent-negative: '#dc2626'
  negative-red: '#dc2626'
  link-warm: '#c25e3e'
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
  sm: '6px'
  md: '8px'
  lg: '12px'
  xl: '14px'
spacing:
  xs: '5px'
  sm: '10px'
  md: '16px'
  lg: '20px'
components:
  button-primary:
    backgroundColor: '{colors.primary-warm}'
    textColor: '{colors.surface-white}'
    rounded: '{rounded.md}'
    padding: '6px 12px'
  button-primary-hover:
    backgroundColor: '{colors.primary-warm-hover}'
    textColor: '{colors.surface-white}'
  button-normal:
    backgroundColor: '{colors.surface-white}'
    textColor: '{colors.page-text}'
    rounded: '{rounded.md}'
    padding: '6px 12px'
  input:
    backgroundColor: '{colors.surface-white}'
    textColor: '{colors.page-text}'
    rounded: '{rounded.md}'
    padding: '6px 10px'
---

# Design System: Actual Budget

## 1. Overview

**Apple macOS / Warm Neutral Direction:** A calm, tactile, warm linen canvas (`#f7f5f0`), white bordered surfaces (`#ffffff` on `#e5dfd5`), a light stone navigation rail (`#ede8df`), and a warm terracotta/copper accent (`#c25e3e`). Dense tabular numeral tables and established envelope actions remain intact with enhanced readability and softer diffusion shadows.

**Key Characteristics:**

- Table-first layouts with tabular numerals everywhere money appears
- Apple macOS style: gentle 8–14px rounded corners, diffusion shadows, segmented controls
- Warm terracotta accent for primary actions and focus highlights
- Semantic color tokens only; components never hardcode hex values
- Light warm stone navigation rail seamlessly integrated into macOS window chrome

## 2. Colors

A light warm stone navigation rail, warm linen canvas, terracotta accent, and clear semantic money indicators.

### Primary

- **Primary Terracotta** (#c25e3e): Primary buttons, highlights, and active accents. Hover uses #ab5034.
- **Sidebar Warm Stone** (#ede8df): Persistent navigation rail in the light theme. Hover uses #e3ddd2; selection uses #d8d1c4 with #1c1917 text.

### Neutral

- **Page Text** (#1c1917): Default body text on light surfaces.
- **Stone Slate** (#57534e): Secondary and subdued text.
- **Stone Mist** (#e5dfd5): Table borders, card outlines, and dividers.
- **Linen Frost** (#f7f5f0): Page background and quiet surfaces.
- **Surface White** (#ffffff): Tables, cards, menus, modals.

### Tertiary (semantic money and status colors)

- **Positive Green** (#15803d): Positive amounts and funded envelopes.
- **Negative Red** (#dc2626): Negative amounts, overspending, failures.
- **Finance Soft Accent** (#fbf0eb): Summary cards and warm tint backgrounds.
- **Link Warm** (#c25e3e): Links and informational highlights.
- **Warning Gold** (#b88115): Underfunded templates, pending states.

### Named Rules

**The Semantic Token Rule.** Components never use raw palette values or hex codes. Every color goes through the `theme.*` semantic layer (`--color-*` custom properties) so all three themes (light, dark, midnight) stay correct. A hardcoded hex in a component is a bug.

**The One Accent Rule.** Warm terracotta marks primary actions and the highlighted summary card.

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

### Standard Component Sizes

`Button`, `Text` and `Input` accept a `size` prop: `small` | `medium` | `large` | `extra-large` (the `ComponentSize` vocabulary in `packages/component-library/src/tokens.ts`). Omitting the prop renders exactly as before — fully backward compatible. Sizes are responsive: they step up one notch on mobile/narrow for readability and touch targets, and collapse to the compact desktop scale from 512px/730px up. Breakpoint groups mirror the `useResponsive` view modes: narrow <512, small 512–729, medium 730–1099, wide ≥1100.

Text values (fontSize / lineHeight, px):

| Size        | narrow  | small   | medium  | wide    |
| ----------- | ------- | ------- | ------- | ------- |
| small       | 12 / 16 | 12 / 16 | 12 / 16 | 12 / 16 |
| medium      | 13 / 18 | 13 / 18 | 13 / 18 | 13 / 18 |
| large       | 16 / 22 | 15 / 20 | 15 / 20 | 15 / 20 |
| extra-large | 17 / 24 | 17 / 24 | 16 / 22 | 16 / 22 |

Control values for Button/Input (paddingY / paddingX / min-height, px):

| Size        | narrow       | small       | medium      | wide        |
| ----------- | ------------ | ----------- | ----------- | ----------- |
| small       | 3 / 8 / 24   | 3 / 8 / 24  | 3 / 8 / 24  | 3 / 8 / 24  |
| medium      | 5 / 10 / —   | 5 / 10 / —  | 5 / 10 / —  | 5 / 10 / —  |
| large       | 8 / 12 / 36  | 6 / 12 / 32 | 6 / 12 / 32 | 6 / 12 / 32 |
| extra-large | 10 / 14 / 40 | 8 / 12 / 36 | 8 / 12 / 36 | 8 / 12 / 36 |

`size="medium"` reproduces today's default control look exactly (5px/10px padding, 13px text, no min-height) and, on controls, inherits line-height like the default; the other sizes apply their scale line-height. `Text` always applies its size's line-height, while the omitted prop forces no line-height at all. `extra-large` narrow hits the 40px mobile touch target. The touch-target guarantee applies to touch-primary controls: at narrow, use `large` or `extra-large` for controls the user taps; `small` stays the compact 24px desktop-density choice at every breakpoint and is not meant for touch-primary controls.

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

- **Sidebar:** Deep green background, pale green text, white selected text. The fixed account total sits above a scrolling tree with every account balance.
- **Mobile:** Deep green header and a bottom navigation tray with Overview, Budget, transaction entry, accounts, and every secondary destination.

### Pills / Chips

- **Style:** Editor pills: tinted background, 4px radius, 3px 5px padding. Used for rule conditions and inline tokens

### Signature Component: The Money Table

The core surface of the app. White rows on 1px Navy Mist borders, Frost hover, teal-bordered selection, sticky header with Slate 13px text, fixed Category and Total columns during horizontal scrolling, amounts right-aligned in tabular figures colored by the semantic money tokens. Alternate-row striping is theme-controlled, never hardcoded.

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
