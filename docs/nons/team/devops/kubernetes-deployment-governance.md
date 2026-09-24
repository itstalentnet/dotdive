---
layout: doc
title: حاکمیت استقرار Kubernetes
description: قوانین مالکیت، نام‌گذاری، ارتقاء و بازگشت استقرار در Kubernetes
version: 1.0.0
status: APPROVED
author: Antigravity
owner: Devops Team
created_at: 2026-06-15
updated_at: 2026-06-15
tags:
  - Kubernetes
  - Governance
  - Helm
  - Deployment
  - DevOps
reviewers:
  - Devops Team
  - Backend Team
  - Platform Team
---

# حاکمیت استقرار Kubernetes

**Kubernetes Deployment Governance**

---

## ۱. مدل مالکیت استقرار

### ۱.۱ Ownership Matrix

| سرویس | Namespace | تیم مالک | Helm Release Name |
|-------|-----------|---------|-------------------|
| Gateway (Traefik) | `nons-system` | Devops | `nons-gateway` |
| Auth Service | `nons-platform` | Backend | `nons-auth-service` |
| PostgreSQL | `nons-platform` | Devops | `nons-postgres` |
| Redis | `nons-platform` | Devops | `nons-redis` |
| NATS | `nons-platform` | Devops | `nons-nats` |
| Kratos | `nons-platform` | Backend | `nons-kratos` |
| Hydra | `nons-platform` | Backend | `nons-hydra` |
| Core (Go) | `nons-platform` | Backend | `nons-core` |
| MongoDB | `nons-platform` | Backend | `nons-mongo` (آینده) |
| TigerBeetle | `nons-platform` | Backend | `nons-tigerbeetle` (آینده) |

### ۱.۲ قوانین Ownership

| قانون | توضیح |
|-------|-------|
| هر سرویس یک تیم مالک دارد | تیم مالک مسئول استقرار، مانیتورینگ و رفع باگ است |
| Namespace اشتراکی | سرویس‌های platform در `nons-platform`، زیرساخت در `nons-system` |
| تیم Devops مالک زیرساخت | Gateway، دیتابیس‌ها، messaging — مگر اینکه سرویس تخصصی باشد |
| تیم Backend مالک سرویس | تمام سرویس‌های تخصصی (auth, order, payment, ...) |

---

## ۲. قوانین Namespace

| Namespace | هدف | سطح دسترسی | RBAC |
|-----------|-----|-----------|------|
| `nons-system` | زیرساخت (Gateway) | Devops Only | Admin, View |
| `nons-platform` | سرویس‌های اصلی | Backend + Devops | Admin, Edit, View |
| `nons-services` | سرویس‌های آینده | Backend + Devops | Admin, Edit, View |
| `nons-monitoring` | Monitoring Stack (آینده) | Devops Only | Admin, View |

---

## ۳. Helm Release Naming

### ۳.۱ الگوی نام

```
nons-{service-name}
```

| مؤلفه | قانون | مثال |
|-------|-------|------|
| پیشوند | `nons-` | `nons-auth-service` |
| نام سرویس | دقیقاً مطابق دایرکتوری سرویس | `auth-service` |
| خط تیره | جداکننده کلمات | `auth-service` |
| حرف بزرگ | ممنوع | `nons-auth-service` ✅ \| `nons-Auth-Service` ❌ |

### ۳.۲ ثبت Helm Release

```bash
helm install nons-auth-service ./deploy/helm/auth-service \
  -n nons-platform \
  -f ./deploy/environments/local/values.yaml
```

---

## ۴. استراتژی ارتقاء (Upgrade Strategy)

### ۴.۱ Rolling Update

| پارامتر | مقدار | دلیل |
|---------|-------|------|
| استراتژی | `RollingUpdate` | پیش‌فرض — بدون Downtime |
| maxUnavailable | 0 | جلوگیری از قطعی کامل |
| maxSurge | 1 | یک پاد اضافه قبل از حذف قدیمی |
| minReadySeconds | 10 | زمان انتظار برای آماده‌شدن پاد جدید |

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 0
    maxSurge: 1
  minReadySeconds: 10
```

### ۴.2 امنیت ارتقاء

| قانون | توضیح |
|-------|-------|
| Health Check | readinessProbe + livenessProbe برای همه deployments |
| Pre-stop Hook | SIGTERM + graceful shutdown (حداقل ۱۰ ثانیه) |
| Pod Disruption Budget | حداقل ۱ پاد همیشه در دسترس (برای multi-replica) |
| Resource Limits | CPU/Memory limits برای همه کانتینرها |

---

## ۵. استراتژی بازگشت (Rollback Strategy)

### ۵.۱ Helm Rollback

```bash
# مشاهده تاریخچه
helm history nons-auth-service -n nons-platform

# بازگشت به Revision قبلی
helm rollback nons-auth-service <REVISION> -n nons-platform

# بازگشت با timeout بیشتر
helm rollback nons-auth-service <REVISION> -n nons-platform --timeout 5m
```

### ۵.۲ Kubectl Rollout

```bash
# بازگشت Deployment
kubectl rollout undo deployment/nons-auth-service -n nons-platform

# بازگشت به Revision مشخص
kubectl rollout undo deployment/nons-auth-service -n nons-platform --to-revision=<REVISION>

# بررسی وضعیت Rollout
kubectl rollout status deployment/nons-auth-service -n nons-platform
```

### ۵.۳ قوانین Rollback

| قانون | توضیح |
|-------|-------|
| بازگشت فوری | در صورت Failed health check بعد از upgrade |
| حداکثر زمان | ۵ دقیقه timeout برای rollback |
| بررسی پس از بازگشت | Health check + log check بعد از rollback |
| ثبت علت | مستندسازی دلیل بازگشت در incident report |
| Revision limit | نگهداری حداقل ۱۰ revision اخیر در Helm |

---

## ۶. انتظارات سازگاری نسخه (Version Compatibility)

### ۶.۱ قوانین

| مؤلفه | قانون |
|-------|-------|
| سرویس A ← سرویس B | MAJOR سرویس B باید با MAJOR مورد انتظار سرویس A مطابقت داشته باشد |
| Helm Chart ← Image | Chart در `values.yaml` محدوده `image.tag` را مشخص نمی‌کند — محیط تعیین می‌کند |
| Proto ← Binding | نسخه Binding با نسخه Proto هماهنگ است (توسط Buf) |
| API Version | همیشه در مسیر URL: `/v1/`, `/v2/` |

### ۶.۲ Breaking Change Detection

| مکانیسم | ابزار | زمان |
|---------|-------|------|
| Proto Compatibility | `buf breaking` | هر PR روی `contracts/` |
| API Compatibility | تست‌های integration | هر PR |
| SemVer Enforcement | Code Review | هر PR |

---

## ۷. استقرار به ازای محیط

### ۷.۱ Development (K3d)

```bash
k3d image import nons-auth-service:latest -c nons
helm upgrade --install nons-auth-service ./deploy/helm/auth-service \
  --set image.tag=latest \
  --set image.pullPolicy=Never \
  -n nons-platform \
  -f ./deploy/environments/local/values.yaml
```

### ۷.۲ Staging

```bash
helm upgrade --install nons-auth-service ./deploy/helm/auth-service \
  --set image.tag=sha-a1b2c3d4 \
  -n nons-platform \
  -f ./deploy/environments/staging/values.yaml
```

### ۷.۳ Production

```bash
helm upgrade --install nons-auth-service ./deploy/helm/auth-service \
  --set image.tag=1.2.0 \
  -n nons-platform \
  -f ./deploy/environments/production/values.yaml
```

---

## ۸. RBAC و دسترسی

| نقش | دسترسی | تیم |
|-----|---------|-----|
| Cluster Admin | Full cluster | Devops Team |
| Namespace Admin | Full namespace | Backend Team (در namespace خود) |
| Deployer | `helm install/upgrade/rollback` | CI/CD Pipeline (ServiceAccount) |
| Viewer | `kubectl get/logs/describe` | همه تیم‌ها |

---

## ۹. خلاصه

| حوزه | تصمیم |
|------|--------|
| Helm Release Name | `nons-{service-name}` |
| Namespaces | `nons-system`, `nons-platform`, `nons-services`, `nons-monitoring` |
| Upgrade Strategy | RollingUpdate (maxUnavailable: 0, maxSurge: 1) |
| Rollback | `helm rollback` + `kubectl rollout undo` |
| Revision History | حداقل ۱۰ revision |
| Breaking Change | `buf breaking` + تست integration + Code Review |
| Environment Values | `deploy/environments/{env}/values.yaml` |
