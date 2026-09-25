---
layout: doc
title: ران‌بوک عملیات
description: دفترچه راهنمای عملیات پلتفرم — کشیک، سطوح شدت، مسیر تشدید و بازیابی
version: 1.0.0
status: PRIVATE
author: xoxxel
owner: xoxxel
created_at: 2026-06-03
updated_at: 2026-06-15
tags:
  - DevOps
  - Runbook
  - Operations
  - Incident
  - Monitoring
reviewers:
  - Devops
  - Backend Team
  - SRE
---

# ران تایم
**نسخه:** v1.0  
**دامنه:** تمام سرویس‌های تولیدی  
**مخاطب:** مهندسان کشیک، SRE، عملیات پلتفرم  
**آخرین به‌روزرسانی:** ۱۴۰۵-۰۳-۱۳ (2026-06-03)

## فهرست مطالب
- [مبانی کشیک](#مبانی-کشیک)
- [سطوح شدت](#سطوح-شدت)
- [مسیر تشدید](#مسیر-تشدید)
- [ابزارهای تشخیص عمومی](#ابزارهای-تشخیص-عمومی)
- [حوادث IAM](#حوادث-iam)
- [حوادث کش](#حوادث-کش)
- [حوادث Event Bus](#حوادث-event-bus)
- [حوادث پایگاه داده](#حوادث-پایگاه-داده)
- [حوادث Marketplace](#حوادث-marketplace)
- [حوادث Wallet](#حوادث-wallet)
- [پس از حادثه](#پس-از-حادثه)
- [تماس‌ها و منابع](#تماسها-و-منابع)

## ۱. مبانی کشیک

### ۶۰ ثانیه اول هر حادثه
1. داشبورد مانیتورینگ را چک کنید → سرویس(های) تحت تأثیر را شناسایی کنید
2. NATS DLQ را برای backlog رویدادها بررسی کنید
3. وضعیت Redis را چک کنید
4. تأخیر replication PostgreSQL را بررسی کنید
5. شدت حادثه را تعیین کنید → بر اساس آن صفحه کنید
6. کانال حادثه را باز کنید: `#incident-YYYY-MM-DD`
7. وضعیت اولیه را پست کنید

### سیگنال‌های طلایی که اول باید چک کنید

| سیگنال                  | ابزار          | آستانه نگرانی                  |
|-------------------------|----------------|--------------------------------|
| نرخ خطا                | Grafana        | > ۱٪ درخواست‌ها               |
| تأخیر (p99)            | Grafana        | > ۵۰۰ میلی‌ثانیه              |
| اشباع (CPU/Mem)        | Grafana        | > ۸۰٪ پایدار                   |
| تأخیر مصرف‌کننده NATS | داشبورد NATS  | > ۱۰۰۰ پیام                    |
| حافظه Redis            | Redis Insight  | > ۸۵٪                          |
| اتصالات Postgres       | Grafana        | > ۸۰٪ از حداکثر               |
| تعداد پیام DLQ         | داشبورد NATS  | > ۱۰ پیام                      |

## ۲. سطوح شدت

| سطح     | نام          | تعریف                                      | زمان پاسخگویی       | مثال‌ها |
|---------|-------------|-------------------------------------------|---------------------|--------|
| SEV-1  | بحرانی     | قطعی کل پلتفرم یا خطر از دست رفتن داده   | فوری — بیدار کردن همه | کاربران نمی‌توانند لاگین کنند، پرداخت‌ها شکست می‌خورند، خرابی DB |
| SEV-2  | بالا        | ویژگی اصلی برای بخش قابل توجهی از کاربران خراب است | کمتر از ۱۵ دقیقه     | داده‌های IAM اشتباه، برداشت‌ها برای همه کاربران مسدود |
| SEV-3  | متوسط      | تجربه کاربری کاهش یافته، راه‌حل جایگزین وجود دارد | کمتر از ۱ ساعت       | کندی موتور سیاست، تأخیر اعلان‌ها، خطای یک سرویس |
| SEV-4  | پایین       | مشکل جزئی بدون تأثیر بر کاربر           | روز کاری بعدی       | نویز لاگ، پیام‌های تک DLQ، انحراف متریک غیربحرانی |

## ۳. مسیر تشدید

```
Alert → 
On-call Engineer (L1) → 
(اگر حل نشد) Senior Engineer (L2) → 
(اگر حل نشد) Engineering Lead (L3) → 
(در صورت از دست رفتن داده یا قطعی طولانی) CTO + Legal
```

### قوانین صفحه کردن
- **SEV-1:** همزمان L1 و L2 را صفحه کنید.
- **SEV-2:** فقط L1 را صفحه کنید. L2 در حالت آماده‌باش.
- **SEV-3:** L1 به صورت async مدیریت کند. خارج از ساعات اداری صفحه نشود.
- **SEV-4:** تیکت ایجاد شود. صفحه نشود.

## ۴. ابزارهای تشخیص عمومی

### چک کردن سلامت سرویس‌ها
```bash
# از طریق Gateway
curl -s http://localhost/v1/auth/health
curl -s http://localhost/v1/auth/ready

# مستقیم (فقط در شبکه داخلی کلاستر)
curl -s http://auth-service:3001/health
```

### Kubernetes / K3d (تنها مسیر رسمی)
```bash
# بررسی وضعیت کلاستر
k3d cluster list
kubectl cluster-info

# بررسی پادها
kubectl get pods -n nons-platform
kubectl get pods -n nons-system
kubectl describe pod <pod-name> -n nons-platform

# لاگ‌ها
kubectl logs <pod-name> -n nons-platform --tail=100
kubectl logs -f -l app=auth-service -n nons-platform

# بررسی وضعیت Helm
helm list -n nons-platform
helm history nons-auth-service -n nons-platform
helm status nons-auth-service -n nons-platform

# بررسی IngressRoutes
kubectl get ingressroute -n nons-system
```

### پایگاه داده PostgreSQL
```sql
-- تعداد اتصالات
SELECT count(*) FROM pg_stat_activity;

-- کوئری‌های کند
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 seconds'
ORDER BY duration DESC;
```

### Redis
```bash
# از داخل کلاستر
kubectl run tmp-redis-cli --rm -i --tty --image=redis:alpine -n nons-platform -- redis-cli -h redis ping
redis-cli -h $REDIS_HOST INFO
redis-cli -h $REDIS_HOST INFO memory
redis-cli -h $REDIS_HOST SLOWLOG GET 10
```

### NATS
```bash
# از داخل کلاستر
kubectl exec -n nons-platform -it deployment/nons-nats -- nats stream list
curl http://$NATS_HOST:8222/healthz
nats stream info IAM
nats consumer info IAM marketplace-service-consumer
```

### Helm (مدیریت استقرار)
```bash
# بررسی تاریخچه استقرار
helm history nons-auth-service -n nons-platform

# بازگشت به نسخه قبل
helm rollback nons-auth-service <revision> -n nons-platform

# مشاهده مقادیر جاری
helm get values nons-auth-service -n nons-platform
```

### K3d (مدیریت کلاستر محلی)
```bash
# ایست/شروع کلاستر
k3d cluster stop nons
k3d cluster start nons

# ایمپورت ایمیج جدید
k3d image import nons-auth-service:latest -c nons

# حذف و بازسازی کلاستر
k3d cluster delete nons
```

## ۵. حوادث IAM

### ۵.۱ بازگشت داده قدیمی (Stale) در IAM Context
**علائم:**
- کاربر بن شده ولی هنوز دسترسی دارد
- محدودیت اعمال شده ولی توسط سرویس‌های پایین‌دستی اجرا نمی‌شود

**تشخیص:**
```sql
-- چک کردن دیتابیس IAM (جدول users در IAM نگهداری می‌شود، نه Auth)
SELECT status, updated_at FROM users WHERE kratos_id = '<userId>';
```
```bash
redis-cli -h $REDIS_HOST GET "iam:context:<userId>"
```

**رفع:**
```bash
redis-cli -h $REDIS_HOST DEL "iam:context:<userId>"
```

### ۵.۲ فعال نشدن Policy Engine
**رفع:**
- استفاده از Admin API برای ارزیابی دستی سیاست
- فعال کردن مجدد مصرف‌کننده NATS
- فعال کردن سیاست در دیتابیس

### ۵.۳ عدم پاسخگویی سرویس IAM (SEV-1)
**رفع:**
1. ری‌استارت سرویس
2. Redeploy کامل
3. Rollback به ایمیج قبلی

## ۶. حوادث کش (Cache)

### ۶.۱ خرابی یا ناهماهنگی Redis Cache
**رفع:**
```bash
# فلاش فقط کلیدهای IAM (ایمن)
redis-cli -h $REDIS_HOST --scan --pattern "iam:context:*" | xargs redis-cli -h $REDIS_HOST DEL
```

### ۶.۲ تمام شدن حافظه Redis
**رفع فوری:**
- افزایش موقت `maxmemory`
- فلاش کلیدهای غیرضروری
- بررسی fragmentation

### ۶.۳ عدم دسترسی به Redis (SEV-1/2)

## ۷. حوادث Event Bus (NATS)

### ۷.۱ تأخیر مصرف‌کننده NATS
**رفع:**
- ری‌استارت سرویس مصرف‌کننده
- Scale up replicas
- Skip پیام مشکل‌دار

### ۷.۲ عدم دسترسی JetStream (SEV-1)

### ۷.۳ پر شدن Dead Letter Queue

## ۸. حوادث پایگاه داده

### ۸.۱ تعداد بالای اتصالات PostgreSQL
### ۸.۲ کوئری‌های کند

## ۹. حوادث Marketplace

### ۹.۱ پردازش نشدن سفارشات

## ۱۰. حوادث Wallet

### ۱۰.۱ مسدود شدن غیرمنتظره برداشت‌ها

## ۱۱. پس از حادثه (Post-Incident)

**الزامی برای SEV-1 و SEV-2 در کمتر از ۲۴ ساعت**

### قالب گزارش حادثه
```markdown
## گزارش حادثه — <تاریخ> — <عنوان>

**شدت:** SEV-X  
**مدت:** X ساعت X دقیقه  
**سرویس‌های تحت تأثیر:**  

### timeline
### Root Cause
### چه چیزی خوب پیش رفت
### چه چیزی بد پیش رفت
### اقدامات اصلاحی
```

## ۱۲. تماس‌ها و منابع

### داشبوردها
- **Grafana:** http://grafana.internal
- **NATS Dashboard:** http://nats.internal:8222
- **Redis Insight:** http://redis.internal
- **Jaeger:** http://jaeger.internal
- **Traefik Dashboard:** `http://localhost:8085` (محلی)

### متغیرهای محیطی مهم
- `IAM_DATABASE_URL`
- `REDIS_HOST`
- `NATS_URL`
- `KRATOS_ADMIN_URL`
- `HYDRA_ADMIN_URL`

### مستندات مرتبط
- **Helm Architecture:** ./helm-architecture.md
- **راهنمای استقرار:** ./setup-guide.md

---

**کانال‌های ارتباطی:**
- اصلی: `#incident-<تاریخ>`
- تشدید: `#engineering-leads`
- Status Page: https://status.platform.internal

