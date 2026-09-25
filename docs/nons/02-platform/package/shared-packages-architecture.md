---
layout: doc
title: معماری لایه قراردادها
description: تعریف رویکرد و مسئولیت قراردادهای مشترک پروژه — تفکیک قرارداد از پیاده‌سازی با Protocol Buffers
version: 2.0.0
status: APPROVED
author: xoxxel
owner: xoxxel
created_at: 2026-06-10
updated_at: 2026-06-12
tags:
  - Architecture
  - Contracts
  - Shared
  - Proto
  - ADR-Platform-001
reviewers:
  - Backend Team
  - Platform Team
---

# معماری لایه قراردادها

---

## معماری دو لایه‌ای

پروژه NONS از دو لایه مجزا برای مدیریت قراردادها استفاده می‌کند:

```text
لایه قراردادهای پلتفرم (Platform Contracts)
        ↓
    Proto Definition — منبع حقیقت
        ↓
    Code Generation (Buf)
        ↓
    Bindingهای زبان‌مخصوص (TS, Go, Python, ...)

────────────────────────────────────

لایه قراردادهای دامنه (Domain Contracts)
        ↓
    داخل هر سرویس — مالکیت آن سرویس
```

---

## Contract Layer (Proto)

تمامی قراردادهای مشترک پلتفرم در قالب **Protocol Buffers** تعریف می‌شوند. هیچ زبانی مالک قراردادها نیست — Proto منبع حقیقت است.

**ساختار:**

```text
nons-api/contracts/
├── envelope.proto      # Event Envelope — ساختار پیام رویدادها
├── registry.proto      # Service Registry — ثبت سرویس‌ها
├── errors.proto        # Platform Error Codes — کدهای خطای مشترک
└── permissions.proto   # Permissions — مجوزهای سطح پلتفرم
```

**فرآیند:**

```text
Proto (.proto)
    ↓
Buf (lint, break check, generate)
    ↓
Go bindings  →  nons-api/core/
TS bindings  →  nons-api/packages/contracts (generated)
Python       →  (future)
```

**مزایا:**

- استقلال کامل از زبان
- حذف Drift بین پیاده‌سازی‌ها
- یک منبع حقیقت واحد
- پشتیبانی از معماری چندزبانه

---

## قراردادهای دامنه (در سطح سرویس)

قراردادهای مختص هر دامنه (مانند `Order`, `Payment`, `Wallet`) در داخل همان سرویس تعریف می‌شوند و به لایه پلتفرم منتقل نمی‌شوند.

مثال:

```text
nons-api/services/order-service/contracts/
nons-api/services/payment-service/contracts/
nons-api/services/wallet-service/contracts/
```

مالک هر Domain Contract همان سرویس است. پلتفرم فقط مالک Platform Contracts است.

---

## تفاوت قرارداد و پیاده‌سازی

### پکیج مرکزی با پیاده‌سازی ❌

```ts
// packages/logger — این رویکرد انتخاب نشده
import winston from "winston";

export const logger = winston.createLogger({
  format: winston.format.json(),
});
```

**مشکل این رویکرد:**

- همه سرویس‌های TypeScript به `winston` قفل می‌شوند
- Go core نمی‌تواند از یک پکیج TypeScript استفاده کند
- تغییر کتابخانه در آینده به معنای تغییر در همه سرویس‌ها است
- سرویس‌هایی که نیاز متفاوتی دارند نمی‌توانند انعطاف داشته باشند

---

### قرارداد خالص ✅

قراردادها فقط **شکل داده** را تعریف می‌کنند — نه پیاده‌سازی.

**Contract Layer (Proto):**

```protobuf
// nons-api/contracts/envelope.proto
message EventEnvelope {
  string id = 1;
  string subject = 2;
  string version = 3;
  string timestamp = 4;
  string source = 5;
  string trace_id = 6;
  bytes payload = 7;
}
```

**Logging Contract (TypeScript — استثنا):**

```ts
// packages/logging — این رویکرد انتخاب شده
// هیچ import خارجی ندارد — فقط TypeScript خالص

export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

export interface LogEntry {
  level: "debug" | "info" | "warn" | "error";
  service: string;
  traceId: string;
  message: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}
```

هر سرویس این interface را با هر کتابخانه‌ای که مناسب بداند پیاده‌سازی می‌کند — ولی **خروجی نهایی همیشه همین شکل** را دارد.

Logging Contract یک قرارداد انتقال داده بین سرویس‌ها نیست — فقط استاندارد خروجی Log را تعریف می‌کند. به همین دلیل در Proto تعریف نمی‌شود.

---

## اجزای فعلی

### `nons-api/contracts/` — Proto Source of Truth

**نوع:** مرکزی — قراردادهای پلتفرم

**مسئولیت:** تعریف قراردادهای مشترک پلتفرم (Event Envelope, Error Codes, Registry, Permissions).

**فرمت:** Protocol Buffers

**ابزار:** Buf — linting, breaking-change detection, code generation

**چه کسی استفاده می‌کند:** Core (Go bindings), سرویس‌های TypeScript (TS bindings), سرویس‌های آینده

---

### `nons-api/packages/logging` — `@nons/logging`

**نوع:** فقط قرارداد — **بدون پیاده‌سازی** — خارج از محدوده Proto

**مسئولیت:** تعریف فرمت یکسان لاگ و interface که هر سرویس باید implement کند. این پکیج هیچ کتابخانه‌ای import نمی‌کند و هیچ لاگی نمی‌زند.

```ts
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  service: string;
  traceId: string;
  message: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}
```

**Go core** همان فرمت `LogEntry` را به شکل JSON تولید می‌کند:

```go
type LogEntry struct {
    Level     string                 `json:"level"`
    Service   string                 `json:"service"`
    TraceID   string                 `json:"traceId"`
    Message   string                 `json:"message"`
    Timestamp string                 `json:"timestamp"`
    Meta      map[string]interface{} `json:"meta,omitempty"`
}
```

**نتیجه:** خروجی لاگ از `auth-service` با TypeScript/pino و از Go core با zap، **دقیقاً یک شکل** دارد. سیستم مانیتورینگ هر دو را یکسان می‌خواند.

---

### `.nons/generated/` — مصنوعات تولیدشده توسط CLI

طبق [ADR-Platform-004](../ADR/ADR-Platform-004)، مصنوعات فرانت‌اند توسط **Platform CLI** تولید می‌شوند. کدهای Types، API Client و Hooks توسط `nons generate` در `.nons/generated/` در پروژه کلاینت تولید می‌شوند. فرانت‌اند هیچ وابستگی NPM ندارد — تنها وابستگی، ابزار CLI `nons` است.

---

## خلاصه تصمیم

| مؤلفه                                  | نوع                      | منبع حقیقت      | وابستگی خارجی |
| -------------------------------------- | ------------------------ | --------------- | ------------- |
| `nons-api/contracts/` (Proto)          | مرکزی — پلتفرم           | Proto           | Buf (ابزار)   |
| `nons-api/packages/contracts` (generated) | Binding تولیدشده      | Proto           | هیچ           |
| `nons-api/packages/events` (generated) | Binding تولیدشده         | Proto + Catalog | هیچ           |
| `nons-api/packages/logging`            | قرارداد — فقط TypeScript | خود فایل        | هیچ           |
| `.nons/generated/` (فرانت‌اند)         | مصنوعات تولیدشده توسط CLI  | Service Manifest | CLI (nons) |

---

## چرا این رویکرد

**۱. زبان‌آگنوستیک واقعی**

رویکرد قبلی (TypeScript packages) ادعای زبان‌آگنوستیک بودن داشت اما در عمل TypeScript مالک قراردادها بود و Go core مجبور بود structها را دستی بازنویسی کند. با Proto، هیچ زبانی مالک نیست — همه مصرف‌کننده.

**۲. حذف Drift**

Code Generation تضمین می‌کند Bindingهای Go و TypeScript همیشه هماهنگ هستند. دیگر خبری از Desynchronization بین Core و سرویس‌ها نیست.

**۳. تغییر آزاد است**

اگر `auth-service` بخواهد از `pino` به `winston` مهاجرت کند، هیچ سرویس دیگری تأثیر نمی‌گیرد — چون پیاده‌سازی داخل خود سرویس است.

**۴. خروجی یکسان است**

مهم نیست هر سرویس چه کتابخانه‌ای استفاده می‌کند — چون همه باید `LogEntry` یکسان تولید کنند، سیستم مانیتورینگ و tracing بدون مشکل کار می‌کند.

**۵. آماده برای آینده**

Proto از Rust, Python, Java, Go, TypeScript و هر زبان دیگری پشتیبانی می‌کند. افزودن سرویس با زبان جدید نیاز به Parser اختصاصی ندارد.

---

## ارتباط با NATS

استفاده از Protobuf به معنای استفاده از gRPC نیست. پیام‌ها همچنان از طریق NATS با Payload JSON منتقل می‌شوند. Proto فقط منبع حقیقت قراردادها است.

```text
Proto
  ↓
Generate Types
  ↓
JSON Payload
  ↓
NATS
```

---

## ابهامات رفع‌شده

تمامی ابهامات معماری در [ADR-Platform-001](../ADR/ADR-Platform-001) و پیوست‌های آن تصمیم‌گیری شده‌اند. برای جزئیات بیشتر به آن سند مراجعه کنید.

> **نکته:** با تصویب [ADR-Platform-004](../ADR/ADR-Platform-004)، مصنوعات فرانت‌اند توسط `nons generate` در `.nons/generated/` تولید می‌شوند. بک‌اند Bindingهای Proto را از `nons-api/packages/contracts` و `nons-api/packages/events` مصرف می‌کند که از طریق Buf در CI تولید می‌شوند.
