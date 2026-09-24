---
layout: doc
title: 'ADR-Platform-005: معماری Generator Metadata و استراتژی Template-per-Framework'
description: Architectural Decision Record defining the three-layer metadata model for CLI generator configuration and the template-per-framework architecture for client artifact generation.
version: 1.0.0
status: APPROVED
author: Platform Team
owner: Platform Team
created_at: 2026-07-04
updated_at: 2026-07-04
tags:
  - ADR
  - Platform
  - CLI
  - Generator
  - Template
  - Metadata
  - SDK
reviewers:
  - Backend Team
  - Frontend Team
  - Platform Team
---

# تصمیم معماری: استراتژی Metadata جنریتور و معماری Template-per-Framework

**Architectural Decision Record — Generator Metadata Strategy & Framework Template Architecture**

> **ADR-Platform-005 — Approved (Rev. 1.0)**

---

## وضعیت (Status)

APPROVED (تایید شده)

---

## تاریخ (Date)

2026-07-04

---

## زمینه (Context)

پس از اجرای [ADR-Platform-004](./ADR-Platform-004) و تحلیل پیاده‌سازی اولیه جنریتور TypeScript در `cli/internal/generator/typescript/typescript.go`، دو ضعف معماری شناسایی شد:

۱. **وابستگی runtime/framework داخل جنریتور:** مقدار hardcoded `process.env.NEXT_PUBLIC_API_URL` در تمام فریم‌ورک‌ها استفاده می‌شد، حتی اگر پروژه مصرف‌کننده Vue یا Vite باشد.

۲. **سیاست transport جهانی و غیرقابل تنظیم:** `credentials: 'include'` بدون توجه به سرویس یا deployment بر تمام requestها اعمال می‌شد.

۳. **منطق شاخه‌ای فریم‌ورک‌ها درون یک فایل واحد:** افزودن فریم‌ورک جدید نیازمند تغییر در `typescript.go` و تمام شاخه‌های موجود بود.

این ADR تصمیمات معماری را برای رفع این ضعف‌ها به شکل پایدار و قابل‌مقیاس تثبیت می‌کند.

---

## تصمیمات مصوب (Decisions)

### ۱. مدل سه‌لایه Metadata (Three-Layer Metadata Model)

پیکربندی جنریتور از سه لایه مستقل تأمین می‌شود:

```
┌─────────────────────────────────────────────────────────────────────┐
│  لایه ۱: OpenAPI + x-nons Extensions                               │
│  مالک: بک‌اند — اطلاعات per-operation، ذاتی سرویس                 │
│                                                                     │
│  • auth: true/false            • timeout                            │
│  • content-type                • retry                              │
│  • visibility (public/private) • cache config                       │
│  • token name                  • rate-limit hints                   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ builder.go استخراج می‌کند
┌──────────────────────────────▼──────────────────────────────────────┐
│  لایه ۲: Service Manifest JSON                                      │
│  مالک: CLI — snapshot خنثی transport، سطح سرویس                   │
│                                                                     │
│  • تمام داده‌های لایه ۱ (normalizeشده)                              │
│  • auth_strategies: ["BearerJWT", "CookieSession"]                 │
│  • transport.credentials_required: true/false                       │
│  • transport.accept: "application/json"                             │
│  • base_url (از OpenAPI servers[])                                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ جنریتور می‌خواند
┌──────────────────────────────▼──────────────────────────────────────┐
│  لایه ۳: Consumer Config Overlay (.nons/config.yaml)               │
│  مالک: مصرف‌کننده — deployment-specific، framework-specific        │
│                                                                     │
│  • transport.base_url_env: NEXT_PUBLIC_API_URL                      │
│  • transport.credentials: include | omit | same-origin              │
│  • framework: react | vue | next | nuxt | angular | svelte          │
│  • output paths                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**قانون جریان یک‌طرفه:** اطلاعات فقط از لایه بالاتر به لایه پایین‌تر جریان دارد. بک‌اند هرگز نام فریم‌ورک مصرف‌کننده را نمی‌داند.

---

### ۲. تفکیک مسئولیت منبع حقیقت

| دسته پیکربندی | منبع حقیقت | دلیل |
|-------------|-----------|------|
| مسیرها و متدهای API | OpenAPI | بک‌اند مالک تعریف مسیرهاست |
| Schema درخواست/پاسخ | OpenAPI | بک‌اند مالک مدل داده است |
| نیاز به auth | OpenAPI `security` + `x-nons.visibility` | بک‌اند می‌داند کدام endpoint احراز هویت نیاز دارد |
| Content-Type هر درخواست | OpenAPI `requestBody` | بک‌اند فرمت مورد انتظار را تعریف می‌کند |
| Timeout / retry / cache | OpenAPI `x-nons` | بک‌اند اطلاعات SLA هر operation را دارد |
| Base URL تولید | OpenAPI `servers[]` | بک‌اند URL خود را می‌داند |
| **نام env var** (`NEXT_PUBLIC_API_URL`) | **config.yaml** | وابسته به فریم‌ورک — بک‌اند نمی‌تواند بداند |
| **حالت credentials** | **config.yaml** | وابسته به CORS policy deployment |
| **الگوی Hook** (useState vs ref) | **config.yaml** + template | تصمیم فریم‌ورک فرانت‌اند |
| **ساختار دایرکتوری خروجی** | **config.yaml** | قرارداد پروژه مصرف‌کننده |

---

### ۳. معماری Template-per-Framework

جنریتور از یک فایل واحد با شاخه‌بندی شرطی به معماری template-per-framework تبدیل می‌شود:

```
OpenAPI
    ↓
Manifest (language-neutral)
    ↓
Core Generator (framework-agnostic)
    ↓
RenderContext (fully computed)
    ↓
Template Renderer
    ├── react/
    ├── next/
    ├── vue/
    ├── nuxt/
    ├── angular/
    └── (future: svelte/, solid/, node/, ...)
```

---

### ۴. مرز مسئولیت Core Generator و Templates

#### Core Generator مسئول است:
- parse کردن `manifest.json`
- resolve کردن operation token → function name
- استنتاج path parameters از path strings
- طبقه‌بندی operationها: GET/non-GET، auto-execute/manual
- ساخت argument list تایپ‌دار از manifest params
- تبدیل schema types → target language types
- Reserved keyword safety enforcement
- Sort deterministic operationها
- Render کردن templates با RenderContext
- نوشتن فایل‌های خروجی
- Emit کردن هدر GENERATED

#### Templates مسئول هستند:
- Import statements (react vs vue vs angular)
- الگوی state management (useState vs ref vs signals)
- الگوی effect/lifecycle (useEffect vs watch vs ngOnInit)
- نام env var (NEXT_PUBLIC_API_URL vs VITE_API_URL)
- نام دایرکتوری خروجی (hooks/ vs composables/ vs services/)
- قرارداد نامگذاری فایل
- سیستم module (import/export)

**قانون تفکیک:** Templates فقط یک `RenderContext` از پیش‌محاسبه‌شده را render می‌کنند. Templates منطق ندارند — فقط rendering دارند.

---

### ۵. قرارداد RenderContext

RenderContext ساختار داده‌ای است که Core Generator محاسبه می‌کند و به templates می‌دهد:

```go
type RenderContext struct {
    ServiceName string
    Operations  []OperationContext
    Types       []TypeContext
    Imports     []string
    Config      TransportConfig
}

type OperationContext struct {
    FuncName       string   // computed از getFunctionName
    HookName       string   // use{FuncName}
    Method         string
    Path           string
    TemplatedPath  string   // برای template literals
    PathParams     []string
    QueryParams    []ParamInfo
    HasRequestBody bool
    RequestType    string
    ResponseType   string
    IsAuthRequired bool
    AutoExecute    bool     // computed از shouldAutoExecute
    IsFormEncoded  bool
    ContentType    string
}

type TransportConfig struct {
    Framework   string
    BaseURLEnv  string   // از config.yaml
    Credentials string   // از config.yaml یا manifest
}
```

---

### ۶. پیکربندی Transport در config.yaml

بلوک `transport` به `config.yaml` اضافه می‌شود:

```yaml
project:
  name: my-app
  framework: react    # react | vue | next | nuxt | angular | svelte | node
  version: 1.0.0

paths:
  registry: .nons/registry
  bundles: .nons/bundles
  output: .nons/generated

transport:
  base_url_env: NEXT_PUBLIC_API_URL    # نام env var فریم‌ورک
  credentials: include                  # include | omit | same-origin
  default_timeout: 10000               # ms — fallback اگر x-nons.timeout نباشد
```

**مقادیر پیش‌فرض فریم‌ورک** (اگر `transport` در config.yaml تعریف نشده باشد):

| فریم‌ورک | `base_url_env` پیش‌فرض | `credentials` پیش‌فرض |
|---------|----------------------|---------------------|
| `next` | `NEXT_PUBLIC_API_URL` | `include` |
| `react` | `REACT_APP_API_URL` | `omit` |
| `vue` | `VITE_API_URL` | `omit` |
| `nuxt` | `NUXT_PUBLIC_API_URL` | `include` |
| `angular` | `API_URL` | `omit` |
| `svelte` | `VITE_API_URL` | `omit` |
| `node` | `API_URL` | `omit` |

---

### ۷. شش اصل تضمینی (Six Invariants)

این اصول در تمام پیاده‌سازی‌های آینده باید رعایت شوند:

1. **Backend هیچوقت نام framework ندارد در spec.** هیچ `x-nons.framework`، هیچ `x-nons.react_*`. بک‌اند نمی‌داند چه کسی مصرف‌کننده آن است.

2. **Core Generator هیچ string خاص framework ندارد.** هیچ `"vue"`, `"react"`, `"NEXT_PUBLIC"` در `generator.go` یا کد اصلی generation. این‌ها به templates و config تعلق دارند.

3. **Templates فقط render می‌کنند — بدون business logic.** هیچ type resolution، هیچ path parsing، هیچ auth detection. Templates فقط RenderContext از پیش‌محاسبه‌شده را render می‌کنند.

4. **config.yaml همیشه optional با safe defaults است.** `nons generate` باید با حداقل config کار کند. پیش‌فرض‌های transport بر اساس `framework` از جدول بالا انتخاب می‌شوند.

5. **Manifest کاملاً language-neutral است.** هیچ فیلد TypeScript-specific در manifest. Manifest باید به یک Kotlin generator، Dart generator، و TypeScript generator به یک اندازه مفید باشد.

6. **Generator determinism یک invariant است.** خروجی identical برای manifest + config identical، همیشه. تمام عملیات روی map قبل از rendering باید sort شوند.

---

### ۸. پشتیبانی از فریم‌ورک‌های آینده

| فریم‌ورک | نوع | تغییر Core Generator؟ |
|---------|-----|----------------------|
| Svelte 5 (runes) | Frontend SPA | ❌ خیر — فقط template جدید |
| SolidJS | Frontend SPA | ❌ خیر — فقط template جدید |
| Remix | SSR | ❌ خیر — فقط template جدید |
| Astro | Static/SSR | ❌ خیر — فقط template جدید |
| React Native | Mobile | ❌ خیر — فقط template جدید |
| Node.js SDK | Server | ❌ خیر — فقط template جدید |
| Flutter (Dart) | Mobile | ⚠ نیاز به Generator جدید (نه template) |
| Android/Kotlin | Mobile | ⚠ نیاز به Generator جدید (نه template) |

برای targets غیر-TypeScript، `Generator interface` (`Generate(m *Manifest, outputDir string) error`) اکستنشن‌پوینت صحیح است.

---

### ۹. ارتباط با ADRهای قبلی

| ADR | ارتباط |
|-----|--------|
| [ADR-Platform-004](./ADR-Platform-004) | این ADR بر آن بنا شده — به جای جایگزینی، مکمل است |
| [ADR-Platform-001](./ADR-Platform-001) | Manifest language-neutral از Proto pattern پیروی می‌کند |

---

## پیامدها (Consequences)

### پیامدهای مثبت (Positive)
- **Blast radius کمتر:** افزودن فریم‌ورک جدید، کد موجود را لمس نمی‌کند
- **Ownership مستقل:** هر تیم می‌تواند template فریم‌ورک خود را مستقلاً داشته باشد
- **قابلیت تست ایزوله:** هر template با یک fixture manifest به تنهایی تست می‌شود
- **Backend-agnostic transport:** سرویس‌های مختلف deployment policy متفاوت می‌توانند داشته باشند
- **آماده‌بودن برای فریم‌ورک‌های آینده:** بدون تغییر در core generator

### پیامدهای منفی (Negative)
- **هزینه migration:** refactor کردن `typescript.go` به ساختار template نیاز به کار دارد
- **مستندسازی RenderContext:** قرارداد بین Core و Templates باید صریح و نگهداری‌شده باشد
- **پیچیدگی اولیه:** ساختار چندفایله در ابتدا پیچیده‌تر از یک فایل واحد به نظر می‌رسد

---

## منابع (References)

- [CLI-SDK-AUDIT-REPORT.md] — گزارش audit اولیه که ضعف‌های معماری را شناسایی کرد
- [ARCH-VALIDATION-REPORT.md] — گزارش validation معماری که این تصمیمات از آن استخراج شد
- [cli-reference.md](../package/cli-reference) — راهنمای کامل CLI
- [nons-ContractManagement-guide.md](../package/nons-ContractManagement-guide) — راهنمای مدیریت قرارداد
