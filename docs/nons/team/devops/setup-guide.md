---
layout: doc
title: راهنمای راه‌اندازی
description: راهنمای گام‌به‌گام راه‌اندازی محیط توسعه از صفر تا اجرای سرویس‌ها
version: 1.0.0
status: PRIVATE
author: xoxxel
owner: Devops Team
created_at: 2026-06-15
updated_at: 2026-06-15
tags:
  - DevOps
  - Setup
  - Development
  - K3d
  - Helm
reviewers:
  - Devops
  - Backend Team
---

# راهنمای راه‌اندازی

**Development Setup Guide — Zero to Running**

---

## مسیر رسمی توسعه و استقرار

پلتفرم NONS انحصاراً از مسیر **Kubernetes-Native (Helm + K3d)** برای توسعه، تست و استقرار پشتیبانی می‌کند. منبع حقیقت پیکربندی استقرار پروژه در پوشه `deploy/` قرار دارد.

---

## مسیر رسمی: استقرار کامل با K3d + Helm

### گام ۱: ایجاد کلاستر K3d

```bash
k3d cluster create nons \
  -p "80:80@loadbalancer" \
  -p "8085:8080@loadbalancer" \
  --k3s-arg "--disable=traefik@server:0"
```

ترافیک پیش‌فرض K3s غیرفعال می‌شود تا چارت سفارشی Traefik (v3) خودمان را نصب کنیم.

### گام ۲: ایجاد Namespaceها

```bash
kubectl create namespace nons-platform
kubectl create namespace nons-system
```

### گام ۳: نصب سرویس‌های زیرساختی

ترتیب نصب با توجه به وابستگی‌ها:

```bash
# ۱. پایگاه داده
helm install nons-postgres ./deploy/helm/postgres \
  -n nons-platform -f ./deploy/environments/local/values.yaml

helm install nons-redis ./deploy/helm/redis \
  -n nons-platform -f ./deploy/environments/local/values.yaml

helm install nons-nats ./deploy/helm/nats \
  -n nons-platform -f ./deploy/environments/local/values.yaml
```

### گام ۴: نصب سرویس‌های احراز هویت

```bash
# ۲. Ory Kratos (با migration خودکار)
helm install nons-kratos ./deploy/helm/kratos \
  -n nons-platform -f ./deploy/environments/local/values.yaml

# ۳. Ory Hydra (با migration خودکار)
helm install nons-hydra ./deploy/helm/hydra \
  -n nons-platform -f ./deploy/environments/local/values.yaml

# ۴. Auth Service (Bridge)
k3d image import nons-auth-service:latest -c nons
helm install nons-auth-service ./deploy/helm/auth-service \
  -n nons-platform -f ./deploy/environments/local/values.yaml
```

### گام ۵: نصب Gateway

```bash
helm install nons-gateway ./deploy/helm/gateway \
  -n nons-system -f ./deploy/environments/local/values.yaml
```

### گام ۶: تأیید وضعیت

```bash
# همه پادها باید Running باشند
kubectl get pods -n nons-platform
kubectl get pods -n nons-system

# Gateway باید ۲۰۰ برگرداند
curl -i http://localhost/v1/auth/health

# Kratos باید redirect برگرداند
curl -i http://localhost/v1/auth/kratos/self-service/login/browser

# مسیر محافظت‌شده باید ۴۰۱ برگرداند (بدون توکن)
curl -i http://localhost/v1/protected
```

---

## بیلد و تست

### بیلد همه پکیج‌ها

```bash
cd nons-api
pnpm install
pnpm build
```

### اجرای تست‌ها

```bash
# تست TypeScript
pnpm test

# تست Go Core
cd core && go test ./... -v
```

### کد جنریشن (Proto → Bindings)

```bash
pnpm codegen
```

این دستور از Proto files در `contracts/`، bindings TypeScript و Go تولید می‌کند.

---

## استقرار نسخه جدید (مسیر Helm)

```bash
# ۱. بیلد ایمیج
docker build -t nons/auth-service:v1.1.0 -f services/auth-service/Dockerfile .

# ۲. ایمپورت به K3d
k3d image import nons/auth-service:v1.1.0 -c nons

# ۳. آپگرید Helm
helm upgrade nons-auth-service ./deploy/helm/auth-service \
  --set image.tag=v1.1.0 \
  -n nons-platform \
  -f ./deploy/environments/local/values.yaml
```

---

## رول‌بک (Rollback)

در صورت بروز خطا در استقرار، به نسخه پایدار قبلی بازگردید:

```bash
# بررسی وضعیت رول‌اوت
kubectl rollout status deployment/nons-auth-service -n nons-platform

# مشاهده تاریخچه نسخه‌ها
helm history nons-auth-service -n nons-platform

# بازگشت به نسخه پایدار
helm rollback nons-auth-service <REVISION> -n nons-platform
```

---

## مدیریت کلاستر K3d

```bash
# ایست کلاستر
k3d cluster stop nons

# شروع مجدد
k3d cluster start nons

# حذف و بازسازی
k3d cluster delete nons
```

---

## عیب‌یابی سریع

| مشکل | دستور تشخیص |
|------|------------|
| پاد در حال CrashLoopBackOff | `kubectl describe pod <pod> -n nons-platform` |
| Gateway 503 می‌دهد | `kubectl logs -l app=auth-service -n nons-platform --tail=50` |
| Kratos/Hydra migration failed | `kubectl logs job/nons-kratos-migration -n nons-platform` |
| NATS وصل نمی‌شود | `kubectl exec -n nons-platform -it deployment/nons-nats -- nats stream list` |
| Redis وصل نمی‌شود | `kubectl run tmp-redis --rm -i --tty --image=redis:alpine -n nons-platform -- redis-cli -h redis ping` |
| Helm نصب نمی‌شود | `helm status <release> -n nons-platform` |
| لاگ بلادرنگ | `kubectl logs -f -l app=<service> -n nons-platform` |
| رول‌بک | `helm rollback <release> <revision> -n nons-platform` |

---

## منابع

- [پیش‌نیازها](./prerequisites.md)
- [راهنمای عملیات](./runbook.md)
- [معماری Helm](./helm-architecture.md)
- [معماری کانتینر](./container-delivery-architecture.md)
