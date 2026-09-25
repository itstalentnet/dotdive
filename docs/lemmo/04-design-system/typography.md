| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Typography, Font Stacks & Type Scale Rules |
| **Title (FA)** | تایپوگرافی، فونت‌ها و قوانین مقیاس و زبان در دیزاین سیستم |
| **ID** | DOC-DS-003 |
| **Category** | `design-system` |
| **Status** | `Active` |
| **Owner** | Design System Team |
| **Last Updated** | 2026-09-16 |
| **Summary (EN)** | Typography specifications, font loading (Satoshi, Oddval), type scale ladder, and language switching rules. |
| **Summary (FA)** | مشخصات تایپوگرافی، فونت‌های انگلیسی ساتوشی و اودوال، مقیاس اندازه متون و سوئیچ خودکار زبان. |
| **Tags** | `design-system`, `typography`, `fonts`, `scale`, `bilingual` |

---

# Typography — Fonts, Scale & Language Rules

> Font files live in `src/design-system/fonts/.` — see `fonts.css` for the `@font-face` declarations.
> Auto-switching base: `src/design-system/fonts/typography-base.css`.
> JS tokens: `src/design-system/tokens/typography.ts`.

---

## 1. Font set (4 fonts, one job each)

| Font                      | Weights            | Role                             | Subject              |
| ------------------------- | ------------------ | -------------------------------- | -------------------- |
| **Satoshi** (variable)    | 300–900 + italic   | Body / numerals / anything latin | English primary font |
| **Oddval** (SemiBold)     | 600 only           | Display / large headings         | English headings     |
| **Morabba**               | 400–700 (4 static) | Display / large headings         | Persian headings     |
| **IRANSans** (X variable) | 100–1000           | Body                             | Persian body         |

- **Oddval ships only 600** (vendor constraint, confirmed). It is reserved for **large headings** —
  never body-size text.
  > **Provenance (QA-1 backlog B7):** the vendor zip ships `.ttf`/`.otf` only; the deployed
  > `Satoshi-Variable`-style `.woff2` is a one-off conversion via `fonteditor-core` (git history
  > `441ed14^`). Keep the byte-identical vendor files for the other three fonts; re-run conversion
  > only if the vendor ships an official woff2.
- Morabba is a **blackweight display face** — small/mid text stays in IRANSans.
- English always prefers Satoshi; Persian always prefers Morabba (heading) / IRANSans (body).

## 2. The language rule — no branching in components

Font switching is **automatic** via the `[lang]` attribute (see `typography-base.css`):

```css
[lang='fa'] {
  --font-heading: 'Morabba', sans-serif;
  --font-body: 'IRANSans', sans-serif;
  --leading-factor: 1.15;
}
```

- The document/container sets `lang` once (e.g. `<html lang="fa" dir="rtl">` or a nested `[lang='fa']` section).
- Components consume `var(--font-heading)` / `var(--font-body)` and **never** ask "what language am I?".

## 3. Numbers always in Satoshi — `data-numeric`

Persian/Arabic text runs RTL, but digits/latin stats must stay LTR and render in **Satoshi** to match brand
numeral rendering. Rule enforced in `typography-base.css`:

```css
[data-numeric] {
  font-family: var(--font-numeric);
  font-feature-settings: 'tnum' 1;
  direction: ltr;
  unicode-bidi: isolate;
}
```

**Every** numeric element (price, counter, date, time, stat, table cell numbers, percentages) must carry
`data-numeric` (or class `tabular-nums`). This is failure-prone at scale — QA-1 must spot-check Persian
sections for `data-numeric` coverage.

## 4. Persian line-height factor

Persian fonts need extra leading for diacritics. `typography-base.css` sets `--leading-factor` to `1` (en) and
`1.15` (fa). Compose lines as `line-height: calc(var(--base-lh) * var(--leading-factor))` where the semantic
value uses the token ladder. Calculated values are applied by the type-scale primitives, never hardcoded.

## 5. Type scale (from System_design, verified)

Absolute sizes (see tokens for the full ladder):

| Size token  | Value             | Typical use             |
| ----------- | ----------------- | ----------------------- |
| `size-050`  | `.625rem` / 10px  | xxs labels, table heads |
| `size-100`  | `.75rem` / 12px   | captions, badges        |
| `size-200`  | `.875rem` / 14px  | **Default body text**   |
| `size-300`  | `1rem` / 16px     | Lead text, inputs       |
| `size-400`  | `1.125rem` / 18px | text-lg                 |
| `size-500`  | `1.25rem` / 20px  | small headings          |
| `size-600`  | `1.5rem` / 24px   | h4                      |
| `size-700`  | `1.75rem` / 28px  | h3                      |
| `size-800`  | `2rem` / 32px     | h2 smaller              |
| `size-900`  | `2.25rem` / 36px  | h2 (text-3xl)           |
| `size-1000` | `2.5rem` / 40px   | h1 smaller              |
| `size-1100` | `3rem` / 48px     | h1 (text-5xl 48/52)     |
| `size-1200` | `3.5rem` / 56px   | section heading         |
| `size-1300` | `4rem` / 64px     | hero / display          |
| `size-1400` | `4.5rem` / 72px   | large display           |

> **Semantic slots confirmed (QA-1 backlog B1):** h3 = `size-700` (1.75rem, LH 2.25rem) and
> h4 = `size-600` (1.5rem, LH 1.875rem) were verified against the reference product
> (higgsfield.ai `--hf-type-size-*`; its `brand-h-sm` = 1.75rem, `brand-h-xs` = 1.5rem).

Line-height ladder (rem): 1 · 1.125 · 1.25 · 1.5 · 1.75 · 2 · 2.25 · 2.5 · 2.75 · 3 · 4 · 4.5 —
paired to sizes by the composite `scale` table in `typography.ts`.

## 6. Weights

`regular 400` · `medium 500` · `cta 510` (brand CTA, from System_design) · `semi-bold 600` ·
`bold 700` · `black 900`. Interpolated for variable fonts (Satoshi, IRANSansX).

## 7. Letter-spacing

Ladder tokenized in `typography.track`. Resolved against the reference product (higgsfield.ai,
2026-09-12 audit) — QA-1 backlog B2/B3.

Actual letter-spacing per `typography.scale` (authoritative — do not guess "in your head"):

- **Headings are negative tracking, mostly percent-based, with one pixel exception:**
  display = `-2%`, **h1 = `-1.2px`** (pixel track `5xl`, NOT `-2%`), h2 = `-2%`,
  h3 = `-2%`, h4 = `-1%`; caps = `-4%`.
- **Body sizes are slightly loose, not 0:** body / bodyLarge = `0.00625rem` (track-loose).
- **Caption has NO tracking (`0`).** Reference product sets `letter-spacing` on `text-xs` to `0%`.
  The old `-0.3px` on caption (text-xs) was removed (B2).
- **small (text-xxs) = `-0.3px`** — belongs only to `text-xxs` per the System_design
  composition comment.
- Table heads keep `-0.56px`.
- Do not improvise tracking values; use the ladder.
