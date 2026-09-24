---
layout: doc
title: راهنمای درگاه API Gateway
description: راهنمای اجرا، پیکربندی، متغیرهای محیطی و سناریوهای عیب‌یابی درگاه ورود پلتفرم (API Gateway)
version: 1.0.0
status: PUBLIC
author: Antigravity
owner: Platform Team
created_at: 2026-06-14
updated_at: 2026-06-14
tags:
  - Gateway
  - README
  - Platform
  - How-To
reviewers:
  - Platform Team
  - Backend Team
  - Devops
---

# راهنمای درگاه API Gateway

**API Gateway Service Guide**

> **خلاصه:** این مستند راهنمای کاملی برای نحوه پیکربندی، راه‌اندازی، متغیرهای محیطی، تست محلی و عیب‌یابی درگاه API Gateway پلتفرم NONS ارائه می‌دهد.

---

## ارجاعات مرتبط

**Related Documents**

- [تصمیم معماری ۱: انتخاب درگاه](./ADR/ADR-Gateway-001)
- [بلوپرینت درگاه (Gateway Blueprint)](./blueprint)
- [راهنمای نام‌گذاری پلتفرم](../standards/naming-conventions)

---

## فهرست محتوا

**Table of Contents**

1. [معرفی و هدف سرویس](#۱-معرفی-و-هدف-سرویس)
2. [نیازمندی‌ها و وابستگی‌ها](#۲-نیازمندی‌ها-و-وابستگی‌ها)
3. [متغیرهای محیطی (Environment Variables)](#۳-متغیرهای-محیطی-environment-variables)
4. [نحوه اجرا (How to Run)](#۴-نحوه-اجرا-how-to-run)
5. [نحوه تست محلی (Local Testing)](#۵-نحوه-تست-محلی-local-testing)
6. [مثال درخواست‌ها (Request Examples)](#۶-مثال-درخواست‌ها-request-examples)
7. [عیب‌یابی (Troubleshooting)](#۷-عیب‌یابی-troubleshooting)

---

## ۱. معرفی و هدف سرویس

**Introduction & Objective**

درگاه API Gateway (پیاده‌سازی شده بر پایه Traefik v3) لایه ورودی خارجی پلتفرم NONS است. هیچ درخواستی از خارج پلتفرم نباید بدون عبور از این درگاه به میکروسرویس‌ها برسد. این درگاه امنیت لبه، بررسی اولیه احراز هویت کلاینت‌ها، هدایت ترافیک به سرویس مقصد، و تزریق Correlation ID را پوشش می‌دهد.

---

## ۲. نیازمندی‌ها و وابستگی‌ها

**Prerequisites & Dependencies**

برای اجرای رسمی درگاه در محیط توسعه محلی به ابزارهای زیر نیاز است:
- **K3d CLI >= v5.6**
- **Helm CLI >= v3.12**
- **Kubectl**
- **Docker** (صرفاً به عنوان ران‌تایم موتور کانتینر کلاستر)

درگاه برای اعتبارسنجی توکن‌های مسیرهای محافظت‌شده به اجرای **Auth Service (Bridge)** نیاز دارد.

---

## ۳. متغیرهای محیطی (Environment Variables)

**Environment Variables**

تنظیمات درگاه از طریق فایل `.env` در روت پروژه بک‌اند `nons-api/` مدیریت می‌شوند. متغیرهای کلیدی درگاه به شرح زیر هستند:

| متغیر محیطی | مقدار پیش‌فرض | توضیح |
| --- | --- | --- |
| `GATEWAY_PORT` | `80` | پورتی که درگاه درخواست‌های خارجی را روی آن دریافت می‌کند. |
| `GATEWAY_DASHBOARD_PORT` | `8085` | پورت دسترسی به داشبورد مدیریتی Traefik. |
| `GATEWAY_DASHBOARD_USER` | `admin` | نام کاربری پنل داشبورد درگاه. |
| `GATEWAY_DASHBOARD_PASSWORD_HASH` | `$$2y$$10$$abcdef...` | هش کلمه عبور پنل داشبورد (فرمت bcrypt). |
| `AUTH_SERVICE_VALIDATE_URL` | `http://auth-service:8080/v1/auth/validate` | آدرس بررسی صحت توکن در سرویس واسط احراز هویت. |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | دامنه‌های مجاز فرانت‌اند برای دسترسی به APIها. |

---

## ۴. نحوه اجرا (How to Run)

**How to Run**

مسیر رسمی و انحصاری برای اجرای درگاه و کل پلتفرم، استقرار روی کلاستر کوبرنتیز محلی (K3d) یا پروداکشن (K3s) به وسیله Helm است:

### مسیر رسمی (Helm + K3d)
برای بالا آوردن درگاه در کلاستر محلی K3d، پس از راه‌اندازی کلاستر و نصب سایر چارت‌های زیرساختی (طبق [راهنمای راه‌اندازی](../../devops/setup-guide))، دستور زیر را اجرا کنید:
```powershell
helm install nons-gateway ./deploy/helm/gateway -n nons-system -f ./deploy/environments/local/values.yaml
```

---

## ۵. نحوه تست محلی و داشبوردها (Local Testing & Dashboards)

**Local Testing**

پس از اجرای موفق درگاه، می‌توانید کارکرد آن را بررسی کنید:

### ۱. داشبورد مدیریتی Traefik (Traefik Dashboard)
مرورگر خود را باز کرده و به آدرس زیر مراجعه کنید:
- **URL داشبورد:** `http://localhost:8085/dashboard/`
- **احراز هویت:** پس از ورود به آدرس فوق، از شما نام کاربری و کلمه عبور خواسته می‌شود:
  - **نام کاربری (Username):** `admin`
  - **کلمه عبور (Password):** `admin` (یا هش تعریف شده در فایل `.env`)
در این داشبورد می‌توانید وضعیت روت‌ها (HTTP Routers)، سرویس‌ها (Services) و میان‌افزارهای فعال (Middlewares) را به صورت زنده رصد کنید.

### ۲. بررسی سلامت درگاه (Ping Endpoint)
برای اطمینان از آماده بودن درگاه، درخواست زیر را ارسال کنید:
```powershell
curl.exe -i http://localhost/v1/auth/health
```
باید پاسخ `200 OK` به همراه وضعیت سرویس احراز هویت دریافت کنید:
```json
{"status":"UP","timestamp":"2026-06-15T..."}
```

---

## ۶. دریافت توکن تستی و اعتبارسنجی (Test JWT Generation & Validation)

**Test Authentication Scenario**

برای تست و شبیه‌سازی درخواست‌های احراز هویت شده بدون نیاز به رابط کاربری کامل، می‌توانید جریان تأیید نشست را با کوکی شبیه‌سازی کنید:

### ۱. ورود به سیستم و دریافت کوکی نشست (Login & Fetch Cookie)
ابتدا یک درخواست ورود شبیه‌سازی شده به سرویس احراز هویت ارسال کنید یا از طریق مرورگر به آدرس `http://localhost/v1/auth/login` مراجعه کرده و وارد شوید تا کوکی `ory_kratos_session` روی مرورگر شما تنظیم شود.

### ۲. فراخوانی مسیر محافظت شده (Call Protected Route)
کوکی نشست دریافت شده را در درخواست خود به درگاه Gateway اعمال کنید تا لایه Forward Auth آن را تایید کند:
```powershell
# استفاده از curl برای ارسال کوکی نشست
curl.exe -i --cookie "ory_kratos_session=<SESSION_COOKIE_VALUE>" http://localhost/v1/protected
```
خروجی موفقیت‌آمیز (`200 OK`) شامل هدرهای هویتی تزریق شده توسط درگاه به سرویس بالادستی خواهد بود:
```http
HTTP/1.1 200 OK
X-User-Id: 550e8400-e29b-41d4-a716-446655440000
X-Subject: user@example.com
```

---

## ۷. جریان واقعی احراز هویت کلاینت (Real Login Flow Scenario)

**Real Kratos + Traefik ForwardAuth Flow**

در سناریوی واقعی، مرورگر کاربر مراحل احراز هویت را به شکل زیر طی می‌کند:

### مرحله ۱: ورود ایمیل (Email Submission)
کاربر به آدرس ورود مراجعه کرده و ایمیل خود را وارد می‌کند. درخواست به مسیر زیر ارسال می‌شود:
```text
POST http://localhost/v1/auth/entry
```
سرویس `auth-service` به صورت پویا با Kratos ارتباط برقرار کرده و متناسب با وضعیت کاربر، یکی از جریان‌های زیر را آغاز می‌کند:
- **کاربر موجود:** ریدایرکت به آدرس `/v1/auth/login?flow=<flow_id>` به همراه ارسال کد OTP به ایمیل کاربر.
- **کاربر جدید:** ریدایرکت به آدرس `/v1/auth/register?flow=<flow_id>` به همراه ارسال کد OTP به ایمیل کاربر.

### مرحله ۲: تایید کد یکبار مصرف (OTP Code Verification)
کاربر کد ۶ رقمی OTP را وارد کرده و به سرویس ارسال می‌کند. Kratos صحت کد را تایید نموده و کوکی نشست `ory_kratos_session` را روی مرورگر کاربر تنظیم کرده و او را به `/v1/auth/dashboard` هدایت می‌کند.

### مرحله ۳: فراخوانی سرویس‌های محافظت‌شده
برای درخواست‌های بعدی به سرویس‌های تجاری (مثلاً `/v1/orders/*`):
1. مرورگر کوکی نشست `ory_kratos_session` را به صورت خودکار به همراه درخواست ارسال می‌کند.
2. درگاه Traefik درخواست را متوقف کرده و آن را جهت تایید صلاحیت به مسیر `/v1/auth/validate` در سرویس `auth-service` ارسال می‌کند (ForwardAuth).
3. سرویس `auth-service` کوکی نشست را با Kratos بررسی می‌کند. در صورت معتبر بودن، هدرهای `X-User-Id` و `X-Subject` را تزریق کرده و Traefik درخواست را به سرویس مقصد عبور می‌دهد.

---

## ۸. عیب‌یابی (Troubleshooting)

**Troubleshooting**

### خطای ۵۰۲ Bad Gateway
- **علت ۱:** میکروسرویس مقصد خاموش یا در حال بالا آمدن است.
  - *رفع مشکل:* وضعیت پاد مقصد را با دستور `kubectl get pods -n nons-platform` بررسی کنید.
- **علت ۲:** پورت معرفی شده در Service/Ingress کوبرنتیز با پورت اجرای سرویس مطابقت ندارد.
  - *رفع مشکل:* چارت Helm و فایل values.yaml سرویس مربوطه را بررسی کنید.

### خطای ۵۰۴ Gateway Timeout
- **علت:** سرویس مقصد درخواست را دریافت کرده اما نتوانسته در زمان مجاز پاسخ دهد.
  - *رفع مشکل:* لاگ‌های سرویس مقصد را با دستور `kubectl logs -l app={service-name} -n nons-platform --tail=100` بررسی کنید.

### عدم شناسایی سرویس جدید توسط درگاه
- **علت ۱:** پاد سرویس جدید در Namespace یا شبکه کلاستر به درستی ثبت نشده است.
  - *رفع مشکل:* سلامت سرویس کوبرنتیز را با `kubectl get svc -n nons-platform` بررسی کنید.
- **علت ۲:** تنظیمات IngressRoute برای سرویس جدید اعمال نشده است.
  - *رفع مشکل:* وجود منابع IngressRoute را با `kubectl get ingressroute -n nons-system` بررسی کنید.

---

**آخرین بروزرسانی:** 2026-06-15  
**وضعیت:** ✅ تایید شده (APPROVED)  
