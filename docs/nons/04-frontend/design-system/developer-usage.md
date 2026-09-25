---
layout: doc
title: راهنمای مصرف توسعه‌دهنده (Developer Usage)
description: نحوهٔ مصرف توکن‌های طراحی و بازتولید رابط کاربری مرجع در سیستم طراحی نانس
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
  - Developer Guide
reviewers:
  - Frontend Team
---

# راهنمای مصرف توسعه‌دهنده — سیستم طراحی نانس
**Developer Usage Guide — Nons Design System**

نحوهٔ مصرف توکن‌های طراحی (Design Tokens) و بازتولید رابط کاربری مرجع (به `preview/index.html` مراجعه کنید). این نقطهٔ ورود واحد برای توسعه‌دهندگانی است که سیستم را در یک محصول ادغام می‌کنند.

> مستندات مرتبط: [تایپوگرافی](typography) · [حالت‌های تعاملی](interactive-states) · گزارش پوشش توکن‌ها (توسط نگه‌دارنده تکمیل می‌شود)

---

## فهرست محتوا

1. [مدل ذهنی](#۱-مدل-ذهنی)
2. [واژگان توکن‌های خروجی CLI](#۲-واژگان-توکن‌های-خروجی-cli)
3. [حالت روشن / تاریک (Light / Dark)](#۳-حالت-روشن--تاریک-light--dark)
4. [حالت‌های تعاملی](#۴-حالت‌های-تعاملی-مهم‌ترین-بخش)
5. [بازتولید رابط کاربری مرجع](#۵-بازتولید-رابط-کاربری-مرجع)
6. [انجام دهید / انجام ندهید](#۶-انجام-دهید--انجام-ندهید)
7. [دریافت توکن‌ها](#۷-دریافت-توکن‌ها)

---

## ۱. مدل ذهنی

```text
registry/*.yaml   →   themes/*.yaml   →   nons CLI   →   your app
(اولیهٔ خام)           (نگاشت نقش)         (تولید CSS)     (مصرف متغیرها)
```

* **Registry** = مقادیر اولیهٔ خام و بدون‌نام (رنگ‌های OKLCH، اندازه‌های `fs-*`، فاصله‌گذاری…).
* **Theme** = نقش‌های معنایی را به اولیه‌ها نگاشت می‌کند (هرگز مقدار خام را ذخیره نمی‌کند).
* **CLI (`nons`)** = YAML را به CSS Custom Property برای استک شما تبدیل می‌کند.
* **App شما** = متغیرهای CSS تولیدشده را مصرف می‌کند. **هرگز مقدار خام را مستقیماً ننویسید.**

### قانون طلایی

> به یک توکن ارجاع بده. هرگز یک مقدار خام `px`، `oklch(...)`، هگز یا وزن عددی را در کد محصول
> ننویس. اگر مقدار موردنیازت وجود ندارد، آن را به Registry اضافه کن — به‌صورت درون‌خطی (inline) قرارش نده.

---

## ۲. واژگان توکن‌های خروجی CLI

مصرف‌کننده با **CSS Custom Property** کار می‌کند. نام‌های زیر متغیرهای تولیدشده هستند؛ مقادیر از Registry/تم می‌آیند و به‌صورت خودکار بین light/dark جابه‌جا می‌شوند.

### ۲.۱ رنگ‌ها — معنایی (surface / text / border)

| متغیر | معنی |
|----------|---------|
| `--bg-primary` | پس‌زمینهٔ اصلی برنامه |
| `--bg-sidebar` | پس‌زمینهٔ نوار کناری / ناوبری |
| `--bg-card` | سطح کارت / پنل |
| `--bg-hover` | سطح hover خنثی |
| `--text-primary` | متن پیش‌فرض |
| `--text-secondary` | متن کمرنگ / ثانویه |
| `--border-primary` | حاشیهٔ پیش‌فرض، همچنین پرکنندهٔ حالت غیرفعال |
| `--overlay-bg` | سایهٔ مُدال / کشو |

### ۲.۲ رنگ‌ها — برند و وضعیت

| متغیر | معنی |
|----------|---------|
| `--color-primary` | سبز برند (عنصر توپر، filled) |
| `--color-primary-hover` | سبز توپر ~۸٪ تیره‌تر (hover توپر) |
| `--color-primary-active` | سبز توپر ~۱۶٪ تیره‌تر (فشردهٔ pressed) |
| `--color-primary-bg` | ۱۵٪ رنگ سبز (پس‌زمینهٔ انتخاب‌شده) |
| `--color-primary-selected-bg` | ۸٪ رنگ سبز (پس‌زمینهٔ hover) |
| `--color-primary-dark` | سبز تیره (متن/آیکون روی سبز) |
| `--color-danger` / `--color-danger-bg` | fg / bg خطا |
| `--color-success` / `--color-success-bg` | fg / bg موفقیت |
| `--color-warning` / `--color-warning-bg` | fg / bg هشدار |
| `--color-info` / `--color-info-bg` | fg / bg اطلاعات |

### ۲.۳ تایپوگرافی

توکن‌های اولیه (`registry/typography.yaml`): `--fs-*` (اندازه)، `--fw-*` (وزن)،
`--lh-*` (ارتفاع خط)، `--ls-*` (فاصلهٔ حروف)، `--ff-*` (خانواده). محصولات آن‌ها را از
طریق **توکن‌های نقش** تعریف‌شده در هر تم (`typography.roles`) مصرف می‌کنند؛ مثلاً
`title.lg`، `body.md`، `button.md`، `caption.md`. برای قانون سلسله‌مراتب و مقیاس هر محصول
به [تایپوگرافی](typography) مراجعه کنید.

| پیشوند | مثال | مقدار |
|--------|---------|-------|
| `--fs-*` | `--fs-14` | `14px` |
| `--fw-*` | `--fw-semibold` | `600` |
| `--lh-*` | `--lh-1-5` | `1.5` |
| `--ls-*` | `--ls-n15` | `-0.015em` |
| `--ff-*` | `--ff-primary` | پشتهٔ فونت |

### ۲.۴ سایر رجیستری‌ها

| رجیستری | متغیرها | نمونه |
|----------|-----------|--------|
| spacing | `--ds-spacing-*` | `--ds-spacing-4 = 16px` |
| radius | `--ds-radius-*` | `--ds-radius-md = 8px` |
| shadow | `--ds-shadow-*` | `--ds-shadow-md` |
| motion | `--ds-motion-duration-*`, `--ds-motion-easing-*` | `fast = 150ms` |
| border | `--ds-border-width-*` | `default = 1px` |
| opacity | `--ds-opacity-*` | `disabled = 0.5` |
| z-index | `--ds-z-index-*` | `modal = 1000` |

---

## ۳. حالت روشن / تاریک (Light / Dark)

CLI هر دو تم را تولید می‌کند؛ با تنظیم یک attribute روی ریشه جابه‌جا می‌شوند:

```html
<html data-theme="light"> … </html>
<!-- تغییر به -->
<html data-theme="dark"> … </html>
```

تمام متغیرهای `--bg-*`، `--text-*`، `--color-*-bg`، `--border-*` به‌صورت خودکار به مقدار
درست در هر حالت رفع می‌شوند. **شما قوانین رنگی وابسته به حالت نمی‌نویسید** — فقط توکن را
می‌نویسید. تنها استثنا رنگ متن روی یک سطح سبز است (به §۵.۱ مراجعه کنید).

---

## ۴. حالت‌های تعاملی (مهم‌ترین بخش)

**دو الگوی متفاوت** وجود دارد. آن‌ها را با هم قاطی نکنید.

### ۴.۱ عنصر اولیهٔ توپر (دکمه) — توپر، تیره‌تر در hover/active

```css
.btn-primary            { background: var(--color-primary);        color: var(--color-primary-dark); }
.btn-primary:hover      { background: var(--color-primary-hover); }   /* توپر، ~۸٪ تیره‌تر */
.btn-primary:active     { background: var(--color-primary-active); }  /* توپر، ~۱۶٪ تیره‌تر */
```

یک عنصر توپر باید از توکن‌های **تیرهٔ توپر** استفاده کند. هرگز برای hover توپر از یک tint
شفاف استفاده نکن — در حالت تاریک محو می‌شود.

### ۴.۲ پس‌زمینهٔ آیتم انتخاب‌شده (nav / tab / menu) — tint برند + تاکید

```css
.nav-item                       { color: var(--text-primary); }
.nav-item:hover                 { background: var(--bg-hover); }              /* خنثی */
.nav-item[aria-current="page"]  { background: var(--color-primary-bg);       /* ۱۵٪ tint */
                                   color: var(--color-primary-dark); font-weight: var(--fw-semibold); }
.nav-item[aria-current="page"]::before {   /* نوار تاکید توپر = "انتخاب‌شده" بدون ابهام */
  content:""; position:absolute; inset-inline-start:0; top:8px; bottom:8px;
  width:3px; border-radius:3px; background: var(--color-primary);
}
```

### ۴.۳ غیرفعال — سطح خنثی توپر (هرگز opacity روی یک tint)

```css
.btn:disabled, .btn:disabled:hover {
  background: var(--border-primary);   /* خنثی توپر، در هر دو حالت مرئی */
  color: var(--text-secondary);
  border-color: transparent; cursor: not-allowed;
}
```

از **ویژگی‌های وضعیت** (`[aria-current]`، `[aria-selected]`، `[aria-disabled]`،
`:hover`، `:active`، `:disabled`) استفاده کن — نه کلاس‌های مبهم `is-active`.

ماتریس کامل و منطق: [حالت‌های تعاملی](interactive-states).

---

## ۵. بازتولید رابط کاربری مرجع

در ادامه الگوهای دقیق پشت `preview/index.html` آمده است. آن‌ها را کپی کنید؛ توکن‌ها را
جابه‌جا کنید، هرگز مقادیر را.

### ۵.۱ App shell + ناوبری کناری

```css
body        { background: var(--bg-primary); color: var(--text-primary); font-family: var(--ff-primary); }
.sidebar    { background: var(--bg-sidebar); border-right: 1px solid var(--border-primary); }
.page-title { font-size: var(--fs-22); font-weight: var(--fw-semibold); letter-spacing: var(--ls-n15); }
```

> متن ناوبری انتخاب‌شده در حالت روشن از `--color-primary-dark` و در حالت تاریک از
> `--text-primary` استفاده می‌کند (کنتراست روی tint متفاوت است). این تنها جایی است که بر اساس
> تم شاخه‌بندی می‌کنید.

### ۵.۲ کارت + KPI

```css
.card { background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: var(--ds-radius-lg); }
.card h3  { font-size: var(--fs-15); font-weight: var(--fw-semibold); letter-spacing: var(--ls-n5); }
.card .sub{ font-size: var(--fs-12); color: var(--text-secondary); }
.kpi      { font-size: var(--fs-30); font-weight: var(--fw-semibold); letter-spacing: var(--ls-n20); }
```

### ۵.۳ فیلد فرم

```css
.label  { font-size: var(--fs-13); font-weight: var(--fw-medium); }
.input  { background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-primary);
          border-radius: var(--ds-radius-md); font-size: var(--fs-14); }
.input::placeholder { color: var(--text-secondary); }
.input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-bg); }
.hint   { font-size: var(--fs-12); color: var(--text-secondary); }
```

### ۵.۴ تب‌ها

```css
.tab                     { font-size: var(--fs-13); font-weight: var(--fw-medium); color: var(--text-secondary); border-bottom: 2px solid transparent; }
.tab:hover               { color: var(--text-primary); }
.tab[aria-selected="true"]{ color: var(--color-primary-dark); border-bottom-color: var(--color-primary); }
```

### ۵.۵ هشدارها

```css
.alert-danger  { background: var(--color-danger-bg);  color: var(--color-danger); }
.alert-success { background: var(--color-success-bg); color: var(--color-success); }
.alert-warning { background: var(--color-warning-bg); color: var(--color-warning); }
.alert-info    { background: var(--color-info-bg);    color: var(--color-info); }
```

`preview/index.html` را در مرورگر باز کنید و بین light/dark جابه‌جا شوید تا نتیجهٔ کامل را ببینید.

---

## ۶. انجام دهید / انجام ندهید

| ✅ انجام دهید | ❌ انجام ندهید |
|------|---------|
| `background: var(--color-primary)` | `background: oklch(0.857 0.17 134.6)` |
| `font-size: var(--fs-14)` | `font-size: 14px` |
| hover توپر → `--color-primary-hover` | hover توپر → یک tint شفاف |
| غیرفعال → `--border-primary` توپر + متن کمرنگ | غیرفعال → `opacity` روی یک tint |
| اضافه کردن مقدارِ گم‌شده به Registry | قرار دادن in-place یک مقدار یک‌بار مصرف در کامپوننت |
| تغییر تم از طریق `data-theme` | نوشتن قوانین رنگی جداگانه برای حالت تاریک |
| استفاده از `[aria-current]` / `[aria-selected]` | فقط استایل بی‌معنای `.active` |

---

## ۷. دریافت توکن‌ها

```powershell
# ویندوز
$env:NONS_GITHUB_TOKEN = "ghp_..."
.\nons.ps1 init
.\nons.ps1 sync
```

```bash
# macOS / Linux
export NONS_GITHUB_TOKEN=ghp_...
nons init
nons sync
```

توکن‌ها در `.nons/system-design/` (رجیستری + تم‌ها + فونت‌ها) قرار می‌گیرند. `manifest.json`
منبع حقیقت برای رجیستری‌های موجود، تم‌ها، نسخه‌ها و `colorGuide` خوانا برای انسان است.
