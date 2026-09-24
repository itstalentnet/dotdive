---
layout: doc
title: پیش‌ نیازها
description: پیش‌نیازهای مورد نیاز برای راه‌اندازی محیط توسعه و استقرار پلتفرم NONS
version: 1.0.0
status: PRIVATE
author: xoxxel
owner: Devops Team
created_at: 2026-06-15
updated_at: 2026-06-15
tags:
  - DevOps
  - Prerequisites
  - Setup
  - Development
reviewers:
  - Devops
  - Backend Team
---

# پیش‌ نیازها

**Prerequisites**

---

## ۱. ابزارهای خط فرمان

| ابزار | حداقل نسخه | توضیح | لینک نصب |
|-------|-----------|-------|---------|
| Git | ۲.۴۰ | کنترل نسخه | [git-scm.com](https://git-scm.com) |
| Node.js | ۲۰ (LTS) | اجرای TypeScript | [nodejs.org](https://nodejs.org) |
| pnpm | ۱۰.۳۱.۰ | مدیریت پکیج | `npm i -g pnpm@10.31.0` |
| Go | ۱.۲۲ | کامپایل Core | [go.dev](https://go.dev) |
| Docker | ۲۴.۰ | کانتینر | [docker.com](https://docker.com) |

### Kubernetes (تنها مسیر رسمی توسعه و استقرار)

| ابزار | حداقل نسخه | توضیح | نصب |
|-------|-----------|-------|-----|
| K3d | v5.6 | کलाستر K3s در Docker | `curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh \| bash` |
| Helm | v3.12 | مدیریت چارت‌ها | [helm.sh](https://helm.sh/docs/intro/install/) |
| Kubectl | v1.30 | CLI کوبرنتیز | همراه Docker Desktop یا `curl -LO "https://dl.k8s.io/release/v1.30.0/bin/windows/amd64/kubectl.exe"` |

---

## ۲. تأیید نصب

پس از نصب ابزارها، اجرای دستورات زیر باید خروجی موفق داشته باشد:

```bash
git --version
node --version   # >= 20
pnpm --version   # 10.31.0
go version       # >= 1.22
docker --version
k3d --version    # >= v5.6
helm version     # >= v3.12
kubectl version --client
```

---

## ۳. Clone و نصب وابستگی‌ها

```bash
# Clone مخزن
git clone <repo-url>
cd nons/nons-api

# نصب وابستگی‌های Node.js
pnpm install
```

---

## ۴. پیکربندی محیط

یک فایل `.env` از روی نمونه ایجاد کنید:

```bash
cp .env.example .env
```

فایل `.env.example` حاوی مقادیر پیش‌فرض توسعه است. در محیط پروداکشن، تمام secrets باید به Kubernetes Secrets منتقل شوند.

---

## ۵. سرویس‌های خارجی مورد نیاز

NONS به سرویس‌های زیرساختی زیر وابسته است (مسیر رسمی اجرا چارت‌های Helm در کوبرنتیز است):

| سرویس | نقش | پورت پیش‌فرض |
|-------|-----|-------------|
| PostgreSQL 16 | دیتابیس مرکزی + Kratos + Hydra | ۵۴۳۲ |
| Redis 7 | کش، Rate Limiting | ۶۳۷۹ |
| NATS 2.10 | Event Bus | ۴۲۲۲ |
| MongoDB 7 | ذخیره‌سازی چت (در دست توسعه - نقشه راه) | ۲۷۰۱۷ |
| TigerBeetle | دفترکل مالی (در دست توسعه - نقشه راه) | ۳۰۰۰ |

---

## ۶. پورت‌های مورد نیاز

اطمینان حاصل کنید پورت‌های زیر روی سیستم میزبان آزاد هستند:

| پورت | سرویس | محیط |
|------|-------|------|
| ۸۰ | Traefik Gateway | K3d (رسمی) |
| ۳۰۰۱ | Auth Service | K3d (رسمی) |
| ۴۴۳۳ | Kratos Public | داخلی |
| ۴۴۳۴ | Kratos Admin | داخلی |
| ۴۴۴۴ | Hydra Public | داخلی |
| ۴۴۴۵ | Hydra Admin | داخلی |
| ۸۰۸۵ | Traefik Dashboard | K3d (رسمی) |
| ۹۰۹۰ | Core Metrics | K3d (رسمی) |

---

## ۷. دانش فنی مورد نیاز

توسعه‌دهنده برای کار با پلتفرم باید آشنایی داشته باشد با:

- TypeScript / NestJS (سرویس‌های کسب‌وکار)
- Go (Core Service)
- Docker / Kubernetes
- NATS JetStream
- Ory Kratos + Hydra
- Protocol Buffers
- گیت و GitHub
