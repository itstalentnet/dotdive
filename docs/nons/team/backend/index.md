---
layout: doc
title: بک اند
description: مستندات فنی بک اند — معماری، سرویس‌ها، قراردادها و استانداردهای توسعه
version: 0.2.0
status: PRIVATE
author: xoxxel
owner: xoxxel
created_at: 2026-06-06
updated_at: 2026-06-07
tags:
  - Backend
  - Architecture
  - Documentation
reviewers:
  - Backend Team
  - Product Team
  - Devops
---

# بک اند

**Backend Documentation**

به مستندات فنی بک اند پروژه خوش آمدید.

این بخش شامل معماری سامانه، سرویس‌ها، قراردادهای ارتباطی، مدل‌های داده، استانداردهای توسعه، راهنمای استقرار و مستندات عملیاتی است.

---

## هدف

بک اند پروژه بر پایه معماری Microservice و Monorepo طراحی شده است. هر سرویس مالک دامنه مشخصی از کسب‌وکار بوده و از طریق APIها و Eventها با سایر سرویس‌ها ارتباط برقرار می‌کند.

این مستندات مرجع رسمی طراحی، توسعه، نگهداری و استقرار سرویس‌های بک اند محسوب می‌شوند.

---

## ساختار مستندات

### معماری

- معماری کلان سامانه
- معماری سرویس‌ها
- جریان احراز هویت و مجوزها
- معماری رویدادمحور

### سرویس‌ها

- Auth Service — مدیریت هویت و نشست (Ory Kratos)
- [Token Service — Blueprint](services/token-service.md) — صدور و اعتبارسنجی توکن‌های OAuth2/OIDC (Ory Hydra) + `login-consent-app`
- KYC Service
- [IAM — Blueprint](services/iam-service.md)
- Keto (منسوخ — ادغام شده در IAM)
- [Pool Service — Blueprint](services/pool-service.md) — مدیریت متمرکز داده‌های مرجع (Reference Data) و مواد اولیه تولید
- User Service
- Marketplace Service
- Order Service
- Payment Service
- Wallet Service
- Currency Service
- Settlement Service
- Chat Service
- Dispute Service
- Zone Service
- Review Service
- Moderation Service
- Boost Service
- Search Service
- Notification Service
- Analytics Service
- Storage Service

### قراردادها (مرجع یکپارچه)

تعاریف قراردادها، تایپ‌ها و رویدادهای مشترک در پکیج‌های اشتراکی متمرکز شده‌اند. برای مشاهده:
- [پکیج‌های اشتراکی](/docs/team/platform/package/index) — مرجع اصلی تمام قراردادها

### زیرساخت

- Docker
- Kubernetes
- Gateway
- Monitoring
- Logging

### توسعه

- Coding Standards
- Git Workflow
- Testing Strategy
- Local Development
- [Troubleshooting — عیب‌یابی و حل مشکلات](troubleshooting.md)

---

## اصول معماری

- Service Ownership
- Event-Driven Communication
- Database Per Service
- Immutable Transaction Records
- Horizontal Scalability
- Auditability
- Security First

---

## مخاطبان این مستندات

این مستندات برای افراد زیر تهیه شده است:

- Backend Developers
- DevOps Engineers
- System Architects
- Technical Leads
- Platform Engineers

---

## شروع مطالعه

برای آشنایی با ساختار سیستم، ابتدا بخش «معماری سامانه» را مطالعه کنید.
