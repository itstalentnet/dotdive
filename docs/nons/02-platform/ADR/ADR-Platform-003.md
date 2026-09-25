---
layout: doc
title: تصمیمات معماری مصوب
description: ثبت رسمی تصمیمات معماری مصوب شامل Versioning, Domain, Environment, Release, Registry, Secrets
version: 1.0.0
status: APPROVED
author: Antigravity
owner: Platform Team
created_at: 2026-06-15
updated_at: 2026-06-15
tags:
  - ADR
  - Architecture
  - Decision
  - Versioning
  - Domain
  - Environment
  - Release
  - Registry
  - Secrets
reviewers:
  - Platform Team
  - Backend Team
  - Devops Team
---

# تصمیمات معماری مصوب

**Architectural Decision Record — Approved Architecture Decisions**

> **Status:** APPROVED
> **Date:** 2026-06-15

---

## زمینه (Context)

این سند ۷ تصمیم معماری مصوب را که پیش از این در مستندات پراکنده ثبت شده یا ثبت نشده بودند، به صورت رسمی و متمرکز ثبت می‌کند.

**پیش‌نیاز انجام شده:** قبل از نگارش این سند، تمام مستندات موجود (`versioning-policy.md`, `container-delivery-architecture.md`, `security-policy.md`, `roadmap.md`, ADRهای موجود) بررسی شدند تا از ثبت تکراری (Duplicate) جلوگیری شود.

---

## ۱. Versioning

### تصمیم

**Semantic Versioning 2.0.0 از هم‌اکنون برای همه سرویس‌ها و پکیج‌ها پذیرفته شده است.**

### الگوی نسخه

```
v{major}.{minor}.{patch}
```

| مرحله | الگو | مثال |
|-------|------|-------|
| توسعه داخلی | `v0.{minor}.{patch}` | `v0.1.0`, `v0.2.0` |
| انتشار پایدار | `v{major}.{minor}.{patch}` | `v1.0.0`, `v1.2.0` |
| پیش‌انتشار | `v{version}-{tag}.{n}` | `v1.0.0-alpha.1`, `v1.0.0-rc.1` |

### مستندات مرتبط

جزئیات کامل قوانین افزایش نسخه، انتشار و وابستگی نسخه‌ها در سند [`versioning-policy.md`](../standards/versioning-policy.md) ثبت شده است. این ADR آن سند را تأیید و به عنوان مصوب اعلام می‌کند.

| ایتم | ارجاع |
|------|--------|
| قوانین MAJOR/MINOR/PATCH | `versioning-policy.md#2-قوانین-افزایش-نسخه` |
| پیش‌انتشار (alpha, beta, rc) | `versioning-policy.md#3-پیش‌انتشار` |
| Git Tagging | `versioning-policy.md#5-انتشار` |
| Docker Image Tagging | `container-delivery-architecture.md#22-image-versioning-policy` |

---

## ۲. Domain Strategy

### تصمیم

**دامنه‌ها در کد هاردکد نمی‌شوند و به صورت Config-Driven از طریق متغیرهای محیطی تأمین می‌شوند.**

### متغیرهای الزامی

| متغیر | توضیح | مثال (Development) | مثال (Production) |
|--------|-------|-------------------|-------------------|
| `API_DOMAIN` | دامنه اصلی API | `api.localhost` | `api.nons.app` |
| `AUTH_DOMAIN` | دامنه احراز هویت | `auth.localhost` | `auth.nons.app` |
| `WEB_DOMAIN` | دامنه وب/فرانت‌اند | `localhost` | `nons.app` |

### قوانین

| قانون | توضیح |
|-------|-------|
| هاردکد ممنوع | هیچ دامنه‌ای در کد سرویس نوشته نشود |
| Config Source | متغیر محیطی یا K8s ConfigMap |
| پیش‌فرض | اگر متغیر تنظیم نشده باشد، سرویس باید fail fast کند (نه fallback بی‌صدا) |
| Validation | مقدار دامنه در زمان راه‌اندازی سرویس اعتبارسنجی شود (فرمت URL معتبر) |

### مستندات مرتبط

این تصمیم جدید است و در مستندات قبلی ثبت نشده بود. جزئیات پیاده‌سازی به مستندات هر سرویس موکول می‌شود.

---

## ۳. Environment Model

### تصمیم

**سه محیط زیر در معماری باقی می‌مانند:**

| محیط | وضعیت در فاز فعلی | توضیح |
|------|------------------|-------|
| **Development** | ✅ Active | توسعه محلی روی K3d |
| **Staging** | ✅ Active | استقرار خودکار برای اعتبارسنجی |
| **Production** | ⏳ Planned | فعلاً پیاده‌سازی نمی‌شود |

### فازبندی

```
Phase 1 (Current): Development + Staging فعال
Phase 2 (Future):  Production اضافه می‌شود
```

### قوانین محیطی

| قانون | Development | Staging | Production |
|-------|------------|---------|------------|
| Cluster | K3d | K3s | K3s |
| Deploy Trigger | دستی (`k3d image import` + `helm upgrade`) | خودکار (CI پس از merge) | دستی (با تأیید) |
| Image Source | Local build | ghcr.io (SHA tag) | ghcr.io (Version tag) |
| Data | Ephemeral | Realistic | Real |
| Secrets | Dev secrets | Stage secrets | Production secrets |

### مستندات مرتبط

جزئیات پیاده‌سازی محیط‌ها در [`setup-guide.md`](../../devops/setup-guide.md) و [`helm-architecture.md`](../../devops/helm-architecture.md) ثبت شده است.

---

## ۴. Release Strategy

### تصمیم

**مسیر انتشار رسمی (برای فاز فعلی):**

```text
Developer
  ↓
Staging (استقرار خودکار)
  ↓
Validation (تست‌های E2E)
  ↓
Production (استقرار دستی با تأیید)
```

### محدودیت‌های مصوب

| روش | وضعیت | دلیل |
|-----|-------|------|
| Canary Deployment | ❌ خارج از معماری فعلی | نیاز به Service Mesh + Flagger |
| Blue/Green Deployment | ❌ خارج از معماری فعلی | نیاز به مدیریت دو 환경 کامل |
| Progressive Delivery | ❌ خارج از معماری فعلی | نیاز به Feature Flags + Traffic Split |
| **Rolling Update** | ✅ تنها روش مجاز | پشتیبانی شده توسط Kubernetes |

### مستندات مرتبط

جزئیات بیشتر در [`release-lifecycle-blueprint.md`](../../devops/release-lifecycle-blueprint.md) و [`cicd-architecture-blueprint.md`](../../devops/cicd-architecture-blueprint.md) به عنوان BLUEPRINT ثبت شده‌اند.

---

## ۵. Registry Architecture

### تصمیم

**ثبت‌کننده رسمی کانتینر: GitHub Container Registry (ghcr.io)**

### خلاصه تصمیمات

| مؤلفه | تصمیم |
|-------|--------|
| Provider | `ghcr.io/nons/*` |
| Visibility | همه Private |
| Naming | `ghcr.io/nons/{service-name}` |
| Tag Pattern | SemVer برای Release, `sha-{commit}` برای هر commit |
| Immutability | همه تگ‌ها به جز `latest` |

### مستندات مرتبط

این تصمیم به صورت کامل در [`container-delivery-architecture.md`](../../devops/container-delivery-architecture.md) (وضعیت: APPROVED) ثبت شده است. جزئیات را در آن سند ببینید:

| ایتم | ارجاع |
|------|--------|
| Repository Naming | `container-delivery-architecture.md#12-نام‌گذاری-مخازن` |
| Tagging Rules | `container-delivery-architecture.md#22-image-versioning-policy` |
| Image Lifecycle | `container-delivery-architecture.md#15-retention-policy` |
| Authentication | `container-delivery-architecture.md#14-احراز-هویت-registry` |
| Image Promotion | `container-delivery-architecture.md#34-image-promotion-بین-محیط‌ها` |

---

## ۶. Environment Architecture (ثبت رسمی)

### تصمیم

همان Environments از بخش ۳ با تأکید زیر:

| محیط | Active? | Cluster | Image Source | Deploy Trigger |
|------|---------|---------|-------------|---------------|
| **Development** | ✅ Active | K3d | Local build (`latest`) | دستی |
| **Staging** | ✅ Active | K3s | ghcr.io (`sha-{commit}`) | خودکار (CI) |
| **Production** | ⏳ Planned | K3s | ghcr.io (`{version}`) | دستی (تأیید) |

### اولویت استقرار

1. توسعه‌دهنده روی Development کار می‌کند
2. کد به main merged می‌شود → Staging خودکار استقرار می‌یابد
3. Staging تأیید شد → Production دستی استقرار می‌یابد
4. Production = Planned (فعلاً مرحله ۳ در معماری نیست)

---

## ۷. Secrets Architecture

### تصمیم

**مدیریت رازها در فاز فعلی از طریق Kubernetes Secrets انجام می‌شود. هیچ Secret Manager (Vault یا مشابه) در معماری فعلی وجود ندارد.**

### فهرست رازهای مصوب

| راز | توضیح | مالک | تزریق به | روش تزریق در K8s |
|-----|-------|------|---------|-----------------|
| `DB_PASSWORD` | رمز دیتابیس PostgreSQL | Devops | Postgres, Kratos, Hydra, Auth Service | `envFrom.secretRef` |
| `JWT_PRIVATE_KEY` | کلید خصوصی امضای JWT | Backend | Hydra (OIDC) | ConfigMap (dev) / Secret (stage) |
| `JWT_SIGNING_KEY` | کلید اشتراکی HMAC | Backend | Auth Service | Secret |
| `HYDRA_SYSTEM_SECRET` | رمز داخلی Hydra | Backend | Hydra | Secret |
| `KRATOS_COURIER_SMTP` | رمز SMTP (mailslurper) | Backend | Kratos | ConfigMap (dev) |
| `REGISTRY_TOKEN` | توکن دسترسی به GHCR | Devops | CI Pipeline + K8s `imagePullSecrets` | GitHub Secrets → K8s Secret |
| `API_KEYS` | کلید سرویس‌های خارجی (Nobitex, Fixer) | Backend | Currency Service | Secret |
| `COOKIE_SALT` | نمک کوکی سشن | Backend | Kratos | ConfigMap (dev) / Secret (stage) |
| `OIDC_SALT` | نمک Subject Identifier | Backend | Hydra | Secret |

### نحوه تزریق

#### Development (K3d)

```bash
# رازها در ConfigMap/Secret تعریف می‌شوند (dev values)
helm install ... -f ./deploy/environments/local/values.yaml
```

#### Staging (K3s)

```bash
kubectl create secret generic auth-service-secrets \
  --from-literal=JWT_SIGNING_KEY=... \
  -n nons-platform

helm install ... -f ./deploy/environments/staging/values.yaml
```

### امنیت

| قانون | توضیح |
|-------|-------|
| هیچ رازی در git | `.env`, رازها در gitignore — فقط `.env.example` مجاز است |
| حداقل دسترسی | هر سرویس فقط به رازهای خود دسترسی دارد |
| چرخش دستی | رازها در فاز فعلی به صورت دستی چرخانده می‌شوند |
| Vault | به معماری اضافه نخواهد شد مگر در فاز ۵ |
| Registry Token | در GitHub Secrets ذخیره، به کلاستر تزریق می‌شود |

### مستندات مرتبط

جزئیات بیشتر در [`security-policy.md`](../standards/security-policy.md) و ADRهای Backend ثبت شده است.

---

## خلاصه

| # | تصمیم | وضعیت | مستندات مرتبط |
|---|--------|--------|--------------|
| 1 | Semantic Versioning از هم‌اکنون | ✅ APPROVED | `versioning-policy.md` |
| 2 | Domain Strategy: Config-Driven | ✅ APPROVED | این سند (جدید) |
| 3 | Environment Model: Dev + Staging فعال | ✅ APPROVED | `setup-guide.md`, `helm-architecture.md` |
| 4 | Release: Rolling Update only | ✅ APPROVED | `release-lifecycle-blueprint.md`, `cicd-architecture-blueprint.md` |
| 5 | Registry: GHCR | ✅ APPROVED | `container-delivery-architecture.md` |
| 6 | Environment Architecture: ثبت رسمی | ✅ APPROVED | این سند |
| 7 | Secrets: K8s Secrets (بدون Vault) | ✅ APPROVED | `security-policy.md`, ADRs |

---

## موارد خارج از Scope (فعلاً انجام نشود)

موارد زیر در این سند به عنوان تصمیم اجرایی ثبت **نمی‌شوند** و بخشی از معماری فعلی نیستند:

- ❌ ArgoCD / Flux (GitOps)
- ❌ HashiCorp Vault (Secret Manager)
- ❌ Canary Deployment
- ❌ Blue/Green Deployment
- ❌ Progressive Delivery
- ❌ Service Mesh (Istio / Linkerd)
- ❌ Internal mTLS
- ❌ Image Signing (Cosign) — فاز ۵
- ❌ SBOM Generation — فاز ۵
- ❌ Multi-Architecture Build — فاز ۵

این موارد در `roadmap.md` به عنوان آینده ثبت شده‌اند و تا تصمیم‌گیری جداگانه در معماری جاری اعمال نمی‌شوند.
