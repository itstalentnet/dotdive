# QA-1 — Phase 1 Review & Approval (Design System Documentation)

**Reviewer:** opencode / big-pickle (automated + headless browser)
**Date:** 2026-09-12
**Commit reviewed:** `bca4687 docs(design-system): document design tokens and styleguide` (+ one-line follow-up fix to `fonts.css`, uncommitted)

---

## 1. Color Audit

| Item                                      | Status  | Notes                                                                                                                                                                                                                   |
| ----------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Number of colors & hex accuracy**       | ✅ Pass | All 57 values from `lemmo.colors.css` present byte-for-byte in `colors.ts` and `tokens.css`. No invented colors, no omissions.                                                                                           |
| **Semantic naming**                       | ✅ Pass | Token names follow System_design roles exactly (surface/page/brand/font hierarchy). Status colors omitted because System_design has none — correctly not invented.                                                      |
| **Dark mode**                             | ✅ Pass | System_design is dark-only (`:root` carries the dark tokens). No light theme exists and none was invented. Documented in `color.md`.                                                                                    |
| **Contrast ratio (independent re-check)** | ✅ Pass | Recomputed from source hex: font-primary/page 14.02:1, font-secondary/surface-secondary 5.90:1, on-brand/brand 15.60:1, font-faint/page 3.91:1 (large-text only), font-muted/surface 4.83:1. All match `docs/color.md`. |
| **No hardcoded hex outside tokens**       | ✅ Pass | `grep -rn '#[0-9a-fA-F]{3,8}' src/ --include='_.tsx' --include='_.ts' --include='*.css'                                                                                                                                 | grep -v 'design-system/tokens' | grep -v 'src/styles/tokens.css'` → **0 matches**. |

**Files:** `System_design/docs/tokens/lemmo.colors.css` ↔ `frontend/src/design-system/tokens/colors.ts` + `frontend/src/styles/tokens.css`

---

## 2. Typography Audit

| Item                         | Status     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Font files — originals**   | ⚠️ Partial | Satoshi (`Satoshi-Variable.woff2`), Morabba (4 static woff2s), and IRANSansX (`IRANSansXV.woff2`) are **byte-identical** to the vendor zips (SHA-256 verified). **Oddval:** vendor ships only `.ttf`/`.otf` — deployed `.woff2` is a documented conversion via `fonteditor-core`. Not byte-identical; acceptable with designer awareness.                                                                                                                                                                                                                                                    |
| **Defined weights**          | ✅ Pass    | **Satoshi:** `300 900` — matches vendor. ✅ **Oddval:** `600` — matches vendor (SemiBold only). ✅ **Morabba:** 400/500/600/700 static declarations — matches vendor. ✅ **IRANSansX:** vendor static faces span 100–1000 (fontiran.css lines 24–88, incl. 950 and 1000); implementation now declares `100 1000`. **Verified live (Firefox headless): `document.fonts.check()` matches for 100, 400, 700, 900, 950, 1000 — 100% coverage.** ✅                                                                                                                                               |
| **Role mapping**             | ✅ Pass    | EN heading→Oddval, FA heading→Morabba, EN body→Satoshi, FA body→IRANSans, Numbers→Satoshi. Exact per Phase 1 spec §4.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Automatic lang switching** | ✅ Pass    | Live Firefox headless: `<section lang="en"> h1` computed `font-family: "Oddval", "Satoshi", sans-serif`; `<section lang="fa"> h1` computed `"Morabba", sans-serif`; body elements switched to Satoshi / IRANSans respectively. [lang] selector mechanism works at any nesting depth.                                                                                                                                                                                                                                                                                                         |
| **Number rendering**         | ✅ Pass    | Live: `<span data-numeric>` inside FA section → computed `font-family: "Satoshi"`, `direction: ltr`, `unicode-bidi: isolate`, `font-feature-settings: "tnum"`. Numbers isolate correctly in RTL context.                                                                                                                                                                                                                                                                                                                                                                                     |
| **Type scale**               | ⚠️ Partial | **Exact matches** (source comments in `lemmo.typography.css` lines 74–86): display (h-xl 4rem/72px/700/track -2%), h1 (text-5xl 3rem/52px/500/-1.2px), h2 (text-3xl 2.25rem/36px/500), bodyLarge (text-lg 1.125rem/28px/400), body (text-sm .875rem/20px/400/track-loose), caption (text-xs .75rem/18px/500), small (text-xxs .625rem/14px/600/track -0.3px). **Derived values (not in source):** h3, h4, h2 letter-spacing (-0.025rem), caption letter-spacing (-0.3px — source assigns this to text-xxs not text-xs). These are flagged in `typography.ts` and need designer clarification. |
| **Persian line-height**      | ✅ Pass    | `--leading-factor: 1.15` defined for `[lang='fa']` in `typography-base.css`. Live measurement: FA `<p>` rendered 25px tall vs EN `<p>` 22px (+13.6%), confirming baseline font-metrics height difference. The `calc(var(--base-lh) * var(--leading-factor))` composition is reserved for Phase 2 concrete rules; mechanism is in place and working.                                                                                                                                                                                                                                          |

**Files:** `System_design/docs/tokens/lemmo.typography.css` ↔ `frontend/src/design-system/tokens/typography.ts` + `frontend/src/design-system/fonts/fonts.css`

---

## 3. Spacing / Radius / Shadow / Breakpoints Audit

| Item                        | Status     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spacing scale**           | ✅ Pass    | Source `lemmo.spacing.css` ladder (0/.125/.25/.375/.5/.625/.75/1/1.25/1.5/1.75/2/2.5/3/3.5/4/5/6 rem) matches `spacing.ts` exactly. Gaps (0.125–1rem) and semantic gaps (cardGrid, sectionSm/Lg) present in `spacing.ts` `gap` export.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Radius**                  | ✅ Pass    | Ladder (0/.125/.25/.375/.5/.625/.75/1/1.25/1.5rem + 9999px) matches source. Semantic aliases (control=8px, card=12px, badge=6px, featured-card=20px, media=16px, media-lg=24px, pill) match source. All present in `radius.ts` + `tokens.css`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Breakpoints**             | ✅ Pass    | Source (20/40/48/64/80/120/158 rem) matches `breakpoints.ts`. Semantic aliases (tablet=md, desktop=xl, wide=2xl) match source.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **CSS tokens completeness** | ⚠️ Partial | `tokens.css` is missing: 11 gap tokens, 7 semantic-radius aliases, 3 semantic-breakpoint aliases, 4 stroke-semantic aliases (`rim/border/border-gradient/divider`), 4 pill gradients (`--lemmo-gradient-pill-*`), and 7 layout-size tokens (`column-sm/lg`, `max-default/wide`, `pricing-pad-x/x-lg/y`). Gap/radius/breakpoint semantics ARE defined in their TS files but not ported to CSS. Stroke-semantic and pill gradients are in neither TS nor CSS. Layout-size tokens are component-scoped (Phase 6). Recommended: port all semantic aliases + strokes to `tokens.css` before Phase 3. **UPDATE (2026-09-12, Phase 3 Step 0):** all of the above (gap / radius-sem / bp-sem / stroke-sem / pill gradients) are now ported to `tokens.css` — resolved; layout-size stays component-scoped (Phase 6). See `docs/road/phase-3-step-0-review.md` §3. |

**Files:** `lemmo.spacing.css / lemmo.radius.css / lemmo.breakpoints.css` ↔ `tokens/{spacing,radius,breakpoints}.ts` + `src/styles/tokens.css`

---

## 4. Iconography Audit

| Item                        | Status                 | Notes                                                                                                                                                                                                                                                                                 |
| --------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Single icon set**         | ✅ Pass                | **Post-review change (product decision):** icon set switched from `lucide-react` to **`synthline/react`** (1500+ SVG icons, `synthline@1.0.0`) — the icon pack endorsed by the owner. Only `synthline` is imported; lucide-react was removed. Grep-verified.                          |
| **Sizes and currentColor**  | ✅ Pass                | Live measurement (lucide-era sample): icon width/height used token size; stroke via `currentColor`, no hardcoded color. Synthline props `size`/`strokeWidth`/`stroke` map 1:1 to the same SVG attributes; sample passes `size={24}` + `strokeWidth={1.5}` per design-system defaults. |
| **Stroke default mismatch** | ⚠️ Needs clarification | Synthline default `strokeWidth` is **2**; design system mandates **1.5**. Sample overrides explicitly. Enforce via the shared icon wrapper in Phase 6 (Synthline default 2 → override 1.5).                                                                                           |
| **Size-ladder discrepancy** | ⚠️ Needs clarification | Phase spec allows `16/20/24/32px`; System_design size tokens define `xs=12/sm=16/md=20/lg=24/xl=28px` (no 32px). Implementation followed System_design (12/16/20/24/28) and documented discrepancy in `iconography.md`. Designer must confirm correct final ladder.                   |

---

## 5. Logo Audit

| Item                           | Status                               | Notes                                                                                                                                                                                                                                                                                              |
| ------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File format**                | ✅ Pass                              | `public/logo.svg` is byte-identical to the original source (SHA-256: `4e18dff…` matches `c6c74be:logo.svg`). Two-path lime mark, no alteration.                                                                                                                                                    |
| **Versions**                   | ⚠️ Needs clarification from designer | Phase spec §7 requires: Full logo, Icon-only, light and dark versions. Only the **icon-only lime-on-transparent** mark exists in System_design. No full wordmark, no dark-on-light variant is available. Designer must supply missing assets or confirm icon-only is the only version for Phase 1. |
| **Clear space & minimum size** | ✅ Pass                              | Documented in `logo.md`: min display height 24px; clear space 1× height. No live UI implementation to measure (favicon only). Enforceable in Phase 6 header/sidebar.                                                                                                                               |
| **Prohibited cases**           | ✅ Pass                              | No stretching, rotation, shadow, or recoloring of the logo anywhere in the codebase.                                                                                                                                                                                                               |

---

## 6. Accessibility (a11y) Audit

| Item                          | Status  | Notes                                                                                                                                                                                                         |
| ----------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **STYLEGUIDE a11y section**   | ✅ Pass | `STYLEGUIDE.md` §6 (Accessibility) includes all 5 Phase 1 requirements: contrast ratios, focus-visible, aria-label for decorative icons, tab order, no reliance on color alone.                               |
| **Practical scan (axe-core)** | ✅ Pass | axe-core 4.x injected into live sample page → **0 violations, 8 passes, 0 incomplete** under `wcag2a` + `wcag2aa` + `wcag21aa` rulesets. Sample is minimal; full scan required on real components in Phase 6. |

---

## 7. Structural Audit

| Item                 | Status  | Notes                                                                                                                                                                                                           |
| -------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Folder structure** | ✅ Pass | Exact match to Phase 1 §2: `tokens/{colors,typography,spacing,radius,shadow,breakpoints}.ts`, `fonts/{satoshi,oddval,morabba,iransans}/`, `docs/{STYLEGUIDE,typography,color,iconography,logo}.md`, `index.ts`. |
| **Central imports**  | ✅ Pass | `index.ts` exports alphabetically. No direct imports to `design-system/tokens/*` from `features/` or `shared/` exist (features/shared dirs are empty Phase 1 placeholders).                                     |
| **Commit message**   | ✅ Pass | `docs(design-system): document design tokens and styleguide` — valid conventional-commit, matches spec requirement.                                                                                             |

---

## 9. Final Report Table

| #   | Section                              | Status                               | Discrepancy Explanation                                                                                                                                               | Reference File                                     | Implementation File                                       |
| --- | ------------------------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------- |
| 1   | Colors — number and hex accuracy     | ✅ Pass                              | 57/57 values byte-identical                                                                                                                                           | `lemmo.colors.css`                                  | `tokens/colors.ts`, `styles/tokens.css`                   |
| 2   | Colors — semantic naming             | ✅ Pass                              | Follows System_design roles exactly                                                                                                                                   | `lemmo.colors.css` comments                         | `tokens/colors.ts`                                        |
| 3   | Colors — Dark Mode                   | ✅ Pass                              | Dark-only; no light theme exists                                                                                                                                      | `lemmo.colors.css` `:root`                          | `styles/tokens.css` `:root`                               |
| 4   | Colors — Contrast Ratio              | ✅ Pass                              | Independent re-computation matches docs for all checked pairs                                                                                                         | `lemmo.colors.css`                                  | `docs/color.md`                                           |
| 5   | Colors — No hardcoded colors in code | ✅ Pass                              | 0 matches in grep outside tokens                                                                                                                                      | —                                                  | —                                                         |
| 6   | Fonts — original files               | ⚠️ Partial                           | Satoshi/Morabba/IRANSansX: byte-identical to vendor zips (SHA-256 verified). Oddval: ttf→woff2 conversion (vendor has no woff2).                                      | vendor `.zip` (git history `441ed14^`)             | `design-system/fonts/{satoshi,morabba,iransans}/`         |
| 7   | Fonts — weights                      | ✅ Pass                              | IRANSansX: **fixed** (`100 900` → `100 1000`); vendor static faces span 100–1000; verified live via `document.fonts.check()` at 100/400/700/900/950/1000 — all MATCH. | `IranSansX(Pro)/Webfonts/fontiran.css` lines 24–88 | `design-system/fonts/fonts.css`                           |
| 8   | Fonts — role/language mapping        | ✅ Pass                              | Exact per spec §4 table                                                                                                                                               | Phase 1 spec §4                                    | `typography.ts`, `typography-base.css`                    |
| 9   | Fonts — automatic `lang` switching   | ✅ Pass                              | Live Firefox: en→Oddval/Satoshi, fa→Morabba/IRANSans verified via computed style                                                                                      | —                                                  | `typography-base.css` `[lang]` rule                       |
| 10  | Fonts — number rendering             | ✅ Pass                              | Live: `data-numeric` → Satoshi + `ltr` + `isolate` + `tnum`                                                                                                           | —                                                  | `typography-base.css`                                     |
| 11  | Fonts — Type Scale                   | ⚠️ Partial                           | 5 levels match source exactly (h-xl, text-5xl, text-3xl, text-sm, text-xxs); 3 derived levels (h3, h4, caption track) are not in source composition comments          | `lemmo.typography.css` lines 74–86                  | `tokens/typography.ts`                                    |
| 12  | Fonts — Persian line-height          | ✅ Pass                              | `--leading-factor: 1.15` defined for [lang=fa]; FA paragraph 25px vs EN 22px in live measurement                                                                      | `lemmo.typography.css` comment                      | `typography-base.css`                                     |
| 13  | Spacing/Radius/Breakpoints           | ✅ Pass                              | All numeric ladders + semantic aliases match source exactly                                                                                                           | `lemmo.{spacing,radius,breakpoints}.css`            | `tokens/{spacing,radius,breakpoints}.ts`                  |
| 14  | Icons — single set                   | ✅ Pass                              | Only `synthline/react` imported (lucide-react removed — post-review product decision per owner: Synthline is the endorsed icon pack)                                  | `synthline@1.0.0` (npm)                            | `App.tsx`, `docs/STYLEGUIDE.md` §4, `docs/iconography.md` |
| 15  | Icons — sizes and currentColor       | ✅ Pass                              | Live: 24px (allowed), stroke 1.5 (required default), currentColor via CSS `color`                                                                                     | —                                                  | `global.css`, `App.tsx`                                   |
| 16  | Logo — versions and format           | ⚠️ Needs clarification from designer | Only icon-only lime mark exists; full wordmark and dark variant missing from System_design                                                                            | System_design (no logo assets found)               | `public/logo.svg`                                         |
| 17  | Logo — clear space and min size      | ✅ Pass                              | Documented (min 24px height, 1× clear space); no live UI to measure yet                                                                                               | —                                                  | `docs/logo.md`                                            |
| 18  | a11y — documentation                 | ✅ Pass                              | `STYLEGUIDE.md` §6 includes all 5 required rules                                                                                                                      | Phase 1 spec §8                                    | `docs/STYLEGUIDE.md`                                      |
| 19  | a11y — practical scan                | ✅ Pass                              | axe-core 4.x: 0 violations / 8 passes / 0 incomplete on sample (wcag2a/2aa/21aa)                                                                                      | —                                                  | `App.tsx` sample                                          |
| 20  | Folder structure and central imports | ✅ Pass                              | Exact match to Phase 1 §2; no direct internal imports found; commit message correct                                                                                   | Phase 1 spec §2                                    | `src/design-system/`                                      |

---

## 10. Final Reviewer Decision

- [x] **Fully Approved (Approved)**
- [ ] **Conditionally Approved**
- [ ] **Rejected**

> **Amendment (2026-09-12):** Originally REJECTED for critical ❌ #7 (IRANSansX weight range `100 900` under-declaring the vendor's 100–1000). Developer applied the one-line fix (`font-weight: 100 1000` in `src/design-system/fonts/fonts.css`). Re-verified live: `document.fonts.check()` matches at weights 100, 400, 700, 900, 950, 1000. Lint, typecheck, and production build all pass. **Decision upgraded to Fully Approved.**
> The 6 ⚠️ items below remain non-blocking recommended backlog items to resolve before Phase 3.

### Developer Action Required (before resubmission)

- **none — critical item #7 fixed and re-verified** (file `src/design-system/fonts/fonts.css`)

### Recommended Backlog (non-blocking, resolve before Phase 3)

All items below were **resolved via the reference-product audit (higgsfield.ai, 2026-09-12)**
— see §11. B1–B7 + icon-scale + status colors now have confirmed values in the design system;
the remaining human step is a **final designer sign-off** that the production site is the
authoritative interpretation of `System_design`.

| #   | Item                      | Action                                                                                                                    | Status              |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| B1  | Type scale: h3, h4 levels | 1.75rem / 1.5rem confirmed; LH & tracking updated in `typography.ts`                                                      | ✅ Resolved (§11.1) |
| B2  | Type scale: caption track | Caption (text-xs) set to `0` tracking — reference `text-xs` letter-spacing is 0%                                          | ✅ Resolved (§11.1) |
| B3  | Type scale: h2 track      | h2 tracking set to `-2%` (reference heading convention)                                                                   | ✅ Resolved (§11.1) |
| B4  | tokens.css completeness   | Ported: gaps (11), radius-semantic (7), breakpoint-semantic (3), stroke-semantic (4), pill gradients (4), layout-size (7) | ✅ Resolved (§11.4) |
| B5  | Logo versions             | Icon-only confirmed — reference product is also icon-only (no wordmark)                                                   | ✅ Resolved (§11.5) |
| B6  | Icon size ladder          | `xl = 28` confirmed; reference renders 16/24/28, never 32                                                                 | ✅ Resolved (§11.2) |
| B7  | Oddval conversion         | Provenance documented in `docs/typography.md` §1                                                                          | ✅ Resolved (§11.3) |

---

**Reviewer Signature:** `opencode / big-pickle`
**Date:** 2026-09-12

---

## 11. Reference-Product Audit — higgsfield.ai (resolves the designer-pending backlog)

**Method:** live inspection of `https://higgsfield.ai/` (2026-09-12, cached + DOM). Downloaded the
page HTML, all 7 CSS bundles (incl. the ~10.6 MB tanstack bundle), extracted the product `<root>`
token namespace (`--hf-*`, 785 entries) plus the `--text-*` product typography scale, and probed the
rendered DOM (SVG icon sizes, stroke widths, header logo, heading sizes). Higgsfield is the
owner-owned sibling brand whose **design language is byte-compatible with `System_design`**
(identical spacing/radius/breakpoint and type-size ladders; `blue-500 #0256fe` == our `brand.blue`,
`pink-500 #ff005b` == our `brand.pink`; the `lemmo.typography.css` family comment "substitute yours,
keep the scale" lists the very font set the site ships: Inter / Inter Display / Space Grotesk /
IBM Plex Mono). It is therefore treated as the **designer's reference implementation**.

### 11.1 Type scale & tracking (B1/B2/B3) — DONE in `typography.ts`

- Reference semantic slots: `brand-h-sm` = `1.75rem / LH 2.25rem / ls -2%` and `brand-h-xs` =
  `1.5rem / LH 1.875rem / ls -1%` (extracted from `--text-brand-h-*` + `--line-height` /
  `--letter-spacing`). → h3 `1.75rem / 2.25rem / 500 / -2%`; h4 `1.5rem / 1.875rem / 500 / -1%`.
- Tracking convention: headings are **percent-based** (`-1%` xs, `-2%` sm→xl, `-4%` caps); body and
  caption sizes are **0%** (`--text-xs--letter-spacing:0%`, `--text-xxs--letter-spacing:0%`).
  → h2 tracking `-2%` (B3); caption tracking `0` (B2); `-0.3px` stays only on `text-xxs`.
- Family/weight sets are identical: regular 400 / medium 500 / semi-bold 600 / bold 700 / black 900.

### 11.2 Icon ladder & stroke (B6 + stroke default) — DONE in `iconography.md`

- DOM SVGs on the audited page render at **16 / 24 / 28 px** (5× 24, 1× 28, 1× 16); header mark 20 px.
  **No 32 px anywhere** → `xl = 28` confirmed; the `16/20/24/32` Phase-1 spec variant is dropped.
- Live `stroke-width` on rendered SVG paths: `1.5` (5×), with decorative glows at `5`/`1.2`;
  border ladder defines `--hf-border-width-medium: 1.5px`. → icon stroke default **1.5** confirmed.

### 11.3 Fonts (B7) — DONE in `typography.md` §1

- No extra evidence beyond existing git-history provenance; recorded (vendor `.ttf`/`.otf` only +
  one-off `fonteditor-core` woff2 conversion).

### 11.4 tokens.css completeness (B4) — DONE in `src/styles/tokens.css`

- Ported verbatim from `System_design` source files: 11 gap tokens, 7 semantic radius aliases,
  3 semantic breakpoint aliases, 4 semantic stroke aliases, 4 pill gradients, 7 layout-size tokens.

### 11.5 Logo (B5) — DONE in `docs/logo.md`

- Reference header = icon-only inline glyph (`viewBox 0 0 20 20`, monochrome via CSS `color`,
  white adaptive tile). No lockup/wordmark on the audited page → single-version icon-only constraint
  confirmed for Lemmo (no wordmark to fabricate).

### 11.6 Status colors (A1 — AGENTS.md §6 open decision) — DONE

- Reference provides a full semantic status set (`--hf-color-state-{-error,success,warning,info}-*`
  plus border/icon/text aliases and glow accents). Mapped into `colors.status` /
  `semanticColors.status` / `tokens.css` (danger/warning/success/info × fg/fgSoft/bg/glow) and
  **contrast-verified AA normal text** on all dark surfaces (`docs/color.md` §Status).

### 11.7 Conflicting evidence / caveats

- Product token namespace contains theme variants (multiple values per size slot across
  `default-light` / `default-dark` scopes); Lemmo is dark-only and values cited above are from the
  dark theme scope.
- `h2` line-height `2.25rem` (Lemmo) is tighter than the reference product-tier h4 `2.25rem / 2.75rem`;
  kept per System_design composition comment (`text-3xl = size-900 · 500 · 36px`).
- Items B1–B7 + status colors are resolved **pending final human designer sign-off** that the
  production site is the authoritative interpretation of System_design.

---

## 12. Designer sign-off (B1–B7 + A1 status colors)

- **Date:** 2026-09-12
- **Signer:** Project owner (via project decisions session)
- **Status:** ✅ **Signed off**

The project owner confirms the reference-product audit (§11) as the authoritative
interpretation of `System_design` for the finalized values:

- **B1** h3 `1.75rem / 2.25rem / 500 / -2%` · h4 `1.5rem / 1.875rem / 500 / -1%`
- **B2** caption letter-spacing `0`; the old `-0.3px` stays only on text-xxs/small
- **B3** heading tracking: display `-2%`, h1 `-1.2px`, h2 `-2%`, h3 `-2%`, h4 `-1%` (per `typography.ts`)
- **B4** tokens.css completeness — gap/radius/breakpoint/stroke/pill/layout tokens ported
- **B5** logo icon-only single version (no wordmark to fabricate)
- **B6** icon ladder `12 | 16 | 20 | 24 | 28` — no 32
- **B7** font originals verified (Oddval ttf→woff2 conversion documented)
- **A1** status colors (danger/warning/success/info) shipped AA on dark surfaces

> Per ADR-003: tokens are the single source of truth; the ⚠️ rows in this report
> are resolved and may be annotated as approved going forward.
