---
layout: doc
title: سیاست مستندات سرویس
description: فایل‌های اجباری docs/، توضیح هر فایل و قوانین به‌روزرسانی
version: 1.0.0
status: PRIVATE
author: xoxxel
owner: xoxxel
created_at: 2026-06-07
updated_at: 2026-06-07
tags:
  - Backend
  - Standard
  - Documentation
reviewers:
  - Backend Team
---

# سیاست مستندات سرویس
**Service Documentation Policy**

نسخه 1.0 | الزامی برای همه سرویس‌ها

---

## 1. اصل اساسی

هر سرویس مستندات خود را داخل پوشه `docs/` خود نگهداری می‌کند.  
**هیچ مستند سرویسی خارج از دایرکتوری سرویس زندگی نمی‌کند.**

---

## 2. فایل‌های اجباری

| فایل | محتوا | اجباری |
|---|---|---|
| `README.md` | راه‌اندازی، متغیرهای محیط، دستورالعمل اجرا، خلاصه نقاط پایانی | ✅ |
| `openapi.yaml` | مشخصات کامل OpenAPI 3.0 برای همه نقاط پایانی | ✅ |
| `events.md` | رویدادهای منتشر شده (با payload) و مصرف شده | ✅ |
| `database.md` | نمای کلی طرح دیتابیس، نکات مهاجرت | ✅ |

---

## 3. فایل‌های اختیاری اما توصیه شده

| فایل | محتوا |
|---|---|
| `adr/` | تصمیمات معماری خاص این سرویس (Architecture Decision Records) |
| `runbook.md` | نحوه اشکال‌زدایی مشکلات رایج در محیط تولید |
| `load-testing.md` | سناریوها و نتایج تست بار |
| `migration-guide.md` | راهنمای مهاجرت برای نسخه‌های MAJOR |

---

## 4. توضیح فایل‌های اجباری

### `README.md`
- اولین فایلی که هر توسعه‌دهنده می‌خواند
- باید طبق الگوی بخش ۶ (README Template) نوشته شود
- شامل راه‌اندازی، متغیرهای محیط، API، رویدادها، دیتابیس

### `openapi.yaml`
- مشخصات کامل OpenAPI 3.0
- شامل همه endpoints با متد، مسیر، پارامترها، درخواست و پاسخ
- همراه با سرویس به‌روزرسانی شود

```yaml
openapi: 3.0.0
info:
  title: Order Service
  version: 1.0.0
paths:
  /v1/orders:
    post:
      summary: Create a new order
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                productId:
                  type: string
                  format: uuid
                quantity:
                  type: integer
                  minimum: 1
      responses:
        '201':
          description: Order created
```

### `events.md`
- رویدادهایی که سرویس **منتشر می‌کند** (Publishes)
- رویدادهایی که سرویس **مصرف می‌کند** (Subscribes)
- هر رویداد با payload نمونه

```markdown
# Events

## Publishes

### `nons.order.created`
```json
{
  "id": "uuid-v7",
  "type": "order.created",
  "version": "1",
  "payload": {
    "orderId": "uuid",
    "sellerId": "uuid",
    "amount": 100.00
  }
}
```

## Subscribes

### `nons.payment.released`
- action: آزادسازی وجوه
```

### `database.md`
- موتور دیتابیس (PostgreSQL, MongoDB, Redis)
- موجودیت‌های اصلی با فیلدهای کلیدی
- روابط بین موجودیت‌ها
- نکات مهاجرت و ایندکس‌های مهم

---

## 5. قوانین

| قانون | توضیح |
|---|---|
| خودکفایی | مستندات هر سرویس در مخزن همان سرویس |
| هم‌گامی | تغییر در سرویس = به‌روزرسانی مستندات مربوطه |
| زبان | مستندات سرویس به **فارسی** نوشته می‌شوند (مقادیر و نام‌ها انگلیسی) |
| بازبینی | مستندات در PR بازبینی می‌شوند |
| ADR | تصمیمات معماری مهم باید در `adr/` مستند شوند |

---

## 6. چک‌لیست به‌روزرسانی

| تغییر در سرویس | مستندات نیازمند به‌روزرسانی |
|---|---|
| اضافه شدن endpoint | `openapi.yaml` ✅ |
| تغییر payload رویداد | `events.md` ✅ |
| تغییر دیتابیس | `database.md` ✅ |
| تغییر راه‌اندازی | `README.md` ✅ |
| تصمیم معماری جدید | `adr/` ✅ |
| تغییر رفتار | `README.md` + docs مربوطه ✅ |
