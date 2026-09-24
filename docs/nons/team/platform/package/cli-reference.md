---
layout: doc
title: راهنمای ابزار خط فرمان (Nons CLI)
description: مستند فنی و راهنمای کاربری ابزار CLI خط فرمان پلتفرم NONS
version: 2.2.0
status: APPROVED
author: Platform Team
owner: Platform Team
created_at: 2026-07-01
updated_at: 2026-07-04
tags:
  - CLI
  - Registry
  - Artifact Generation
  - Integration
---

# راهنمای ابزار خط فرمان (Nons CLI)

**Platform CLI** — تنها ابزار رسمی توسعه‌دهنده برای تعامل با سرویس‌های پلتفرم NONS.

> **مسئولیت CLI:** مدیریت قراردادها، رجیستری، باندل‌ها و تولید مصنوعات پروژه. CLI یک ابزار Contract Management است که کدهای مصرف‌کننده را برای فریم‌ورک هدف تولید می‌کند.

> **وضعیت:** این سند معماری کلی CLI و حوزه‌های مسئولیتی آن را شرح می‌دهد. دستورات دقیق و پرچم‌ها در فاز پیاده‌سازی نهایی می‌شوند.

---

## ۱. فلسفه معماری

```
CLI یک ابزار ایستا (Build-time) است، نه یک کتابخانه زمان اجرا (Runtime).
```

| ویژگی | توضیح |
|--------|--------|
| **مستقل** | یک فایل اجرایی واحد — بدون وابستگی به Node.js یا runtime دیگر |
| **چندسکویی** | Windows, macOS, Linux |
| **زبان‌آگنوستیک** | پروژه مصرف‌کننده می‌تواند هر زبانی داشته باشد |
| **خروجی پروژه‌محور** | کدها متناسب با فریم‌ورک هدف تولید می‌شوند |

---

## ۲. نصب

```bash
# دانلود آخرین نسخه
curl -fsSL https://nons.dev/cli/install.sh | sh

# یا دانلود مستقیم از GitHub Releases
# https://github.com/nons-dev/cli/releases
```

CLI به صورت یک باینری مستقل توزیع می‌شود — نیاز به Node.js، npm، pnpm یا هیچ وابستگی دیگری ندارد.

---

## ۳. دستورات رسمی

### `nons init`

مقداردهی اولیه پروژه کلاینت. یک ویزارد تعاملی برای انتخاب فریم‌ورک پروژه اجرا می‌کند.

```bash
nons init
```

**خروجی:** ایجاد دایرکتوری `.nons/` با ساختار اولیه و فایل `config.yaml`.

---

### `nons registry build <service>`

ساخت Service Manifest از OpenAPI یک سرویس.

```bash
nons registry build user --source services/user-service/docs/openapi.yaml
```

**خروجی:** `.nons/registry/user/manifest.json`

```bash
nons registry build user --update   # بروزرسانی رجیستری موجود
```

---

### `nons registry list`

فهرست تمام رجیستری‌های محلی.

```bash
nons registry list
```

**خروجی:** نام سرویس، نسخه، تعداد operationها، تاریخ آخرین بروزرسانی.

---

### `nons bundle create`

ساخت باندل از مجموعه‌ای از سرویس‌ها.

```bash
nons bundle create --name my-app --services user,auth
```

**خروجی:** `.nons/bundles/my-app/bundle.json`

```bash
nons bundle list                # لیست باندل‌ها
nons bundle inspect my-app      # جزئیات باندل
nons bundle update my-app       # بروزرسانی باندل
nons bundle delete my-app       # حذف باندل
```

---

### `nons generate`

تولید مصنوعات پروژه بر اساس رجیستری‌ها و باندل‌های محلی.

```bash
nons generate
```

CLI فریم‌ورک هدف را از `config.yaml` می‌خواند و مصنوعات مناسب را در `.nons/generated/` تولید می‌کند.

**خروجی بر اساس فریم‌ورک:**

| فریم‌ورک | مسیر خروجی | مصنوعات |
|----------|-----------|---------|
| React / Next.js | `.nons/generated/hooks/` | Custom Hooks, Types, API Client |
| Vue / Nuxt | `.nons/generated/composables/` | Composables, Types, API Client |
| Flutter | `.nons/generated/dart/` | Dart Classes, API Service |
| React Native | `.nons/generated/hooks/` | Custom Hooks, Types |

---

### `nons validate`

اعتبارسنجی قراردادها، رجیستری‌ها و باندل‌ها.

```bash
nons validate               # بررسی همه
nons validate --registry    # فقط رجیستری
nons validate --bundle      # فقط باندل
nons validate --endpoints   # سلامت اندپوینت‌ها
```

---

### `nons interactive` / `nons ui`

حالت تعاملی (TUI) برای مرور سرویس‌ها، ساخت باندل و تولید مصنوعات.

```bash
nons interactive
```

---

## ۴. ساختار دایرکتوری `.nons/`

```
project/
└── .nons/
    ├── config.yaml              # تنظیمات پروژه (فریم‌ورک، مسیرها)
    │
    ├── registry/                # ← تولیدشده توسط nons registry build
    │   ├── user/
    │   │   └── manifest.json
    │   └── auth/
    │       └── manifest.json
    │
    ├── bundles/                 # ← تولیدشده توسط nons bundle create
    │   └── my-app/
    │       └── bundle.json
    │
    └── generated/               # ← تولیدشده توسط nons generate
        ├── types/
        ├── api-client/
        └── hooks/               # (واکنش‌گرا: React Hooks, Vue Composables, ...)
```

**قوانین طلایی:**

1. هیچ فایلی در `.nons/` دستی ویرایش نمی‌شود — به جز `config.yaml`
2. `registry/` فقط توسط `nons registry build` مدیریت می‌شود
3. `bundles/` فقط توسط `nons bundle` مدیریت می‌شود
4. `generated/` فقط توسط `nons generate` تولید می‌شود
5. `.nons/` در git commit می‌شود
6. `generated/` در `.gitignore` نیست — اعضای تیم پس از clone باید `nons generate` را اجرا کنند

---

## ۵. پیکربندی Transport در `config.yaml`

پیکربندی transport به `config.yaml` اضافه شده تا جنریتور بتواند به جای مقادیر hardcodeشده از config مصرف‌کننده استفاده کند. این توسط [ADR-Platform-005](../ADR/ADR-Platform-005) مصوب شد.

```yaml
project:
  name: my-app
  framework: react    # react | vue | next | nuxt | angular | svelte | node
  version: 1.0.0

paths:
  registry: .nons/registry
  bundles: .nons/bundles
  output: .nons/generated

transport:                               # اختیاری — پیش‌فرض بر اساس framework انتخاب می‌شود
  base_url_env: REACT_APP_API_URL        # نام env var فریم‌ورک
  credentials: omit                      # include | omit | same-origin
  default_timeout: 10000                 # ms
```

**پیش‌فرض‌های فریم‌ورکی (اگر `transport` تعریف نشده باشد):**

| فریم‌ورک | `base_url_env` | `credentials` |
|---------|--------------|---------------|
| `next` | `NEXT_PUBLIC_API_URL` | `include` |
| `react` | `REACT_APP_API_URL` | `omit` |
| `vue` | `VITE_API_URL` | `omit` |
| `nuxt` | `NUXT_PUBLIC_API_URL` | `include` |
| `angular` | `API_URL` | `omit` |
| `svelte` | `VITE_API_URL` | `omit` |
| `node` | `API_URL` | `omit` |

> **توضیح:** `credentials: include` برای حالتی است که سرویس از cookie-based auth استفاده می‌کند (cross-origin CORS با `Access-Control-Allow-Credentials: true`). برای سرویس‌های با احراز هویت Bearer-only مقدار `omit` امن‌تر است.

---

## ۵. مصنوعات تولیدشده — مثال (React/Next.js)

### types/user.ts

```typescript
// .nons/generated/types/user.ts
// ★ GENERATED BY nons generate — DO NOT EDIT ★

export interface UserResponse {
  id: string;
  displayName: string;
  avatar: string | null;
  createdAt: string;
}

export interface ListUsersRequest {
  limit?: number;
  cursor?: string;
}

export interface ListUsersResponse {
  success: boolean;
  data: UserResponse[];
  meta: { pagination: { next_cursor: string | null; has_more: boolean; limit: number } };
}
```

### api-client/user.ts

```typescript
// .nons/generated/api-client/user.ts
// ★ GENERATED BY nons generate — DO NOT EDIT ★

import type { ListUsersRequest, ListUsersResponse, UserResponse } from '../types/user';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function listUsers(data: ListUsersRequest): Promise<ListUsersResponse> {
  const params = new URLSearchParams();
  if (data.limit) params.set('limit', String(data.limit));
  if (data.cursor) params.set('cursor', data.cursor);
  const res = await fetch(`${BASE_URL}/v1/users?${params}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new ApiError(await res.json());
  return res.json();
}

export async function getUser(id: string): Promise<UserResponse> {
  const res = await fetch(`${BASE_URL}/v1/users/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new ApiError(await res.json());
  return res.json();
}
```

### hooks/useUsers.ts (React)

```typescript
// .nons/generated/hooks/useUsers.ts
// ★ GENERATED BY nons generate — DO NOT EDIT ★

import { useState, useEffect } from 'react';
import { listUsers } from '../api-client/user';
import type { UserResponse } from '../types/user';

export function useUsers(limit = 20) {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listUsers({ limit }).then(res => {
      setUsers(res.data);
      setLoading(false);
    });
  }, [limit]);

  return { users, loading };
}
```

---

## ۶. جریان کاری کامل

```bash
# 1. مقداردهی اولیه پروژه
nons init
# → ویزارد تعاملی: انتخاب فریم‌ورک (Next.js)
# → ایجاد .nons/config.yaml

# 2. ساخت رجیستری از OpenAPI سرویس
nons registry build user --source services/user-service/docs/openapi.yaml
# → ایجاد .nons/registry/user/manifest.json

# 3. ساخت باندل
nons bundle create --name my-app --services user
# → ایجاد .nons/bundles/my-app/bundle.json

# 4. تولید مصنوعات پروژه
nons generate
# → ایجاد .nons/generated/types/
# → ایجاد .nons/generated/api-client/
# → ایجاد .nons/generated/hooks/

# 5. اعتبارسنجی
nons validate
```

---

## ۷. تغییر اندپوینت در بک‌اند

هنگامی که بک‌اند یک اندپوینت را تغییر می‌دهد:

```bash
# مرحله ۱: بروزرسانی رجیستری
nons registry build user --update

# مرحله ۲: بازتولید مصنوعات
nons generate
```

**در هیچکدام از این مراحل، کد پروژه کلاینت تغییر نمی‌کند.**

---

## ۸. یکپارچگی با Platform Contracts (Proto + Buf)

CLI به صورت مستقیم از Bindingهای TypeScript تولیدشده توسط Buf استفاده نمی‌کند. جریان یکپارچگی:

```
nons-api/contracts/*.proto
       │
       ▼ [buf generate]
Platform TypeScript Bindings
       │
       ▼ [استفاده در CLI Generator]
متدهای تولیدشده در API Client
```

Platform Types (Error Envelope, ...) در زمان تولید توسط CLI به کدهای خروجی تزریق می‌شوند.

---

## مستندات مرتبط

| سند | توضیح |
|-----|--------|
| [ADR-Platform-004](../ADR/ADR-Platform-004) | تصمیمات معماری CLI و Registry |
| [ADR-Platform-005](../ADR/ADR-Platform-005) | معماری Generator Metadata و Template-per-Framework |
| [OpenAPI Guidelines](../api/openapi-guidelines) | استاندارد تولید OpenAPI |
| [Repository Structure](../standards/repository-structure) | مسیر فایل‌ها در سرویس |
