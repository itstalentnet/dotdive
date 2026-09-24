# Phase 1 — Design System Documentation

> **⛔ SUPERSEDED — historical phase deliverable.** Baseline values inside are old and do NOT match
> the final, verified tokens (e.g. §5 breakpoints `0/768/1024/1440px`, §4.3 type scale, §6 icon
> ladder with `32px`). Single source of truth:
> `src/design-system/tokens/` + `src/styles/tokens.css` (values) ·
> `frontend/AGENTS.md` + `docs/decisions/*.md` (locked decisions) ·
> `src/design-system/docs/` (design-system docs). When in doubt, follow the live sources.

### Developer Implementation Document | Project: Lemmo

> **Prerequisite:** Phase 0 (Tooling & Governance) must be completed and QA-0 must be approved.
>
> **Input Source:** The `System_design` folder (path: `/home/behroz/Documents/Git/lemmo/System_design`) — containing font files, potentially exported Figma/color files, and the logo. The developer must open this folder and extract the exact values (color hex values, font sizes if available) from it, not guess them.

---

## 1. Phase Objective

The output of this phase must be **a Single Source of Truth** for every visual value in the project, so that:

- No color, font, size, or spacing is manually hardcoded inside components in the future.
- Every developer (or AI tool) knows exactly which value to use without having to ask anyone.
- Changing one value (for example, the primary color) in the future requires editing only one file and applies the change across the entire project.

This phase **does not produce UI code** — it only creates tokens, documentation, and the base font-configuration files. Actual component development takes place in Phase 6.

---

## 2. Output Folder Structure for This Phase

```text
src/design-system/
├── tokens/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── radius.ts
│   ├── shadow.ts
│   └── breakpoints.ts
├── fonts/
│   ├── satoshi/          # Font files imported from System_design
│   ├── oddval/
│   ├── morabba/
│   └── iransans/
├── docs/
│   ├── STYLEGUIDE.md      # Final coding + design rules are documented here
│   ├── typography.md
│   ├── color.md
│   ├── iconography.md
│   └── logo.md
└── index.ts               # Central export for all tokens
```

---

## 3. Design Tokens — Color

The developer must extract the exact hex values from the `System_design` folder. Structure of `colors.ts`:

```ts
// src/design-system/tokens/colors.ts

export const colors = {
  // Brand colors (extract from System_design)
  primary: {
    50: '#...',
    100: '#...',
    // ... through 900
    DEFAULT: '#...', // Main color used in most places
  },
  secondary: {/* same pattern */},

  // Neutral colors (background, text, border)
  neutral: {
    background: '#...',
    surface: '#...',
    border: '#...',
    textPrimary: '#...',
    textSecondary: '#...',
    textDisabled: '#...',
  },

  // Status colors (Semantic)
  status: {
    success: '#...',
    warning: '#...',
    error: '#...',
    info: '#...',
  },

  // Dark mode (if the project has Dark Mode)
  dark: {
    background: '#...',
    surface: '#...',
    textPrimary: '#...',
    // ...
  },
} as const;

export type ColorToken = typeof colors;
```

### Mandatory Rules

- All colors must be defined both as tokens in TypeScript (above) and as **CSS Custom Properties** so they can also be used in raw CSS/Tailwind:

```css
/* src/styles/tokens.css */
:root {
  --color-primary: #...;
  --color-bg: #...;
  --color-text-primary: #...;
  /* ... */
}

[data-theme='dark'] {
  --color-bg: #...;
  --color-text-primary: #...;
}
```

- **Never** write hex values directly inside components — the Phase 0 ESLint rule (`no-restricted-syntax`) will block this in CI.
- **Contrast Ratio (WCAG AA):** Every text/background color pair must have a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text/icons. The developer must test every color with a tool such as [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) before adding it to the table above and record the result in `docs/color.md`.

---

## 4. Design Tokens — Typography (Critical Project Note: Bilingual Support)

The project has 4 fonts that must be mapped precisely:

| Font Role                                           | Font             | Language |
| --------------------------------------------------- | ---------------- | -------- |
| Large headings                                      | Oddval           | English  |
| Large headings                                      | Morabba (Square) | Persian  |
| Body text                                           | Satoshi          | English  |
| Body text                                           | IRANSans         | Persian  |
| Numbers (in all contexts, even inside Persian text) | Satoshi          | —        |

### 4.1 Font Loading

Copy the font files from `System_design` into `src/design-system/fonts/` (preferred format: `woff2` for the web). Then define `@font-face`:

```css
/* src/design-system/fonts/fonts.css */

@font-face {
  font-family: 'Satoshi';
  src: url('./satoshi/Satoshi-Variable.woff2') format('woff2');
  font-weight: 300 900;
  font-display: swap;
}

@font-face {
  font-family: 'Oddval';
  src: url('./oddval/Oddval-Bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}

@font-face {
  font-family: 'Morabba';
  src: url('./morabba/Morabba-Bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}

@font-face {
  font-family: 'IRANSans';
  src: url('./iransans/IRANSansX-Variable.woff2') format('woff2');
  font-weight: 300 900;
  font-display: swap;
}
```

> The developer must replace the weights above with the actual weights available in the font files from `System_design`.

### 4.2 Automatic Font Switching Based on Language (Not Manual!)

**Key rule:** Font selection must never be written manually inside a component (`if lang === 'fa'`). It must be applied automatically through CSS based on the `dir`/`lang` attribute on `<html>`:

```css
/* src/design-system/fonts/typography-base.css */

:root {
  --font-heading: 'Oddval', sans-serif;
  --font-body: 'Satoshi', sans-serif;
}

[lang='fa'] {
  --font-heading: 'Morabba', sans-serif;
  --font-body: 'IRANSans', sans-serif;
}

/* Numbers always use Satoshi, even in Persian */
.tabular-nums,
[data-numeric] {
  font-family: 'Satoshi', sans-serif;
  font-feature-settings: 'tnum' 1;
  direction: ltr;
  unicode-bidi: isolate;
}
```

- Any component that displays a number (price, counter, numeric date, time) must add the `data-numeric` class/attribute to that element. This rule must be documented in `STYLEGUIDE.md` (Section 9) so that AI/developers do not forget it.
- `unicode-bidi: isolate` is necessary to prevent the direction of numbers inside an RTL Persian sentence from becoming corrupted.

### 4.3 Type Scale

The table must be completed based on the actual examples in `System_design` (the following values are baseline suggestions, not final values):

```ts
// src/design-system/tokens/typography.ts

export const typography = {
  fontFamily: {
    headingEn: "'Oddval', sans-serif",
    headingFa: "'Morabba', sans-serif",
    bodyEn: "'Satoshi', sans-serif",
    bodyFa: "'IRANSans', sans-serif",
    numeral: "'Satoshi', sans-serif",
  },
  scale: {
    h1: { size: '2.5rem', lineHeight: '1.2', weight: 700 },
    h2: { size: '2rem', lineHeight: '1.25', weight: 700 },
    h3: { size: '1.5rem', lineHeight: '1.3', weight: 600 },
    bodyLarge: { size: '1.125rem', lineHeight: '1.6', weight: 400 },
    body: { size: '1rem', lineHeight: '1.6', weight: 400 },
    caption: { size: '0.875rem', lineHeight: '1.5', weight: 400 },
    small: { size: '0.75rem', lineHeight: '1.4', weight: 400 },
  },
} as const;
```

**Important technical note:** Persian fonts (IRANSans, Morabba) usually require more `line-height` than their Latin equivalents (due to greater character and diacritic height). The developer must define a corrective factor for `[lang="fa"]` if necessary (for example, `line-height: calc(var(--base-lh) * 1.1)`).

---

## 5. Spacing, Radius, Shadow, Breakpoints

```ts
// src/design-system/tokens/spacing.ts
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;
```

```ts
// src/design-system/tokens/radius.ts
export const radius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;
```

```ts
// src/design-system/tokens/breakpoints.ts
export const breakpoints = {
  mobile: '0px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px',
} as const;
```

**Rule:** Spacing values must always be multiples of the `spacing scale` — writing `margin: 13px` or any value outside this table will be rejected in the PR (`no-magic-numbers` from Phase 0 helps enforce this at the code level, but visual review is also required).

---

## 6. Iconography

- Select and lock a single icon set (recommendation: [Lucide](https://lucide.dev) or [Phosphor](https://phosphoricons.com) — both are lightweight, open-source, and have broad coverage). **Mixing two different icon sets in one project is prohibited.**
- Allowed sizes: `16px`, `20px`, `24px`, `32px` — no other size may be used.
- The default `stroke-width` must be defined once and remain consistent everywhere (e.g. `1.5`).
- Icon colors must always use `currentColor`, not hardcoded colors, so they automatically inherit the text color in dark mode and different states.
- The final document in `docs/iconography.md` must include: the name of the selected icon set, the import method (e.g. `import { ChatIcon } from 'lucide-react'`), and a size/usage table.

---

## 7. Logo

The `docs/logo.md` file must include the following (extracted from `System_design`):

- Available formats (preferably SVG for lossless scalability)
- Logo versions: Full logo, Icon-only (for favicon/collapsed sidebar), light and dark versions
- **Clear space:** Minimum allowed space around the logo from other elements (usually defined relative to the logo's own height, e.g. `0.5x` the logo height)
- **Minimum allowed display size** (e.g. the logo must not be rendered below 24px in height because details will be lost)
- Allowed colors on dark/light backgrounds (and whether a monochrome version exists)
- **Prohibited usage:** Asymmetrically stretching the logo, changing its color outside the defined versions, rotating it, or adding shadows/effects without approval.

---

## 8. Accessibility (a11y)

This section must be recorded in `STYLEGUIDE.md` as mandatory rules (not recommendations):

- All text/background colors must comply with WCAG AA contrast requirements (Section 3).
- Every interactive element (button, link, input) must have a clear and visible `focus-visible` state — never write `outline: none` without a replacement.
- All purely visual icons (without accompanying text) must have an `aria-label`.
- The Tab order (keyboard navigation) must be logical and follow the visual order of the page.
- Semantic colors (success/error/warning) must not be the only way to communicate meaning — always accompany them with an icon or text.

---

## 9. `STYLEGUIDE.md` — Design System-Related Coding Rules

This file is the executive summary of all the rules above that developers (and AI models that will write code later) must always have available. Suggested structure for this file:

```markdown
# Style Guide — Mandatory Design System Usage Rules

## Color

- Use only `src/design-system/tokens/colors.ts` or the equivalent CSS variables.
- Never write hex values inside components.

## Typography

- Never write `font-family` directly inside a component; use the defined
  classes (heading/body) or CSS variables (`var(--font-body)`).
- Every numeric element must have `data-numeric`.
- Font sizes must come only from `typography.scale` — not arbitrary px/rem values.

## Spacing

- All margin/padding values must come from `spacing` tokens.

## Icon

- Use only the [name of selected icon set]. Sizes must only use the allowed values (Section 6).

## Component

- Every new component must first be checked in `design-system/primitives`;
  creating a similar component from scratch without documented justification is prohibited.

## Accessibility

- Follow Section 8.
```

---

## 10. Phase 1 Completion Checklist (QA-1)

- [ ] All colors from `System_design` have been extracted and registered in `colors.ts` + `tokens.css`
- [ ] Every text/background color pair has been tested with a contrast tool and the result recorded in `docs/color.md`
- [ ] All 4 fonts (Satoshi, Oddval, Morabba, IRANSans) are placed in `fonts/` and `@font-face` is defined
- [ ] Automatic font switching based on `[lang]` has been tested (one sample page with `lang="fa"` and one with `lang="en"`)
- [ ] The `data-numeric` rule has been implemented and tested on a sample (a Persian number inside an RTL sentence displays correctly)
- [ ] The complete Type Scale is registered in `typography.ts`
- [ ] Spacing, Radius, Shadow, and Breakpoints are defined
- [ ] The icon set has been selected and documented in `docs/iconography.md`
- [ ] Logo rules (clear space, minimum size, versions) are documented in `docs/logo.md`
- [ ] The a11y section has been written in `STYLEGUIDE.md`
- [ ] `STYLEGUIDE.md` is final and complete and covers all the sections above
- [ ] There are no hardcoded hex/px values in design-system files outside token definitions
- [ ] The final commit is registered with the message `docs(design-system): document design tokens and styleguide`

> After the checklist has been fully approved, QA-1 is performed by the project owner (visual review of the tokens against the original `System_design` files). If approved, authorization is given to proceed to **Phase 2 (Frontend Architecture)**.
