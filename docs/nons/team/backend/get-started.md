---
layout: doc
title: شروع سریع بک‌اند
description: راهنمای شروع کار با سرویس‌های بک‌اند — ساختار، ایجاد سرویس جدید، مجوزها، APIها، رویدادها و چک‌لیست PR
version: 1.0.0
status: ACTIVE
author: Platform Team
owner: Backend Team
created_at: 2026-07-24
updated_at: 2026-07-24
tags:
  - Backend
  - GetStarted
  - Guidelines
---

# شروع سریع بک‌اند

**Backend Get Started**

> این سند برای یک توسعه‌دهنده جدید کافی است تا بدون پرسیدن از تیم، سرویس بک‌اند خود را ایجاد، پیکربندی و با استانداردهای پلتفرم هماهنگ کند.

---

## ۱. نمای کلی

### معماری

پلتفرم NONS بر پایه معماری **Microservice + Monorepo** (Nx + pnpm workspace) ساخته شده است:

```
nons-api/
├── contracts/       Proto source of truth
├── packages/        TS packages (types, contracts, events, logging, client)
├── core/            Go control plane (NATS, Postgres, OTel)
├── services/        24 سرویس (۶ پیاده‌سازی‌شده، ۱۸ blueprint)
├── infra/           Gateway، Kratos، Hydra، k8s
├── deploy/          Helm charts
└── scripts/         Codegen و ابزارهای اتوماسیون
```

### سه لایه حیاتی

```
Auth Service  → «این شخص کیست؟» (هویت) — Ory Kratos
User Service  → «این شخص چگونه نمایش داده شود؟» (پروفایل)
IAM Service   → «این شخص چه کاری اجازه دارد انجام دهد؟» (دسترسی)
```

---

## ۲. راه‌اندازی محیط

### پیش‌نیازها

| ابزار | نسخه | توضیح |
|-------|------|-------|
| Go | >= 1.26 | کامپایل سرویس‌ها |
| Node.js | >= 20 | برای pnpm و codegen |
| pnpm | >= 9 | مدیریت وابستگی‌ها |
| Docker | جدید | برای Redis، Kratos، Hydra، Postgres |
| NATS | >= 2.x | صف پیام (اختیاری در توسعه) |

### دستورات اصلی

```bash
# از ریشه nons-api/ اجرا کنید
pnpm install

# تولید کد از Proto
pnpm codegen

# تست همه سرویس‌ها
pnpm test

# lint همه سرویس‌ها
pnpm lint

# build همه سرویس‌ها
pnpm build
```

### اجرای سرویس

```bash
# یک سرویس خاص
cd services/iam-service
go run ./cmd

# یا از root با --filter
pnpm --filter @nons/iam-service dev
```

---

## ۳. ساختار یک سرویس

### الگوی استاندارد

هر سرویس باید از این ساختار پیروی کند:

```
services/<service-name>/
├── cmd/
│   └── main.go              # نقطه ورود
├── internal/
│   ├── config/
│   │   └── config.go        # بارگذاری env vars
│   ├── handler/
│   │   └── handler.go       # هندلرهای HTTP
│   ├── service/
│   │   └── service.go       # منطق کسب‌وکار
│   ├── repository/
│   │   └── repository.go    # دسترسی به داده
│   ├── model/
│   │   └── model.go         # ساختارهای داده
│   ├── middleware/
│   │   └── auth.go          # میان‌افزار احراز هویت
│   └── event/
│       └── event.go         # NATS publisher/subscriber
├── migrations/
│   ├── migration.go
│   └── 001_init.sql
├── permissions.meta.yaml    # ← مجوزهای این سرویس
├── go.mod
├── Dockerfile
└── README.md
```

> توجه: سرویس‌های `auth-service` و `login-consent-app` از الگوی قدیمی `main.go` در ریشه و `package internal` تخت استفاده می‌کنند. سرویس‌های جدید باید از الگوی `cmd/main.go` + زیرپکیج‌ها پیروی کنند.

---

## ۴. قوانین مجوزها (Permission Rules)

### ۴.۱ — هر سرویس مالک مجوزهای خود است

فایل `permissions.meta.yaml` در ریشه سرویس، مالکیت مجوزها را مشخص می‌کند:

```yaml
# Owner: <your-service>
- key: yourresource.youraction
  name: Human Readable Name
  description: One-sentence explanation
  group: yourresource
```

### ۴.۲ — زنجیره تعریف مجوز جدید

| مرحله | اقدام | مسئول |
|-------|-------|-------|
| ۱ | افزودن enum به `contracts/permissions.proto` | تیم پلتفرم |
| ۲ | اجرای `pnpm codegen` | اتوماتیک |
| ۳ | افزودن metadata به `permissions.meta.yaml` **در سرویس مالک** | تیم سرویس |
| ۴ | اجرای `pnpm codegen` (aggregation + بررسی orphan/collision) | اتوماتیک |
| ۵ | ثبت در IAM DB seed (`002_seed_defaults.sql`) | تیم سرویس |
| ۶ | افزودن برچسب فارسی/انگلیسی در `admin-panel/locales/` | تیم فرانت |

> **مالکیت توزیع‌شده:** هر سرویس فایل `permissions.meta.yaml` خود را در ریشهٔ خود دارد (مثلاً `services/order-service/permissions.meta.yaml`). IAM فقط aggregator است. aggregation در build-time توسط `pnpm codegen` انجام می‌شود. برای جزئیات بیشتر به `permissions-source-of-truth.md` مراجعه کنید.

### ۴.۳ — منبع حقیقت دوگانه

- **Proto** (`contracts/permissions.proto`) منبع حقیقت برای **تعریف کلیدها** است (key names, enum values)
- **IAM** منبع حقیقت برای **وضعیت runtime** است (کدام کاربر کدام مجوز را دارد، نقش‌ها، خط‌مشی‌ها)

هیچ سرویسی نباید مجوزی تعریف کند که در Proto نباشد (گیر افتادن در CI توسط orphan check). همچنین هیچ کلید Protoای نباید بدون owner بماند (orphan) یا بیش از یک owner داشته باشد (collision).

---

## ۵. قوانین API

### مسیردهی

- همه routeها از الگوی `METHOD /v1/<resource>/...` پیروی می‌کنند
- از `POST /v1/path` (بدون پیشوند متد) استفاده نکنید
- مثال: `GET /v1/iam/roles`، `POST /v1/users/{id}/roles`

```go
mux.HandleFunc("GET /v1/iam/roles", handler.ListRoles)
mux.HandleFunc("POST /v1/iam/roles", handler.CreateRole)
```

### OpenAPI Annotation

هر endpoint جدید باید annotation `google.api.http` در proto داشته باشد:

```proto
rpc ListRoles (ListRolesRequest) returns (ListRolesResponse) {
  option (google.api.http) = {
    get: "/v1/iam/roles"
  };
}
```

### فرمت پاسخ

```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
// یا
{
  "success": false,
  "error": { "code": "...", "message": "..." }
}
```

---

## ۶. قوانین NATS و رویدادها

### EventEnvelope — همه سرویس‌ها باید از یک قالب پیروی کنند

```json
{
  "id": "evt_uuid",            // <- این فیلد الزامی است
  "subject": "nons.domain.entity.action",
  "version": 1,
  "timestamp": "2026-01-01T00:00:00Z",
  "source": "service-name",
  "trace_id": "..." ,
  "payload": { ... }
}
```

> همه سرویس‌ها باید فیلد `id` را در EventEnvelope داشته باشند. سرویس‌های قدیمی که `id` ندارند باید به‌روز شوند.

###命名 NATS subjects

الگوی اجباری: `nons.<domain>.<entity>.<action>`
مثال: `nons.auth.user.registered`، `nons.user.profile.updated`

---

## ۷. قوانین پیکربندی

### بارگذاری env vars

از `godotenv` برای بارگذاری `.env` استفاده کنید (نه parser دستی):

```go
import "github.com/joho/godotenv"

func LoadConfig() Config {
    godotenv.Load()
    // ...
}
```

### نام‌گذاری env vars

- همه سرویس‌ها از `LOG_LEVEL=info` استفاده کنند (نه `AUTH_LOG_LEVEL`)
- همه سرویس‌ها از `KRATOS_ADMIN_URL=...` استفاده کنند (نه `KRATOS_ADMIN`)
- همه سرویس‌ها از `IAM_SERVICE_URL=...` استفاده کنند (نه `IAM_URL`)
- مقادیر اجباری: `DATABASE_URL` (اگر سرویس دیتابیس دارد)
- همه سرویس‌ها `PORT` برای پورت HTTP

---

## ۸. قوانین Middleware

### الگوی احراز هویت

سرویس‌های جدید باید از **middleware-based auth** مشابه `iam-service` استفاده کنند:

```go
// internal/middleware/auth.go
func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        userID := r.Header.Get("X-User-ID")
        if r.Header.Get("X-User-ID") == "" {
            http.Error(w, "missing user identity", http.StatusUnauthorized)
            return
        }
        ctx := context.WithValue(r.Context(), "user_id", userID)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

> الگوی ad-hoc (خواندن هدر در هر هندلر به صورت مجزا) منسوخ شده است.

---

## ۹. چک‌لیست قبل از PR

- [ ] `go build ./...` — بدون خطا
- [ ] `go vet ./...` — بدون خطا
- [ ] تست‌ها پاس می‌شوند
- [ ] فایل `permissions.meta.yaml` وجود دارد (اگر سرویس مجوز دارد)
- [ ] همه کلیدهای مجوز در Proto تعریف شده‌اند
- [ ] `pnpm codegen` اجرا شده و `git diff --exit-code` پاس می‌شود
- [ ] event envelope دارای فیلد `id` است
- [ ] routeها از الگوی `METHOD /v1/...` پیروی می‌کنند
- [ ] env vars با naming convention هماهنگ هستند
- [ ] auth middleware استفاده شده (نه ad-hoc)
- [ ] خطاها fail-closed هستند (در صورت خطا، دسترسی رد شود)
- [ ] `go mod tidy` اجرا شده

---

## مستندات مرتبط

- [خدمات بک‌اند (index)](index)
- [مدل مجوزها در پلتفرم](/docs/team/platform/permission-model)
- [استاندارد قرارداد مجوز](/docs/team/platform/standards/permission-contract-standard)
- [استاندارد همگام‌سازی SDK](/docs/team/platform/standards/permission-and-sdk-sync-standard)
- [Blueprint سرویس IAM](services/iam-service)
- [عیب‌یابی](troubleshooting)
- [معماری پلتفرم](/docs/team/platform/Architecture)
