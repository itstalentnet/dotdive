---
layout: doc
title: شروع سریع فرانت‌اند
description: راهنمای شروع کار با پنل ادمین — نصب، ساختار، قوانین مجوزها، ترجمه و چک‌لیست PR
version: 1.0.0
status: ACTIVE
author: Platform Team
owner: Frontend Team
created_at: 2026-07-24
updated_at: 2026-07-24
tags:
  - Frontend
  - GetStarted
  - Guidelines
---

# شروع سریع فرانت‌اند

**Frontend Get Started**

> این سند برای یک توسعه‌دهنده جدید کافی است تا بدون پرسیدن از تیم، محیط خود را راه‌اندازی کند، با ساختار پروژه آشنا شود و قوانین توسعه را رعایت کند.

---

## 📌 قانون معماری و تصمیم فریم‌ورک (Architecture Standard & ADR-0001)

> 🚨 **دستورالعمل اجباری فرانت‌اند:**
> طبق سند تصمیم معماری [ADR-0001 / ADR-Platform-006](https://dotdive.ir/docs/team/platform/ADR/ADR-Platform-006-renderer-framework-vue)، تمام پکیج‌های فرانت‌اند شامل `@nons-dev/uikit`، `@nons-dev/renderer` و `admin-panel` **منحصراً مبتنی بر Vue 3** توسعه می‌یابند.
>
> **چرخهٔ لایه‌های Schema-Driven UI:**
>
> ```
> @nons-dev/ui-schema (قرارداد داده خالص TS)
>        ↓
> @nons-dev/renderer (موتور رندر Vue 3)
>        ↓
> @nons-dev/uikit (کامپوننت‌های UI پایه Vue 3)
>        ↓
> admin-panel / UI Builder (مصرف‌کننده نهایی)
> ```
>
> توسعه‌دهندگان جدید پیش از شروع کدنویسی باید الزامات این معماری را مطالعه و رعایت نمایند.

---

## ۱. راه‌اندازی محیط

### پیش‌نیازها

| ابزار   | نسخه       | توضیح                                |
| ------- | ---------- | ------------------------------------ |
| Node.js | >= 20      | runtime                              |
| npm     | همراه Node | package manager (pnpm نیست، npm است) |

### دستورات اصلی

```bash
# نصب وابستگی‌ها
npm install

# شروع توسعه (پورت 3000، auto-open)
npm run dev

# build + typecheck
npm run build

# فقط typecheck
npx vue-tsc -b --noEmit
```

> نکته: `admin-panel` از npm استفاده می‌کند، **نه pnpm**. فایل `package-lock.json` را با npm مدیریت کنید.

### متغیرهای محیطی

| متغیر          | پیش‌فرض                 | اجباری؟ | توضیح                               |
| -------------- | ----------------------- | ------- | ----------------------------------- |
| `VITE_API_URL` | `''` (خالی = proxy)     | خیر     | آدرس API بک‌اند (توسعه: proxy Vite) |
| `VITE_AUTH_UI` | `http://localhost:3000` | خیر     | آدرس auth-ui برای ریدایرکت لاگین    |

فایل `.env` را از `.env.example` کپی کنید (در مخزن موجود است).

---

## ۲. معماری پروژه

### ساختار پوشه‌ها

```
src/
├── main.ts              # نقطه ورود — bootstrap، SDK، mount
├── App.vue               # فقط <RouterView /> + استایل سراسری
├── app/
│   └── router.ts         # Vue Router — تک مسیر / → AdminLayout
├── auth/                 # احراز هویت — store, api, types, plugin
├── components/           # کامپوننت‌های اپلیکیشن
│   └── GenericPage.vue   # بارگذاری پویای schema بر اساس route param
├── engine/               # PageRenderer — رندر پویای قالب‌ها
├── templates/            # قالب‌های صفحه: table, form, detail, settings
├── layouts/              # AdminLayout — سایدبار، هدر، ناحیه محتوا + i18n
├── navigation/           # منوی استاتیک + فیلتر دسترسی
├── permissions/          # ثابت‌های مجوزها (PERMISSIONS.*)
├── i18n/                 # دیکشنری ترجمه + تست پوشش
├── sdk/                  # HTTP client (fetch-based) + سرویس‌های SDK
├── registry/             # پل بین UI و SDK
├── schemas/              # صفحه‌های JSON (users, permissions, settings, ...)
├── providers/            # کامپوزابل‌های اشتراکی
├── services/             # (قدیمی — ترجیحاً از SDK استفاده کنید)
└── styles/               # استایل‌های سراسری
```

### جریان داده

```
Page Schema (JSON) → PageRenderer → Template → @nons-dev/uikit → Registry → SDK
```

---

## ۳. قوانین مصرف مجوزها (Permission Rules)

### قانون اول — هرگز رشته هاردکد نکنید

همه مجوزها باید از ثابت‌های `PERMISSIONS.*` در `src/permissions/constants.ts` استفاده کنند:

```ts
// ✅ درست
import { PERMISSIONS } from '../permissions/constants'
if (hasPermission(PERMISSIONS.ADMIN.ACCESS)) { ... }

// ❌ نادرست
if (hasPermission('admin.access')) { ... }
```

### قانون دوم — مجوزها در JSON schema

در فایل‌های JSON، از آرایه `permissions` با کلید کامل استفاده کنید:

```json
{
  "permissions": ["admin.access"]
}
```

این فایل‌ها JSON هستند و نمی‌توانند از `PERMISSIONS.*` استفاده کنند، پس باید **دستی** با Proto هماهنگ بمانند.

### قانون سوم — فقط ۲۱ کلید معتبر

تنها ۲۱ کلید مجوز در پلتفرم وجود دارد (تعریف‌شده در `contracts/permissions.proto`). هیچ کلید دیگری نباید در کد ظاهر شود. لیست کامل:

| گروه     | کلیدها                                                                                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| admin    | `admin.access`, `roles.read`, `permissions.read`, `capabilities.read`, `restrictions.read`, `policies.read`, `workspaces.read`, `audit.read`, `events.read`, `settings.read` |
| products | `products.create`, `products.update`, `products.delete`, `products.publish`                                                                                                  |
| orders   | `orders.create`, `orders.cancel`                                                                                                                                             |
| wallets  | `wallets.read`, `wallets.withdraw`                                                                                                                                           |
| users    | `users.read`                                                                                                                                                                 |
| tickets  | `tickets.read`, `tickets.resolve`                                                                                                                                            |

### قانون چهارم — IAM منبع runtime است، نه توسعه

Frontend هرگز Permission جدید نمی‌سازد. همه کلیدها از IAM از طریق `GET /v1/iam/permissions/meta` دریافت می‌شوند. برای افزودن کلید جدید:

1. به Proto اضافه شود (تیم پلتفرم)
2. `pnpm codegen` اجرا شود
3. به `permissions.meta.yaml` سرویس مربوطه اضافه شود
4. به IAM DB seed اضافه شود
5. آنگاه در فرانت‌اند `constants.ts` و localeها بروز شوند

---

## ۴. قوانین ترجمه (i18n)

### ساختار

ترجمه‌ها در دو فایل `locales/fa.json` و `locales/en.json` زیر namespace `permissions` ذخیره می‌شوند:

```json
{
  "permissions": {
    "admin.access": "دسترسی به پنل مدیریت",
    "products.create": "ایجاد محصول"
  }
}
```

### قوانین

- هر کلید مجوز در Proto باید **دقیقاً یک** entry در هر دو فایل locale داشته باشد
- کلیدهای اضافی (که در Proto نیستند) در localeها **ممنوع** هستند — تست `permission-catalog.spec.ts` این را بررسی می‌کند
- کلیدهای گمشده توسط تست `permission-catalog.spec.ts` گزارش می‌شوند (fail روی missing)
- اگر کلیدی از Proto حذف شد، باید از localeها نیز حذف شود (warn روی stale)

---

## ۵. قوانین SDK

### SDK مرورگر هرگز Bearer token ندارد

SDK مرورگر (`src/sdk/`) از `Authorization: Bearer` استفاده **نمی‌کند**. احراز هویت از طریق:

- کوکی نشست Kratos (`credentials: 'include'`)
- هدر `X-User-ID` (تنظیم توسط `setDefaultHeaders`)

```ts
// ✅ SDK فعلی — فقط baseURL + locale
const sdk = initSDK({
  baseURL: (import.meta.env.VITE_API_URL as string) || "",
  locale: "fa",
});

// تزریق header پس از احراز هویت (در src/auth/store.ts)
sdk.setDefaultHeaders({ "X-User-ID": userId });
```

### فراخوانی مستقیم IAM (در auth/store.ts)

```ts
const response = await fetch(`/v1/iam/me/context`, {
  headers: { "X-User-ID": userId, Accept: "application/json" },
  credentials: "include",
});
```

### Permission از طریق UIKit runtime

`hasPermission()` از `runtimeContext.permissions` UIKit می‌خواند (تنظیم در `src/auth/store.ts` پس از دریافت context از IAM):

```ts
// UIKit فقط هوک setPermissions را ارائه می‌دهد
import { runtimeContext } from '@nons-dev/uikit'
runtimeContext.setPermissions(userPermissions)

// مصرف در کامپوننت‌ها
import { hasPermission } from '../permissions/helpers'
if (hasPermission(PERMISSIONS.ADMIN.ACCESS)) { ... }
```

---

## ۶. چک‌لیست قبل از PR

- [ ] `npm run build` — بدون خطا (typecheck + build)
- [ ] همه مجوزهای جدید در `PERMISSIONS.*` تعریف شده‌اند
- [ ] همه مجوزهای جدید در `locales/fa.json` و `en.json` اضافه شده‌اند
- [ ] هیچ رشته مجوزی به‌صورت هاردکد در کد جدید وجود ندارد (تست `no-hardcoded-permissions.spec.ts` پاس می‌شود)
- [ ] `permission-catalog.spec.ts` پاس می‌شود (هیچ کلید missing/stale نیست)
- [ ] از `any` استفاده نشده — به‌خصوص در مسیر auth/permission
- [ ] خطاها fail-closed هستند (در صورت خطا، دسترسی محدود شود نه افزایش)

---

## مستندات مرتبط

- [معماری فرانت‌اند (Overview)](architecture/overview)
- [قرارداد Auth Header در پنل ادمین](architecture/admin-panel-auth-headers)
- [مدل مجوزها در پلتفرم](/docs/team/platform/permission-model)
- [استاندارد قرارداد مجوز](/docs/team/platform/standards/permission-contract-standard)
