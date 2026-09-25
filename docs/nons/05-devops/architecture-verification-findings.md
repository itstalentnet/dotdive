---
layout: doc
title: یافته‌های احراز معماری
description: بررسی انطباق پروژه nons-api با معماری Kubernetes-Native استقرار — تغییرات الزامی، توصیه‌شده و اختیاری
version: 1.0.0
status: PRIVATE
author: Antigravity
owner: Devops Team
created_at: 2026-06-16
updated_at: 2026-06-16
tags:
  - Architecture
  - Verification
  - Deployment
  - Kubernetes
  - Nons-api
reviewers:
  - Devops Team
  - Backend Team
  - Platform Team
---

# یافته‌های احراز معماری

**Architecture Verification Findings — Nons-api vs. Kubernetes-Native Architecture**

---

## مقدمه

این سند نتیجه بررسی پروژه `nons-api` در برابر معماری Kubernetes-Native استقرار تعریف‌شده در مستندات devops است. **هیچ تغییری در کد اعمال نشده** — فقط یافته‌ها ثبت شده‌اند تا در تسک‌های بعدی پیاده‌سازی شوند.

---

## ۱. تغییرات الزامی (Required Changes)

تغییراتی که بدون آن‌ها استقرار روی سرور عملیاتی امکان‌پذیر نیست.

| # | عنوان | مؤلفه | اولویت | توضیح |
|---|-------|--------|--------|-------|
| R1 | **ghcr.io Authentication** | CI/CD | HIGH | ایجاد PAT برای push تصاویر + `imagePullSecrets` در K8s |
| R2 | **K3s Cluster Provisioning** | Infrastructure | HIGH | راه‌اندازی سرور K3s با containerd و Helm |
| R3 | **Production Secrets واقعی** | Deploy | HIGH | جایگزینی placeholderهای `.env.example` با رازهای امن |
| R4 | **DNS Records + TLS** | Network | HIGH | تنظیم A/CNAME برای `nons.ir` + نصب cert-manager |
| R5 | **Helm Chart برای Core Service** | Deploy | HIGH | `core/` فاقد چارت Helm است — بدون آن قابل استقرار نیست |
| R6 | **تکمیل production/values.yaml** | Deploy | HIGH | مقادیر واقعی replica، resources، storage برای Production تنظیم نشده |
| R7 | **NATS Subjects با پیشوند `nons.`** | Core | HIGH | Core از subjects بدون `nons.` استفاده می‌کند — با سرویس‌ها ناسازگار است |
| R8 | **پارامتری‌سازی تصویر در auth-service** | Deploy | HIGH | تصویر و pullPolicy در دپلویمنت auth-service هاردکد شده‌اند — باید از values استفاده کنند |

---

## ۲. تغییرات توصیه‌شده (Recommended Changes)

تغییراتی که استقرار را ایمن‌تر، پایدارتر و قابل نگهداری‌تر می‌کند.

| # | عنوان | مؤلفه | اولویت | توضیح |
|---|-------|--------|--------|-------|
| S1 | **CI/CD Pipeline برای انتشار** | CI/CD | MEDIUM | Build + Push + Deploy خودکار — GitHub Actions workflow جدید |
| S2 | **NetworkPolicy** | Deploy | MEDIUM | محدود کردن ترافیک بین Namespaceها با Kubernetes NetworkPolicy |
| S3 | **Pod Disruption Budget** | Deploy | MEDIUM | تضمین حداقل ۱ پاد برای سرویس‌های Stateless |
| S4 | **Health Check برای همه سرویس‌ها** | Services | MEDIUM | اطمینان از readinessProbe/livenessProbe در همه Helm charts |
| S5 | **HPA فعال** | Deploy | MEDIUM | Horizontal Pod Autoscaler بر اساس CPU/Memory |
| S6 | **.env.example پاک‌سازی** | Repo | MEDIUM | جایگزینی مقادیر واقعی با placeholders |
| S7 | **چرخش کلیدها و رمزها** | Devops | MEDIUM | Password/Token قوی برای PostgreSQL, Redis, NATS |
| S8 | **Image Tag در auth-service** | Auth Service | MEDIUM | `version: '1.0.0'` → `'1.0'` (۲ بخشی به جای ۳ بخشی) |
| S9 | **مسیرهای تکراری Auth** | Auth Service | MEDIUM | حذف مسیرهای بدون prefix — فقط `/v1/auth/*` بماند |

---

## ۳. بهبودهای اختیاری (Optional Improvements)

بهبودهایی که برای آینده مفید هستند اما برای MVP ضروری نیستند.

| # | عنوان | مؤلفه | اولویت | توضیح |
|---|-------|--------|--------|-------|
| O1 | **External Secrets Operator** | Infrastructure | LOW | Sync خودکار Secrets از Vault/ AWS Secrets Manager |
| O2 | **Monitoring Stack** | Infrastructure | LOW | Prometheus + Grafana + Jaeger |
| O3 | **Service Mesh (Istio/Linkerd)** | Infrastructure | LOW | mTLS داخلی، traffic splitting، observability |
| O4 | **ArgoCD / Flux (GitOps)** | CI/CD | LOW | استقرار Declarative با Git به عنوان منبع حقیقت |
| O5 | **Grafana Faro (Real User Monitoring)** | Frontend | LOW | نظارت بر عملکرد فرانت‌اند |
| O6 | **Vault Integration** | Secrets | LOW | مرکزیت مدیریت تمام رازها |
| O7 | **HashiCorp Waypoint** | CI/CD | LOW | استقرار یکپارچه Platform-as-Product |
| O8 | **Multi-Arch Images (arm64)** | CI | LOW | پشتیبانی از Apple Silicon و ARM servers |
| O9 | **Container Image Signing (Cosign)** | CI/CD | LOW | امضای تصاویر برای زنجیره تأمین امن |
| O10 | **Backup & Restore Automation** | Infrastructure | LOW | CronJob برای pg_dump + S3 upload |
| O11 | **K8s Event Audit به NATS** | Core | LOW | Core می‌تواند رویدادهای K8s را به NATS پخش کند |
| O12 | **Canary / Blue-Green Deploy** | CI/CD | LOW | استقرار تدریجی با کنترل ترافیک |

---

## ۴. یافته‌های خاص معماری (Specific Architecture Findings)

### ۴.۱ Core NATS Subjects (H1 از developer-violations.md)

**مشکل:** `core/internal/shared/shared.go` از subjects بدون پیشوند `nons.` استفاده می‌کند:

```go
// اشتباه — فاقد پیشوند nons.
SubjectServiceRegistered = "platform.service.registered"
SubjectServiceHeartbeat  = "platform.service.heartbeat"
```

**تأثیر:** Core روی `platform.service.>` subscribe می‌کند در حالی که سرویس‌ها با `nons.platform.service.*` publish می‌کنند. هیچ رویدادی به Core نمی‌رسد.

**راهکار:** اصلاح subjects در `shared.go` و `router.go` به `nons.platform.service.*`.

### ۴.۲ publishStatusChanged هرگز publish نمی‌کند (H2 از developer-violations.md)

**مشکل:** در `core/internal/health/health.go`، تابع `publishStatusChanged` رویداد را می‌سازد و log می‌کند اما هیچوقت روی NATS publish نمی‌کند.

**تأثیر:** رویداد `nons.platform.service.status_changed` ثبت شده در `events.ts` هرگز در NATS منتشر نمی‌شود.

**راهکار:** پیاده‌سازی NATS publish در `publishStatusChanged`.

### ۴.۳ نقش پیش‌فرض `buyer` هاردکد شده (M7 از developer-violations.md)

**مشکل:** `services/auth-service/src/server.ts:240` نقش `buyer` را به عنوان پیش‌فرض هاردکد کرده است:

```typescript
roles: traits.role ? [traits.role] : ['buyer'],
```

**تأثیر:** همه کاربران جدید بدون مراجعه به IAM، نقش `buyer` می‌گیرند.

**راهکار:** حذف پیش‌فرض — IAM Service باید از طریق رویداد `nons.iam.role.assigned` نقش را تعیین کند.

### ۴.۴ سرویس‌ها Startup/Shutdown خود را publish نمی‌کنند (M8 از developer-violations.md)

**مشکل:** `core/cmd/main.go` و auth-service startup/shutdown خود را به NATS اعلام نمی‌کنند.

**تأثیر:** Service Registry Core خالی می‌ماند — هیچ سرویسی ثبت‌نام نمی‌کند.

**راهکار:** publish `SubjectServiceRegistered` پس از اتصال NATS، publish `SubjectServiceShutdown` در graceful shutdown.

### ۴.۵ Docker Compose Legacy

**وضعیت:** `docker-compose.yml` در مخزن وجود ندارد — همواره شده به K3d/Helm طبق ADR-DevOps-001. ✅
**تأیید:** هیچ Docker Compose در مسیر رسمی استقرار وجود ندارد.

### ۴.۶ Package Build-Time Only

**وضعیت:** `packages/types`, `packages/contracts`, `packages/events`, `packages/logging` build-time only هستند و در تصویر نهایی حضور ندارند. ✅
**تأیید:** `packages/client` در معماری جدید وجود ندارد — مصنوعات فرانت‌اند توسط `nons generate` در `.nons/generated/` تولید می‌شوند. ✅

---

## ۵. پیشنهادات فنی برای استقرار

### ۵.۱ ترتیب استقرار در Production (Recommended Sequence)

```
۱. PostgreSQL (پایگاه داده مرکزی)
۲. Redis (کش و Rate Limiting)
۳. NATS JetStream (گذرگاه رویدادها)
─── پس از تأیید زیرساخت ───
۴. Ory Kratos (مدیریت هویت) — migration خودکار
۵. Ory Hydra (سرور OAuth2) — migration خودکار
─── پس از تأیید Kratos + Hydra ───
۶. Auth Service (سرویس واسط)
─── پس از تأیید احراز هویت ───
۷. Core (کنترل پلن)
─── پس از تأیید همه سرویس‌ها ───
۸. Gateway (Traefik Ingress) — آخرین لایه
```

### ۵.۲ استراتژی Image Tag برای Production

| مرحله | Tag | توضیح |
|-------|-----|-------|
| اولین استقرار | `1.0.0` | اولین Release |
| Patch | `1.0.1`, `1.0.2` | رفع باگ |
| Minor | `1.1.0`, `1.2.0` | قابلیت جدید (عقب‌گر compatible) |
| Major | `2.0.0`, `3.0.0` | تغییرات بزرگ |

### ۵.۳ Rollback Strategy

```bash
helm history nons-auth-service -n nons-platform
helm rollback nons-auth-service <PREVIOUS_REVISION> -n nons-platform
```

**شرط Rollback:** Failure در readinessProbe تا ۵ دقیقه پس از upgrade.

---

## ۶. خلاصه

| دسته | تعداد | بحرانی‌ترین |
|------|-------|------------|
| 🔴 Required | ۸ | ghcr.io Auth, K3s Cluster, Core Helm Chart |
| 🟡 Recommended | ۹ | CI/CD Pipeline, NetworkPolicy, HPA |
| 🟢 Optional | ۱۲ | Monitoring, GitOps, Vault |
| **Total** | **۲۹** | — |

**نتیجه:** پروژه با ۸ تغییر الزامی برای استقرار آماده می‌شود. این تغییرات در سه حوزه متمرکز هستند: CI/CD (ghcr.io + Pipeline)، زیرساخت (K3s + DNS + TLS)، و اصلاح ناسازگاری‌های معماری (NATS subjects + Core Helm Chart).
