---
layout: doc
title: IAM Service
description: سرویس مدیریت هویت و دسترسی‌ها — Authorization، نقش‌ها، مجوزها، خط‌مشی‌ها و حاکمیت کاربران در پلتفرم NONS
version: 1.1.0
status: APPROVED
author: Backend Team
owner: Backend Team
created_at: 2026-06-22
updated_at: 2026-06-22
tags:
  - Backend
  - Service
  - IAM
  - Authorization
  - Blueprint
reviewers:
  - Backend Team
  - Platform Team
  - Product Team
---

# سرویس IAM

**IAM Service Blueprint**

> **مستند رسمی معماری، مرزهای مسئولیت، مدل داده و تعاملات سرویس مدیریت هویت و دسترسی**

---

## فهرست محتوا

1. [ماموریت و محدوده](#۱-ماموریت-و-محدوده)
2. [جایگاه معماری](#۲-جایگاه-معماری)
3. [اصول هسته](#۳-اصول-هسته)
4. [دامنه‌های کسب‌وکاری](#۴-دامنه‌های-کسب‌وکاری)
5. [Authorization Context](#۵-authorization-context)
6. [Policy Engine](#۶-policy-engine)
7. [ساختار دیتابیس](#۷-ساختار-دیتابیس)
8. [APIهای REST](#۸-apihay-rest)
9. [رویدادها](#۹-رویدادها)
10. [حسابرسی (Audit)](#۱۰-حسابرسی)
11. [استراتژی کش](#۱۱-استراتژی-کش)
12. [Business Rule Ownership](#۱۲-business-rule-ownership)
13. [معماری ران‌تایم](#۱۳-معماری-رانتایم)
14. [تکنولوژی و استقرار](#۱۴-تکنولوژی-و-استقرار)
15. [آینده توسعه](#۱۵-آینده-توسعه)

---

## ۱. ماموریت و محدوده

**Mission & Scope**

IAM تنها لایه حاکمیتی (Governance Layer) پلتفرم NONS است. این سرویس تنها مرجع معتبر برای **تصمیم‌گیری‌های مجوزدهی (Authorization)**، **کنترل دسترسی (Access Control)**، **حاکمیت کاربران (User Governance)**، **خط‌مشی‌های پلتفرم** و **حقوق اشتراک (Entitlements)** می‌باشد.

### مرزهای مسئولیت

| IAM مالک این موارد است | IAM مالک این موارد نیست |
|------------------------|-------------------------|
| نقش‌ها (Roles) | احراز هویت (Authentication) ← Auth Service / Kratos |
| قابلیت‌ها (Capabilities) | رمز عبور، نشست (Session)، MFA ← Auth Service / Kratos |
| مجوزها (Permissions) | توکن‌های دسترسی OAuth2 ← Token Service (Hydra) — صدور/ابطال توکن‌ها |
| حقوق اشتراک (Entitlements) | قیمت‌گذاری و صورتحساب ← Billing Service |
| محدودیت‌ها (Restrictions) | پروفایل کاربر ← User Service |
| خط‌مشی‌ها (Policies) | محصولات، سفارشات، کیف پول ← سرویس‌های کسب‌وکاری |
| وضعیت حساب (Status) | منطق کسب‌وکار سرویس‌ها ← هر سرویس |
| لاگ‌های حسابرسی (Audit Logs) | مالکیت منابع (Resource Ownership) ← Relationship Service (آینده) |
| Onboarding Flow (State Machine) | |
| پالیسی تغییر Username/Avatar (rate-limit, cooldown, quota) | پروفایل کاربر ← User Service |

> **تصمیم معماری (D6 / D8 / D9):** مسئولیت‌های زیر صراحتاً به IAM واگذار شده‌اند:
> - **State Machine Onboarding:** چرخه وضعیت Onboarding در IAM/سرویس Onboarding است؛ User Service صرفاً Projection آن را نگهداری می‌کند.
> - **پالیسی تغییر Username/Avatar:** محدودیت‌ها (تعداد مجاز در سال، Cooldown، حداقل عمر حساب، quota) توسط **IAM Policy Engine** تعریف و اعمال می‌شوند. User Service نتیجه بررسی پالیسی IAM را اجرا می‌کند و محدودیتی را هاردکد نمی‌کند.

### قانون کلی معماری

```
Auth Service  → «این شخص کیست؟» (هویت)
User Service  → «این شخص چگونه نمایش داده شود؟» (پروفایل)
IAM Service   → «این شخص چه کاری اجازه دارد انجام دهد؟» (دسترسی)
Billing       → «این شخص چه سطح خدماتی دارد؟» (اشتراک)
```

---

## ۲. جایگاه معماری

**Architecture Position**

```
مرورگر / اپلیکیشن
       │
       ▼
 Auth Service / Kratos    ← احراز هویت (کیستی؟)
       │
       ▼
┌──────────┐
│   IAM    │    ← مجوزدهی (چه می‌تواند بکند؟)
└────┬─────┘
     │
 ┌───┼───┬───┬───┬───┬───┐
 ▼   ▼   ▼   ▼   ▼   ▼   ▼
بازار سفارش کیف چت اختلاف نظارت ...
```

### تفکیک لایه‌ها

| لایه | مسئولیت | سرویس |
|------|---------|-------|
| **احراز هویت** | کیستی؟ — ورود، ثبت‌نام، نشست، MFA | Auth Service / Ory Kratos |
| **پروفایل** | چگونه نمایش داده شود؟ — Public ID, Username, Avatar, Preferences | User Service |
| **مجوزدهی** | چه می‌تواند بکند؟ — نقش‌ها، مجوزها، خط‌مشی‌ها | IAM |
| **مالکیت** (آینده) | چه کسی صاحب چیست؟ — روابط ریزدانه | Relationship Service |

---

## ۳. اصول هسته

**Core Principles**

### اصل ۱ — تفکیک دو منبع حقیقت: Proto برای تعریف، IAM برای runtime

> [!IMPORTANT]
> ** Proto منبع حقیقت تعریف Keyهاست؛ IAM منبع حقیقت وضعیت runtime.**
> - **Proto** (`contracts/permissions.proto`) منبع حقیقت برای **تعریف کلیدهای مجوز** است (نام‌ها، enum values)
> - **IAM** منبع حقیقت برای **وضعیت runtime** است (کدام کاربر کدام مجوز را دارد، نقش‌ها، خط‌مشی‌ها)
>
> برای افزودن یک کلید مجوز جدید، اول باید در Proto تعریف شود، سپس در IAM ثبت گردد. IAM به‌تنهایی کلید جدید نمی‌سازد.

هیچ سرویسی حق ایجاد، تغییر یا حذف مستقیم موارد زیر را ندارد:
- نقش‌ها (Roles)
- مجوزها (Permissions)
- محدودیت‌ها (Restrictions)
- خط‌مشی‌ها (Policies)
- حقوق اشتراک (Entitlements)

همه تغییرات منحصراً از طریق IAM انجام می‌شود.

### اصل ۲ — همه چیز داده است (Everything is Data)

موارد زیر هرگز نباید در کد به صورت سخت (Hardcoded) نوشته شوند:

| مورد | نحوه ذخیره‌سازی |
|------|-----------------|
| نقش‌ها و قابلیت‌های مرتبط | دیتابیس |
| تعاریف مجوزها و کلیدهای آن‌ها | دیتابیس |
| حقوق اشتراک و مقادیر آن | دیتابیس |
| انواع محدودیت‌ها | دیتابیس |
| قوانین خط‌مشی | دیتابیس |

**نتیجه:** تعریف یک نقش جدید یا اضافه کردن یک مجوز جدید بدون نیاز به استقرار (Deploy) کد جدید فقط با یک درخواست API امکان‌پذیر است.

### اصل ۳ — بافت مجوزدهی محاسبه می‌شود، ذخیره نمی‌شود

Authorization Context هرگز به صورت دائمی ذخیره نمی‌شود. این شیء در لحظه از وضعیت کنونی تمام موجودیت‌های IAM محاسبه و در Redis با TTL کوتاه (۵ دقیقه) کش می‌شود.

### اصل ۴ — منطق کسب‌وکار در سرویس‌های کسب‌وکاری می‌ماند

IAM داده‌ها و محدودیت‌ها را فراهم می‌کند. سرویس‌های کسب‌وکاری تصمیم نهایی را می‌گیرند.

```
IAM ارائه می‌دهد:   seller.product.limit = 100
Marketplace:        current_products = 78
تصمیم:              78 < 100 → مجاز است (Marketplace تصمیم می‌گیرد)
```

### اصل ۵ — Business Rule هر سرویس در همان سرویس تعریف می‌شود

Policy و Business Rule توسط IAM ساخته نمی‌شوند. هر سرویس کسب‌وکاری مالک Business Rule خود است. سرویس در زمان تعریف شدن، قراردادهای دسترسی و Permission Contract مورد نیاز خود را ثبت می‌کند. IAM این قراردادها را دریافت، نگهداری و برای Authorization استفاده می‌کند.

```
Marketplace تعریف می‌کند:  product.create, product.publish
IAM فقط مدیریت دسترسی به این قراردادها را انجام می‌دهد.
IAM نباید بداند محصول چیست یا قانون فروش چیست.
```

---

## ۴. دامنه‌های کسب‌وکاری

**Domain Model**

### ۴.۱. کاربر (User)

یک ارجاع به هویت (Identity) در Auth Service. IAM هرگز رمز عبور، نشست یا داده‌های احراز هویت را ذخیره نمی‌کند. شناسه کاربر (userId) همان شناسه هویت در Auth Service است.

| فیلد | نوع | توضیح |
|------|-----|-------|
| `identity_id` | UUID | شناسه کاربر در Auth Service (PK) |
| `email` | VARCHAR | ایمیل (برای نمایش و جستجوی ادمین) |
| `status` | ENUM | وضعیت حساب |

> **نکته:** ایمیل در IAM صرفاً برای اهداف مدیریتی و لاگ‌ها ذخیره می‌شود. منبع حقیقت ایمیل Kratos است.

### ۴.۲. وضعیت حساب (Status)

| وضعیت | توضیح | اثر |
|-------|-------|-----|
| `ACTIVE` | حالت عادی | دسترسی کامل بر اساس نقش‌ها |
| `PENDING_VERIFICATION` | منتظر تأیید | دسترسی محدود |
| `LIMITED` | محدودیت جزئی | برخی عملیات مسدود |
| `SUSPENDED` | تعلیق موقت | ورود مجاز، بیشتر عملیات مسدود |
| `BANNED` | مسدودیت دائمی | ورود مسدود، هیچ دسترسی ندارد |
| `ARCHIVED` | حذف نرم | بدون دسترسی، داده‌ها حفظ می‌شوند |

**قوانین:**
- فقط یک وضعیت فعال در هر لحظه
- هر تغییر وضعیت در `status_history` ثبت می‌شود
- تغییر وضعیت باعث بی‌اعتبارسازی فوری کش می‌شود
- رویداد `nons.iam.user.status_changed` منتشر می‌گردد

### ۴.۳. نقش (Role)

یک موقعیت کسب‌وکاری. کاربران می‌توانند همزمان چند نقش داشته باشند. نقش‌ها کاملاً پویا هستند و در دیتابیس تعریف می‌شوند.

| فیلد | نوع | توضیح |
|------|-----|-------|
| `key` | VARCHAR | شناسه منحصربه‌فرد (مثلاً `SELLER`) |
| `name` | VARCHAR | نام نمایشی |
| `description` | TEXT | توضیحات (اختیاری) |

**نقش‌های پیش‌فرض:**

| نقش | توضیح |
|-----|-------|
| `BUYER` | خریدار |
| `SELLER` | فروشنده |
| `ADMIN` | مدیر |
| `REVIEWER` | بازبین |
| `SUPPORT_AGENT` | پشتیبانی |
| `FINANCE_AGENT` | امور مالی |

> **نکته:** پلن‌ها هرگز نباید به عنوان نقش نمایش داده شوند. یک فروشنده PREMIUM همچنان `role=SELLER` دارد با `plan=PREMIUM`.

### ۴.۴. قابلیت (Capability)

یک گروه‌بندی منطقی از مجوزهای مرتبط. قابلیت‌ها به نقش‌ها اختصاص می‌یابند. این لایه میانی امکان مدیریت دسته‌جمعی مجوزها را بدون اتصال مستقیم نقش‌ها به مجوزهای اتمی فراهم می‌کند.

| فیلد | نوع | توضیح |
|------|-----|-------|
| `key` | VARCHAR | شناسه منحصربه‌فرد (مثلاً `SELLING`) |
| `name` | VARCHAR | نام نمایشی |
| `description` | TEXT | توضیحات (اختیاری) |

**قابلیت‌های پیش‌فرض:**

| قابلیت | مجوزهای نمونه |
|--------|--------------|
| `SELLING` | `product.create`, `product.edit`, `product.delete` |
| `BUYING` | `order.create`, `order.cancel`, `review.create` |
| `SUPPORT` | `ticket.view`, `ticket.resolve` |
| `FINANCE` | `wallet.withdraw`, `wallet.view`, `report.finance` |

**روابط:**
```
نقش (Role) ←→ قابلیت (Capability) ←→ مجوز (Permission)
```

### ۴.۵. مجوز (Permission)

یک کنش اتمی و نام‌گذاری شده. کلیدهای مجوز قراردادهای پایدار (Stable Contracts) بین IAM و سرویس‌های کسب‌وکاری هستند.

| فیلد | نوع | توضیح |
|------|-----|-------|
| `key` | VARCHAR | شناسه منحصربه‌فرد (مثلاً `product.create`) |
| `name` | VARCHAR | نام نمایشی |
| `description` | TEXT | توضیحات (اختیاری) |

**فرمت:** `resource.action` یا `resource.subresource.action`

**نمونه‌ها:**
- `product.create` — ایجاد محصول
- `order.create` — ایجاد سفارش
- `wallet.withdraw` — برداشت از کیف پول
- `admin.access` — دسترسی به پنل مدیریت

> **توجه:** کلیدهای مجوز قرارداد API بین IAM و سرویس‌های پایین‌دستی هستند. تغییر نام یک کلید، یک Breaking Change محسوب می‌شود.

### ۴.۶. حق اشتراک (Entitlement)

یک محدودیت یا feature flag که از نقش، پلن، خط‌مشی یا override کاربر می‌آید. IAM مالک **تعریف و مدیریت** Entitlement‌هاست، اما **قیمت‌گذاری و صورتحساب** در Billing Service انجام می‌شود.

| فیلد | نوع | توضیح |
|------|-----|-------|
| `key` | VARCHAR | شناسه منحصربه‌فرد (مثلاً `seller.product.limit`) |
| `name` | VARCHAR | نام نمایشی |
| `value_type` | ENUM | `NUMBER` / `BOOLEAN` |
| `default_value` | VARCHAR | مقدار پیش‌فرض |

**نمونه‌ها:**
- `seller.product.limit = 10` — محدودیت تعداد محصول
- `daily.withdraw.limit = 5000` — محدودیت برداشت روزانه
- `feature.analytics = true` — دسترسی به گزارش‌ها

**اولویت تصمیم‌گیری (بالاترین اولویت برنده است):**

1. **User Override** — همیشه بالاترین اولویت
2. **Policy-generated** — تولیدشده توسط خط‌مشی
3. **Role-based** — بر اساس نقش
4. **Plan-based** — پایین‌ترین اولویت

### ۴.۷. Override کاربر (User Override)

تغییرات مستقیم برای یک کاربر خاص که پیش‌فرض‌های نقش یا پلن را نادیده می‌گیرد.

| فیلد | نوع | توضیح |
|------|-----|-------|
| `user_id` | UUID | کاربر هدف |
| `entitlement_key` | VARCHAR | حق اشتراکی که override می‌شود |
| `value` | VARCHAR | مقدار جدید |
| `reason` | TEXT | دلیل (اختیاری) |
| `created_at` | TIMESTAMPTZ | |
| `expires_at` | TIMESTAMPTZ | انقضا (اختیاری) |

### ۴.۸. محدودیت (Restriction)

محدودیت‌های اداری اعمال‌شده بر کاربر.

| فیلد | نوع | توضیح |
|------|-----|-------|
| `key` | VARCHAR | شناسه منحصربه‌فرد (مثلاً `withdraw.blocked`) |
| `name` | VARCHAR | نام نمایشی |
| `description` | TEXT | توضیحات (اختیاری) |

**انواع محدودیت (همگی پویا):**
- `withdraw.blocked` — جلوگیری از برداشت
- `selling.blocked` — جلوگیری از فروش
- `chat.blocked` — جلوگیری از چت
- `product.create.blocked` — جلوگیری از ایجاد محصول

> محدودیت‌ها آخرین مرحله در محاسبه بافت هستند و همه چیز را override می‌کنند به جز `Status=BANNED`.

### ۴.۹. خط‌مشی (Policy)

قوانین حاکمیتی کسب‌وکاری که در IAM ذخیره و توسط Policy Engine اجرا می‌شوند.

| بخش | توضیح |
|-----|-------|
| `condition` | شرط ارزیابی (metric, operator, value) |
| `effect` | اثر در صورت برآورده شدن شرط |
| `enabled` | فعال/غیرفعال |

**DSL خط‌مشی:**

```json
{
  "name": "high-dispute-block-withdraw",
  "enabled": true,
  "condition": {
    "metric": "seller.dispute_count",
    "operator": ">",
    "value": 3
  },
  "effect": {
    "type": "restriction.add",
    "target": "withdraw.blocked"
  }
}
```

**انواع اثر:**
| نوع | توضیح |
|-----|-------|
| `restriction.add` | اضافه کردن محدودیت به کاربر |
| `entitlement.set` | تنظیم مقدار حق اشتراک |

### ۴.۱۰. Workspace

یک ناحیه قابل دسترسی در پلتفرم. Workspace در IAM فقط یک مفهوم **Authorization** است — IAM تصمیم می‌گیرد کاربر به کدام workspace دسترسی دارد، اما مسیردهی و UI خارج از IAM است.

| فیلد | نوع | توضیح |
|------|-----|-------|
| `key` | VARCHAR | شناسه (مثلاً `seller`) |
| `name` | VARCHAR | نام نمایشی |
| `required_permissions` | TEXT[] | مجوزهای مورد نیاز |

**محیط‌های کاری پیش‌فرض:**

| کلید | مجوز مورد نیاز |
|------|---------------|
| `seller` | `product.create` |
| `admin` | `admin.access` |
| `finance` | `wallet.view` |
| `support` | `ticket.view` |

---

## ۵. Authorization Context

**Authorization Context**

### تعریف

Authorization Context خروجی محاسبه‌شده IAM است. این شیء که سرویس‌های پایین‌دستی برای تصمیمات مجوزدهی استفاده می‌کنند، هرگز به صورت دائمی ذخیره نمی‌شود و در لحظه محاسبه و در Redis کش می‌شود.

### ساختار Context

```json
{
  "schemaVersion": 1,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "ACTIVE",
  "roles": [
    { "key": "SELLER", "name": "Seller" }
  ],
  "permissions": ["product.create", "product.edit"],
  "entitlements": {
    "seller.product.limit": "100",
    "feature.analytics": "true",
    "daily.withdraw.limit": "50"
  },
  "restrictions": [],
  "workspaces": ["seller"],
  "plan": { "key": "PREMIUM", "name": "Premium" },
  "generatedAt": "2026-06-22T10:00:00Z",
  "expiresAt": "2026-06-22T10:05:00Z"
}
```

### ترتیب محاسبه Context

| مرحله | منبع | خروجی |
|-------|------|-------|
| 1 | نقش‌های کاربر | مجموعه اولیه قابلیت‌ها و مجوزها |
| 2 | قابلیت‌ها | لیست گسترش‌یافته مجوزها |
| 3 | مجوزها | لیست نهایی مجوزهای اتمی |
| 4 | پلن | مقادیر پایه حق اشتراک |
| 5 | خط‌مشی‌ها | اعمال تغییرات ناشی از خط‌مشی |
| 6 | Overrideهای کاربر | اعمال overrideها (بالاترین اولویت) |
| 7 | محدودیت‌ها | مسدود یا محدود کردن کنش‌ها |
| 8 | وضعیت | اعمال اثر سراسری وضعیت |

### منطق بررسی مجوز (Check Permission)

```
1. اگر وضعیت BANNED باشد       → رد (reason: "User is banned")
2. اگر وضعیت SUSPENDED باشد    → رد (reason: "User is suspended")
3. اگر وضعیت ARCHIVED باشد     → رد (reason: "Account is archived")
4. اگر مجوز در لیست نباشد      → رد (reason: "Missing permission: {action}")
5. اگر محدودیت فعال باشد       → رد (reason: "Blocked by restriction: {key}")
6. در غیر این صورت             → تأیید
```

---

## ۶. Policy Engine

**Policy Engine**

موتور Policy یک ماژول مجزاست که:
1. خط‌مشی‌ها را از دیتابیس می‌خواند
2. شرط (condition) را با متریک‌های ورودی ارزیابی می‌کند
3. در صورت برآورده شدن شرط، اثر (effect) را اعمال می‌کند
4. رویداد `nons.iam.policy.executed` را منتشر می‌کند
5. نتیجه را در لاگ حسابرسی ثبت می‌کند

### محدودیت‌های نسخه اول (v1)

- شرایط فقط از مقایسه تک‌متریک پشتیبانی می‌کند (بدون AND/OR)
- اجرای خط‌مشی از طریق API (اجرای مبتنی بر رویداد در برنامه آینده)
- متریک‌ها در زمان ارزیابی ارائه می‌شوند (بدون جمع‌آوری داخلی متریک)

---

## ۷. ساختار دیتابیس

**Database Structure**

### دیاگرام روابط

```
Role ─── RoleCapability ─── Capability ─── CapabilityPermission ─── Permission

User ─── UserRole ─── Role
User ─── UserRestriction ─── Restriction
User ─── UserOverride ─── Entitlement
User ─── StatusHistory
User ─── Plan ─── PlanEntitlement ─── Entitlement

Policy ─── { condition: JSON, effect: JSON }

Workspace ─── { required_permissions: TEXT[] }

AuditLog (append-only)
```

### جداول متعلق به IAM

| جدول | توضیح |
|------|-------|
| `users` | snapshot مدیریتی کاربران |
| `roles` | تعاریف نقش‌ها |
| `capabilities` | گروه‌بندی مجوزها |
| `permissions` | مجوزهای اتمی |
| `plans` | پلن‌های اشتراک (Entitlement definitions) |
| `entitlements` | حقوق اشتراک |
| `user_roles` | نگاشت کاربر-نقش |
| `user_restrictions` | محدودیت‌های کاربر |
| `user_overrides` | overrideهای کاربر |
| `status_history` | تاریخچه وضعیت |
| `plan_entitlements` | نگاشت پلن-حق اشتراک |
| `role_capabilities` | نگاشت نقش-قابلیت |
| `capability_permissions` | نگاشت قابلیت-مجوز |
| `policies` | خط‌مشی‌ها |
| `workspaces` | محیط‌های کاری |
| `audit_logs` | لاگ حسابرسی append-only |

---

## ۸. APIهای REST

**REST APIs**

تمامی مسیرها با پیشوند `/v1/iam` ارائه می‌شوند.

### ۸.۱. APIهای Context (مورد استفاده همه سرویس‌ها)

| Method | Path | توضیح |
|--------|------|-------|
| `GET` | `/v1/iam/me/context` | دریافت Authorization Context کاربر جاری |
| `GET` | `/v1/iam/users/{id}/context` | دریافت Context کاربر مشخص (ادمین) |
| `POST` | `/v1/iam/authorization/check` | بررسی مجوز خاص برای کاربر |

**بررسی مجوز:**
```http
POST /v1/iam/authorization/check
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "action": "product.create"
}
```

**پاسخ:**
```json
// 200 — مجاز
{ "data": { "allowed": true } }

// 200 — مسدود
{ "data": { "allowed": false, "reason": "restriction:selling.blocked" } }
```

### ۸.۲. APIهای مدیریت کاربر

| Method | Path | توضیح |
|--------|------|-------|
| `GET` | `/v1/iam/users/{id}` | دریافت اطلاعات IAM کاربر |
| `POST` | `/v1/iam/users/{id}/roles` | اختصاص نقش به کاربر |
| `DELETE` | `/v1/iam/users/{id}/roles/{roleKey}` | حذف نقش از کاربر |
| `PUT` | `/v1/iam/users/{id}/status` | تغییر وضعیت کاربر |
| `GET` | `/v1/iam/users/{id}/status/history` | تاریخچه تغییر وضعیت |
| `POST` | `/v1/iam/users/{id}/restrictions` | اضافه کردن محدودیت |
| `DELETE` | `/v1/iam/users/{id}/restrictions/{key}` | حذف محدودیت |
| `GET` | `/v1/iam/users/{id}/restrictions` | دریافت محدودیت‌ها |
| `GET` | `/v1/iam/users/{id}/overrides` | دریافت overrideها |
| `POST` | `/v1/iam/users/{id}/overrides` | اعمال override |
| `DELETE` | `/v1/iam/users/{id}/overrides/{id}` | حذف override |
| `PUT` | `/v1/iam/users/{id}/plan` | تغییر پلن کاربر |
| `GET` | `/v1/iam/users/{id}/audit` | دریافت لاگ حسابرسی کاربر |

### ۸.۳. APIهای پیکربندی

| Method | Path | توضیح |
|--------|------|-------|
| `POST` | `/v1/iam/roles` | ایجاد نقش |
| `GET` | `/v1/iam/roles` | فهرست نقش‌ها |
| `PATCH` | `/v1/iam/roles/{key}` | به‌روزرسانی نقش |
| `DELETE` | `/v1/iam/roles/{key}` | حذف نقش |
| `POST` | `/v1/iam/capabilities` | ایجاد قابلیت |
| `GET` | `/v1/iam/capabilities` | فهرست قابلیت‌ها |
| `PATCH` | `/v1/iam/capabilities/{key}` | به‌روزرسانی قابلیت |
| `DELETE` | `/v1/iam/capabilities/{key}` | حذف قابلیت |
| `POST` | `/v1/iam/permissions` | ایجاد مجوز |
| `GET` | `/v1/iam/permissions` | فهرست مجوزها |
| `PATCH` | `/v1/iam/permissions/{key}` | به‌روزرسانی مجوز |
| `DELETE` | `/v1/iam/permissions/{key}` | حذف مجوز |
| `POST` | `/v1/iam/plans` | ایجاد پلن |
| `GET` | `/v1/iam/plans` | فهرست پلن‌ها |
| `PATCH` | `/v1/iam/plans/{key}` | به‌روزرسانی پلن |
| `DELETE` | `/v1/iam/plans/{key}` | حذف پلن |
| `POST` | `/v1/iam/entitlements` | ایجاد حق اشتراک |
| `GET` | `/v1/iam/entitlements` | فهرست حقوق اشتراک |
| `PATCH` | `/v1/iam/entitlements/{key}` | به‌روزرسانی |
| `DELETE` | `/v1/iam/entitlements/{key}` | حذف |
| `POST` | `/v1/iam/policies` | ایجاد خط‌مشی |
| `GET` | `/v1/iam/policies` | فهرست خط‌مشی‌ها |
| `PATCH` | `/v1/iam/policies/{id}` | به‌روزرسانی |
| `DELETE` | `/v1/iam/policies/{id}` | حذف |
| `POST` | `/v1/iam/policies/{id}/execute` | اجرای دستی خط‌مشی |
| `POST` | `/v1/iam/workspaces` | ایجاد workspace |
| `GET` | `/v1/iam/workspaces` | فهرست workspaceها |
| `PATCH` | `/v1/iam/workspaces/{key}` | به‌روزرسانی |
| `DELETE` | `/v1/iam/workspaces/{key}` | حذف |
| `GET` | `/v1/iam/audit` | فهرست لاگ حسابرسی |

---

## ۹. رویدادها

**Events**

تمامی رویدادها مطابق استاندارد `ADR-EVENT-001` در دامنه `iam` تعریف می‌شوند.

### رویدادهای منتشرشده (Outbound)

| رویداد | مصرف‌کنندگان | توضیح |
|--------|-------------|-------|
| `nons.iam.user.status_changed` | همه سرویس‌ها | تغییر وضعیت حساب (بحرانی) |
| `nons.iam.user.role_assigned` | سرویس‌های مرتبط | نقش به کاربر اختصاص یافت |
| `nons.iam.user.role_removed` | سرویس‌های مرتبط | نقش از کاربر گرفته شد |
| `nons.iam.user.plan_changed` | billing-service, marketplace | پلن کاربر تغییر کرد |
| `nons.iam.user.restriction_added` | wallet-service, marketplace | محدودیت اضافه شد |
| `nons.iam.user.restriction_removed` | wallet-service, marketplace | محدودیت حذف شد |
| `nons.iam.policy.executed` | notification-service, admin | خط‌مشی اجرا شد |
| `nons.iam.user.onboarding_completed` | notification-service | Onboarding کاربر تکمیل شد |
| `nons.iam.user.onboarding_state_changed` | user-service, notification-service | تغییر وضعیت State Machine Onboarding |

### رویدادهای مصرف‌شونده (Inbound)

| رویداد | Publisher | عکس‌العمل |
|--------|-----------|-----------|
| `nons.auth.user.registered` | auth-service | ایجاد کاربر در IAM |
| `nons.user.profile.created` | user-service | همگام‌سازی اطلاعات پروفایل |

### ساختار رویداد (نمونه)

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "actor_id": "admin_xyz",
  "old_status": "ACTIVE",
  "new_status": "BANNED",
  "reason": "نقض قوانین سرویس"
}
```

---

## ۱۰. حسابرسی

**Audit**

### اصول

- هر کنش حاکمیتی باید در لاگ حسابرسی ثبت شود
- لاگ‌ها append-only هستند (فقط create، هیچگاه update یا delete)
- هر لاگ شامل snapshot قبل و بعد از تغییر است

| Field | Type | توضیح |
|-------|------|-------|
| `id` | UUID PK | |
| `actor_id` | UUID | انجام‌دهنده کنش |
| `target_id` | UUID | هدف کنش |
| `action` | VARCHAR | نوع کنش |
| `entity` | VARCHAR | موجودیت |
| `entity_id` | VARCHAR | شناسه موجودیت |
| `before` | JSONB | snapshot قبل از تغییر |
| `after` | JSONB | snapshot بعد از تغییر |
| `detail` | TEXT | توضیحات |
| `created_at` | TIMESTAMPTZ | |

### رویدادهای قابل حسابرسی

| رویداد | موارد ثبت‌شده |
|--------|--------------|
| `role.assigned` | actor, target_user, role |
| `role.removed` | actor, target_user, role |
| `plan.changed` | actor, target_user, old_plan, new_plan |
| `restriction.added` | actor, target_user, restriction_key |
| `restriction.removed` | actor, target_user, restriction_key |
| `status.changed` | actor, target_user, old_status, new_status |
| `policy.executed` | policy_id, target_user, condition_snapshot |
| `override.applied` | actor, target_user, key, old_value, new_value |
| `override.removed` | actor, target_user, key |

---

## ۱۱. استراتژی کش

**Cache Strategy**

### معماری

Authorization Context در Redis به ازای هر کاربر کش می‌شود. بی‌اعتبارسازی کش **همزمان و فوری** است — قبل از برگرداندن پاسخ API، کش پاک می‌شود.

### کلید کش و TTL

```
کلید: iam:context:{userId}
TTL:  300 ثانیه (۵ دقیقه)
Fallback: اگر Redis در دسترس نباشد، Context مستقیماً از دیتابیس محاسبه می‌شود
```

### رویدادهای بی‌اعتبارسازی

| تغییر | محدوده بی‌اعتبارسازی |
|-------|---------------------|
| نقش اختصاص/حذف شد | کش یک کاربر |
| پلن تغییر کرد | کش یک کاربر |
| محدودیت اضافه/حذف شد | کش یک کاربر |
| وضعیت تغییر کرد | کش یک کاربر |
| Override اعمال شد | کش یک کاربر |
| خط‌مشی اجرا شد | کش یک کاربر |

### تضمین Ban/Suspend

```
1. نوشتن وضعیت جدید در دیتابیس
2. بی‌اعتبارسازی کش Redis برای آن کاربر
3. انتشار رویداد nons.iam.user.status_changed
4. برگرداندن 200 OK
```

> اگر بی‌اعتبارسازی کش شکست بخورد، نوشتن وضعیت برگردانده (Roll back) می‌شود. حالت جزئی برای عملیات Ban قابل قبول نیست.

---

## ۱۲. Business Rule Ownership

**Business Rule Ownership**

### اصل

Policy و Business Rule توسط IAM ساخته نمی‌شوند. هر سرویس کسب‌وکاری مالک Business Rule خود است و قراردادهای دسترسی خود را در IAM ثبت می‌کند.

### مدل

| مرحله | توضیح |
|-------|-------|
| 1 | سرویس کسب‌وکاری Permissionهای مورد نیاز خود را تعریف و در IAM ثبت می‌کند |
| 2 | IAM این Permissionها را نگهداری و برای Authorization استفاده می‌کند |
| 3 | سرویس کسب‌وکاری در زمان اجرا با IAM بررسی مجوز می‌کند |

### مثال

```
Marketplace:
  - تعریف: product.create, product.publish
  - بررسی: POST /v1/iam/authorization/check { userId, action: "product.create" }
  - IAM پاسخ می‌دهد: allowed / denied

Billing:
  - تعریف: seller.product.limit
  - IAM ذخیره می‌کند: premium.seller.product.limit = 500
  - Marketplace می‌پرسد: "کاربر چند محصول می‌تواند داشته باشد؟"
```

---

## ۱۳. معماری ران‌تایم

**Runtime Architecture**

```mermaid
graph TD
    Client[كلاينت] -->|GET /v1/iam/**| GW[Traefik Gateway]
    GW -->|ForwardAuth| Auth[Auth Service]
    Auth -->|X-User-Id| GW
    GW -->|Route| IAM[IAM Service]
    IAM -->|Read / Write| DB[(PostgreSQL)]
    IAM -->|Cache| Redis[(Redis)]
    
    Auth -->|nons.auth.user.registered| NATS[NATS JetStream]
    User[User Service] -->|nons.user.profile.created| NATS
    NATS -->|consume| IAM
    
    IAM -->|nons.iam.user.status_changed| NATS
    IAM -->|nons.iam.policy.executed| NATS
    
    NATS -->|consume| BusSvc[Business Services]
    BusSvc -->|POST /v1/iam/authorization/check| IAM
```

### ماتریس وابستگی

| سرویس | نوع ارتباط | جهت |
|-------|-----------|------|
| **Auth Service** | رویداد `nons.auth.user.registered` | ورودی |
| **User Service** | رویداد `nons.user.profile.created` | ورودی |
| **Business Services** | REST: `POST /authorization/check` | ورودی/خروجی |
| **Traefik Gateway** | Forward به `/v1/iam/...` | ورودی |
| **Redis** | کش Authorization Context | داخلی |
| **PostgreSQL** | دیتابیس دائمی | داخلی |

---

## ۱۴. تکنولوژی و استقرار

**Technology & Deployment**

| مؤلفه | فناوری |
|-------|--------|
| **زبان** | Go |
| **دیتابیس** | PostgreSQL (مستقل) |
| **کش** | Redis |
| **صف پیام** | NATS JetStream |

### متغیرهای محیطی

| متغیر | پیش‌فرض | توضیح |
|-------|---------|-------|
| `PORT` | `3004` | پورت HTTP |
| `DATABASE_URL` | `postgresql://iam:secret@localhost:5432/iam_db` | کانکشن دیتابیس |
| `REDIS_URL` | `redis://localhost:6379` | آدرس Redis |
| `NATS_URL` | `nats://localhost:4222` | آدرس NATS |

### دیتابیس

- موتور: PostgreSQL
- دیتابیس مستقل: `iam_db`
- مهاجرت: پوشه `migrations/`

---

## ۱۵. آینده توسعه

**Future Extensions**

| قابلیت | توضیح |
|--------|-------|
| **Relationship Service** | سرویس مجزا برای مالکیت منابع (Resource Ownership) با معماری ReBAC |
| **Policy Event Triggers** | اجرای خودکار خط‌مشی در پاسخ به رویدادهای سرویس‌ها |
| **Advanced Policy Conditions** | پشتیبانی از AND/OR/NOT در شرایط خط‌مشی |
| **Bulk Operations** | APIهای گروهی برای تغییر وضعیت، نقش و محدودیت |
| **Webhook Notifications** | ارسال رویدادهای حاکمیتی به سیستم‌های خارجی |

---

## مستندات مرتبط

- [معماری پلتفرم](../../platform/Architecture.md)
- [استاندارد نام‌گذاری رویدادها (ADR-EVENT-001)](../../platform/ADR/ADR-EVENT-001.md)
- [User Service Blueprint](./user-service.md)
- [استاندارد پاسخ API](../standard/api-response-format.md)
- <a href="../../../../../nons-api/catalog/events/iam/">ایونت کاتالوگ IAM</a>
