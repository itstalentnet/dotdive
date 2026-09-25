---
layout: doc
title: مدل مجوزها — منبع حقیقت و مالکیت توزیع‌شده
description: معماری نهایی مدل مجوزها — از تعریف در Proto تا اعمال در CI، با مالکیت توزیع‌شده متادیتا
version: 1.0.0
status: ACTIVE
author: Platform Team
owner: Platform Team
created_at: 2026-07-24
updated_at: 2026-07-24
tags:
  - Platform
  - Permission
  - Architecture
  - Codegen
  - IAM
---

# مدل مجوزها — منبع حقیقت و مالکیت توزیع‌شده

**Permission Model — Source of Truth & Distributed Ownership**

> این سند معماری نهایی مدل مجوزهای پلتفرم NONS را شرح می‌دهد: یک منبع حقیقت برای کلیدها (Proto)، مالکیت توزیع‌شده متادیتا در هر سرویس، و زنجیره خودکار از Proto تا CI.

---

## ۱. اصول معماری

### اصل اول — Proto منبع حقیقت تعریف کلیدهاست

فایل `contracts/permissions.proto` (در `nons-api/`) تنها جایی است که کلیدهای مجوز تعریف می‌شوند. هیچ سرویس یا فرانت‌اندی حق تعریف کلید جدید خارج از Proto را ندارد.

### اصل دوم — متادیتا نزد تیم صاحب هر سرویس زندگی می‌کند

هر سرویس فایل `permissions.meta.yaml` خود را دارد. IAM فقط کلیدهای مربوط به خود را نگهداری می‌کند. این یعنی:

- **تیم marketplace** مالک `products.*` است
- **تیم order** مالک `orders.*` است
- **تیم wallet** مالک `wallets.*` است
- **تیم IAM** مالک `admin.*`، `*.read` و `tickets.*` است (موقت)

### اصل سوم — یک کلید = یک مالک

هر کلید مجوز در Proto باید دقیقاً یک فایل YAML مالک داشته باشد. اگر صفر باشد (orphan) CI رد می‌کند. اگر دو تا باشد (collision) CI رد می‌کند.

---

## ۲. Pipeline کامل

```
contracts/permissions.proto   (SSOT — Source of Truth)
    │
    ├── buf generate ──→ core/platform/*.pb.go          (FINAL, committed)
    ├── buf generate ──→ packages/contracts/src/*.ts     (FINAL, committed)
    ├── buf generate ──→ packages/types/src/*.ts         (FINAL, committed)
    ├── buf generate ──→ packages/events/src/*.ts        (FINAL, committed)
    ├── buf generate ──→ gen/openapi/*.swagger.json      (INTERMEDIATE, gitignored)
    │       │
    │       └── openapi-typescript ──→ packages/contracts/src/iam-sdk.ts (FINAL, committed)
    │
    ├── generate-iam-permission-keys.mjs ──→ permission_keys_gen.go
    │
    └── services/*/permissions.meta.yaml
            │
            └── aggregate-permission-meta.mjs ──→ permission_meta_aggregated.go (FINAL)
```

### تفکیک FINAL و INTERMEDIATE

| Artifact | Type | در git؟ | CI check؟ |
|----------|------|---------|-----------|
| `.pb.go` (Go protobuf) | FINAL | ✅ committed | `git diff --exit-code` |
| `.ts` (TypeScript) | FINAL | ✅ committed | `git diff --exit-code` |
| `iam-sdk.ts` | FINAL | ✅ committed | `git diff --exit-code` |
| `permission_keys_gen.go` | FINAL | ✅ committed | `git diff --exit-code` |
| `permission_meta_aggregated.go` | FINAL | ✅ committed | `git diff --exit-code` |
| `gen/openapi/*.swagger.json` | INTERMEDIATE | ❌ gitignored | مصرف مستقیم در pipeline |

---

## ۳. CI Validation Chain

هر commit توسط ۳ لایه CI محافظت می‌شود:

### لایه ۱ — Proto lint & breaking

```
npx buf lint contracts          — قالب‌بندی و قراردادهای Proto
npx buf breaking contracts      — عدم تغییرات breaking (حذف فیلد، شماره‌گذاری مجدد)
```

### لایه ۲ — Codegen & ownership validation

```
pnpm codegen                    — بازتولید همه artifactها
  ├── aggregate-permission-meta.mjs
  │   ├── هر Proto key = دقیقاً ۱ YAML owner  (رد orphan + collision)
  │   ├── هر YAML key = معتبر در Proto          (رد کلید جعلی)
  │   └── متادیتا کامل: name, description, group
  └── prettier                   — فرمت کدهای تولیدشده
```

### لایه ۳ — Diff sync

```
git diff --exit-code            — تضمین هماهنگی artifactهای committed با Proto
go test ./core/platform/...     — تست تطابق Proto key ↔ ۲۱ کلید
go test ./services/iam/...      — تست تطابق aggregated metadata ↔ Proto keys
```

---

## ۴. مالکیت فعلی

| سرویس | کلیدها | مالک |
|-------|--------|------|
| `iam-service` | `admin.access`, `roles.read`, `permissions.read`, `capabilities.read`, `restrictions.read`, `policies.read`, `workspaces.read`, `audit.read`, `events.read`, `settings.read` | IAM Team |
| `iam-service` (temporary) | `tickets.read`, `tickets.resolve` | IAM Team (تا ایجاد tickets-service) |
| `marketplace-service` | `products.create`, `products.update`, `products.delete`, `products.publish` | Marketplace Team |
| `order-service` | `orders.create`, `orders.cancel` | Order Team |
| `wallet-service` | `wallets.read`, `wallets.withdraw` | Wallet Team |
| `user-service` | `users.read` | User Team |

### نکته: نام سرویس ≠ namespace کلید

نام پوشه سرویس (مثلاً `order-service`) لزوماً با namespace کلید (مثلاً `orders.*`) یکی نیست. این عمدی است — نام پوشه منطبق بر نام مخزن سرویس است، namespace کلید از قرارداد IAM پیروی می‌کند.

---

## ۵. افزودن مجوز جدید

### مراحل

1. **افزودن enum value به `contracts/permissions.proto`** (`PermissionKey`)
   - نیاز به بررسی تیم پلتفرم
   - مقدار عددی جدید (از آخرین مقدار + ۱)

2. **اجرای `pnpm codegen`** — بازتولید خودکار Go/TS/SDK/OpenAPI

3. **افزودن metadata به `services/<your-service>/permissions.meta.yaml`**
   ```yaml
   # Owner: <your-service>
   - key: yourresource.newaction
     name: Human Readable Name
     description: One-sentence explanation
     group: yourresource
   ```
   - فقط نیاز به بررسی تیم خودتان
   - CI به‌صورت خودکار orphan/collision را بررسی می‌کند

4. **ثبت در IAM DB seed** (`002_seed_defaults.sql`)

5. **افزودن برچسب فارسی/انگلیسی** در `admin-panel/locales/`

6. **همه تست‌ها باید پاس شوند**

### حذف مجوز

- کلید را از Proto حذف کنید (breaking change — نیاز به major version)
- از YAML سرویس حذف کنید
- از IAM DB seed حذف کنید
- از localeها حذف کنید

---

## ۶. مستندات مرتبط

- [شروع سریع بک‌اند](/docs/team/backend/get-started)
- [شروع سریع فرانت‌اند](/docs/team/frontend/get-started)
- [استاندارد قرارداد مجوز](/docs/team/platform/standards/permission-contract-standard)
- [استاندارد همگام‌سازی SDK](/docs/team/platform/standards/permission-and-sdk-sync-standard)
- [Blueprint سرویس IAM](/docs/team/backend/services/iam-service)
- [تغییرات معماری (Phase 1→5)](/docs/team/platform/ADR/ADR-Platform-004)

---

## A. پیوست — تاریخچه معماری

| فاز | منبع کلیدها | مالکیت متادیتا | مکانیزم |
|-----|-------------|----------------|---------|
| ۱ | IAM DB seed | تک فایل در IAM | دستی |
| ۲ | `permissions_meta.yaml` (دستی) | تک فایل در IAM cmd/ | دستی |
| ۳ | Proto (enum فقط) | تک فایل در IAM cmd/ | semi-auto |
| ۴ | Proto + OpenAPI + SDK | تک فایل در IAM cmd/ | codegen |
| **۵ (فعلی)** | **Proto** | **توزیع‌شده per-service YAML** | **کامل خودکار + CI** |
