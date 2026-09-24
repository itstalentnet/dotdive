# @lemmo-lab/tokens

> **The Single Source of Truth Design Tokens Package for the Lemmo Ecosystem.**  
> Authored in W3C DTCG format, strictly governed by 9 CI automated rules, and engineered for accessible multi-theme consumption.

[![npm version](https://img.shields.io/npm/v/@lemmo-lab/tokens.svg?color=386b00)](https://www.npmjs.com/package/@lemmo-lab/tokens)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI Governance](https://img.shields.io/badge/CI%20Governance-9%20Rules%20Passing-brightgreen.svg)](#-ci-governance-rules)
[![WCAG AA](https://img.shields.io/badge/Accessibility-WCAG%20AA%20%E2%89%A5%204.5%3A1-success.svg)](#-accessibility--contrast-compliance-wcag-aa)

---

## 📑 Table of Contents
- [Architecture Overview](#-architecture-overview)
- [Shipped Themes (Tier 3)](#-shipped-themes-tier-3)
- [Installation & Quick Start](#-installation--quick-start)
- [Consuming Tokens](#-consuming-tokens)
  - [1. CSS Custom Properties](#1-css-custom-properties)
  - [2. Multi-Theme Switching](#2-multi-theme-switching)
  - [3. Tailwind CSS Preset](#3-tailwind-css-preset)
  - [4. JavaScript & TypeScript](#4-javascript--typescript)
- [CLI Tool (@lemmo-lab/tokens-cli)](#-cli-tool-lemmo-labtokens-cli)
- [Accessibility & Contrast Compliance (WCAG AA)](#-accessibility--contrast-compliance-wcag-aa)
- [Typography & Persian Script Protection](#-typography--persian-script-protection)
- [CI Governance Rules](#-ci-governance-rules)
- [Audit & Parity Guarantee](#-audit--parity-guarantee)

---

## 🌟 Architecture Overview

`@lemmo-lab/tokens` adheres strictly to the **Three-Tier Design Tokens Community Group (W3C DTCG)** model:

```
packages/tokens/src/
├── core/         ← Tier 1: Raw Primitives (Palettes, 4px spacing ladder, radius, motion)
├── semantic/     ← Tier 2: Semantic Contract (--lemmo-surface-*, --lemmo-text-*, --lemmo-border-*)
└── themes/       ← Tier 3: Named Theme Presets (Mapping Tier 1 onto Tier 2 contracts)
```

1. **Tier 1 — Primitives (`core/`)**: Immutable foundation values. Color palettes (dark, light, neon, midnight, brand, status, alpha), spacing (4px rhythm from `0` to `2400`), typography scales, motion curves, and shadow definitions.
2. **Tier 2 — Semantic Contract (`semantic/`)**: Component-facing design tokens. Components never reference raw hex/px values directly; they reference semantic roles (`--lemmo-surface-primary`, `--lemmo-text-primary`, `--lemmo-border-subtle`).
3. **Tier 3 — Themes (`themes/`)**: Multi-theme presets that map raw primitives onto the semantic contract. Themes are strictly cosmetic and bounded; they may never override geometric properties like spacing or layout.

---

## 🎨 Shipped Themes (Tier 3)

`@lemmo-lab/tokens` ships with 4 production-ready, fully accessible theme presets:

| Theme Preset | Environment | Primary Canvas | Elevation / Cards | Key Accent | WCAG Contrast |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **`default`** | Dark Mode (Default) | `#131517` | `#1c1e20` / `#23262a` | Lime `#d1fe17` | 14.02:1 (AAA) |
| **`light`** | Day / Light Mode | `#f8f9fa` | `#ffffff` / `#e9ecef` | LimeContrast `#386b00` | 6.42:1 (AA) |
| **`neon`** | Cyberpunk Contrast | `#08090a` | `#12151a` / `#181c24` | Electric Green `#00ff66` | 13.51:1 (AAA) |
| **`midnight`** | OLED Pure Black | `#000000` | `#0c0c0c` / `#161616` | Minimal White `#ffffff` | 21.00:1 (AAA) |

---

## 📦 Installation & Quick Start

```bash
# Using npm
npm install @lemmo-lab/tokens

# Using pnpm
pnpm add @lemmo-lab/tokens

# Using yarn
yarn add @lemmo-lab/tokens
```

---

## 💻 Consuming Tokens

### 1. CSS Custom Properties

Import the base CSS bundle in your application's entry point (e.g. `index.css`, `App.css`, or `layout.tsx`):

```css
/* Loads base variables, typography, font resets, and default dark theme */
@import "@lemmo-lab/tokens/css/variables.css";
```

All variables use the official, standardized prefix:
```css
.card {
  background-color: var(--lemmo-surface-primary);
  color: var(--lemmo-text-primary);
  border: 1px solid var(--lemmo-border-subtle);
  border-radius: var(--lemmo-radius-card);
  padding: var(--lemmo-space-400);
}
```

---

### 2. Multi-Theme Switching

To enable theme switching, import the modular theme stylesheets:

```css
/* Option A: Import all themes bundled */
@import "@lemmo-lab/tokens/css/themes";

/* Option B: Import individual themes on demand */
@import "@lemmo-lab/tokens/css/themes/light.css";
@import "@lemmo-lab/tokens/css/themes/neon.css";
@import "@lemmo-lab/tokens/css/themes/midnight.css";
```

Activate themes dynamically by setting `data-theme` on the root `<html>`, `<body>`, or any nested container:

```html
<!-- Default Dark Mode -->
<html>

<!-- Day / Light Mode -->
<html data-theme="light">

<!-- Neon Preset -->
<html data-theme="neon">

<!-- Midnight OLED Preset -->
<html data-theme="midnight">
```

---

### 3. Tailwind CSS Preset

`@lemmo-lab/tokens` includes a first-class Tailwind CSS preset compatible with Tailwind v3 and v4:

```javascript
// tailwind.config.js
import lemmoPreset from '@lemmo-lab/tokens/tailwind';

export default {
  presets: [lemmoPreset],
  content: [
    './src/**/*.{js,jsx,ts,tsx,vue,svelte,html}',
  ],
  // Your customizations...
};
```

You can now use utility classes matching the design system:
```html
<div class="bg-[var(--lemmo-surface-primary)] text-[var(--lemmo-text-primary)] rounded-[var(--lemmo-radius-card)] p-4">
  <button class="bg-[var(--lemmo-interactive-primary-background)] text-[var(--lemmo-interactive-primary-foreground)]">
    Submit
  </button>
</div>
```

---

### 4. JavaScript & TypeScript

Strongly typed token definitions for React, Vue, Svelte, or Node.js services:

```typescript
import { tokens, themes } from '@lemmo-lab/tokens';

// Access theme-specific semantic contracts
const currentTheme = themes.light;
console.log(currentTheme.color.surface.primary.background); // "#ffffff"

// Access primitive scale values
console.log(tokens.core.spacing[400]); // "1rem"
console.log(tokens.core.radius.base);  // "0.5rem"
```

---

## 🛠️ CLI Tool (`@lemmo-lab/tokens-cli`)

For projects that require standalone extraction, scaffolding, or theme inspection:

```bash
# Launch the interactive setup wizard
npx @lemmo-lab/tokens-cli install

# Install only the Light theme to a specific folder
npx @lemmo-lab/tokens-cli install --theme light --out ./src/styles/tokens

# Compare token differences between two themes
npx @lemmo-lab/tokens-cli diff default light

# Scaffold a new theme adhering to DTCG rules
npx @lemmo-lab/tokens-cli add-theme ocean
```

---

## ♿ Accessibility & Contrast Compliance (WCAG AA)

- **Lime Light-Theme Contrast Fix**: Traditional brand lime (`#d1fe17`) drops to `1.28:1` on light backgrounds. To guarantee strict accessibility, `@lemmo-lab/tokens` introduces `color.brand.limeContrast` (`#386b00`), providing **6.42:1** contrast against white (`#ffffff`) and **6.09:1** against off-white (`#f8f9fa`), exceeding WCAG AA minimums.
- **Mandatory Token Pairing**: Every `*-background` token is guaranteed to ship with a paired `*-foreground` token verified to satisfy at least **4.5:1** contrast across all 4 themes.
- **Delta-E Discriminability (Delta-E >= 2.0)**: Eliminates imperceptible color duplicates (e.g. merging `#131416` into `#131517`).

---

## 🔤 Typography & Persian Script Protection

- **Proportional Unitless Line-Heights**: All line-heights are defined as unitless ratios (`1.25`, `1.43`, etc.) ensuring proper scaling when font sizes change.
- **Persian Glyphic Integrity**: Negative letter-spacing breaks cursive Persian and Arabic connections (Nastaliq & Naskh). In `@lemmo-lab/tokens`, tracking is strictly reset to `letter-spacing: normal` under `:root[lang="fa"], [lang="fa"]`.
- **Decoupled Display Stack**: Hero font `Oddval` is isolated into `--lemmo-font-display`, preventing unintentional font fallbacks.

---

## 🛡️ CI Governance Rules

Every token commit is validated automatically against 9 strict governance rules:

1. **Cosmetics vs. Geometry**: Themes may only override visual aesthetics (color, base radius, shadow, font, motion). Geometry (spacing, layout, width) is strictly forbidden in themes.
2. **Mandatory Paired Tokens**: Background tokens must have matching foreground tokens.
3. **Relative Radius Scale**: Radius scales must be derived from `--radius-base` via `calc()`.
4. **Zero Orphan Tokens**: All Tier 2 semantic keys must resolve in every shipped theme.
5. **W3C DTCG Compliance**: All source tokens require `$type` and `$value`.
6. **Minimum Contrast**: Paired foreground/background tokens must satisfy WCAG AA contrast (>= 4.5:1).
7. **Color Discriminability**: Adjacent palette steps must maintain Delta-E CIE76 >= 2.0.
8. **Zero Raw Hex in Gradients**: All 26 gradients must be 100% tokenized via `{...}` aliases per theme.
9. **Zero `lemu` Policy**: The legacy prefix `--lemu-*` is permanently eliminated in favor of `--lemmo-*`.

Run validator locally:
```bash
pnpm validate
```

---

## 📊 Audit & Parity Guarantee

`@lemmo-lab/tokens` is verified to be in **100% complete synchronization** with `System_design`. All 361 CSS variables, brand gradients, typography scales, and responsive breakpoints match with zero missing tokens and zero drift.

For technical deep-dives:
- [Audit & Parity Report](https://github.com/lemmo-lab/tokens/blob/main/docs/audit-system-design-sync.md)
- [Executive Architecture Decisions](https://github.com/lemmo-lab/tokens/blob/main/docs/EXECUTIVE-AUDIT-REPORT.md)

---

## 📄 License

MIT © [Lemmo Lab](https://github.com/lemmo-lab)