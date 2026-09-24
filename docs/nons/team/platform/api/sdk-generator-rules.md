---
title: SDK Generator Rules
description: قوانین رسمی جنریتور nons CLI برای تولید SDK از OpenAPI
version: v1.0.0
category: Platform
author: Platform Engineering
date: 2026-07-03
---

# قوانین رسمی جنریتور SDK

> این سند **تنها منبع اصلی (Single Source of Truth)** برای پیاده‌سازی و توسعه جنریتور SDK در پروژه `cli/` است.
> تمام تغییرات آینده در منطق جنریتور **باید** با قوانین این سند انطباق داشته باشند.
> نقض هر یک از قوانین اجباری این سند موجب رد PR در CI می‌شود.

---

## ۱. مقدمه

جنریتور SDK پلتفرم NONS یک ابزار دو مرحله‌ای است که از فایل `openapi.yaml` هر سرویس، کد TypeScript آماده مصرف تولید می‌کند. این جنریتور در دایرکتوری `cli/` پیاده‌سازی شده و به عنوان باینری `nons` کامپایل می‌شود.

در طول یک Audit جامع تولیدی (2026-07-03)، چندین نقص بنیادی کشف شد که منجر به تولید SDK **غیرقابل کامپایل** می‌شد:

- **۴ تابع `getAuth()` تکراری** در یک فایل
- **۴ تابع `submit()` تکراری** در یک فایل
- **کلمه کلیدی رزرو شده** `protected` به عنوان نام تابع
- **بدنه درخواست‌ها** به دلیل نادیده گرفتن `form-urlencoded` همیشه `null`

این سند هم ریشه این مشکلات را مستند می‌کند و هم قوانین الزامی برای جلوگیری از تکرار آن‌ها را تعریف می‌نماید.

---

## ۲. معماری پایپلاین

```
service/docs/openapi.yaml
              │
              │  nons registry build --source <path>
              ▼
 cli/internal/registry/builder.go
              │  (OpenAPI → Manifest)
              ▼
.nons/registry/<service>/manifest.json
              │
              │  nons generate
              ▼
 cli/internal/generator/typescript/typescript.go
              │  (Manifest → TypeScript)
              ▼
.nons/generated/
  ├── types/<service>.ts          ← TypeScript interfaces
  ├── api-client/<service>.ts     ← HTTP client functions
  └── hooks/use<Service>.ts       ← React hooks
```

### مسئولیت هر مرحله

| مرحله | فایل | ورودی | خروجی |
|-------|------|-------|-------|
| Registry Builder | `registry/builder.go` | `openapi.yaml` | `manifest.json` |
| TS Generator | `generator/typescript/typescript.go` | `manifest.json` | `*.ts` |
| Manifest Schema | `manifest/manifest.go` | — | تعریف ساختار داده |

---

## ۳. قوانین اجباری

### قانون SDK-001 — نام‌گذاری تابع از `operationId` (بحرانی)

**شناسه:** SDK-001  
**شدت:** بحرانی — نقض این قانون SDK را غیرقابل کامپایل می‌کند  
**فایل مرتبط:** `cli/internal/generator/typescript/typescript.go`

#### ❌ پیاده‌سازی اشتباه (قبلی)

```go
// BUG: استفاده از آخرین بخش token به عنوان نام تابع
func getFunctionName(token string, service string) string {
    parts := strings.Split(token, ".")
    action := parts[len(parts)-1]   // auth.login.get → "get" → "getAuth"
    ...                              // auth.register.get → "get" → "getAuth" تکراری!
}
```

نتیجه اشتباه:

```typescript
export async function getAuth(): Promise<FlowResponseJSON> { /* /v1/auth/login */ }
export async function getAuth(): Promise<FlowResponseJSON> { /* /v1/auth/register */ }  // ❌ تکراری
export async function getAuth(): Promise<any>              { /* /v1/auth/settings */ }  // ❌ تکراری
```

#### ✅ پیاده‌سازی صحیح

نام تابع **باید** از فیلد `OperationID` که در manifest ذخیره شده، مشتق شود:

```go
// CORRECT: استفاده از operationId یکتا
func getFunctionName(op manifest.Operation) string {
    if op.OperationID != "" {
        return lowerCamelCase(op.OperationID)
    }
    return sanitizeFunctionName(op.Token)
}
```

نتیجه صحیح:

```typescript
export async function getLoginFlow(): Promise<FlowResponseJSON> { }    // ✅ یکتا
export async function getRegisterFlow(): Promise<FlowResponseJSON> { } // ✅ یکتا
export async function getSettingsFlow(): Promise<any> { }              // ✅ یکتا
```

---

### قانون SDK-002 — بلاک‌لیست کلمات کلیدی TypeScript (بحرانی)

**شناسه:** SDK-002  
**شدت:** بحرانی — نام تابع رزرو شده منجر به SyntaxError می‌شود

#### ❌ خروجی اشتباه (قبلی)

```typescript
export async function protected(): Promise<any> { }  // ❌ SyntaxError
```

#### ✅ پیاده‌سازی صحیح

```go
var tsReservedKeywords = map[string]bool{
    "break": true, "case": true, "catch": true, "class": true, "const": true,
    "continue": true, "delete": true, "do": true, "else": true, "export": true,
    "extends": true, "finally": true, "for": true, "function": true, "if": true,
    "import": true, "in": true, "instanceof": true, "let": true, "new": true,
    "null": true, "return": true, "static": true, "super": true, "switch": true,
    "this": true, "throw": true, "try": true, "typeof": true, "var": true,
    "void": true, "while": true, "yield": true,
    // TypeScript
    "abstract": true, "any": true, "async": true, "await": true, "enum": true,
    "implements": true, "interface": true, "module": true, "namespace": true,
    "package": true, "private": true, "protected": true, "public": true,
    "readonly": true, "type": true, "undefined": true,
}

func safeFunctionName(name string) string {
    if tsReservedKeywords[name] {
        return name + "Op"
    }
    return name
}
```

---

### قانون SDK-003 — حفظ `operationId` در Manifest (بحرانی)

**شناسه:** SDK-003  
**شدت:** بحرانی — پیش‌نیاز قانون SDK-001

#### ❌ ساختار ناقص (قبلی)

```go
type Operation struct {
    Method   string  `json:"method"`
    Path     string  `json:"path"`
    // ← OperationID وجود ندارد!
}
```

#### ✅ ساختار صحیح

```go
type Operation struct {
    Method      string       `json:"method"`
    Path        string       `json:"path"`
    OperationID string       `json:"operation_id"`  // ← اضافه شد
    Request     *string      `json:"request"`
    Response    *string      `json:"response"`
    Auth        bool         `json:"auth"`
    Timeout     int          `json:"timeout"`
    Retry       int          `json:"retry"`
    Cache       *CacheConfig `json:"cache,omitempty"`
}
```

و در builder:

```go
operations[token] = manifest.Operation{
    Method:      method,
    Path:        pathStr,
    OperationID: op.OperationID,  // ← از OpenAPI کپی می‌شود
    ...
}
```

---

### قانون SDK-004 — پشتیبانی از `application/x-www-form-urlencoded` (بالا)

**شناسه:** SDK-004  
**شدت:** بالا — عدم رعایت منجر به ارسال body خالی و خطای ۴۰۰ در runtime

#### ❌ پیاده‌سازی ناقص (قبلی)

```go
// فقط application/json خوانده می‌شود — form-urlencoded نادیده گرفته می‌شود
content := op.RequestBody.Value.Content.Get("application/json")
```

#### ✅ پیاده‌سازی صحیح (با fallback)

```go
var reqSchemaName *string
var reqContentType string

if op.RequestBody != nil && op.RequestBody.Value != nil {
    content := op.RequestBody.Value.Content.Get("application/json")
    if content != nil && content.Schema != nil && content.Schema.Ref != "" {
        name := refToName(content.Schema.Ref)
        reqSchemaName = &name
        reqContentType = "application/json"
    } else {
        content = op.RequestBody.Value.Content.Get("application/x-www-form-urlencoded")
        if content != nil && content.Schema != nil && content.Schema.Ref != "" {
            name := refToName(content.Schema.Ref)
            reqSchemaName = &name
            reqContentType = "application/x-www-form-urlencoded"
        }
    }
}
```

و در generator، بر اساس `ContentType`:

```typescript
// form-urlencoded:
const formData = new URLSearchParams(Object.entries(data).map(([k, v]) => [k, String(v)]));
body: formData.toString()  +  'Content-Type': 'application/x-www-form-urlencoded'

// json:
body: JSON.stringify(data)  +  'Content-Type': 'application/json'
```

---

### قانون SDK-005 — Quote کردن نام‌های Property غیر-Identifier (متوسط)

**شناسه:** SDK-005  
**شدت:** متوسط — منجر به SyntaxError در TypeScript

#### ❌ خروجی اشتباه

```typescript
export interface RegisterSubmitRequest {
    traits.email: string;  // ❌ SyntaxError — dot در نام property
}
```

#### ✅ خروجی صحیح

```typescript
export interface RegisterSubmitRequest {
    'traits.email': string;  // ✅ با single quote
}
```

#### قانون تشخیص

یک property key نیاز به quote دارد اگر:
- شامل `.` یا `-` یا فضای خالی باشد
- با عدد شروع شود
- کلمه کلیدی JavaScript باشد

---

### قانون SDK-006 — جلوگیری از Variable Shadowing در Hooks (متوسط)

**شناسه:** SDK-006  
**شدت:** متوسط — منجر به خطای runtime که در کامپایل مشخص نمی‌شود

#### ❌ خروجی اشتباه

```typescript
export function useError() {
    const [error, setError] = useState<any>(null);  // state var "error"
    const res = await error();   // ❌ فراخوانی state variable، نه API function
```

#### ✅ خروجی صحیح

```typescript
export function useError() {
    const [fetchError, setFetchError] = useState<any>(null);  // renamed
    const res = await error();   // ✅ صحیح
```

**قانون:** اگر نام state variable با نام یک API function import شده یکسان باشد، پیشوند `fetch` اضافه شود.

---

### قانون SDK-007 — کنترل `useEffect` auto-execute (پایین)

**شناسه:** SDK-007  
**شدت:** پایین — منجر به side effect غیرمنتظره

**قانون:** فقط endpoint‌های GET که side-effect مخرب ندارند می‌توانند auto-execute داشته باشند. عملیات‌هایی که token آن‌ها شامل `logout`، `revoke`، `delete`، `remove` است نباید auto-execute داشته باشند.

---

### قانون SDK-008 — `operationId` اجباری و یکتا در OpenAPI (بحرانی)

**شناسه:** SDK-008  
**شدت:** بحرانی — builder باید این را enforce کند

```go
// builder.go — اعتبارسنجی یکتایی operationId
seen := make(map[string]string)
for token, op := range operations {
    if op.OperationID == "" {
        return nil, fmt.Errorf("operation %s (at %s %s) missing operationId in OpenAPI",
            token, op.Method, op.Path)
    }
    if existing, found := seen[op.OperationID]; found {
        return nil, fmt.Errorf("duplicate operationId %q: tokens %s and %s",
            op.OperationID, existing, token)
    }
    seen[op.OperationID] = token
}
```

---

## ۴. چک‌لیست CI

```bash
# ۱. ساخت CLI
cd cli && go build ./... && go test -race ./internal/...

# ۲. تولید SDK از OpenAPI سرویس
nons registry build --source ../nons-api/services/auth-service/docs/openapi.yaml auth
nons generate

# ۳. بررسی duplicate exports
grep -o "export async function [a-zA-Z]*" .nons/generated/api-client/*.ts \
    | sort | uniq -d | grep . && echo "FAIL: duplicate exports" || echo "OK"

# ۴. بررسی reserved keywords
grep -E "function (protected|private|public|class)\b" .nons/generated/api-client/*.ts \
    && echo "FAIL: reserved keyword" || echo "OK"

# ۵. بررسی property با dot بدون quote
grep -E "^\s+[a-z]+\.[a-z]+:" .nons/generated/types/*.ts \
    && echo "FAIL: unquoted dot-key" || echo "OK"

# ۶. TypeScript compile
npx tsc --noEmit --strict --esModuleInterop .nons/generated/**/*.ts && echo "OK" || echo "FAIL"
```

---

## ۵. وضعیت اصلاحات

| شناسه | توضیح | وضعیت |
|--------|--------|--------|
| SDK-001 | نام تابع از token آخر | ✅ رفع شد v1.1.0 |
| SDK-002 | کلمه کلیدی رزرو شده | ✅ رفع شد v1.1.0 |
| SDK-003 | `operationId` در manifest نیست | ✅ رفع شد v1.1.0 |
| SDK-004 | form-urlencoded body نادیده گرفته می‌شود | ✅ رفع شد v1.1.0 |
| SDK-005 | نام property با dot | ✅ رفع شد v1.1.0 |
| SDK-006 | Variable shadowing در hooks | ✅ رفع شد v1.1.0 |
| SDK-007 | Auto-execute روی عملیات مخرب | ✅ رفع شد v1.1.0 |
| SDK-008 | یکتایی operationId enforce نمی‌شود | ✅ رفع شد v1.1.0 |

---

## ۶. مستندات مرتبط

- [OpenAPI Guidelines](./openapi-guidelines.md) — قوانین نوشتن `openapi.yaml` در سرویس‌های Go
- [API Design Guidelines](./api-design-guidelines.md) — اصول طراحی REST API
