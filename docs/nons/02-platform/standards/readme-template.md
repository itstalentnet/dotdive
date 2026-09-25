---
layout: doc
title: الگوی README سرویس
description: ساختار اجباری docs/README.md — بخش‌ها، ترتیب و مثال کامل
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
  - Template
reviewers:
  - Backend Team
---

# الگوی README سرویس
**Service README Template**

نسخه 1.0 | الگوی اجباری برای `docs/README.md` هر سرویس

---

## 1. ساختار اجباری

فایل `docs/README.md` هر سرویس باید **دقیقاً** شامل این بخش‌ها با همین ترتیب باشد:

```markdown
# {نام سرویس}

> {یک جمله — این سرویس مسئول چه کاری است}

## مسئولیت‌ها

{لیست مواردی که این سرویس در اختیار دارد}

## شروع سریع

{حداقل مراحل برای اجرای محلی}

## متغیرهای محیط

| متغیر | الزامی | مقدار پیش‌فرض | توضیحات |
|---|---|---|---|
| `SERVICE_DB_URL` | بله | `postgres://localhost:5432/db` | آدرس دیتابیس |

## API

{لینک به openapi.yaml یا خلاصه نقاط پایانی}

## رویدادها

### منتشر می‌کند (Publishes)

{لیست رویدادهای خروجی}

### مصرف می‌کند (Subscribes)

{لیست رویدادهای ورودی}

## دیتابیس

{موتور دیتابیس، محل فایل طرح}

## وابستگی‌ها

{سرویس‌های دیگری که این سرویس مستقیماً صدا می‌زند}
```

---

## 2. مثال کامل

```markdown
# سرویس سفارش (Order Service)

> مدیریت چرخه عمر سفارشات از ایجاد تا تحویل و اختلاف

## مسئولیت‌ها

- ایجاد و مدیریت سفارشات
- مدیریت وضعیت‌های سفارش (Pending → Paid → Delivered → Completed)
- مدیریت اختلافات و انصراف
- انتشار رویدادهای مرتبط با سفارش

## شروع سریع

    # order-service بخشی از monorepo است — clone کل repo:
    git clone https://github.com/nons/nons-api
    cd nons-api/services/order-service
    cd order-service
    cp .env.example .env
    npm install
    npm run dev

سرویس در `http://localhost:3000` در دسترس خواهد بود.

## متغیرهای محیط

| متغیر | الزامی | مقدار پیش‌فرض | توضیحات |
|---|---|---|---|
| `ORDER_DB_URL` | بله | `postgres://localhost:5432/order_db` | آدرس دیتابیس PostgreSQL |
| `ORDER_REDIS_URL` | خیر | `redis://localhost:6379` | آدرس Redis برای کش |
| `ORDER_GUARANTEE_TIMEOUT_HOURS` | خیر | `24` | مدت زمان گارانتی بر حسب ساعت |
| `NATS_URL` | بله | `nats://localhost:4222` | آدرس NATS server |
| `NATS_CLUSTER_ID` | بله | `nons-cluster` | شناسه کلاستر NATS |

## API

مشخصات کامل API در [openapi.yaml](openapi.yaml) موجود است.

### نقاط پایانی اصلی

| Method | Path | توضیحات |
|---|---|---|
| POST | `/v1/orders` | ایجاد سفارش جدید |
| GET | `/v1/orders/:id` | دریافت جزئیات سفارش |
| PATCH | `/v1/orders/:id/status` | به‌روزرسانی وضعیت سفارش |

## رویدادها

### منتشر می‌کند (Publishes)

| رویداد | توضیحات |
|---|---|
| `nons.order.created` | سفارش جدید ایجاد شد |
| `nons.order.paid` | سفارش پرداخت شد |
| `nons.order.delivered` | سفارش تحویل شد |
| `nons.order.disputed` | اختلاف برای سفارش ثبت شد |

### مصرف می‌کند (Subscribes)

| رویداد | منبع | عکس‌العمل |
|---|---|---|
| `nons.payment.released` | Payment Service | آزادسازی وجوه به فروشنده |
| `nons.user.suspended` | Auth Service | لغو سفارش‌های در انتظار کاربر |

## دیتابیس

- **موتور:** PostgreSQL 15
- **طرح:** [database.md](database.md)
- **مهاجرت:** پوشه `migrations/` در ریشه سرویس

### موجودیت‌های اصلی

- `orders` — سفارشات
- `order_items` — آیتم‌های سفارش
- `order_status_history` — تاریخچه وضعیت‌ها

## وابستگی‌ها

| سرویس | نوع وابستگی |
|---|---|
| Auth Service | احراز هویت کاربران |
| Payment Service | پرداخت و مدیریت Escrow |
| Notification Service | ارسال نوتیفیکیشن به کاربران |
```

---

## 3. قوانین

| قانون | توضیح |
|---|---|
| ترتیب ثابت | بخش‌ها باید به همین ترتیب باشند |
| همه بخش‌ها اجباری | حتی اگر خالی باشند — `---` بگذارید |
| زبان | توضیحات فارسی، مقادیر و نام‌ها انگلیسی |
| به‌روزرسانی | هر PR که رفتار را تغییر می‌دهد باید README را به‌روز کند |
| لینک‌ها | به `openapi.yaml` و `database.md` لینک مستقیم بدهید |
