---
layout: doc
title: راهنمای تولید OpenAPI
description: استاندارد رسمی تولید، اعتبارسنجی و انتشار OpenAPI در پلتفرم نونز
version: 1.2.0
status: APPROVED
author: Platform Team
owner: Platform Team
created_at: 2026-07-02
updated_at: 2026-07-08
tags:
  - Platform
  - API
  - OpenAPI
  - Standard
  - Contract
reviewers:
  - Backend Team
  - Platform Team
---

# راهنمای تولید OpenAPI

**OpenAPI Guidelines**

نسخه ۱.۲ | الزامی برای تمام سرویس‌ها

> این سند استاندارد تولید، اعتبارسنجی و انتشار OpenAPI در پلتفرم نونز را مشخص می‌کند. OpenAPI تنها منبع رسمی قرارداد API است که Registry و مصنوعات کلاینت از آن ساخته می‌شوند.

---

## ۱. نسخه OpenAPI

تمام سرویس‌ها باید OpenAPI **نسخه 3.1** منتشر کنند.

```yaml
openapi: "3.1.0"
```

نسخه‌های قدیمی‌تر (3.0.x, 2.0) مجاز نیستند. OpenAPI 3.1 با JSON Schema Draft 2020-12 سازگار است.

---

## ۲. مسئولیت تولید

هر سرویس مسئول تولید OpenAPI خودش است.

```
هر سرویس → OpenAPI خود را تولید می‌کند
```

**قوانین:**
- `nons` هیچ Contractی تولید نمی‌کند — `nons` مصرف‌کننده OpenAPI است
- Registry از OpenAPI ساخته می‌شود — Registry تولیدکننده OpenAPI نیست
- هر سرویس مالک OpenAPI خود است و مسئول صحت آن

---

## ۳. ابزار رسمی تولید (`nons-openapi`)

از نسخه ۱.۲ این استاندارد، تولید OpenAPI از طریق **ابزار واحد و مشترک `nons-openapi`** انجام می‌شود. این ابزار در مخزن مستقل [`github.com/NonsCore/openapi`](https://github.com/NonsCore/openapi) نگهداری شده و به‌صورت باینری منتشر می‌شود (GitHub Releases).

> **چرا ابزار مشترک؟** پیش از این هر سرویس یک ژنراتور اختصاصی (`cmd/openapi-gen/main.go`) و اسکریپت‌های تکراری داشت. این رویکرد باعث تکرار ~۸۵٪ کد و ناهماهنگی خروجی می‌شد. `nons-openapi` این منطق را در یک ابزار واحد با معماری Adapter متمرکز می‌کند.

### معماری Adapter

ابزار `nons-openapi` هسته‌ای زبان‌مستقل دارد و از طریق Adapterها با اکوسیستم‌های مختلف کار می‌کند:

| زبان/اکوسیستم | Adapter | وضعیت |
|----------------|---------|-------|
| Go | `go-ast` (پارس annotationهای Handler + Struct Tags) | رسمی |
| هر زبان (fallback) | `manifest-generic` (خواندن مانیفست OpenAPI از پیش نوشته‌شده) | رسمی |
| Python / NestJS | Adapter اختصاصی (نقشه راه آینده) | برنامه‌ریزی‌شده |

هر سرویس تنها یک فایل کانفیگ `openapi-config.yaml` دارد که Adapter و تنظیمات آن را مشخص می‌کند. جزئیات مدل `go-ast` در بخش ۱۳ آمده است.

### نسخه‌بندی ابزار

- ابزار با SemVer نسخه‌گذاری می‌شود و با tag گیت (`vX.Y.Z`) منتشر می‌گردد.
- هر پروژه می‌تواند نسخه ابزار را در `.nons-config.json` (فیلد `tool_version_pinned`) قفل کند.
- دستور `nons-openapi version --check` هماهنگی نسخه نصب‌شده با نسخه قفل‌شده را بررسی می‌کند.

---

## ۴. پایپلاین اعتبارسنجی (Validation Pipeline)

OpenAPI باید در CI اعتبارسنجی شود. پایپلاین رسمی:

```
OpenAPI Source (سرویس)
      │
      ▼
OpenAPI Lint (اعتبارسنجی ساختار)
      │
      ▼
Schema Validation (بررسی هماهنگی با طرح‌های داده)
      │
      ▼
Breaking Change Detection (شناسایی تغییرات مخرب)
      │
      ▼
Contract Test (تست‌های قرارداد)
      │
      ▼
Publish (انتشار به Registry)
```

**توضیح هر مرحله:**

| مرحله | ابزار | توضیح |
|-------|----------------|--------|
| Generate | `nons-openapi generate` | تولید `docs/openapi.yaml` از منبع (اعتبارسنجی ساختاری درون‌ساخت) |
| Lint | `nons-openapi validate` | اعتبارسنجی ساختار OpenAPI 3.1 |
| Breaking Change | `nons-openapi diff` (مقایسه با `openapi.prev.yaml`) | شناسایی تغییرات شکننده نسبت به نسخه قبلی |
| Publish | CI Pipeline | انتشار به Registry پلتفرم |

**قانون مهم:** هرگونه تغییر شکننده (حذف فیلد، تغییر نام فیلدهای اجباری، تغییر کد وضعیت HTTP) بدون افزایش نسخه API،Pipeline را متوقف می‌کند.

---

## ۵. فراداده استاندارد (Standard Metadata)

تمام سرویس‌ها باید فراداده استاندارد زیر را در OpenAPI خود داشته باشند:

```yaml
openapi: "3.1.0"
info:
  title: "<Service Name> API"          # مثال: User Service API
  description: "<توضیح کوتاه سرویس>"
  version: "1.0.0"
  contact:
    name: Backend Team
    url: https://github.com/orgs/nons-dev/teams/backend
  license:
    name: Proprietary
servers:
  - url: https://api.nons.io/v1
    description: Production
  - url: https://staging.api.nons.io/v1
    description: Staging
externalDocs:
  description: API Design Guidelines
  url: https://docs.nons.dev/team/platform/api/api-design-guidelines
tags:
  - name: <DomainName>
    description: <توضیح دامنه>
```

| فیلد | الزامی | توضیح |
|------|--------|--------|
| `info.title` | بله | نام سرویس — باید با `<Service Name> API` تطابق داشته باشد |
| `info.version` | بله | نسخه سند OpenAPI (هماهنگ با نسخه API) |
| `info.description` | توصیه | توضیح کوتاه |
| `info.contact` | توصیه | تیم مسئول |
| `info.license` | توصیه | Proprietary |
| `servers` | بله | حداقل یک سرور — Production الزامی است |
| `externalDocs` | توصیه | لینک به API Design Guidelines |
| `tags` | بله | دسته‌بندی اندپوینت‌ها |

---

## ۶. قوانین مسیر (Path Rules)

```
✅ تمام مسیرها باید با /v1/<domain> شروع شوند
✅ مثال: /v1/users/me, /v1/orders/{orderId}
❌ مسیر بدون پیشوند: /me, /profile
❌ تکرار نسخه: /v1/v1/users
```

پیشوند مسیر و نگاشت آن به Tagها از طریق بخش `tag_rules` در `openapi-config.yaml` تنظیم می‌شود (قوانین به ترتیب تعریف، از خاص به عام، ارزیابی می‌شوند).

---

## ۷. طرح‌های امنیتی (Security Schemes)

طرح‌های امنیتی رسمی پلتفرم — **باید عیناً** در همه سرویس‌ها تعریف شوند:

```yaml
components:
  securitySchemes:
    CookieSession:
      type: apiKey
      in: cookie
      name: session
      description: "Admin panel default — Cookie-based authentication"
    BearerJWT:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: "Services, CLI, mobile — JWT in Authorization header"
    ApiKey:
      type: apiKey
      in: header
      name: X-API-Key
      description: "External integrations — X-API-Key header"
```

**قوانین استفاده:**

| نوع اندپوینت | Security Field | توضیح |
|---|---|---|
| Public (بدون احراز هویت) | `security: []` | آرایه خالی — فیلد باید وجود داشته باشد |
| Protected (نیاز به JWT) | `- BearerJWT: []` | BearerJWT در Authorization header |
| Admin (پنل مدیریت) | `- CookieSession: []` | Cookie-based |
| External Integration | `- ApiKey: []` | X-API-Key header |

---

## ۸. ساختار `x-nons` (Extension Metadata)

هر operation باید بلوک `x-nons` داشته باشد. این فیلد اطلاعات Registry پلتفرم را حمل می‌کند:

```yaml
x-nons:
  token: users.getProfile      # الزامی: domain.action
  service: user-service        # الزامی: نام سرویس
  visibility: Public           # الزامی: Public | Protected
  timeout: 5s                  # اختیاری: حداکثر زمان پاسخ
  retry: 3                     # اختیاری: تعداد Retry در خطای شبکه
  cache: 60s                   # اختیاری: مدت Cache (فقط برای Public GET)
```

### قوانین `token`

فرمت: `<domain>.<action>` — فقط حروف، اعداد و Underscore مجاز

```
✅ users.getProfile
✅ users.updateUsername
✅ orders.create_item
❌ users.get-profile    (خط تیره مجاز نیست)
❌ getProfile           (باید domain.action باشد)
❌ users.              (action خالی)
```

Regex validator: `^[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+$`

### قوانین `visibility`

| مقدار | کاربرد |
|-------|---------|
| `Public` | اندپوینت‌های عمومی — نیاز به احراز هویت ندارند |
| `Protected` | اندپوینت‌های احراز هویت‌شده — BearerJWT الزامی است |

**ارتباط visibility با security:**
- `visibility: Public` → `security: []`
- `visibility: Protected` → `security: - BearerJWT: []`

### قوانین `cache`

فقط برای اندپوینت‌های Public GET که پاسخ‌شان قابل کش شدن است:

```yaml
# Cache فعال - 60 ثانیه
x-nons:
  visibility: Public
  cache: 60s

# بدون Cache
x-nons:
  visibility: Protected
  cache: 0s
```

---

## ۹. قوانین `operationId`

```
✅ هر operation باید operationId داشته باشد
✅ operationId باید با نام تابع Handler در کد منبع یکسان باشد
✅ PascalCase — مثال: GetProfile, UpdateUsername
❌ camelCase یا snake_case
❌ تکرار operationId در یک سرویس
```

**فلسفه:** این تطابق به ژنراتور اجازه می‌دهد بدون کانفیگ اضافه، operationId را از نام تابع استخراج کند.

---

## ۱۰. Envelope استاندارد پاسخ

### موفقیت (Success Response)

تمام پاسخ‌های موفق باید داخل envelope `data` قرار گیرند:

```yaml
"200":
  description: "..."
  content:
    application/json:
      schema:
        type: object
        required:
          - data
        properties:
          data:
            $ref: '#/components/schemas/YourResponseSchema'
```

در کد Go:
```go
func sendSuccess(w http.ResponseWriter, data any) {
    sendJSON(w, http.StatusOK, map[string]any{"data": data})
}
```

### خطا (Error Response)

تمام پاسخ‌های خطا باید از `ErrorResponse` استفاده کنند:

```yaml
"400":
  description: "..."
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/ErrorResponse'
```

**Schema های ثابت خطا** (در تمام سرویس‌ها باید عیناً وجود داشته باشند):

```yaml
components:
  schemas:
    ValidationErrorDetail:
      type: object
      required:
        - field
        - message
      properties:
        field:
          type: string
        message:
          type: string

    ErrorDetails:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: string        # مثال: USER_NOT_FOUND, VALIDATION_ERROR
        message:
          type: string        # پیام human-readable
        details:
          type: array
          items:
            $ref: '#/components/schemas/ValidationErrorDetail'

    ErrorResponse:
      type: object
      required:
        - error
      properties:
        error:
          $ref: '#/components/schemas/ErrorDetails'
```

---

## ۱۱. کدهای HTTP استاندارد

| کد | نام | کاربرد |
|----|-----|----------|
| `200` | OK | عملیات موفق |
| `400` | Bad Request | ورودی نامعتبر، فرمت اشتباه |
| `401` | Unauthorized | احراز هویت نشده |
| `403` | Forbidden | احراز هویت شده ولی دسترسی ندارد |
| `404` | Not Found | منبع یافت نشد |
| `409` | Conflict | تعارض (مثال: username تکراری) |
| `500` | Internal Server Error | خطای داخلی سرور |

**قانون:** حذف هر کد HTTP که در نسخه قبلی وجود داشته، Breaking Change محسوب می‌شود.

---

## ۱۲. محدودیت محتوای OpenAPI

**هیچ Metadata مربوط به UI، Layout، Template، Frontend یا Builder داخل OpenAPI قرار نگیرد.**

```
✅ مجاز: description, summary, tags, operationId, parameters, schemas, x-nons
❌ ممنوع: x-ui-layout, x-template, x-frontend-component, x-builder-config
```

OpenAPI فقط قرارداد Backend است. تصمیمات نمایشی (UI) در Registry مدیریت می‌شوند.

---

## ۱۳. مدل Adapter مربوط به Go (`go-ast`)

> این بخش مختص سرویس‌های Go است. Adapter `go-ast` بخشی از ابزار `nons-openapi` است؛ نیازی به نوشتن ژنراتور اختصاصی در هر سرویس نیست.

### معماری کلی

Adapter `go-ast` از دو منبع در کد سرویس و یک فایل کانفیگ می‌خواند:

```
internal/handler/handler.go   →  Endpoint definitions (Annotations)
internal/handler/models.go    →  Request/Response Schema (Struct Tags)
openapi-config.yaml           →  Adapter settings, tag_rules, schemas تزریقی
        │                                │
        └──────────────┬─────────────────┘
                       ▼
           nons-openapi (go-ast adapter)
                       │
                       ▼
            docs/openapi.yaml (تولید خودکار)
```

مسیر فایل‌های Handler و Models از طریق `openapi-config.yaml` تنظیم می‌شود (فیلدهای `handler_paths` و `models_path` در بخش `go-ast`).

### منبع ۱: Annotation های Handler

هر تابع Handler در `internal/handler/handler.go` باید Comment‌های annotation‌دار داشته باشد:

```go
// UpdateUsername updates the current user's username.
// @route PATCH /v1/users/me/username
// @summary Update user username
// @description Update username after validating uniqueness requirements
// @security BearerJWT
// @x-nons.token users.updateUsername
// @x-nons.service user-service
// @x-nons.visibility Protected
// @x-nons.timeout 5s
// @x-nons.retry 0
// @request UpdateUsernameRequest
// @response 200 SuccessResponse UpdateUsernameResponse "Username updated successfully"
// @response 400 ErrorResponse - "Invalid username format"
// @response 401 ErrorResponse - "Unauthorized"
// @response 404 ErrorResponse - "User not found"
// @response 409 ErrorResponse - "Username already taken"
// @response 500 ErrorResponse - "Internal server error"
func (h *UserHandler) UpdateUsername(w http.ResponseWriter, r *http.Request) {
    // ...
}
```

#### فرمت هر Annotation

| Annotation | فرمت | مثال |
|---|---|---|
| `@route` | `METHOD /path` | `@route PATCH /v1/users/me/username` |
| `@summary` | متن | `@summary Update user username` |
| `@description` | متن | `@description Update username after validating...` |
| `@security` | نام scheme یا `Public` | `@security BearerJWT` |
| `@x-nons.<key>` | `<key> <value>` | `@x-nons.token users.updateUsername` |
| `@request` | نام Struct | `@request UpdateUsernameRequest` |
| `@accepts` | Content-Type (اختیاری) | `@accepts application/x-www-form-urlencoded` |
| `@param` | `name in type required "desc"` | `@param publicId path string true "User Public ID"` |
| `@response` | `status envelope dataType "desc"` | `@response 200 SuccessResponse UpdateUsernameResponse "..."` |

> **`@accepts`:** به‌صورت پیش‌فرض بدنه درخواست `application/json` است. اگر اندپوینتی فرم‌محور باشد (مثل جریان‌های احراز هویت مبتنی بر Kratos)، با `@accepts application/x-www-form-urlencoded` نوع محتوای همان اندپوینت را override کنید. مقدار پیش‌فرض کل سرویس از طریق `request_media_type` در `openapi-config.yaml` قابل تنظیم است.

#### فرمت `@response`

```
@response <status> <envelope> <dataType> "<description>"
```

| مقدار `envelope` | رفتار در OpenAPI |
|---|---|
| `SuccessResponse` | داخل `{ data: $ref }` قرار می‌گیرد |
| `ErrorResponse` | مستقیم `$ref: ErrorResponse` |

| مقدار `dataType` | رفتار |
|---|---|
| نام Struct | `$ref: '#/components/schemas/StructName'` |
| `-` | `type: object` (بدون schema مشخص) |

#### فرمت `@param`

```
@param <name> <in> <type> <required> "<description>"
```

| فیلد | مقادیر ممکن |
|-------|-------------|
| `in` | `path`, `query`, `header`, `cookie` |
| `type` | `string`, `integer`, `boolean` |
| `required` | `true`, `false` |

مثال:
```go
// @param publicId path string true "User Public ID"
// @param page query integer false "Page number"
```

### منبع ۲: Struct Tags در models.go

Schema های OpenAPI از Struct‌های `internal/handler/models.go` استخراج می‌شوند:

```go
// فایل: internal/handler/models.go

type UpdateUsernameRequest struct {
    Username string `json:"username" validate:"required,min=3,max=30,alphanum_underscore"`
}
```

#### تبدیل Struct Tags به OpenAPI Schema

| Struct Tag | OpenAPI Property | مثال |
|---|---|---|
| `json:"field_name"` | نام فیلد در schema | `username` |
| `json:"-"` | فیلد از schema حذف می‌شود | — |
| `validate:"required"` | `required: [field_name]` | الزامی |
| `validate:"min=3"` | `minLength: 3` | برای string |
| `validate:"max=30"` | `maxLength: 30` | برای string |
| `validate:"alphanum_underscore"` | `pattern: "^[a-zA-Z0-9_]+$"` | pattern ثابت |
| `validate:"enum=A\|B\|C"` | `enum: [A, B, C]` | مقادیر مجاز |
| نوع `*string` (pointer) | `nullable: true` | nullable field |
| نوع `time.Time` | `type: string, format: date-time` | timestamp |

#### مثال کامل تبدیل

```go
// Go struct
type UpdateUsernameRequest struct {
    Username string `json:"username" validate:"required,min=3,max=30,alphanum_underscore"`
}

type UpdatePreferencesRequest struct {
    Currency string `json:"currency" validate:"enum=IRR|USD|TRY"`
    Theme    string `json:"theme"    validate:"enum=light|dark|system"`
    Language string `json:"language" validate:"enum=fa|en|tr"`
}

type UpdateProfileResponse struct {
    PublicID    string    `json:"public_id"`
    DisplayName *string   `json:"display_name"`   // pointer = nullable
    UpdatedAt   time.Time `json:"updated_at"`
}
```

```yaml
# OpenAPI خروجی
schemas:
  UpdateUsernameRequest:
    type: object
    required:
      - username
    properties:
      username:
        type: string
        minLength: 3
        maxLength: 30
        pattern: "^[a-zA-Z0-9_]+$"

  UpdatePreferencesRequest:
    type: object
    properties:
      currency:
        type: string
        enum:
          - IRR
          - USD
          - TRY
      theme:
        type: string
        enum:
          - light
          - dark
          - system
      language:
        type: string
        enum:
          - fa
          - en
          - tr

  UpdateProfileResponse:
    type: object
    properties:
      public_id:
        type: string
      display_name:
        type: string
        nullable: true       # چون *string است
      updated_at:
        type: string
        format: date-time    # چون time.Time است
```

#### تبدیل نوع داده Go به OpenAPI

| نوع Go | نوع OpenAPI | تذکر |
|--------|-------------|------|
| `string`, `*string` | `string` | pointer → nullable |
| `int`, `int32`, `int64`, `uint`, `uint64` | `integer` | — |
| `bool` | `boolean` | — |
| `time.Time`, `*time.Time` | `string` + `format: date-time` | — |
| سایر | `object` | nested schema |

#### Schemaهای مشترک (تزریق از کانفیگ)

Schemaهای مشترک مانند `ErrorResponse`، `ErrorDetails`، `ValidationErrorItem` از پارس خودکار Structها **skip** شده و در عوض از بخش `schemas` در `openapi-config.yaml` تزریق می‌شوند. این کار تضمین می‌کند تعریف این Schemaها در همه سرویس‌ها یکسان است. اگر یک Schema هم در کد و هم در کانفیگ تعریف شود، ابزار با خطای conflict متوقف می‌شود (fail-fast).

---

## ۱۴. ساختار فایل‌های اتوماسیون سرویس

با ابزار مشترک `nons-openapi`، دیگر نیازی به `cmd/openapi-gen/` و اسکریپت‌های تکراری نیست. هر سرویس تنها به یک فایل کانفیگ نیاز دارد:

```
services/{service-name}/
├── openapi-config.yaml       # کانفیگ سرویس (adapter, tag_rules, schemas)
├── internal/handler/
│   ├── handler.go            # تابع‌های Handler با Annotations
│   └── models.go             # Struct های Request/Response
└── docs/
    ├── openapi.yaml          # خروجی ابزار — هرگز دستی ویرایش نشود
    └── openapi.prev.yaml     # نسخه قبلی برای Breaking Change Detection
```

### نمونه `openapi-config.yaml`

```yaml
info:
  title: User Service API
  description: User profile and account management API
  version: "1.0.0"
  x-service-id: user-service

source:
  type: go-ast

tag_rules:
  - path_prefix: /v1/users
    tag: Users
    description: User profile management

schemas:
  ErrorResponse:
    type: object
    required: [error]
    properties:
      error:
        $ref: '#/components/schemas/ErrorDetails'
  # ... سایر Schemaهای مشترک

go-ast:
  handler_paths:
    - internal/handler/handler.go
  models_path: internal/handler/models.go
  receiver: UserHandler          # خالی ("") برای توابع سطح package
  request_media_type: application/json
  response_media_type: application/json
```

### Makefile Targets

هر سرویس باید این target ها را در Makefile داشته باشد:

```makefile
openapi-gen:
	nons-openapi generate

openapi-val:
	nons-openapi validate
```

**استفاده:**
```bash
make openapi-gen   # تولید openapi.yaml از کد
make openapi-val   # اعتبارسنجی openapi.yaml

# یا مستقیم:
nons-openapi generate           # تولید (شامل اعتبارسنجی ساختاری)
nons-openapi validate           # اعتبارسنجی مستقل
nons-openapi diff               # بررسی تغییرات شکننده در برابر openapi.prev.yaml
nons-openapi generate --dry-run # چاپ خروجی به stdout بدون نوشتن فایل
```

---

## ۱۵. جزئیات پایپلاین اعتبارسنجی

ابزار `nons-openapi` اعتبارسنجی را در دو دستور مجزا انجام می‌دهد:

### `nons-openapi validate` — اعتبارسنجی ساختاری

- نسخه دقیق OpenAPI `3.1.0`
- ساختار صحیح سند (paths، operations، components)
- قابل حل بودن ارجاعات Schema (`$ref`)
- وجود متادیتای الزامی در هر operation

> اعتبارسنجی ساختاری به‌صورت خودکار درون `nons-openapi generate` نیز اجرا می‌شود؛ در صورت خطا، فایل خروجی نوشته نمی‌شود (fail-fast، بدون خراب‌کردن `openapi.yaml` موجود).

### `nons-openapi diff` — تشخیص تغییرات شکننده

اگر `docs/openapi.prev.yaml` وجود داشته باشد، تغییرات نسبت به آن بررسی می‌شود:

| تغییر | وضعیت |
|-------|--------|
| حذف اندپوینت | ❌ Breaking |
| حذف HTTP method | ❌ Breaking |
| حذف response status code | ❌ Breaking |
| حذف request body | ❌ Breaking |
| حذف property از Request schema | ❌ Breaking |
| تغییر type یک property | ❌ Breaking |
| تبدیل optional field به required | ❌ Breaking |
| اضافه کردن optional field | ✅ Non-Breaking |
| اضافه کردن endpoint جدید | ✅ Non-Breaking |

> قوانین کیفی مانند فرمت `token`، الزام `x-nons`، و طرح‌های امنیتی مجاز، بخشی از استانداردهای این سند هستند و در CI بررسی می‌شوند.

---

## ۱۶. فلسفه Single Source of Truth

```
کد Go (handler.go + models.go) + openapi-config.yaml
         │
         │  nons-openapi generate
         ▼
docs/openapi.yaml  ← هرگز دستی ویرایش نشود
         │
         │  nons-openapi validate / diff
         ▼
Registry پلتفرم
```

**قوانین:**
- **تغییر مستقیم `openapi.yaml` اکیداً ممنوع است.** هرگونه ویرایش باید در Annotation ها، Struct Tag ها یا `openapi-config.yaml` اعمال شده و مجدداً `make openapi-gen` اجرا شود.
- مستندات OpenAPI به صورت خودکار از روی کد استخراج می‌شوند تا تضمین شود مستندات با رفتار واقعی سیستم ۱۰۰٪ همگام هستند.

---

## ۱۷. فلسفه Token-Based Registry

به منظور قطع وابستگی کلاینت‌ها به آدرس‌های اینترنتی مستقیم (URLs)، پلتفرم NONS از سیستم **توزیع مبتنی بر توکن (Token-Based)** استفاده می‌کند.

کلاینت درخواست خود را با یک توکن معنایی (Semantic Token) نظیر `users.getProfile` ارسال کرده و سیستم رجیستری آن را به آدرس اندپوینت واقعی متصل می‌کند.

**مزایا:**
- **تغییر منعطف آدرس‌ها:** اگر مسیر اندپوینتی از `/v1/users` به `/v2/profile` تغییر یابد، کدهای فرانت‌اند بدون تغییر باقی می‌مانند — صرفاً فایل رجیستری بروز می‌شود.
- **کنترل متمرکز سیاست‌ها:** سیاست‌هایی مانند Timeout، Retry و Caching مستقیماً در قرارداد ثبت شده و توسط `nons generate` بر روی مصنوعات تولیدشده اعمال می‌شوند.

---

## ۱۸. چک‌لیست پیاده‌سازی برای سرویس جدید

برای هر سرویس Go جدید، مراحل زیر را دنبال کنید:

- [ ] فایل `openapi-config.yaml` ایجاد شده (بر اساس الگوی user-service — Adapter، tag_rules، schemas)
- [ ] تمام Handler ها Annotation‌های `@route`, `@summary`, `@description` دارند
- [ ] هر Handler دارای `@security` (Public یا نام Scheme) است
- [ ] هر Handler دارای کامل‌ترین `@x-nons.*` است (token, service, visibility, timeout, retry)
- [ ] هر request schema با `@request` مشخص شده (و در صورت نیاز `@accepts` برای فرم‌محورها)
- [ ] تمام response codes با `@response` تعریف شده‌اند (شامل ۴۰۰، ۴۰۱، ۵۰۰)
- [ ] فایل `internal/handler/models.go` با Struct Tag های صحیح موجود است
- [ ] Schemaهای مشترک (`ErrorResponse` و…) در بخش `schemas` کانفیگ تعریف شده‌اند
- [ ] `Makefile` دارای target های `openapi-gen` و `openapi-val` است (فراخوان `nons-openapi`)
- [ ] `nons-openapi generate` بدون خطا اجرا می‌شود
- [ ] `nons-openapi validate` بدون خطا اجرا می‌شود

---

## مستندات مرتبط

| سند | توضیح |
|-----|--------|
| [API Design Guidelines](./api-design-guidelines) | استاندارد طراحی API |
| [ADR-Platform-004](../ADR/ADR-Platform-004) | استراتژی مدیریت Registry و تولید مصنوعات |
| [ساختار مخزن](../standards/repository-structure) | مسیر فایل‌ها در هر سرویس |
| [user-service](../../backend/services/user-service) | پیاده‌سازی مرجع (Reference Implementation) |
| [`github.com/NonsCore/openapi`](https://github.com/NonsCore/openapi) | مخزن ابزار `nons-openapi` (Adapterها، CHANGELOG، Releases) |
