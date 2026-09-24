---
layout: doc
title: توکن‌های حالت تعاملی (Interactive States)
description: راهنمای مصرف‌کننده برای لایهٔ توکن حالت تعاملی در سیستم طراحی نانس
version: 1.0.0
status: PRIVATE
author: xoxxel
owner: xoxxel
created_at: 2026-07-11
updated_at: 2026-07-11
tags:
  - Frontend
  - Design System
  - Tokens
  - Interactive States
reviewers:
  - Frontend Team
---

# توکن‌های حالت تعاملی — راهنمای مصرف‌کننده
**Interactive State Tokens — Consumer Guide**

نحوهٔ استفاده از **لایهٔ توکن حالت** (state token layer) سیستم طراحی در یک پروژهٔ مصرف‌کننده.
خود توکن‌ها در این مخزن تعریف شده‌اند (`themes/*/yaml → semantic.{light,dark}.interactive`)؛
این فایل توضیح می‌دهد که یک مصرف‌کننده چگونه آن‌ها را اعمال کند.

---

## فهرست محتوا

1. [چه چیزی اضافه شد (در این مخزن)](#چه-چیزی-اضافه-شد-در-این-مخزن)
2. [واژگان توکن → منبع](#واژگان-توکن--منبع)
3. [نحوهٔ اعمال حالت‌ها توسط مصرف‌کننده](#نحوهٔ-اعمال-حالت‌ها-توسط-مصرف‌کننده)
4. [وابستگی به CLI (پیگیری GAP-REPORT)](#وابستگی-به-cli-پیگیری-gap-report)

---

## چه چیزی اضافه شد (در این مخزن)

هر تم اکنون یک بلاک معنایی `interactive` نمایش می‌دهد — یک ماتریس **نقش × حالت** که فقط به
اولیه‌های موجود در Registry ارجاع می‌دهد. حالت‌ها فراگیر هستند (نه به‌ازای هر کامپوننت)، پس
`nav`، `tab`، `menu` و `button` همگی توکن‌های یکسانی دارند.

```yaml
semantic:
  light:
    interactive:
      primary:    { default, hover, active, disabled }  # عنصر اولیهٔ FILLED (دکمه): توپر، تیره‌تر در hover/active
      selection:  { hover, active }                      # پس‌زمینه آیتم SELECTED (nav/tab/menu): tint برند
      surface:    { hover, disabled }                    # hover سطح خنثی؛ غیرفعال = پرکنندهٔ خنثی توپر
      text:       { default, disabled }
  dark:
    interactive:   # شکل یکسان، نگاشت‌های اولیهٔ متفاوت
```

### واژگان توکن → منبع

| توکن (CSS var) | نقش | حالت | اولیهٔ منبع |
|-----------------|------|-------|------------------|
| `--color-primary` | primary | default (filled) | `primitive.primary.default` (سبز توپر) |
| `--color-primary-hover` | primary | **hover** | `primitive.primary.hover` (توپر، ~۸٪ تیره‌تر) |
| `--color-primary-active` | primary | **active/pressed** | `primitive.primary.active` (توپر، ~۱۶٪ تیره‌تر) |
| `--border-primary` | primary/surface | disabled | `primitive.border` (خنثی توپر) |
| `--color-primary-selected-bg` | selection | hover | `primitive.primary.selectedBg` (۸٪ tint) |
| `--color-primary-bg` | selection | active/selected | `primitive.primary.bg` (۱۵٪ tint) |
| `--bg-hover` | surface | hover (خنثی) | `primitive.ui.hover` |
| `--text-primary` / `--text-secondary` | text | default / disabled | `primitive.text.*` (L/D متفاوت) |

**دو الگوی متمایز — آن‌ها را قاطی نکنید:**

1. **عنصر اولیهٔ توپر (دکمه):** سبز توپری که در hover/active **تیره‌تر** می‌شود.
   `--color-primary` → `--color-primary-hover` → `--color-primary-active`. این‌ها سبزهای
   تیرهٔ واقعی هستند (نه tint شفاف)، پس hover در **هر دو** حالت روشن و تاریک کاملاً مرئی است.
   متن همچنان `--color-primary-dark` باقی می‌ماند.

2. **پس‌زمینهٔ آیتم انتخاب‌شده (nav / tab / menu):** یک **tint** برند روی سطح — در hover
   `--color-primary-selected-bg` (۸٪)، در حالت انتخاب‌شده `--color-primary-bg` (۱۵٪) — به‌علاوهٔ
   یک نوار تاکید توپر `--color-primary` برای نشانگر بدون ابهام.

**چرا نسخهٔ قبلی اشتباه بود:** یک دکمهٔ اولیهٔ توپر نباید برای hover از یک tint شفاف استفاده
کند — با شفافیت/opacity در حالت تاریک محو می‌شود. عناصر توپر از `primary.hover` / `primary.active`
تیرهٔ توپر استفاده می‌کنند؛ فقط پس‌زمینه‌های انتخاب‌شده از tint استفاده می‌کنند.

---

## نحوهٔ اعمال حالت‌ها توسط مصرف‌کننده

سیستم طراحی فقط **مقادیر** را ارائه می‌دهد. مصرف‌کننده مالکِ *زمان* فعال‌بودن یک حالت
(selectorها / attributeها) است و به توکن ارجاع می‌دهد — هرگز به یک رنگ خام.

```css
/* آیتم ناوبری */
.navItem {
  background: transparent;
  color: var(--text-primary);
}
.navItem:hover            { background: var(--bg-hover); }            /* surface.hover (خنثی) */
.navItem[aria-current="page"] {
  background: var(--color-primary-bg);          /* primary.active (۱۵٪ tint سبز) */
  color: var(--color-primary-dark);             /* روشن؛ در تاریک از --text-primary استفاده کن */
  font-weight: 600;
  position: relative;
}
.navItem[aria-current="page"]::before {         /* نوار تاکید توپر = selected بدون ابهام */
  content: ""; position: absolute; inset-inline-start: 0; top: 8px; bottom: 8px;
  width: 3px; border-radius: 3px; background: var(--color-primary);
}
.navItem[aria-disabled="true"] { color: var(--text-secondary); background: transparent; } /* text.disabled */

/* دکمهٔ غیرفعال توپر — سطح خنثی توپر، نه opacity روی یک tint
   (opacity روی یک tint شفاف در حالت تاریک محو می‌شود). همچنین hover را متوقف کن. */
.btn:disabled,
.btn:disabled:hover {
  background: var(--border-primary);   /* surface.disabled (خنثی توپر) */
  color: var(--text-secondary);        /* text.disabled */
  border-color: transparent;
  cursor: not-allowed;
}

/* تب‌ها */
.tab[aria-selected="true"] { border-bottom: 2px solid var(--color-primary); color: var(--color-primary-dark); }

/* منو */
.menuItem:hover { background: var(--bg-hover); }
.menuItem:active { background: var(--color-primary-bg); }   /* primary.hover */

/* دکمهٔ اولیهٔ توپر — توپر، تیره‌تر در hover/active */
.btn-primary { background: var(--color-primary); color: var(--color-primary-dark); }
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-primary:active { background: var(--color-primary-active); }
```

### قوانین برای مصرف‌کنندگان

* به توکن ارجاع بده؛ هرگز برای یک حالت تعاملی یک OKLCH/هگز را hardcode کن.
* از ویژگی‌های وضعیت معنایی (`[aria-current]`، `[aria-selected]`، `[aria-disabled]`،
  `:hover`، `:active`، `:disabled`) استفاده کن — کلاس‌های بی‌معنای `is-active` اختراع نکن که معنا را پنهان می‌کنند.
* `disabled` برای یک عنصر **توپر** (مثل دکمهٔ اولیه) از `surface.disabled` توپر
  (`--border-primary`) + `text.disabled` (`--text-secondary`) استفاده می‌کند و باید `:hover`
  را نیز خنثی کند. **از `opacity` روی یک tint شفاف استفاده نکن** — در حالت تاریک نامرئی می‌شود.
  برای یک عنصر **فقط‌متنی**، کمرنگ‌کردن رنگ متن کافی است.
* اگر یک محصول واقعاً به یک سایهٔ active متفاوت نیاز دارد، تم را بسط بده (theme extension) —
  نام توکن را بازتعریف نکن.

---

## وابستگی به CLI (پیگیری GAP-REPORT)

این متغیرهای CSS توسط CLI `nons` از اولیه‌های `registry/colors.yaml` تولید می‌شوند. تا زمانی
که CLI نگاشت‌های `interactive.*` را تولید کند (به Gap A در `GAP-REPORT.md` مراجعه کنید)،
مصرف‌کننده باید به متغیرهای موجودی که پیش‌تر تولید شده‌اند بازگردد (`--color-primary`،
`--color-primary-bg`، `--color-primary-selected-bg`، `--bg-hover`، `--text-primary`،
`--text-secondary`) — که همگی هم‌اکنون در Registry وجود دارند.
