---
layout: doc
title: قراردادها
description: تصمیم معماری برای تعریف و توزیع قراردادهای مشترک بین سرویس‌ها
version: 0.1.0
status: APPROVED
author: xoxxel
owner: xoxxel
created_at: 2026-06-12
updated_at: 2026-06-12
tags:
  - contracts
  - ADR
  - Platform
  - Architecture
  - Protobuf
reviewers:
  - Product Team
  - Backend Team
  - Devops
---

# قراردادها

> ADR-Platform-001 — Language-Neutral Contract Layer

## وضعیت

Approved

## تاریخ

2026-06-12

---

# زمینه

پروژه NONS بر پایه مجموعه‌ای از سرویس‌های مستقل و رویدادمحور طراحی شده است.

این سرویس‌ها الزاماً از یک زبان برنامه‌نویسی مشترک استفاده نمی‌کنند.

نمونه:

- Core → Go
- Business Services → TypeScript / NestJS
- Moderation Services → Python
- Automation Workflows → n8n
- سرویس‌های آینده → Rust ،Java ،Go ،Python یا سایر فناوری‌ها

در نسخه‌های اولیه معماری، قراردادهای مشترک پروژه در قالب Packageهای TypeScript تعریف شده بودند و به عنوان منبع حقیقت (Source of Truth) در نظر گرفته می‌شدند.

این رویکرد برای سرویس‌های TypeScript مناسب است اما برای سرویس‌های غیر TypeScript مشکلات زیر را ایجاد می‌کند:

- وابستگی معماری به TypeScript
- نیاز به Parser یا Adapter اختصاصی برای هر زبان
- احتمال Drift بین پیاده‌سازی زبان‌ها
- دشواری استفاده از قراردادها در ابزارهای غیرکدنویسی مانند n8n
- محدود شدن قابلیت توسعه چندزبانه پلتفرم

---

# مسئله

قراردادهای پلتفرم باید:

- مستقل از زبان باشند
- قابل استفاده در تمامی سرویس‌ها باشند
- توسط ابزارهای مختلف قابل مصرف باشند
- از ایجاد چندین منبع حقیقت جلوگیری کنند
- امکان تولید خودکار Binding برای زبان‌های مختلف را فراهم کنند

---

# گزینه‌های بررسی‌شده

## گزینه ۱ — TypeScript Packages به عنوان Source of Truth

ساختار:

```text
nons-api/packages/
 ├─ events
 ├─ errors
 ├─ permissions
 └─ types
```

### مزایا

- ساده برای سرویس‌های NestJS
- توسعه سریع

### معایب

- وابستگی کل اکوسیستم به TypeScript
- نیاز به Parser برای Go
- نیاز به Adapter برای Python
- افزایش احتمال ناسازگاری قراردادها

### نتیجه

رد شد

---

## گزینه ۲ — Contract Artifact Distribution

ساخت قراردادها در TypeScript و تولید Artifactهای JSON/YAML.

### مزایا

- مستقل از Runtime

### معایب

- همچنان TypeScript مالک قراردادها است
- نیاز به Pipeline توزیع Artifact
- نسخه‌بندی پیچیده‌تر

### نتیجه

رد شد

---

## گزینه ۳ — Protocol Buffers (Protobuf) ✅

قراردادها در قالب Protobuf تعریف می‌شوند و برای هر زبان Binding اختصاصی تولید می‌شود.

### ساختار

```text
contracts/

├── envelope.proto
├── events.proto
├── errors.proto
├── permissions.proto
└── registry.proto
```

---

# تصمیم

Protocol Buffers به عنوان Canonical Contract Definition Format انتخاب می‌شود.

تمام قراردادهای مشترک پلتفرم باید ابتدا در لایه Contracts تعریف شوند.

هیچ زبان برنامه‌نویسی مالک قراردادها نیست.

TypeScript، Go، Python و سایر زبان‌ها مصرف‌کننده قراردادها هستند، نه مالک آن‌ها.

---

# مدل معماری

```text
Contracts Layer (Proto)

        ↓

Code Generation

 ┌──────┼──────┬──────┐
 │      │      │      │

TS     Go    Python  Future
```

---

# محدوده قراردادها

موارد زیر در لایه Contracts تعریف می‌شوند:

- Event Envelope
- Platform Events
- Error Codes
- Permissions
- Service Metadata
- Registry Contracts

---

# موارد خارج از محدوده

قراردادهای دامنه‌ای هر سرویس می‌توانند در همان سرویس نگهداری شوند.

این ADR فقط درباره قراردادهای مشترک پلتفرم است.

---

# ارتباط با NATS

استفاده از Protobuf به معنای استفاده از gRPC نیست.

پروژه همچنان از NATS به عنوان Event Bus استفاده می‌کند.

قراردادها توسط Protobuf تعریف می‌شوند اما نحوه انتقال پیام‌ها مستقل از این تصمیم است.

بنابراین:

- NATS حفظ می‌شود
- معماری Event-Driven حفظ می‌شود
- Core بدون تغییر باقی می‌ماند

---

# مزایا

- استقلال کامل از زبان
- حذف نیاز به Parserهای اختصاصی
- کاهش Drift بین سرویس‌ها
- پشتیبانی طبیعی از Go ،TypeScript ،Python و سایر زبان‌ها
- سازگاری با ابزارهای Automation
- امکان توسعه اکوسیستم بدون تغییر قراردادها
- یک منبع حقیقت واحد برای کل پلتفرم

---

# معایب

- نیاز به ابزار تولید کد (Code Generation)
- افزایش پیچیدگی Build نسبت به TypeScript Packages
- نیاز به آشنایی تیم با Protobuf

---

# پیامدها

تمام سرویس‌ها باید Contract Bindingهای تولیدشده برای زبان خود را مصرف کنند.

هیچ سرویسی مجاز به تعریف نسخه مستقل از قراردادهای مشترک پلتفرم نیست.

تمام تغییرات قراردادها باید ابتدا در لایه Contracts اعمال شوند و سپس Bindingهای جدید تولید شوند.

در همین راستا، فایل‌های استقرار، اسکریپت‌ها و چارت‌های Helm مرتبط با استقرار سرویس‌ها بر اساس قراردادها در شاخه `deploy/` نگهداری و سازمان‌دهی می‌شوند (D14).

---

# نتیجه

به منظور پشتیبانی بلندمدت از معماری چندزبانه، جلوگیری از وابستگی به یک فناوری خاص و ایجاد یک منبع حقیقت مستقل از زبان، Protocol Buffers به عنوان لایه رسمی قراردادهای مشترک پلتفرم NONS انتخاب می‌شود.
