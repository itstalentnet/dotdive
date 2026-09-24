---
layout: doc
title: گزارش آمادگی استقرار
description: ارزیابی وضعیت فعلی پروژه NONS برای استقرار روی سرور عملیاتی
version: 1.0.0
status: PRIVATE
author: Antigravity
owner: Devops Team
created_at: 2026-06-16
updated_at: 2026-06-16
tags:
  - Deployment
  - Readiness
  - Assessment
  - Production
  - Kubernetes
reviewers:
  - Devops Team
  - Backend Team
  - Platform Team
---

# گزارش آمادگی استقرار

**Deployment Readiness Report**

---

## ۱. وضعیت فعلی استقرار (Current Deployment Status)

| مؤلفه | وضعیت | توضیح |
|-------|-------|-------|
| محیط توسعه محلی | ✅ فعال (K3d) | کلاستر محلی K3d با Helm راه‌اندازی و مستند شده |
| CI Pipeline | ✅ فعال (GitHub Actions) | lint, build, test, codegen — ۳ job موازی |
| Container Registry | 🟡 تنظیم نشده | ghcr.io/nons/* تعریف شده ولی Token/PAT عملیاتی تنظیم نشده |
| CD Pipeline | ❌ تنظیم نشده | استقرار خودکار به Staging/Production پیاده‌سازی نشده |
| Production Cluster | ❌ راه‌اندازی نشده | سرور عملیاتی K3s هنوز Provision نشده |
| Monitoring Stack | 🟡 در نقشه راه | Prometheus/Grafana/Jaeger به فاز بعدی موکول شده |
| Secret Management | 🟡 نیازمند تکامل | Kubernetes Secrets پایه وجود دارد، Vault در نقشه راه |

---

## ۲. چارت‌های Helm موجود (Existing Helm Charts)

| چارت | مسیر | وضعیت | توضیح |
|------|------|-------|-------|
| Gateway | `deploy/helm/gateway` | ✅ کامل | Traefik v3 با Forward Auth |
| Auth Service | `deploy/helm/auth-service` | ✅ کامل | سرویس واسط احراز هویت |
| Kratos | `deploy/helm/kratos` | ✅ کامل | Ory Kratos v1.2.0 |
| Hydra | `deploy/helm/hydra` | ✅ کامل | Ory Hydra v2.2.0 |
| NATS | `deploy/helm/nats` | ✅ کامل | NATS JetStream 2.10 |
| Redis | `deploy/helm/redis` | ✅ کامل | Redis 7 با AOF |
| PostgreSQL | `deploy/helm/postgres` | ✅ کامل | PostgreSQL 16 |
| Monitoring | `deploy/helm/monitoring` | 📄 اسکلت | Prometheus/Grafana/Jaeger — فقط پوسته |
| Core | `deploy/helm/core` | ❌ وجود ندارد | چارت Go Core Service ساخته نشده |
| سایر سرویس‌ها | — | ❌ وجود ندارد | ۱۹ سرویس دیگر فاقد چارت Helm هستند |

---

## ۳. منابع Kubernetes موجود (Existing K8s Resources)

| نوع منبع | Namespace | وضعیت |
|----------|-----------|-------|
| Deployment | `nons-platform` | ✅ برای ۷ سرویس اصلی |
| StatefulSet | `nons-platform` | ✅ برای PostgreSQL, NATS |
| Service | `nons-platform` | ✅ برای همه سرویس‌های فعال |
| ConfigMap | `nons-platform` | ✅ برای تنظیمات غیرحساس |
| Secret | `nons-platform` | 🟡 پایه موجود، نیازمند تکامل |
| IngressRoute | `nons-system` | ✅ Traefik IngressRoute |
| HPA | `nons-platform` | 📄 تعریف شده در blueprint، پیاده‌سازی نشده |
| PDB | — | ❌ تعریف نشده |
| NetworkPolicy | — | ❌ تعریف نشده |
| ServiceAccount | — | ❌ اختصاصی برای CI/CD |

---

## ۴. تصاویر موجود (Existing Images)

| سرویس | Dockerfile | Image Name | آخرین بیلد |
|-------|-----------|------------|-----------|
| Auth Service | `services/auth-service/Dockerfile` | `nons/auth-service` | محلی (K3d import) |
| Core | `core/Dockerfile` | `nons/core` | محلی |
| Gateway | — | Traefik رسمی | از Registry رسمی |
| Kratos | — | Ory رسمی | از Registry رسمی |
| Hydra | — | Ory رسمی | از Registry رسمی |
| NATS | — | NATS رسمی | از Registry رسمی |
| Redis | — | Redis رسمی | از Registry رسمی |
| PostgreSQL | — | PostgreSQL رسمی | از Registry رسمی |

**نکته:** هیچ تصویری به ghcr.io推送 نشده است. همه تصاویر ساخته‌شده仅限于 محیط محلی K3d با `k3d image import`.

---

## ۵. فرآیند انتشار موجود (Existing Release Process)

| مرحله | وضعیت | مستندات |
|-------|-------|---------|
| Git Tagging | 🟡 دستی | `auth-service/v{version}` — مستند شده |
| Image Build | 🟡 دستی | `docker build` محلی |
| Image Push | ❌ فعال نیست | نیاز به ghcr.io Token |
| Helm Deploy | 🟡 دستی | `helm upgrade --install` محلی |
| GitHub Release | ❌ فعال نیست | نیاز به CI/CD pipeline |
| Changelog | 🟡 مستند شده | الگو در release-lifecycle-blueprint موجود |
| Version Bump | 🟡 دستی | `package.json` + `git tag` |

**تگ‌های موجود:** `v0.1.0`, `v0.1.1`, `v0.2.0` — بدون پیشوند سرویس (نامگذاری قدیمی).

---

## ۶. الزامات缺失 قبل از اولین استقرار (Missing Requirements)

### بحرانی (Required Before First Deployment)

| # | الزام | اولویت | راهکار پیشنهادی |
|---|-------|--------|----------------|
| ۱ | **ghcr.io Token و Pull Secret** | HIGH | ایجاد PAT با scopes `write:packages`, `delete:packages` |
| ۲ | **K3s Cluster Provisioning** | HIGH | راه‌اندازی سرور K3s با containerd |
| ۳ | **DNS Records** | HIGH | تنظیم A/CNAME رکوردها برای nons.ir و nons.app |
| ۴ | **TLS Certificate** | HIGH | نصب cert-manager و Let's Encrypt |
| ۵ | **Kubernetes Secrets واقعی** | HIGH | جایگزینی مقادیر پیش‌فرض `.env.example` با رازهای واقعی |
| ۶ | **Production values.yaml** | HIGH | تکمیل `deploy/environments/production/values.yaml` |

### مهم (Strongly Recommended)

| # | الزام | اولویت | راهکار پیشنهادی |
|---|-------|--------|----------------|
| ۷ | **CI/CD Pipeline برای انتشار** | MEDIUM | GitHub Actions workflow برای build + push + deploy |
| ۸ | **PersistentVolume برای PostgreSQL** | MEDIUM | تنظیم StorageClass و PVC با حجم حداقل ۱۰Gi |
| ۹ | **NetworkPolicy** | MEDIUM | محدود کردن ترافیک بین Namespaceها |
| ۱۰ | **Pod Disruption Budget** | MEDIUM | حداقل ۱ پاد برای سرویس‌های Stateless |
| ۱۱ | **Core Service Helm Chart** | MEDIUM | ایجاد چارت Helm برای `core/` |
| ۱۲ | **Health Check Endpoints** | MEDIUM | اطمینان از readinessProbe/livenessProbe برای همه سرویس‌ها |

### فرصت‌های بهبود (Future Roadmap)

| # | الزام | اولویت | فاز |
|---|-------|--------|-----|
| ۱۳ | Monitoring Stack (Prometheus/Grafana) | LOW | فاز ۲ |
| ۱۴ | External Secrets Operator | LOW | فاز ۲ |
| ۱۵ | Vault Integration | LOW | فاز ۳ |
| ۱۶ | Staging Environment | LOW | فاز ۲ |
| ۱۷ | HPA فعال | LOW | فاز ۲ |

---

## ۷. ریسک‌ها و موانع (Risks & Blockers)

### ریسک‌های فنی

| ریسک | احتمال | تأثیر | توضیح |
|------|--------|-------|-------|
| **Configuration Drift** | MEDIUM | HIGH | محیط K3d محلی ممکن است با K3s پروداکشن تفاوت داشته باشد |
| **Missing Image Pipeline** | HIGH | HIGH | بدون CI/CD انتشار، استقرار اولیه کاملاً دستی خواهد بود |
| **Secrets در Repository** | HIGH | HIGH | `.env.example` حاوی مقادیر واقعی — خطر نشت در مخزن عمومی |
| **NATS Subjects ناهماهنگ** | HIGH | MEDIUM | Core از subjects بدون `nons.` استفاده می‌کند در حالی که سرویس‌ها با `nons.` publish می‌کنند |
| **بدون Staging Environment** | MEDIUM | HIGH | تست واقعی قبل از پروداکشن امکان‌پذیر نیست |

### موانع عملیاتی

| مانع | توضیح |
|------|-------|
| **عدم وجود rollout plan** | ترتیب استقرار سرویس‌ها در پروداکشن مستند نشده |
| **بدون backup/restore strategy** | هیچ راهکاری برای بازیابی داده‌ها در سناریوی disaster تعریف نشده |
| **بدون monitoring/SLA** | بدون نظارت، تشخیص مشکل در پروداکشن غیرممکن است |
| **ورژن‌های ناسازگار** | `core/go.mod` نیازمند Go 1.26, auth-service نیازمند Node 20 — اطمینان از سازگاری runtime |

---

## ۸. جمع‌بندی (Summary)

| حوزه | امتیاز (۱-۵) | وضعیت |
|------|-------------|--------|
| Helm Charts | ⭐⭐⭐⭐☆ (۴) | ✅ ۷ چارت اصلی آماده |
| CI Pipeline | ⭐⭐⭐☆☆ (۳) | 🟡 lint/build/test فعال — publish/deploy缺失 |
| Image Pipeline | ⭐☆☆☆☆ (۱) | ❌ نیاز به ghcr.io + CI/CD |
| Monitoring | ⭐☆☆☆☆ (۱) | ❌ در نقشه راه |
| Secrets | ⭐⭐☆☆☆ (۲) | 🟡 پایه موجود — نیاز به Vault/ESO |
| Documentation | ⭐⭐⭐⭐☆ (۴) | ✅ مستندات devops کامل |
| Production Cluster | ☆☆☆☆☆ (۰) | ❌ هنوز Provision نشده |
| **Overall** | **⭐⭐⭐☆☆ (۲.۷)** | **🟡 آماده برای شروع — نیاز به ۶ الزام بحرانی قبل از استقرار** |

**نتیجه:** پروژه برای استقرار روی سرور عملیاتی در وضعیت **"آماده مشروط"** قرار دارد. با رفع ۶ الزام بحرانی بخش ۶، اولین استقرار امکان‌پذیر است. استقرار خودکار (CD) و Monitoring برای فاز دوم توصیه می‌شوند.
