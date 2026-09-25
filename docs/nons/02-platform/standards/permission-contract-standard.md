---
layout: doc
title: استاندارد قرارداد مجوز
description: نحوه تعریف، ثبت و استفاده از Permission Contractها در سرویس‌های پلتفرم NONS
version: 1.0.0
status: APPROVED
author: Backend Team
owner: Backend Team
created_at: 2026-06-22
updated_at: 2026-06-22
tags:
  - Backend
  - Standard
  - IAM
  - Authorization
  - Permission
reviewers:
  - Backend Team
  - Platform Team
---

# استاندارد قرارداد مجوز

**Permission Contract Standard**

> این سند نحوه تعریف، ثبت و مصرف Permission Contractها توسط سرویس‌های کسب‌وکاری را مشخص می‌کند. هر سرویس مسئول تعریف Permissions و Business Rules خود است و IAM صرفاً این قراردادها را نگهداری و برای Authorization استفاده می‌کند.

---

## ۱. اصل بنیادین

**هر سرویس مالک Permissions خود است. IAM نگهبان قراردادهاست.**

```
سرویس تعریف می‌کند:  چه Permissionsی نیاز دارد
IAM ثبت می‌کند:     قرارداد در دیتابیس
سرویس بررسی می‌کند: از طریق POST /v1/iam/authorization/check
IAM پاسخ می‌دهد:    allowed / denied
```

---

## ۲. چرخه عمر Permission Contract

| مرحله | توضیح | مسئول |
|-------|-------|-------|
| **۱. تعریف** | سرویس Permissions مورد نیاز خود را مشخص می‌کند | سرویس کسب‌وکاری |
| **۲. ثبت** | Permissions از طریق API IAM ثبت می‌شوند | توسعه‌دهنده / CD |
| **۳. نگهداری** | IAM قراردادها را ذخیره و در Context محاسبه می‌کند | IAM |
| **۴. مصرف** | سرویس در زمان اجرا مجوز را از IAM بررسی می‌کند | سرویس کسب‌وکاری |
| **۵. تغییر** | تغییر Permission = Breaking Change، نیاز به انتشار نسخه جدید | سرویس کسب‌وکاری |

### قانون ثبت

Permissions **باید** قبل از اینکه یک سرویس به تولید برود در IAM ثبت شده باشند. روش‌های ثبت:

| روش | توضیح | زمان |
|-----|-------|------|
| **API دستی** | POST /v1/iam/permissions در زمان راه‌اندازی | توسعه |
| **اسکریپت Seed** | فایل seed در مخزن سرویس | CI/CD |
| **مقادیر پیش‌فرض** | توسط ادمین در پنل مدیریت | runtime |

---

## ۳. فرمت کلید Permission

### قاعده نام‌گذاری

```
{resource}.{action}
```

| بخش | قاعده | مثال |
|-----|-------|------|
| `resource` | kebab-case، مفرد | `product`، `order`، `wallet` |
| `action` | kebab-case، فعل ساده | `create`، `edit`، `delete`، `view` |

### نمونه‌های مجاز

| سرویس | Permission | توضیح |
|-------|-----------|-------|
| marketplace-service | `products.create` | ایجاد محصول جدید |
| marketplace-service | `products.update` | ویرایش محصول |
| marketplace-service | `products.delete` | حذف محصول |
| marketplace-service | `products.publish` | انتشار محصول |
| order-service | `orders.create` | ایجاد سفارش |
| order-service | `orders.cancel` | لغو سفارش |
| wallet-service | `wallets.read` | مشاهده کیف پول |
| wallet-service | `wallets.withdraw` | برداشت از کیف پول |
| iam-service | `admin.access` | دسترسی به پنل مدیریت |
| iam-service | `settings.read` | مشاهده تنظیمات سیستم |

> نکته: کلیدهای مجوز در namespaceهای جمع تعریف می‌شوند (مثلاً `products.*`، `orders.*`) هرچند نام پوشهٔ سرویس ممکن است مفرد باشد (`order-service`). این تفاوت عمدی است.

### کلیدهای ممنوع

| الگوی ممنوع | دلیل |
|-------------|------|
| `user.*` | متعلق به IAM نیست — User Service پروفایل را مدیریت می‌کند |
| `admin.*` | `admin.access` کافی است — بقیه بر اساس resource تعریف می‌شوند |
| `*.*` | وایلدکارد ممنوع — هر Permission باید صریح باشد |

---

## ۴. فرمت کلید Entitlement

```
{owner}.{resource}.{metric}
```

| بخش | قاعده | مثال |
|-----|-------|------|
| `owner` | مفرد، kebab-case | `seller`، `buyer` |
| `resource` | مفرد، kebab-case | `product`، `withdraw` |
| `metric` | kebab-case | `limit`، `count`، `enabled` |

### نمونه‌ها

| کلید | type | مفهوم |
|------|------|-------|
| `seller.product.limit` | NUMBER | حداکثر تعداد محصول مجاز |
| `seller.boost.count` | NUMBER | تعداد بوست مجاز در ماه |
| `buyer.order.limit` | NUMBER | حداکثر سفارش همزمان |
| `daily.withdraw.limit` | NUMBER | سقف برداشت روزانه |
| `feature.analytics` | BOOLEAN | دسترسی به داشبورد تحلیلی |
| `feature.auto_boost` | BOOLEAN | دسترسی به بوست خودکار |

---

## ۵. Business Rule Ownership

### قاعده

هر سرویس کسب‌وکاری مالک Business Rules خود است. Policy و Business Rule توسط IAM ساخته نمی‌شوند.

### مدل

```
سرویس:
  - تعریف می‌کند: Entitlement key + مقدار پیش‌فرض
  - ثبت می‌کند: در IAM از طریق API
  - بررسی می‌کند: از IAM می‌پرسد کاربر چه Entitlementی دارد
  - تصمیم می‌گیرد: خودش اعمال محدودیت می‌کند

مثال:
  IAM ذخیره می‌کند:  seller.product.limit = 10 (برای نقش SELLER)
  Marketplace:       current_products_count = 8
  تصمیم:             8 < 10 → مجاز است (تصمیم با Marketplace است)
```

### قانون اجرا

| مؤلفه | محل اجرا |
|-------|---------|
| Permission check (allowed/denied) | IAM |
| Entitlement values (limits, counts) | ارائه توسط IAM، اجرا توسط سرویس |
| Business Logic (شرط‌های پیچیده) | سرویس کسب‌وکاری |

---

## ۶. Permission Registration Checklist

هر سرویس پیش از راه‌اندازی باید چک‌لیست زیر را تکمیل کند:

- [ ] تمام Permissions مورد نیاز در IAM ثبت شده‌اند
- [ ] تمام Entitlements با مقادیر پیش‌فرض تعریف شده‌اند
- [ ] Business Rules سرویس در مستندات سرویس ثبت شده‌اند
- [ ] رویدادهای IAM مصرف‌شده در سرویس مستند شده‌اند
- [ ] Authorization Context در endpointهای敏感 بررسی می‌شود

---

## ۷. منابع بیشتر

- [Blueprint سرویس IAM](../../backend/services/iam-service.md)
- [استاندارد امنیت](security-policy.md)
- [استاندارد نام‌گذاری رویدادها (ADR-EVENT-001)](../ADR/ADR-EVENT-001.md)
- [معماری پلتفرم](../Architecture.md)
