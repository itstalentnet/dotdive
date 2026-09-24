| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Design System Style Guide & Implementation Standards |
| **Title (FA)** | راهنمای استایل و قوانین الزامی استفاده از دیزاین سیستم Lemmo |
| **ID** | DOC-DS-001 |
| **Category** | `design-system` |
| **Status** | `Active` |
| **Owner** | Design System Team |
| **Last Updated** | 2026-09-16 |
| **Summary (EN)** | Executive summary and mandatory rules for token consumption, colors, typography, spacing, and accessibility. |
| **Summary (FA)** | خلاصه اجرایی و قوانین اجباری استفاده از توکن‌ها، رنگ‌ها، تایپوگرافی، فواصل و دسترسی‌پذیری در کدها. |
| **Tags** | `design-system`, `styleguide`, `tokens`, `rules`, `eslint` |

---

# Style Guide — Mandatory Design System Usage Rules

> This file is the **executive summary** every developer (and AI tool) must read before writing any UI.
> These rules are **mandatory, not recommendations** — CI (ESLint) enforces the machine-checkable ones;
> the rest are enforced by code review (PR checklist). Source of truth: `System_design` (verified in QA-1).

---

## 1. Color

- Use **only** `src/design-system/tokens/colors.ts` or the CSS variables in `src/styles/tokens.css` (`--lemmo-color-*`).
- **Never write hex values inside components.** The Phase-0 ESLint rule `no-restricted-syntax` bans raw hex —
  it is disabled **only** inside `src/design-system/tokens/**`, which is the single allowed place.
- The product is **dark-only** (verified in `System_design`). No light theme exists — do not invent values.
- Semantic role → token mapping (roles, not page names): primary action = `surface.brand` (lime),
  secondary accent = `surface.brandSecondary` (pink), text = `font.*`, card surface = `surface.primary/secondary`.
- Status colors (success/warning/error/info) **are defined** — `semanticColors.status.*` /
  `--lemmo-text-{danger,warning,success,info}` / `--lemmo-status-*-bg` (sourced from the higgsfield.ai
  reference audit — see `docs/color.md` §Status). Text roles use the AA-passing bright tones;
  status must never be the only signal (always pair with icon/text).

## 2. Typography

- **Never write `font-family` directly inside a component.** Use CSS variables `var(--font-heading)` /
  `var(--font-body)` / `var(--font-numeric)` or the token `typography.fontFamily`.
- Font selection is decided by the `lang`/`dir` attribute **automatically** — components never branch on language.
- **Every numeric element** (price, counter, date, time, stat) must have `data-numeric` (or class `tabular-nums`)
  so it renders in Satoshi, LTR and isolated (`digits/numbers must not break inside Persian text`).
- Font sizes come **only** from `typography.scale` / `--lemmo-type-size-*`. No arbitrary rem/px values.
- Headings inherit the heading font via `[class*='heading']` and element selectors — see `typography-base.css`.

## 3. Spacing, Radius, Shadow

- All margin/padding/gap values must come from `spacing` / `gap` tokens (the **4 px ladder**) — e.g. `spacing[400]`
  or `var(--lemmo-space-400)`. Writing `margin: 13px` is rejected (`no-magic-numbers` in CI).
- Radius from `radius` tokens only (`{2,4,6,8,10,12,16,20,24} + pill`).
- Shadows/elevations from `shadow` tokens only — never invent drop-shadows.

## 4. Icon

- Use **only Synthline** (`synthline/react`). Mixing a second icon set is prohibited.
- Allowed sizes: `12 | 16 | 20 | 24 | 28` px (`--lemmo-size-icon-xs/sm/md/lg/xl`); `12` is reserved for
  ultra-compact inline (dense list/table) contexts. No other size
  (`xl = 28` confirmed via reference audit — the reference renders 16/24/28, never 32).
- `stroke-width` is always `1.5` (matches reference production value). Icon color is **always
  `currentColor`** — never a hardcoded color.

## 5. Component

- Before creating any component, check `design-system/primitives` — re-creating a similar component without
  documented justification is prohibited.
- Components never set their own `max-width` (that is the container's job), and sections never set horizontal
  padding for content (that is the container's job) — per `System_design` §21 layering.
- Geometry snaps to the 4 px ladder and radius set — no one-off px values to "fill space".

## 6. Accessibility

- All text/background pairs must meet WCAG AA: **4.5:1** normal text, **3:1** large text/icons
  (verified list in `docs/color.md` — `font.faint` is **large-text only**).
- Every interactive element (button, link, input) needs a **visible `focus-visible`** state —
  never `outline: none` without a replacement.
- Purely visual icons (no adjacent text) need `aria-label`.
- Keyboard tab order must follow the visual order of the page.
- Semantic colors must **never be the only signal** — always pair them with an icon or text
  (success/error/warning are color-agnostic to color-blind users).

## 7. Tokens — the only place for raw values

- Raw values (hex codes, pixel scales, radii, gradients, shadow definitions) are defined **exclusively** inside the proprietary package **`@lemmo-lab/tokens`** (`/home/behroz/Documents/Git/lemu/tokens`).
- In applications (such as `/app`), tokens are imported via `@lemmo-lab/tokens/css/variables.css` (or the mirrored local token file `src/styles/lemmo-tokens.css`).
- ESLint and CI enforce zero hardcoded values outside token definitions. Any new raw color, dimension, or radius _outside_ `@lemmo-lab/tokens` fails CI immediately.

| Topic                         | Source / Doc                                     |
| ----------------------------- | ------------------------------------------------ |
| Token Values & CSS Variables  | `@lemmo-lab/tokens` (`packages/tokens-build/dist/css/variables.css`)|
| Colors + contrast             | `docs/design-system/color.md`                    |
| Fonts + scale                 | `docs/design-system/typography.md`               |
| Icons                         | `docs/design-system/iconography.md`              |
| Logo usage                    | `docs/design-system/logo.md`                     |
| Direction, Layout & UX Rules  | `docs/design-system/interaction-and-layout.md`   |
| Design Decision Principles    | `docs/design-system/design-decision-principles.md`|
| Container & Inheritance Rules | `docs/design-system/container-relationship-and-inheritance.md` |
| Responsive & Composable Layout| `docs/design-system/responsive-decision-principles.md` |
| Assistive Tech & Micro-States | `docs/design-system/assistive-technology-and-microstates.md` |
| Agent-Operable Interfaces     | `docs/design-system/agent-operable-interfaces.md` |

---

## 9. Directionality, Layout & Interaction Framework (DOC-DS-005)

> Full guide and 24 principles: [`docs/design-system/interaction-and-layout.md`](./interaction-and-layout.md).

- **Define relationships, not coordinates:** Always think in terms of `Start / End` and `Leading / Trailing` rather than fixed `Left / Right`.
- **Logical CSS Properties:** Enforce `padding-inline`, `margin-inline`, `inset-inline` rather than directional left/right.
- **Directional vs Non-Directional Icons:** Directional icons (arrows, chevrons, forward/back) mirror in RTL. Non-directional icons (search, edit, delete, settings) maintain their physical shape.
- **Action Hierarchy:** Navigation $\rightarrow$ Tabs $\rightarrow$ Filters $\rightarrow$ Search $\rightarrow$ Contextual Actions $\rightarrow$ Primary Action.
- **Dropdown Semantics:** Semantic attachment to trigger takes priority over physical direction; menus adapt and reposition to prevent viewport clipping.
- **Decision Hierarchy:** `Semantic meaning` $\rightarrow$ `Content relationship` $\rightarrow$ `Reading direction` $\rightarrow$ `Available space` $\rightarrow$ `Responsive adaptation` $\rightarrow$ `Physical position`.
