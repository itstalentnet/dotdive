---
layout: doc
title: معماری Helm
description: معماری چارت‌های Helm در پلتفرم NONS، ساختار، مدیریت مقادیر محیطی و دستورات استقرار
version: 1.0.0
status: APPROVED
author: Antigravity
owner: Devops Team
created_at: 2026-06-15
updated_at: 2026-06-15
tags:
  - Helm
  - Kubernetes
  - DevOps
  - Deployment
reviewers:
  - Devops
  - Backend Team
---

# معماری Helm

**Helm Charts Architecture**

---

## ۱. ساختار چارت‌ها

تمامی میکروسرویس‌ها و سرویس‌های زیرساختی به صورت چارت‌های اختصاصی Helm در پوشه `deploy/helm/` بسته‌بندی می‌شوند:

| چارت | دایرکتوری | توضیح |
|------|----------|-------|
| Gateway | `deploy/helm/gateway/` | Traefik v3، IngressRoutes، Forward Auth |
| Auth Service | `deploy/helm/auth-service/` | سرویس واسط احراز هویت (Stateless) |
| Kratos | `deploy/helm/kratos/` | Ory Kratos v1.2.0 |
| Hydra | `deploy/helm/hydra/` | Ory Hydra v2.2.0 |
| NATS | `deploy/helm/nats/` | NATS JetStream 2.10 |
| Redis | `deploy/helm/redis/` | Redis 7 (AOF enabled) |
| PostgreSQL | `deploy/helm/postgres/` | PostgreSQL 16 |
| Monitoring (Roadmap) | `deploy/helm/monitoring/` | Prometheus, Grafana, Jaeger (منتقل‌شده به نقشه راه - D4) |

---

## ۲. مدیریت محیط‌ها

مقادیر هر محیط در `deploy/environments/` نگهداری می‌شود:

```text
deploy/environments/
├── local/values.yaml       # K3d توسعه محلی
├── staging/values.yaml     # تست و پیش‌تولید
└── production/values.yaml  # عملیاتی (K3s)
```

### تفاوت‌های کلیدی بین محیط‌ها

| پارامتر | Local (K3d) | Production (K3s) |
|---------|-------------|------------------|
| replicaCount | 1 | 2 تا 5 |
| ingress host | localhost | api.nons.ir |
| منابع سخت‌افزاری | بدون محدودیت | limits + requests |
| حجم PostgreSQL | 1Gi | 50Gi |

---

## ۳. دستورات استقرار

### نصب اولیه (محلی)

```bash
# Namespace
kubectl create namespace nons-platform
kubectl create namespace nons-system

# زیرساخت
helm install nons-postgres ./deploy/helm/postgres -n nons-platform -f ./deploy/environments/local/values.yaml
helm install nons-redis ./deploy/helm/redis -n nons-platform -f ./deploy/environments/local/values.yaml
helm install nons-nats ./deploy/helm/nats -n nons-platform -f ./deploy/environments/local/values.yaml

# هویت
helm install nons-kratos ./deploy/helm/kratos -n nons-platform -f ./deploy/environments/local/values.yaml
helm install nons-hydra ./deploy/helm/hydra -n nons-platform -f ./deploy/environments/local/values.yaml

# سرویس‌ها
k3d image import nons-auth-service:latest -c nons
helm install nons-auth-service ./deploy/helm/auth-service -n nons-platform -f ./deploy/environments/local/values.yaml

# Gateway
helm install nons-gateway ./deploy/helm/gateway -n nons-system -f ./deploy/environments/local/values.yaml
```

### آپگرید

```bash
helm upgrade nons-auth-service ./deploy/helm/auth-service \
  --set image.tag=v1.1.0 \
  -n nons-platform \
  -f ./deploy/environments/local/values.yaml
```

---

## ۴. عیب‌یابی Helm

```bash
# بررسی وضعیت
helm list -n nons-platform
helm status nons-auth-service -n nons-platform

# تاریخچه رول‌اوت
helm history nons-auth-service -n nons-platform

# بازگشت به نسخه قبل
helm rollback nons-auth-service <revision> -n nons-platform

# مشاهده مقادیر جاری
helm get values nons-auth-service -n nons-platform
```

---

## ۵. سرویس‌های خارج از Helm (انتقال به نقشه راه - D4)

سرویس‌های زیر از معماری فعال MVP خارج شده و به نقشه راه (Roadmap) منتقل شده‌اند و چارت‌های Helm فعال برای آن‌ها در MVP وجود ندارد:

- **TigerBeetle Helm Chart** — دفترکل مالی (double-entry ledger)
- **MongoDB Helm Chart** — ذخیره‌سازی پیام‌های چت
- **Monitoring Stack** — پشته نظارت و ردیابی (Prometheus, Grafana, Jaeger)

> [!NOTE]
> جزئیات کامل انتقال این موارد به همراه دلایل عدم نیاز در MVP، وابستگی‌ها و اثرات آن‌ها بر معماری در سند [مسیر توسعه](../backend/roadmap.md) ثبت شده است.
