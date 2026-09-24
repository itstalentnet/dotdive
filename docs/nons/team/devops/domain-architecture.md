---
layout: doc
title: معماری دامنه و DNS
description: تعریف دامنه‌های اصلی، ساب‌دامنه سرویس‌ها و استراتژی پیکربندی DNS
version: 1.0.0
status: PRIVATE
author: Antigravity
owner: Devops Team
created_at: 2026-06-16
updated_at: 2026-06-16
tags:
  - Domain
  - DNS
  - Network
  - Infrastructure
  - Kubernetes
reviewers:
  - Devops Team
  - Backend Team
  - Platform Team
---

# معماری دامنه و DNS

**Domain & DNS Architecture**

---

## ۱. اصول معماری

1. **هیچ دامنه‌ای Hard-Coded نیست** — همه آدرس‌ها از طریق Helm Values / Environment Variables قابل تغییر هستند.
2. **یک دامنه اصلی، چند ساب‌دامنه** — سرویس‌ها روی ساب‌دامنه‌های `{service}.nons.{tld}` در دسترس هستند.
3. **DNS در لایه Ingress مدیریت می‌شود** — نه در کد سرویس.
4. **TLS برای همه دامنه‌های عمومی اجباری است** — فقط HTTPS پذیرفته می‌شود.

---

## ۲. دامنه‌های اصلی (Primary Domains)

| دامنه | نوع | کاربرد | وضعیت |
|-------|-----|--------|-------|
| `nons.ir` | TLD ایران | دامنه اصلی پلتفرم برای کاربران ایرانی | 🟡 ثبت شده — تأیید شود |
| `nons.app` | TLD بین‌الملل | دامنه دوم برای دسترسی بین‌الملل | 🟡 ثبت شده — تأیید شود |

**خط‌مشی:** `nons.ir` دامنه اصلی است. `nons.app` به عنوان fallback و برای کاربران بین‌الملل استفاده می‌شود. تمام تنظیمات DNS ابتدا روی `nons.ir` اعمال و سپس برای `nons.app` تکرار می‌شود.

---

## ۳. ساب‌دامنه سرویس‌ها (Service Domains)

### ۳.۱ سرویس‌های فعلی (MVP)

| ساب‌دامنه | سرویس مقصد | Ingress Route | Port |
|-----------|-----------|--------------|------|
| `api.nons.ir` | API Gateway (Traefik) | همه مسیرهای `/v1/*` | ۴۴۳ |
| `auth.nons.ir` | Auth Service (مستقیم) | مسیرهای OAuth2 | ۴۴۳ |
| `kratos.nons.ir` | Ory Kratos (ادمین) | مدیریت هویت | ۴۴۳ |

### ۳.۲ سرویس‌های آینده

| ساب‌دامنه | سرویس | فاز |
|-----------|-------|-----|
| `iam.nons.ir` | IAM Service | فاز ۲ |
| `marketplace.nons.ir` | Marketplace Service | فاز ۲ |
| `order.nons.ir` | Order Service | فاز ۳ |
| `payment.nons.ir` | Payment Service | فاز ۳ |
| `chat.nons.ir` | Chat Service | فاز ۳ |
| `storage.nons.ir` | Storage Service | فاز ۴ |
| `monitor.nons.ir` | Monitoring (Grafana) | فاز ۲ |

### ۳.۳ الگوی نام‌گذاری

```
{service}.nons.ir
{service}.nons.app
```

| مؤلفه | قانون | مثال |
|-------|-------|------|
| پیشوند سرویس | اسم سرویس بدون خط تیره | `auth`, `api`, `kratos` |
| دامنه اصلی | `nons.ir` یا `nons.app` | `nons.ir` |
| الگوی کامل | `{service}.nons.ir` | `api.nons.ir` |
| Environment | فقط در Production | — |

---

## ۴. پیکربندی در Helm Values

همه دامنه‌ها از طریق `values.yaml` در Helm قابل تنظیم هستند. هیچ دامنه‌ای در کد سرویس Hard-Code نمی‌شود.

### ۴.۱ Gateway Ingress

```yaml
# deploy/environments/production/values.yaml
gateway:
  ingress:
    enabled: true
    hosts:
      - host: api.nons.ir
        paths:
          - /v1/auth/*
          - /v1/protected
      - host: auth.nons.ir
        paths:
          - /
    tls:
      - hosts:
          - api.nons.ir
          - auth.nons.ir
        secretName: nons-tls
```

### ۴.۲ سرویس‌های داخلی

سرویس‌ها از متغیرهای محیطی برای آدرس‌دهی استفاده می‌کنند:

```yaml
# deploy/helm/auth-service/values.yaml
env:
  KRATOS_PUBLIC: "http://nons-kratos:4433"
  KRATOS_ADMIN: "http://nons-kratos:4434"
  HYDRA_PUBLIC: "http://nons-hydra:4444"
  HYDRA_ADMIN: "http://nons-hydra:4445"
  LOGIN_APP: "http://auth.nons.ir"
```

در محیط توسعه محلی:

```yaml
# deploy/environments/local/values.yaml
env:
  KRATOS_PUBLIC: "http://localhost:4433"
  LOGIN_APP: "http://localhost:3001"
```

---

## ۵. استراتژی DNS

### ۵.۱ نوع رکوردها

| نوع رکورد | مقدار | کاربرد |
|-----------|-------|--------|
| `A` | IP سرور K3s |指向 مستقیم به سرور |
| `CNAME` | `api`, `auth`, ... |指向 به دامنه اصلی |
| `TXT` | `v=spf1 ...` | احراز هویت ایمیل (آینده) |

### ۵.۲ نمونه رکوردها

```dns
; nons.ir — Zone File Example
@     IN A      185.xxx.xxx.xxx
api   IN CNAME  @
auth  IN CNAME  @
kratos IN CNAME @
```

### ۵.۳ تأمین TLS (cert-manager)

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: nons-tls
  namespace: nons-system
spec:
  secretName: nons-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - api.nons.ir
    - auth.nons.ir
    - kratos.nons.ir
```

---

## ۶. معماری شبکه

```
User
  ↓ (HTTPS — api.nons.ir)
Internet
  ↓ (Port 443)
Traefik Ingress (nons-system)
  ↓ (Internal K8s Service Discovery)
auth-service.nons-platform.svc.cluster.local:3001
  ↓
kratos.nons-platform.svc.cluster.local:4433
hydra.nons-platform.svc.cluster.local:4444
```

**قوانین:**

- خارج از کلاستر: فقط از طریق Ingress (HTTPS) — پورت‌های مستقیم بسته هستند
- داخل کلاستر: از طریق K8s Service Discovery — `{release}.{namespace}.svc.cluster.local:{port}`
- Gateway تنها نقطه ورود خارجی است — سرویس‌ها مستقیماً暴露 نمی‌شوند

---

## ۷. خلاصه

| حوزه | تصمیم |
|------|--------|
| دامنه اصلی | `nons.ir` (ایران) + `nons.app` (بین‌الملل) |
| الگوی ساب‌دامنه | `{service}.nons.ir` |
| پیکربندی | Helm Values — هیچ دامنه‌ای Hard-Coded نیست |
| TLS | cert-manager + Let's Encrypt برای همه دامنه‌ها |
| DNS Provider | بر اساس Registrar (تأیید نشده) |
| ورود خارجی | فقط از طریق Gateway (Traefik) روی پورت ۴۴۳ |
| ارتباط داخلی | K8s Service Discovery |
