| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Iconography Standards & Synthline Rules |
| **Title (FA)** | استانداردهای آیکونوگرافی و قوانین پکیج سینث‌لاین |
| **ID** | DOC-DS-004 |
| **Category** | `design-system` |
| **Status** | `Active` |
| **Owner** | Design System Team |
| **Last Updated** | 2026-09-17 |
| **Summary (EN)** | Synthline icon set specification, sizing ladder (12-28px), stroke-width rules, and accessibility guidelines. |
| **Summary (FA)** | مشخصات پکیج آیکون‌های اختصاصی Synthline، پله اندازه ۱۲ تا ۲۸ پیکسل، ضخامت خطوط و استانداردهای دسترسی‌پذیری. |
| **Tags** | `design-system`, `iconography`, `icons`, `synthline`, `sizes` |

---

# Iconography — Synthline, sizes & rules

## 1. Set lock

- **Synthline** (`synthline/react`) is the **only** icon set.
- Adding another set (Lucide, Font Awesome, Iconify mix, custom SVG components) is prohibited without owner approval.
- If a glyph is missing, request it upstream or document a **branded exception** (see §4) — do not hand-roll one-off SVGs inline in components.

## 2. Sizing ladder

System_design defines an icon size ladder at `--lemmo-size-icon-*` (px):

| Token     | px     | Typical use              |
| --------- | ------ | ------------------------ |
| `icon-xs` | **12** | ultra-compact inline     |
| `icon-sm` | **16** | default inline icon      |
| `icon-md` | **20** | form/control inline icon |
| `icon-lg` | **24** | section / featured icon  |
| `icon-xl` | **28** | large featured icon      |

> **Ladder resolved (QA-1 backlog B6, 2026-09-12):** the reference product (higgsfield.ai)
> renders inline SVGs at exactly **16 / 24 / 28 px** and the header mark at 20 px — **no 32 px**
> anywhere on the audited page. `xl = 28` is confirmed (System_design), `32` is dropped.
> Final ladder `12 | 16 | 20 | 24 | 28`.

## 3. Rendering rules

1. **Color:** always `currentColor` — icons inherit text/button color. Never hardcode an icon color.
2. **Stroke:** `stroke-width="1.5"` (set once in a shared Icon wrapper; Synthline default is 2 → override).
   > Confirmed against reference product DOM: `stroke-width="1.5"` is the live production value
   > (audit 2026-09-12); its token ladder also defines `--hf-border-width-medium: 1.5px`.
3. **Size:** from the ladder above via the wrapper (size prop restricted to the full ladder
   `12 | 16 | 20 | 24 | 28` in TS types; `12` is the ultra-compact inline size, keep it for
   dense list/table contexts — no other value).
4. **Decorative icons** without adjacent text need `aria-label` (or `aria-hidden="true"` when the
   adjacent text already conveys meaning).
5. Icon inside a button/control carries `aria-hidden` — the button label provides the accessible name.

## 4. Branded icon exception

Brand marks (e.g. logo glyphs, checkout badge icons, offer "flash" marks) are **not Synthline** — they are
brand artwork. Place them under `src/design-system` as `*.svg` components and document each here.
No brand icon may be re-rendered as a Synthline path.
