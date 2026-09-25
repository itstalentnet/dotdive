| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Color Tokens, Semantic Palette & Contrast Audit |
| **Title (FA)** | توکن‌های رنگی، پالت معنایی و گزارش کنتراست |
| **ID** | DOC-DS-002 |
| **Category** | `design-system` |
| **Status** | `Active` |
| **Owner** | Design System Team |
| **Last Updated** | 2026-09-16 |
| **Summary (EN)** | Color tokens, dark theme specification, brand accents, status colors, and WCAG AA contrast compliance. |
| **Summary (FA)** | توکن‌های پالت رنگی تیره، رنگ‌های اکشن برند، رنگ‌های وضعیت و استانداردهای کنتراست دسترسی‌پذیری WCAG AA. |
| **Tags** | `design-system`, `color`, `tokens`, `contrast`, `palette` |

---

# Color — Design Tokens & Contrast Report

> Source of truth: `System_design/docs/tokens/lemmo.colors.css` (+ `gradients`, `elevation`).
> Values in this document were extracted verbatim, not guessed.
> **Status colors** (§5) come from the reference product audit (higgsfield.ai, 2026-09-12) — see §5.
> **Theme:** dark-only. `:root` in `src/styles/tokens.css` _is_ the dark theme.
> JS equivalent: `src/design-system/tokens/colors.ts`.

---

## 1. Semantic palette

| Token (css / ts)                                            | Value                | Role                         |
| ----------------------------------------------------------- | -------------------- | ---------------------------- |
| `--lemmo-color-page-primary` / `colors.page.primary`         | `#131517`            | Standard page background     |
| `--lemmo-color-app-background` / `colors.page.appBackground` | `#131416`            | App shell background         |
| `--lemmo-color-surface-tertiary`                             | `#0f1113`            | Deepest surface              |
| `--lemmo-color-surface-primary`                              | `#1c1e20`            | Card / panel surface         |
| `--lemmo-color-surface-secondary`                            | `#23262a`            | Raised surface               |
| `--lemmo-color-surface-elevated`                             | `#18191c`            | Gradient base (elevated-end) |
| `--lemmo-color-surface-glass`                                | `rgba(15,17,19,.88)` | Glass card                   |
| `--lemmo-color-surface-brand`                                | `#d1fe17`            | **Primary action (lime)**    |
| `--lemmo-color-surface-brand-hover`                          | `#c4ee0b`            | Primary action hover         |
| `--lemmo-color-surface-brand-edge`                           | `#829b19`            | Primary action inset edge    |
| `--lemmo-color-surface-brand-secondary`                      | `#ff005b`            | **Secondary accent (pink)**  |
| `--lemmo-color-font-primary`                                 | `#e1e1e3`            | Primary text                 |
| `--lemmo-color-font-secondary`                               | `#a1a1a5`            | Secondary text               |
| `--lemmo-color-font-muted`                                   | `#898a8b`            | Muted text                   |
| `--lemmo-color-font-faint`                                   | `#737475`            | Faint / placeholder text     |
| `--lemmo-color-font-on-brand`                                | `#131517`            | Text **on** lime             |
| `--lemmo-color-font-reverted`                                | `#060515`            | Near-black textual reverted  |

## 2. Brand accent palette (decorative / special-use only)

| Token                                   | Value                             | Use (from System_design §19) |
| --------------------------------------- | --------------------------------- | ---------------------------- |
| `brand.lime`/`limeHover`/`limeEdge`     | `#d1fe17` / `#c4ee0b` / `#829b19` | Primary CTA stack            |
| `brand.pink` / `pinkLight` / `pinkDeep` | `#ff005b` / `#fb398c` / `#ed1572` | Offers, highlights           |
| `brand.pinkMaroon` / `pinkBase`         | `#d1004e` / `#8b006a`             | Offer gradients              |
| `brand.blue` / `blueLight` / `blueDeep` | `#0256fe` / `#245ef1` / `#1544ed` | Special/detail accents       |
| `brand.cyan` / `cyanSoft` / `cyanGlow`  | `#3c8cff` / `#9ce6f3` / `#3cd8ff` | Table highlight, glow        |
| `brand.violet` / `violetDeep`           | `#853cb0` / `#b02df2`             | Ultraviolet pill             |

## 3. Borders & strokes

| Token                            | Value                                                  |
| -------------------------------- | ------------------------------------------------------ |
| `separator.card`                 | `rgba(217,217,217,.04)`                                |
| `border.soft` / `mid` / `strong` | `rgba(255,255,255,.04)` / `.05` / `.1`                 |
| `border.ghostLight`              | `rgba(6,5,21,.04)`                                     |
| Alpha overlays                   | `whiteAlpha.4…70`, `blackAlpha.4…24` (see `colors.ts`) |

---

## 4. WCAG AA contrast report

> Computed with the standard relative-luminance formula (WCAG 2.1 §1.4.3).
> **AA normal** = ≥ 4.5:1 · **AA large** = ≥ 3:1 (large text ≥ 24px or ≥ 18.66px bold, icons/UI ≥ 3:1).

| Text color               | Background                  |       Ratio | Verdict                               |
| ------------------------ | --------------------------- | ----------: | ------------------------------------- |
| `font-primary #e1e1e3`   | `page #131517`              | **14.02:1** | PASS — normal text                    |
| `font-secondary #a1a1a5` | `page #131517`              |  **7.11:1** | PASS — normal text                    |
| `font-muted #898a8b`     | `page #131517`              |  **5.29:1** | PASS — normal text                    |
| `font-faint #737475`     | `page #131517`              |  **3.91:1** | **LARGE TEXT ONLY** (3:1 ok, < 4.5:1) |
| `font-primary #e1e1e3`   | `surface-primary #1c1e20`   | **12.80:1** | PASS                                  |
| `font-primary #e1e1e3`   | `surface-secondary #23262a` | **11.63:1** | PASS                                  |
| `font-secondary #a1a1a5` | `surface-secondary #23262a` |  **5.90:1** | PASS                                  |
| `font-primary #e1e1e3`   | `surface-tertiary #0f1113`  | **14.49:1** | PASS                                  |
| `font-on-brand #131517`  | `brand #d1fe17`             | **15.60:1** | PASS                                  |
| `font-on-brand #131517`  | `brand-hover #c4ee0b`       | **13.58:1** | PASS                                  |
| `font-reverted #060515`  | `brand #d1fe17`             | **17.21:1** | PASS                                  |

### Consequences (must be followed)

1. **`font.faint` (`#737475`) may be used only for large text, icons/UI graphics (≥3:1), or decorative text.**
   Never for body/caption size text — it fails 4.5:1 on the page background.
2. All other text pairs pass WCAG AA **normal text**.
3. Text on the lime CTA is always `font.onBrand` — never white.

## 5. Status colors

Status colors are now shipped, sourced from the **reference product** `higgsfield.ai`
(owner-owned sibling brand — audit 2026-09-12, live `--hf-color-*` tokens). That product
shares the same design language as `System_design` (identical spacing/radius/breakpoint
and type-size ladders; `blue-500 #0256fe` and `pink-500 #ff005b` are byte-identical to our
`brand.blue` / `brand.pink`). Raw values → `colors.status` / `semanticColors.status` /
`--lemmo-color-status-*` + `--lemmo-{text,border,status}-*` aliases in `tokens.css`.

| State   | Tokens (`fg` / `fgSoft` / `bg` / `glow`)      | Reference (`--hf-color-*`)              |
| ------- | --------------------------------------------- | --------------------------------------- |
| danger  | `#fa0019` / `#ff5462` / `#5c000f` / `#ff1f2e` | red-600/-500/red-1000/red-glow          |
| warning | `#dfab01` / `#ffef33` / `#523f00` / `#fff05a` | yellow-700/-500/yellow-1100/yellow-glow |
| success | `#2eb844` / `#4ee466` / `#0d4a17` / `#00e62e` | green-500/-400/green-800/green-glow     |
| info    | `#0256fe` / `#5b91fe` / `#000d26` / `#3cd8ff` | blue-500/-400/blue-1100/cyan-glow       |

**Usage rule:** dark-only. Text roles (`semanticColors.status.text.*`) must point at the
**bright AA-passing tone** (`fgSoft` for danger/success/info, `fg` for warning). The main
`fg` tone is reserved for borders/glows/banners. Status must **never be the only signal** —
always pair with an icon or label (a11y).

### Contrast (verified 2026-09-12, against dark surfaces)

| Text                     |   page `#131517` | surface `#1c1e20` | surface-2 `#23262a` |
| ------------------------ | ---------------: | ----------------: | ------------------: |
| `danger` text `#ff5462`  |  **5.84:1** PASS |   **5.33:1** PASS |     **4.85:1** PASS |
| `warning` text `#dfab01` |  **8.68:1** PASS |   **7.93:1** PASS |     **7.21:1** PASS |
| `success` text `#4ee466` | **10.99:1** PASS |  **10.04:1** PASS |     **9.13:1** PASS |
| `info` text `#5b91fe`    |  **6.04:1** PASS |   **5.51:1** PASS |     **5.01:1** PASS |

All four status text tones pass **WCAG AA normal text (≥4.5:1)** on every dark surface.
Other raw status tones (`#fa0019` 4.43:1, `#0256fe` 3.28:1 on page) are large-text/icons/UI **only** —
do not set caption-size text in them.

## 6. Dark mode / themes

Product is **dark-only**. `:root` carries the dark values; no `[data-theme='light']` block exists and none may be
invented. If a light theme is ever approved, add a `[data-theme='light']` override block in `tokens.css` and
re-run the contrast table above before merging.
