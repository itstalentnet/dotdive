| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Brand Logo Mark, Icon Assets & Usage Rules |
| **Title (FA)** | نشان لوگوی برند، دارایی‌های آیکون و قوانین استفاده |
| **ID** | DOC-BRAND-001 |
| **Category** | `branding` |
| **Status** | `Active` |
| **Owner** | Brand & Design System Team |
| **Last Updated** | 2026-09-16 |
| **Summary (EN)** | Geometry, 3-dot triad mark, color variations, sizes, SVG assets, and prohibited usages of Lemmo logo. |
| **Summary (FA)** | هندسه نشان ۳ نقطه‌ای، ابعاد مجاز، رنگ‌بندی‌های مجاز و ممنوعیت‌های استفاده از لوگوی Lemmo. |
| **Tags** | `branding`, `logo`, `mark`, `svg`, `assets` |

---

# Logo — Usage & Best Practices

## 1. Mark description

The **Lemmo** mark is a signature triad composed of **three circular dots** forming an upright triangular geometry (file: `public/logo.svg` & `public/logo-mark.svg`, viewport `512×512`). It serves as the canonical **icon-only mark** for the Lemmo brand.

```xml
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M143.836 311.343C174.673 311.343 199.671 336.341 199.671 367.178C199.671 398.015 174.673 423.014 143.836 423.014C112.998 423.014 88 398.015 88 367.178C88 336.341 112.998 311.343 143.836 311.343Z" fill="currentColor"/>
  <path d="M367.178 311.343C398.015 311.343 423.014 336.341 423.014 367.178C423.014 398.015 398.015 423.014 367.178 423.014C336.341 423.014 311.343 398.015 311.343 367.178C311.343 336.341 336.341 311.343 367.178 311.343Z" fill="currentColor"/>
  <path d="M255.507 88C286.344 88 311.343 112.998 311.343 143.836C311.343 174.673 286.344 199.671 255.507 199.671C224.67 199.671 199.671 174.673 199.671 143.836C199.671 112.998 224.67 88 255.507 88Z" fill="currentColor"/>
</svg>
```

## 2. Provided formats

| Asset | Path | Notes |
| :--- | :--- | :--- |
| SVG (source) | `public/logo.svg`, `public/logo-mark.svg` | Vector source, scalable to any resolution |
| Icon Component | `ui/components/icons/lemmo-icons.tsx` | `<LemmoMark />` (solid) and `<LemmoOutlineIcon />` (rings) |
| Favicon | `public/logo.svg` / `public/icon.svg` | Linked as favicon; browsers rasterize cleanly |

## 3. Color usage

1. **On dark canvases** (`--lemmo-color-page-primary` and all dark surfaces): Brand Lime `#D1FE17` or `currentColor`.
2. **On light / brand lime background** (e.g. lime CTA, lime card): The mark must switch to near-black `#060515` (reverted) or `#131517` (on-brand) to preserve WCAG AA 17.21:1 contrast.
3. **Never** tint, gradient, overlay, or recolor the mark with discordant colors — the 3 dots render uniformly.
4. **Clear space:** Maintain proportional padding equal to the radius of a single dot around the bounding box.

## 4. Min & max size

- **Min display size:** **16px** (favicon / dense table inline) — the three circular dots remain distinct down to 16×16px.
- **Max size:** Unrestricted; preserve the `1:1` aspect ratio (`512×512`).

## 5. Prohibited usage

- Altering the spatial relationship between the three dots.
- Removing or adding dots (the triad must remain intact).
- Distorting, skewing, or stretching the aspect ratio.
- Adding arbitrary drop shadows outside the approved `--lemmo-glow-brand-breathe` token.

## 6. On-brand integrity

The 3-dot triad is the single source of truth for the Lemmo brand icon. In components, use the canonical `<LemmoMark />` primitive from `@/components/icons` which defaults to `fill="currentColor"`.
