---
layout: doc
title: استراتژی محیط‌ها
description: تعریف رسمی محیط‌های استقرار — Development, Production و نقشه راه Staging
version: 1.0.0
status: PRIVATE
author: Antigravity
owner: Devops Team
created_at: 2026-06-16
updated_at: 2026-06-16
tags:
  - Environment
  - Strategy
  - Deployment
  - Kubernetes
reviewers:
  - Devops Team
  - Backend Team
  - Platform Team
---

# استراتژی محیط‌ها

**Environment Strategy**

---

## ۱. اصول معماری

- **یک معماری، چند محیط** — همه محیط‌ها از چارت‌های Helm یکسان استفاده می‌کنند؛ فقط `values.yaml` متفاوت است.
- **Kubernetes-Native** — همه محیط‌ها روی K3d (محلی) یا K3s (پروداکشن) اجرا می‌شوند.
- **محیط‌ها ایزوله هستند** — هیچ سرویسی بین محیط‌ها به اشتراک گذاشته نمی‌شود.
- **ترفیع تصویر (Image Promotion)** — یک تصویر پس از تأیید در Staging، بدون تغییر به Production ارتقا می‌یابد.

---

## ۲. محیط‌های رسمی

### ۲.۱ Development (محلی)

| مشخصه | مقدار |
|-------|-------|
| Cluster | K3d (محلی روی لپ‌تاپ توسعه‌دهنده) |
| Namespace | `nons-platform`, `nons-system` |
| تصاویر | `k3d image import` — بدون Registry خارجی |
| Secrets | مقادیر placeholder از `.env.example` |
| TLS | بدون TLS (HTTP محلی) |
| DNS | `localhost` |
| استقرار | دستی با Helm |
| Monitoring | خاموش |

**موارد استفاده:** توسعه محلی، تست سریع، debug.

**فرمان استقرار:**

```bash
k3d cluster create nons -p "80:80@loadbalancer" --k3s-arg "--disable=traefik@server:0"
kubectl create namespace nons-platform
kubectl create namespace nons-system

helm install nons-postgres ./deploy/helm/postgres -n nons-platform -f ./deploy/environments/local/values.yaml
helm install nons-redis ./deploy/helm/redis -n nons-platform -f ./deploy/environments/local/values.yaml
helm install nons-nats ./deploy/helm/nats -n nons-platform -f ./deploy/environments/local/values.yaml
helm install nons-kratos ./deploy/helm/kratos -n nons-platform -f ./deploy/environments/local/values.yaml
helm install nons-hydra ./deploy/helm/hydra -n nons-platform -f ./deploy/environments/local/values.yaml
k3d image import nons-auth-service:latest -c nons
helm install nons-auth-service ./deploy/helm/auth-service -n nons-platform -f ./deploy/environments/local/values.yaml
helm install nons-gateway ./deploy/helm/gateway -n nons-system -f ./deploy/environments/local/values.yaml
```

### ۲.۲ Production (عملیاتی)

| مشخصه | مقدار |
|-------|-------|
| Cluster | K3s (سرور عملیاتی) |
| Namespace | `nons-platform`, `nons-system` |
| تصاویر | Pull از `ghcr.io/nons/*` با `imagePullSecrets` |
| Secrets | Kubernetes Secrets واقعی + GitHub Environments |
| TLS | Let's Encrypt (cert-manager) |
| DNS | `api.nons.ir`, `auth.nons.ir`, ... |
| استقرار | دستی با تأیید تیم (Manual Gate) |
| Replica | ۲-۵ پاد با HPA |
| Monitoring | Prometheus + Grafana (فاز ۲) |

**موارد استفاده:** ترافیک واقعی کاربران، uptime الزامی.

**فرمان استقرار:**

```bash
helm upgrade --install nons-postgres ./deploy/helm/postgres \
  -n nons-platform \
  -f ./deploy/environments/production/values.yaml

helm upgrade --install nons-auth-service ./deploy/helm/auth-service \
  --set image.tag=1.2.0 \
  -n nons-platform \
  -f ./deploy/environments/production/values.yaml
```

---

## ۳. Staging — وضعیت و نقشه راه

### ۳.۱ وضعیت فعلی

**Staging بخشی از MVP نیست.** در حال حاضر:

| مؤلفه | وضعیت |
|-------|-------|
| Kubernetes Resources | 📄 دایرکتوری `deploy/environments/staging/` وجود دارد |
| values.yaml | 📄 پوسته موجود — مقادیر واقعی تنظیم نشده |
| CI/CD Pipeline | ❌ استقرار خودکار به Staging پیاده‌سازی نشده |
| E2E Tests | 📄 مستند شده در `release-lifecycle-blueprint` — پیاده‌سازی نشده |
| Active Use | ❌ استفاده نمی‌شود |

### ۳.۲ دلیل عدم نیاز در MVP

1. **تعداد سرویس‌های فعال کم است** — تنها auth-service + Core + زیرساخت. تست دستی روی Development کافی است.
2. **ترافیک اولیه پایین است** — MVP با کاربران محدود شروع می‌شود.
3. **تیم کوچک است** — حفظ ۳ محیط برای تیم ۲-۳ نفره هزینه نگهداری دارد.

### ۳.۳ نقشه راه Staging

| فاز | قابلیت | وابستگی | زمان پیشنهادی |
|-----|--------|---------|--------------|
| **فاز ۲-۱** | ایجاد CI/CD Pipeline برای Staging | ghcr.io + GitHub Environments | پس از MVP Launch |
| **فاز ۲-۲** | فعال‌سازی GitHub Environment `staging` | GitHub Environments Setup | همزمان با فاز ۲-۱ |
| **فاز ۲-۳** | استقرار خودکار هر commit به `main` روی Staging | CI/CD Pipeline کامل | همزمان با فاز ۲-۱ |
| **فاز ۲-۴** | E2E Tests خودکار پس از استقرار | Test Suite + Test Data | فاز ۲-۳ + ۱ ماه |
| **فاز ۲-۵** | Active Use — تیم از Staging برای تأیید استفاده کند | همه موارد بالا | فاز ۲-۴ + ۲ هفته |

---

## ۴. مقایسه محیط‌ها

| پارامتر | Development (K3d) | Staging (K3s) | Production (K3s) |
|---------|-------------------|---------------|------------------|
| Cluster | K3d (Docker) | K3s | K3s |
| Replica | ۱ | ۱-۲ | ۲-۵ |
| Image Source | `k3d image import` | `ghcr.io` (SHA tag) | `ghcr.io` (Version tag) |
| TLS | ❌ | ✅ (Self-signed/Let's Encrypt) | ✅ (Let's Encrypt) |
| DNS | `localhost` | `staging.nons.ir` | `api.nons.ir` |
| Secrets | Placeholders | واقعی (گردش limited) | واقعی (کامل) |
| Monitoring | ❌ | ✅ (Prometheus + Grafana) | ✅ (Prometheus + Grafana) |
| استقرار | دستی | خودکار (CI) | دستی (تأیید تیم) |
| Rollback | دستی | خودکار (در صورت خطا) | دستی |
| Data | تستی / synthetic | محدود (subset) | واقعی |
| Uptime Goal | — | ۹۹٪ | ۹۹٫۹٪ |

---

## ۵. تفاوت‌های کلیدی Values بین محیط‌ها

| پارامتر | Local | Production |
|---------|-------|-----------|
| `replicaCount` | ۱ | ۲-۵ |
| `ingress.hosts` | `localhost` | `api.nons.ir` |
| `resources.limits.cpu` | بدون محدودیت | `500m`-`2` |
| `resources.limits.memory` | بدون محدودیت | `512Mi`-`4Gi` |
| `postgres.persistence.size` | `1Gi` | `50Gi` |
| `postgres.persistence.storageClass` | `local-path` | `ssd-cloud` |
| `image.pullPolicy` | `Never` | `Always` |
| `image.tag` | `latest` | SemVer (e.g., `1.2.0`) |

---

## ۶. خط‌مشی ارتقاء بین محیط‌ها (Promotion Flow)

```
Development (K3d)
  ↓  تصویر با `latest` تگ — توسعه و تست محلی
CI Build
  ↓  تصویر با `sha-{commit}` تگ — push به ghcr.io
Staging (K3s) — [فاز ۲]
  ↓  استقرار خودکار + E2E Tests
Production (K3s)
  ↓  استقرار دستی با تأیید تیم + Git Tag
```

**قوانین Promotion:**

| مرحله | از | به | گیت | مسئول |
|-------|---|----|-----|-------|
| توسعه | Local | CI | Commit به `main` | توسعه‌دهنده |
| استقرار Staging | CI | Staging | خودکار (فاز ۲) | CI |
| تأیید Staging | Staging | — | E2E Tests (فاز ۲) | CI |
| استقرار Production | CI/CD | Production | تأیید دستی تیم | Devops Team Lead |
| Release | Production | — | Git Tag + GitHub Release | Devops Team |

---

## ۷. خلاصه

| محیط | وضعیت | Cluster | استقرار | MVP |
|------|-------|---------|---------|-----|
| **Development** | ✅ فعال | K3d | دستی | ✅ بخشی از MVP |
| **Staging** | 📅 فاز ۲ | K3s | خودکار (آینده) | ❌ خارج از MVP |
| **Production** | 🟡 در حال آماده‌سازی | K3s | دستی (تأیید تیم) | ✅ هدف MVP |
