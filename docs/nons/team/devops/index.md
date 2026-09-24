---
layout: doc
title: استقرار
description: راه‌حل‌های زیرساخت، CI/CD، کانتینر، نظارت و خودکارسازی
version: 1.0.0
status: PRIVATE
author: xoxxel
owner: xoxxel
created_at: 2026-06-05
updated_at: 2026-06-16
tags:
  - DevOps
  - Infrastructure
  - CI/CD
  - Kubernetes
  - Monitoring
reviewers:
  - Devops
  - Backend Team
---

# استقرار

## راه‌حل‌های زیرساخت و خودکارسازی

خدمات دیواپس ما شامل موارد زیر است:

- **Kubernetes-Native (K3d/K3s + Helm)**: تنها مسیر رسمی ارکستراسیون کانتینر با Kubernetes
- **پایپلاین‌های CI/CD**: GitHub Actions — lint, build, test, codegen
- **Prometheus + Grafana + Jaeger**: نظارت و ردیابی (منتقل‌شده به نقشه راه)
- **Traefik v3**: درگاه API با اعتبارسنجی Stateless JWT

### فناوری‌های پشتیبانی‌شده

- K3d >= v5.6 (محلی) / K3s (پروداکشن)
- Helm >= v3.12
- Docker (جهت بیلد تصاویر کانتینر)
- GitHub Actions
- NATS JetStream
- PostgreSQL 16, Redis 7 (سرویس‌های فعال MVP)

### راهنماها و آموزش‌ها
- [پیش‌نیازها](./prerequisites.md)
- [راهنمای راه‌اندازی (نصب + استقرار + رول‌بک)](./setup-guide.md)
- [راهنمای عملیات و کشیک](./runbook.md)

### معماری
- [معماری Helm](./helm-architecture.md)
- [معماری تحویل کانتینر](./container-delivery-architecture.md)
- [معماری دامنه و DNS](./domain-architecture.md)
- [معماری مدیریت اسرار](./secret-management-architecture.md)
- [استراتژی محیط‌ها](./environment-strategy.md)

### CI/CD و انتشار
- [بلوپرینت معماری CI/CD](./cicd-architecture-blueprint.md)
- [بلوپرینت چرخه انتشار](./release-lifecycle-blueprint.md)

### حاکمیت و استانداردها
- [حاکمیت استقرار Kubernetes](./kubernetes-deployment-governance.md)

### ارزیابی‌ها و گزارش‌ها
- [گزارش آمادگی استقرار](./deployment-readiness-report.md)
- [یافته‌های احراز معماری](./architecture-verification-findings.md)
- [گزارش دستورات استقرار و خودکارسازی](./deployment-execution-report.md)

[بازگشت به خدمات](/docs/team/)
