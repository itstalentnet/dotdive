| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Workspace Satellite Projects, Shared Resources & Dependencies |
| **Title (FA)** | پروژه‌های جانبی، منابع مشترک و وابستگی‌های توسعه برنامه کاربردی |
| **ID** | DOC-FE-003 |
| **Category** | `frontend` |
| **Status** | `Active` |
| **Owner** | Core Architecture & Frontend Team |
| **Last Updated** | 2026-09-16 |
| **Summary (EN)** | Guide and reference for peripheral monorepo projects, font assets, token engines, documentation, and the Synthline icon package used in the Lemmo Workspace app. |
| **Summary (FA)** | راهنمای جامع آدرس‌ها، کارکرد و نحوه ایمپورت پروژه‌های جانبی مونو‌ریپو شامل فونت‌ها، توکن‌های دیزاین، مخزن مستندات و پکیج آیکون Synthline در توسعه app. |
| **Tags** | `frontend`, `dependencies`, `tokens`, `fonts`, `icons`, `synthline`, `workspace`, `monorepo` |

---

# پروژه‌های جانبی و منابع مشترک توسعه استودیو (Workspace Dependencies)

برنامه کاربردی **`app`** برای تضمین یکپارچگی بصری، تایپوگرافی، عملکرد و هماهنگی با هویت برند **Lemmo**، از مجموعه‌ای از منابع مشترک در سطح مونو‌ریپو و پکیج‌های اختصاصی خارجی استفاده می‌کند. این سند منبع رسمی آدرس‌ها، نقش و نحوه مصرف هر کدام از این منابع است.

---

## ۱. نقشه کلان منابع مشترک و وابستگی‌ها (Ecosystem Map)

```mermaid
flowchart TD
    App["برنامه کاربردی استودیو (app/)"]
    
    subgraph MonorepoResources["منابع و پروژه‌های مشترک مونو‌ریپو"]
        Fonts["پروژه فونت‌ها (fonts/)
        - IRANSansX (فارسی بدنه)
        - Morabba (فارسی عناوین)
        - Oddval (انگلیسی عناوین)
        - Satoshi (انگلیسی بدنه)"]
        
        Tokens["پروژه دیزاین توکن‌ها (tokens/ & ui/)
        - lemmo.tokens.css
        - متغیرهای رنگی، فواصل، شعاع و سایه‌ها"]
        
        Docs["مخزن مستندات مرجع (docs/)
        - منبع یگانه حقیقت (SSOT)
        - قوانین ایجنت‌ها و معماری
        - راهنمای ایندکس llms.txt"]
        
        UI["کتابخانه کامپوننت‌ها (ui/)
        - تمپلیت‌ها و استایل‌های مرجع"]
    end
    
    subgraph ExternalPackages["پکیج‌های استاندارد خارجی"]
        Synthline["کتابخانه رسمی آیکون‌ها
        - synthline / synthline/react
        - مخزن: github.com/itstalentnet/synthline
        - استروک ثابت 1.5 و لدر سایز"]
    end
    
    Fonts -->|next/font/local| App
    Tokens -->|CSS Variables (--lemmo-*)| App
    Docs -->|معماری و قراردادها| App
    Synthline -->|کامپوننت‌های React| App
    UI -.->|الگوهای کامپوننت| App
```

---

## ۲. پکیج رسمی آیکونوگرافی: Synthline

| مشخصه | مقدار |
| :--- | :--- |
| **نام پکیج** | `synthline` / `synthline/react` |
| **آدرس مخزن گیتهاب** | [https://github.com/itstalentnet/synthline](https://github.com/itstalentnet/synthline) |
| **نقش در پروژه** | تنها کتابخانه رسمی و مجاز آیکون در کل اکوسیستم Lemmo |
| **نحوه نصب در `app`** | `pnpm add synthline` یا `npm install synthline` |

### استانداردهای مصرف در کامپوننت‌های استودیو:
- **ضخامت خط (Stroke Width):** الزاماً همیشه `strokeWidth={1.5}` (پیش‌فرض کتابخانه ۲ است که باید با پراپ ۱.۵ تنظیم شود).
- **رنگ (Color):** همیشه از `currentColor` ارث‌بری کند تا با تغییر تم و رنگ متن والد هماهنگ شود.
- **مقیاس اندازه (Size Ladder):** انتخاب سایز فقط از لدر رسمی دیزاین سیستم صورت می‌پذیرد:
  - `12px` (ریز / Badges)
  - `16px` (متن‌های کوچک و اینپوت‌ها)
  - `20px` (پیش‌فرض دکمه‌ها و منوها)
  - `24px` (اکشن‌های شاخص و هدرها)
  - `28px` (حداکثر اندازه آیکون‌ها)

### نمونه کد ایمپورت در `app`:
```tsx
import { IconSparkles, IconWand, IconLayers, IconDownload } from 'synthline/react';

export function ActionButton() {
  return (
    <button className="btn-primary">
      <IconSparkles size={20} strokeWidth={1.5} color="currentColor" />
      <span>تولید جادویی</span>
    </button>
  );
}
```

---

## ۳. پروژه فونت‌های رسمی (`fonts/`)

| مشخصه | مقدار |
| :--- | :--- |
| **مسیر در مونو‌ریپو** | `/home/behroz/Documents/Git/lemu/fonts/fonts/` |
| **مسیر نسبی از `app`** | `../fonts/fonts/` |
| **نقش در پروژه** | مخزن دارایی‌های وکتوری و وب‌فونت‌های WOFF2 رسمی |

### ساختار و وظیفه هر فونت:
1. **IRANSansX (`fonts/fonts/iransans/IRANSansXV.woff2`):**
   - **نقش:** فونت اصلی متون بدنه و پاراگراف‌های فارسی.
   - **مشخصات:** متغیر (Variable) با بازه وزنی `100 1000`.
2. **Morabba (`fonts/fonts/morabba/Morabba-*.woff2`):**
   - **نقش:** فونت نمایشی (Display) برای تیترها، نام ابزارها و هدرهای فارسی.
   - **وزن‌ها:** Regular (400), Medium (500), SemiBold (600), Bold (700).
3. **Oddval (`fonts/fonts/oddval/Oddval-SemiBold.woff2`):**
   - **نقش:** فونت نمایشی انگلیسی برای تیترهای بزرگ و برندینگ استودیو.
   - **وزن:** منحصراً وزن 600 (SemiBold).
4. **Satoshi (`fonts/fonts/satoshi/Satoshi-Variable*.woff2`):**
   - **نقش:** فونت اصلی متون بدنه، اعداد، فرمول‌ها و بخش‌های لاتین.
   - **مشخصات:** متغیر با بازه وزنی ۳۰۰ تا ۹۰۰ به همراه نسخه ایتالیک.

### نحوه ایمپورت و مصرف در Next.js (`src/app/layout.tsx`):
فونت‌ها در زمان راه‌اندازی به پوشه `app/public/fonts/` کپی شده و با ماژول بهینه `next/font/local` لود می‌شوند:

```typescript
import localFont from 'next/font/local';

export const fontIransans = localFont({
  src: '../../../public/fonts/iransans/IRANSansXV.woff2',
  variable: '--lemmo-font-sans-fa',
  display: 'swap',
});

export const fontSatoshi = localFont({
  src: '../../../public/fonts/satoshi/Satoshi-Variable.woff2',
  variable: '--lemmo-font-sans-en',
  display: 'swap',
});
```

---

## ۴. سیستم دیزاین و پکیج رسمی توکن‌ها: `@lemmo-lab/tokens`

| مشخصه | مقدار |
| :--- | :--- |
| **نام پکیج** | `@lemmo-lab/tokens` |
| **ابزار خط فرمان (CLI)** | `@lemmo-lab/tokens-cli` |
| **آدرس مخزن گیتهاب** | [https://github.com/lemmo-lab/tokens.git](https://github.com/lemmo-lab/tokens.git) |
| **مسیر در مونو‌ریپو** | `/home/behroz/Documents/Git/lemu/tokens/` |
| **تم رسمی استودیو** | **تم پیش‌فرض / دارک مود (`default`)** — پس‌زمینه بوم `#131517`، کارت‌ها `#1c1e20`/`#23262a`، رنگ شاخص لیمویی (`#d1fe17`) با تاییدیه کنتراست WCAG AAA (14.02:1) |
| **نحوه نصب** | `pnpm add @lemmo-lab/tokens` (یا استفاده از CLI پکیج) |

### نحوه نصب و استفاده از تم پیش‌فرض دارک در استودیوی `app`:
پکیج به صورت ماژولار در ورودی استایل‌های اپلیکیشن (`src/app/globals.css`) وارد می‌شود:

```css
/* src/app/globals.css */
/* لود متغیرهای پایه، فواصل ۴ پیکسلی، ریست تایپوگرافی و تم رسمی دارک (پیش‌فرض) */
@import "@lemmo-lab/tokens/css/variables.css";

/* یا لود صریح تم پیش‌فرض */
@import "@lemmo-lab/tokens/css/themes/default.css";
```

برای تنظیم صریح در تگ ریشه (`src/app/layout.tsx`):
```html
<html lang="fa" dir="rtl" data-theme="default">
```

### استفاده از CLI رسمی توکن‌ها:
پکیج `@lemmo-lab/tokens-cli` امکان بیلد، اعتبارسنجی مقادیر کنتراست، و استخراج استایل‌ها متناسب با نیازمندی‌های پروژه را فراهم می‌کند.

---

## ۵. مخزن مستندات مرجع (`docs/`)

| مشخصه | مقدار |
| :--- | :--- |
| **مسیر در مونو‌ریپو** | `/home/behroz/Documents/Git/lemu/docs/` |
| **مسیر نسبی از `app`** | `../docs/` |
| **نقش در پروژه** | منبع یگانه حقیقت (SSOT) معماری، قوانین فرانت‌اند، و راهنمای مدل‌های زبانی |

### اسناد حیاتی مرتبط با `app`:
- **[`docs/frontend/workspace-architecture.md`](./workspace-architecture.md) (DOC-FE-001):** سند مصوب و قفل‌شده معماری Next.js، ساختار پوشه‌ها و قوانین مرز لایه‌ها.
- **[`docs/frontend/workspace-decisions.md`](./workspace-decisions.md) (DOC-FE-002):** تصمیمات کلیدی معماری سیستم ابزار مانیفست‌محور، گلوگاه `@/sdk` و معماری عدم نشت دیتای ساختگی (Zero-Leakage Mock).
- **[`docs/AGENTS.md`](../01-architecture/AGENTS.md) (DOC-META-002):** قوانین الزامی ایجنت‌ها، پروتکل توقف فوری (STOP Protocol) و دستورالعمل‌های ضدتضاد.
- **[`docs/design-system/STYLEGUIDE.md`](../04-design-system/STYLEGUIDE.md) (DOC-DS-001):** راهنمای جامع مصرف توکن‌ها و الگوهای تعاملی.
- **[`docs/llms.txt`](../llms.txt):** ایندکس هوشمند تمام اسناد برای مدل‌های زبانی.

---

## ۶. وضعیت پروژه آرشیو کامپوننت‌ها (`ui/`)

> ⚠️ **وضعیت فعلی: کاملاً غیرفعال و ایزوله (Inactive / Archive)**  
> مخزن `ui/` (`lemmoUI`) آرشیو کامپوننت‌ها است. تا زمانی که کامپوننت‌های استودیو در فازهای ابتدایی در حال توسعه هستند، هیچ‌گونه ارجاع، ایمپورت یا وابستگی به این پروژه وجود ندارد. پس از تکمیل و توسعه نهایی کامپوننت‌ها، دسترسی به آن‌ها منحصراً از طریق نصب پکیج رسمی صورت خواهد گرفت و نه ایمپورت مستقیم فایلی.

---

## ۷. چک‌لیست اعتبارسنجی وابستگی‌ها هنگام راه‌اندازی `app`

- [ ] بسته `synthline` در `package.json` نصب شده و آیکون‌ها با `strokeWidth={1.5}` رندر می‌شوند.
- [ ] فایل‌های WOFF2 فونت‌های ۴گانه از پوشه `../fonts/fonts/` به `app/public/fonts/` منتقل شده و با `next/font/local` لود می‌شوند.
- [ ] پکیج `@lemmo-lab/tokens` نصب شده و با تم پیش‌فرض دارک (`data-theme="default"`) به عنوان تم رسمی فعال است.
- [ ] هیچ کدی در `app` وابستگی مستقیمی به پوشه `ui/` ندارد.
- [ ] هرگونه تصمیم فنی جدید در `app` پیش از پیاده‌سازی با اسناد مخزن `docs/` تطبیق داده می‌شود.
