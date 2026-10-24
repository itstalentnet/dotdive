---
slug: "backend-style-guide"
---

| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Backend Style Guide & Engineering Standards |
| **Title (FA)** | راهنمای استایل و استانداردهای مهندسی بک‌اند |
| **ID** | DOC-BE-004 |
| **Category** | `backend` |
| **Status** | `Approved` |
| **Owner** | Backend & Platform Team |
| **Last Updated** | 2026-10-06 |
| **Summary (EN)** | Authoritative Go source formatting, golangci-lint, package layout, error envelope, protobuf, migration rules, and Zero-Trust secure system design invariants per DOC-ARCH-011. |
| **Summary (FA)** | استانداردهای الزامی فرمت Go، تنظیمات golangci-lint، ساختار پکیج‌ها، پروتوباف، مایگریشن‌ها و اصول تغییرناپذیر سیستم‌دیزاین امنیتی و کدنویسی بدون‌اعتماد بر اساس DOC-ARCH-011. |
| **Tags** | `backend`, `go`, `styleguide`, `lint`, `proto`, `migrations`, `security`, `zero-trust` |

---

# Backend Style Guide (`api/`) — Engineering Standards

> ℹ️ **یادداشت سابقه تاریخی و وضعیت استقرار (`api/`):**  
> یادداشت اولیه این سند مربوط به زمان طراحی اولیه (۲۰۲۶-۱۰-۰۶) بود که اعلام می‌کرد کدهای Go وجود ندارد. با پیشرفت توسعه، مخزن `api/` اکنون شامل سرویس‌ها، قراردادهای proto و پکیج‌های core است. این سند استایل‌گاید مرجع و الزام‌آور کلیه سرویس‌ها و پکیج‌های بک‌اند محسوب می‌شود. استانداردهای تکمیلی کاتالوگ متمرکز خطا و ابزار اسکافولدینگ (`tools/errgen`) رسماً در [ADR-007](../01-architecture/decisions/ADR-007-backend-contracts-and-tooling-standards.md) مصوب و قفل شده‌اند.

This document defines the official Backend Style Guide for the Lemmo backend monorepo (`lemmo-api` / `api/`), built entirely from official and widely-adopted authoritative sources. Each section covers one core technology area: Go formatting & linting, project/package layout, the error envelope, Protobuf generation & management, and database migrations.

---

## 1. Go Source Formatting

### Tool: `gofmt`
`gofmt` is Go's own canonical source formatter, shipped with the toolchain. It is the baseline every other tool builds on, and there is no configuration to argue about — a file is either `gofmt`-clean or it is not.  
*Source: Go command documentation — [pkg.go.dev/cmd/gofmt](https://pkg.go.dev/cmd/gofmt)*

**Rule:** Every `.go` file committed to `api/` must be `gofmt`-formatted (`gofmt -l` in CI must return no files; `goimports` — the `gofmt` superset that also manages import grouping/removal — is recommended as the editor-on-save tool).  
*Source: `goimports` — [pkg.go.dev/golang.org/x/tools/cmd/goimports](https://pkg.go.dev/golang.org/x/tools/cmd/goimports)*

### Style Principles Beyond Formatting
For everything `gofmt` does not decide (naming, package shape, error handling idioms, comments), the Google Go Style Guide defines five ordered principles for readable Go: clarity, simplicity, concision, maintainability, and consistency with the wider codebase.  
*Source: Google Go Style Guide — [google.github.io/styleguide/go/guide](https://google.github.io/styleguide/go/guide)*

For concrete, example-driven conventions (error wrapping, interface size, nil-handling, testing patterns, concurrency), the Uber Go Style Guide is the adopted day-to-day companion to the Google guide.  
*Source: Uber Go Style Guide — [github.com/uber-go/guide](https://github.com/uber-go/guide)*

---

## 2. Linting: `golangci-lint`

`golangci-lint` is a single runner that aggregates 100+ Go linters (govet, staticcheck, errcheck, gosimple, ineffassign, misspell, gocyclo, gosec, etc.) behind one YAML configuration file, run in parallel with build-cache reuse.  
*Source: golangci-lint — [golangci-lint.run](https://golangci-lint.run) and [github.com/golangci/golangci-lint](https://github.com/golangci/golangci-lint)*

### Ratified Configuration (`.golangci.yml`)
```yaml
run:
  timeout: 5m

linters:
  enable:
    - govet
    - staticcheck
    - gosimple
    - errcheck
    - ineffassign
    - misspell
    - gocyclo
    - gosec
    - unused
    - bodyclose
    - sqlclosecheck

linters-settings:
  gosec:
    # Start with the default rule set (no confidence filter).
    confidence: low
  gocyclo:
    min-complexity: 15

issues:
  exclude-rules:
    - path: _test\.go
      linters:
        - gosec
        - gocyclo
```

### Rules & Invariants
- **`gosec` and `gocyclo` are both enabled:** They do not conflict and are complementary: `gosec` protects against security defects, `gocyclo` protects long-term code health by bounding complexity.
- **`gosec`:** Enable with default settings. If it produces false positives, raise `confidence` to `medium` in `linters-settings.gosec.confidence` — do **not** disable the linter or use a blanket `#nosec` to silence it project-wide. Every individual suppression must use a scoped `#nosec` comment with the reason documented inline.
- **`gocyclo`:** The default threshold is overridden. `min-complexity: 15` is the ratified baseline. Teams that want stricter, more testable code may lower it to `10`. Do not set it as low as `5`.
- **Test files (`_test.go`):** Excluded from both `gocyclo` and `gosec`, since test logic can legitimately be more complex/verbose than production code.
- **CI Rule:** `golangci-lint run` must pass with zero issues before merge; `gofmt -l` and `goimports -l` must return empty output.

---

## 3. Go Project / Package Structure

### Authoritative Baseline: Official Go Documentation
The Go team's own guidance, "Organizing a Go module," is the canonical starting point. It defines the `internal/` convention (packages that cannot be imported outside the module) and shows how a module grows from a single package, to a command with supporting internal packages, to multiple importable packages.  
*Source: [go.dev/doc/modules/layout](https://go.dev/doc/modules/layout)*

### Service Layout Standard
For services in `api/services/<name>` (ratified in [ADR-008](../01-architecture/decisions/ADR-008-internal-tooling-and-versioning-governance.md), [ADR-009](../01-architecture/decisions/ADR-009-service-owned-deployment-and-financial-ledger.md) and [ADR-024](../01-architecture/decisions/ADR-024-service-blueprint-and-conformance.md)):
- `cmd/main.go` — Single thin entrypoint responsible exclusively for configuration loading, dependency injection, and bootstrap lifecycle; no domain logic or direct transport handlers.
- `internal/` — Private application layers partitioned into `domain/` (entities), `app/` (use-cases), `ports/` (interfaces), and `adapters/` (HTTP/gRPC transport, repository implementations).
- `config/` — Versioned non-sensitive defaults in `config/default.yaml` loaded via `core/config`.
- `deploy/` — Service-owned deployment boundary with `deploy/compose.yaml` (included into root dev compose) and `deploy/config/`.
- `migrations/` — Ordered SQL migration pairs (`000001_init.up.sql` / `.down.sql`) or `.no_migration` sentinel for databaseless services.
- `tests/live/` — Read-only live runtime integration probes for `make verify-live`; temporary or test binaries inside `cmd/` are strictly banned.
- `service.md` / `service.manifest.yaml` — Service specification and machine-readable capability manifest.
- **Contract Boundary Notice:** Individual services NEVER own a local `/api` directory for `.proto` or `openapi.yaml` specs. All contracts reside exclusively in the centralized `api/contracts/` repository ([DOC-BE-003](./contracts.md)).

### Internal Architecture: Feature/Module-Based
Internal package structure for services is **modular, feature-based** rather than horizontal technical layers. Each capability owns a self-contained module under `internal/`, holding its domain logic, service layer, transport handlers, and repository code; modules communicate through explicit exported interfaces:

```text
internal/
  user/
    domain.go       # Core entities and domain rules (zero external dependencies)
    service.go      # Business application use cases
    repository.go   # Data access interfaces and implementation
    handler.go      # gRPC / HTTP transport handlers
```

> **Scaffolding Tooling (Ratified — [ADR-007](../01-architecture/decisions/ADR-007-backend-contracts-and-tooling-standards.md) & [ADR-008](../01-architecture/decisions/ADR-008-internal-tooling-and-versioning-governance.md)):**  
> Automated generation of this directory layout, `service.md`, migration pairs, and Dockerfile is handled by the canonical Go CLI in `tools/lemmo-cli` (`go run ./tools/lemmo-cli service <name>`).

---

## 4. Error Envelope: `google.rpc.Status` (AIP-193) & RFC 7807

> ✅ **تصمیم مصوب معماری: رجیستری متمرکز کدهای خطا ([ADR-007](../01-architecture/decisions/ADR-007-backend-contracts-and-tooling-standards.md)):**  
> ۱. یک رجیستری متمرکز در `contracts/platform/errors.proto` تعبیه شده و کلیه خطاهای مشترک در قالب `enum ErrorReason` تعریف می‌گردند.  
> ۲. خطاهای اختصاصی دامنه‌ای در `contracts/<domain>/v1/errors.proto` تعریف و در بیلد نهایی تجمیع می‌شوند.  
> ۳. تایپ‌های TypeScript مستقیماً در `@/sdk/errors.ts` با دستور `buf generate` تولید می‌شوند.  
> ۴. در ران‌تایم، نام رشته‌ای Enum به فیلد `reason` در `google.rpc.ErrorInfo` نگاشت می‌شود (مثلاً `"WORKSPACE_QUOTA_EXCEEDED"`).  
> ۵. **نحوه افزودن خطای جدید:** افزودن مقدار جدید به `enum ErrorReason` در فایل Proto، اجرای `buf generate` و ثبت کلید متناظر در فایل‌های محلی‌سازی فرانت‌اند.

### Protocol: Google AIP-193 Canonical Standard
For cross-service gRPC communication and external client error envelopes, Lemmo adopts Google AIP-193 (`google.rpc.Status`).  
*Sources: [google.aip.dev/193](https://google.aip.dev/193) and [cloud.google.com/apis/design/errors](https://cloud.google.com/apis/design/errors)*

### Invariants
1. **Canonical Error Structure:**
   - `code`: An integer matching `google.rpc.Code` (e.g., `INVALID_ARGUMENT = 3`, `NOT_FOUND = 5`, `PERMISSION_DENIED = 7`).
   - `message`: Developer-facing only — for logs and debugging. **Must never be shown to end users as-is.**
   - `details`: Strongly typed Protobuf `Any` payloads, specifically:
     - `google.rpc.ErrorInfo`: Holds machine-readable error reasons (`reason`, `domain`, `metadata`).
     - `google.rpc.BadRequest`: Holds granular field-level violations (`field_violations`).
2. **Localization Policy:**
   - Localization is 100% the frontend's responsibility. The server never returns localized Persian or English strings. The client maps `ErrorInfo.reason` (e.g., `WORKSPACE_QUOTA_EXCEEDED`) to the localized UI string.
3. **REST Boundary Translation (RFC 7807) & Mapping Ownership (C4 Resolution):**
   - **Ownership & Location:** The mapping between Google AIP-193 (`google.rpc.Status`) and HTTP RFC 7807 Problem Details is owned centrally by the `api/core/transport/http` package (for Go services serving HTTP/REST directly) and by the Edge Gateway translation layer (`gateway` / Kong edge plugin for external routing). Services must never implement bespoke, uncoordinated error envelopes.
   - **Canonical Contract Reference:** All HTTP error representations must strictly conform to the shared contract schema at [`contracts/openapi/shared/errors.yaml`](./contracts.md) (defining `ProblemDetails` with required fields `type`, `title`, `status`, `detail`, `code`, `reason`, `request_id`, and `help_key`).
   - **Mapping Rules & Traceability:**
     - `google.rpc.Code` maps 1:1 to standard HTTP status codes (`INVALID_ARGUMENT (3)` → `400`, `UNAUTHENTICATED (16)` → `401`, `PERMISSION_DENIED (7)` → `403`, `NOT_FOUND (5)` → `404`, `ALREADY_EXISTS (6)` → `409`, `RESOURCE_EXHAUSTED (8)` → `429`, `INTERNAL (13)` → `500`).
     - `google.rpc.ErrorInfo.reason` is promoted directly to the root `reason` field as well as preserved in `details`.
     - `request_id` is populated from the incoming W3C `traceparent` (TraceID) or generated request ID.
     - `type` is set to `https://errors.lemmo.net/<REASON>` and `help_key` provides a localized developer reference token.

```json
{
  "type": "https://errors.lemmo.net/INVALID_ARGUMENT",
  "title": "Invalid argument",
  "status": 400,
  "detail": "Field 'email' must be a valid email address",
  "code": "INVALID_ARGUMENT",
  "reason": "INVALID_EMAIL_FORMAT",
  "request_id": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
  "help_key": "err.invalid_email_format",
  "details": [
    {
      "@type": "type.googleapis.com/google.rpc.ErrorInfo",
      "reason": "INVALID_EMAIL_FORMAT",
      "domain": "api.lemmo.net"
    },
    {
      "@type": "type.googleapis.com/google.rpc.BadRequest",
      "field_violations": [
        { "field": "email", "description": "malformed email address" }
      ]
    }
  ]
}
```

<a id="error-catalog-d-11"></a><a id="41-central-error-catalog-schema--unknown-error-invariants-decision-d-11"></a>
### 4.1. Central Error Catalog Schema & Unknown Error Invariants (Decision D-11)

Per binding decision **[D-11 in MVP Decision Register](../09-governance/decision-register.md#d-11)** (2026-10-16):
Every business error reason registered across the backend services must adhere to the standardized catalog schema:

| Field | Type | Description |
| :--- | :--- | :--- |
| `reason` | `string` | Canonical UPPER_SNAKE_CASE machine reason (e.g., `BETA_CAPACITY_EXHAUSTED`). |
| `owner_service` | `string` | The authoritative domain service (e.g., `quota-service`, `agent-service`). |
| `http_status` | `int` | RFC 7807 mapped HTTP status code (e.g., `400`, `403`, `404`, `409`, `429`). |
| `grpc_code` | `string` | Google AIP-193 gRPC status (e.g., `INVALID_ARGUMENT`, `RESOURCE_EXHAUSTED`). |
| `translation_key` | `string` | Frontend client i18n lookup key (e.g., `errors.beta.capacity_exhausted`). |
| `retryable` | `bool` | Deterministic flag indicating if immediate or backoff retry is permitted. |
| `help_key` | `string` | Optional documentation anchor for UI help links (e.g., `docs.errors.quota_refill`). |

#### Unknown Error Handling Invariant:
Unhandled panics, infrastructure timeouts, or unmapped low-level database errors must **never** leak raw driver traces, SQL snippets, or broker error bodies to the caller. The gateway/service wraps them in a sanitized fail-safe response:
- `reason`: `"INTERNAL_UNEXPECTED_ERROR"`
- `http_status`: `500`
- `tracking_code`: Bound to the active `request_id` to allow support desk triage without exposing internal system topology.

#### Physical Storage & Tooling Pipeline (ADR-007 & D-11):
1. **Physical SSOT File:** The canonical centralized error catalog is physically authored and maintained in [`contracts/platform/errors.proto`](file:///home/behroz/Documents/Git/lemmo/api/contracts/platform/errors.proto) (with HTTP/OpenAPI mappings mirrored in `contracts/openapi/shared/errors.yaml`).
2. **Code Generator (`tools/errgen`):** Per [ADR-007](../01-architecture/decisions/ADR-007-backend-contracts-and-tooling-standards.md), the internal generator [`tools/errgen`](file:///home/behroz/Documents/Git/lemmo/api/tools/errgen/) parses `contracts/platform/errors.proto` to generate strongly-typed Go domain errors in `core/errors` and synchronized TypeScript definitions in `packages/ts-sdk` for frontend consumption. Neither frontend nor backend services may define ad-hoc error codes outside this pipeline.

---

## 5. Protobuf: Generation & Management via Buf

### Style: Official Protocol Buffers Style Guide
- Formatting: 80-character line wrap, 2-space indentation, double-quoted strings.
- Ordering: License header → syntax → package → sorted imports → file options → messages/services.
- Naming: `CamelCase` for messages, `snake_case` for fields, `CAPITALS_WITH_UNDERSCORES` for enum values, lowercase package names.  
*Source: [protobuf.dev/programming-guides/style](https://protobuf.dev/programming-guides/style/)*

### Tooling: Buf CLI
Buf replaces raw `protoc` shell scripts with a declarative workspace (`buf.yaml`, `buf.gen.yaml`):  
*Source: [buf.build/docs](https://buf.build/docs)*

CI Automation Workflow:
```sh
buf build
buf format -w
buf lint
buf breaking --against '.git#branch=main'
buf generate
```

### Practical Buf Rules
- RPC naming: Every RPC request/response must be explicitly named after the method: `MethodNameRequest` / `MethodNameResponse`.
- Comments: Complete sentences using `//` placed directly above declarations.
- Package versioning: Proto packages mirror directory paths and include an explicit version (`package lemmo.project.v1;`). Breaking changes mandate a new version directory (`v2`), never in-place mutation.

---

## 6. Database Migrations: `golang-migrate`

### Tool: `golang-migrate/migrate`
`golang-migrate` provides reversible, versioned SQL migrations embeddable in binaries via Go `embed`.  
*Source: [github.com/golang-migrate/migrate](https://github.com/golang-migrate/migrate)*

### Naming Convention: Sequential Zero-Padded Integers
Migrations must use sequential, 6-digit zero-padded integers (generated via `migrate create -seq -digits 6 <title>`):
```text
migrations/
  000001_init_schema.up.sql
  000001_init_schema.down.sql
  000002_add_projects_table.up.sql
  000002_add_projects_table.down.sql
```

### Invariants
- Timestamps as migration versions are **forbidden** (sequential numbers ensure monotonic ordering without merge-order ambiguity).
- **Both `up` and `down` files are mandatory** for every migration submitted in a pull request.
- Migrations run automatically via CLI or embedded `iofs.New` before the service accepts traffic.

---

## 7. Internal Tooling, Semantic Versioning & Changelogs (ADR-008)

### Organization: Centralized `tools/` Directory
All developer utilities, codegen scripts, and internal synchronization programs live exclusively under `tools/`:
- `tools/lemmo-cli/` — Canonical Go CLI for service scaffolding (`go run ./tools/lemmo-cli service <name>`).
- `tools/errgen/` — Error catalog code generator (`contracts/platform/errors.proto` → core + `@/sdk`).
- `tools/nodegen/` — Node/Port contract code generator (`contracts/lemmo/v1/node.proto` → `@/sdk`).
- `tools/sdk-release/` — Release automation for `packages/ts-sdk` (`@lemmo/sdk`).
- `tools/ci/` — CI verification, linting, and build scripts.

### Acceptance Criteria for Any Unit in `tools/`
Every subdirectory `tools/<name>/` must satisfy these mandatory requirements before merge:
1. **Independent Module Manifest:** Must contain an independent `go.mod` (or `package.json` if TS/Node).
2. **Authoritative `README.md`:** Explains purpose, exact CLI commands, flags, inputs, and outputs.
3. **Dedicated `CHANGELOG.md`:** Follows Keep a Changelog standard (see below).
4. **Independent Git Tagging:** Releases must be tagged using the multi-module prefix scheme (`tools/<name>/vX.Y.Z`).
5. **Designated Owner:** Team or lead explicitly identified in the README header.

### Versioning Policy: Semantic Versioning 2.0.0
All independent units (`core/`, each tool in `tools/`, and `packages/ts-sdk`) adhere strictly to [Semantic Versioning 2.0.0](https://semver.org/):
- **MAJOR (`X.0.0`):** Incompatible API/contract changes (Breaking Changes).
- **MINOR (`0.X.0`):** Backwards-compatible new features.
- **PATCH (`0.0.X`):** Backwards-compatible bug fixes.

#### Multi-Module Git Tag Scheme
Per official Go multi-module convention, each module is versioned via path-prefixed tags:
```text
core/v0.4.0
tools/lemmo-cli/v1.0.0
tools/errgen/v0.3.1
```

#### Frontend Package Versioning (`packages/ts-sdk`)
TypeScript bindings for frontend consumption are packaged as `@lemmo/sdk` in `packages/ts-sdk`. Frontend workspaces pin specific SemVer versions in `package.json` to prevent unintentional breakage upon backend schema changes.

### Changelog Standard: Keep a Changelog
Every versioned unit maintains a `CHANGELOG.md` adhering to [Keep a Changelog](https://keepachangelog.com/):
- **Human-Readable:** Written for human engineers, never raw uncurated git commit dumps.
- **Ordered Sections:** Dated ISO format `[X.Y.Z] - YYYY-MM-DD` and `[Unreleased]`.
- **Standard Categories:**
  - `Added` for new features.
  - `Changed` for changes in existing functionality.
  - `Deprecated` for soon-to-be removed features.
  - `Removed` for now removed features.
  - `Fixed` for any bug fixes.
  - `Security` in case of vulnerabilities.

### Conventional Commits Recommendation
To streamline automated changelog generation and SemVer bumping, commits should follow Conventional Commits (`feat:`, `fix:`, `feat!:`, `BREAKING CHANGE:`).

---

## 8. Secure System Design & Zero-Trust Architecture Standards

All Go services in `api/` must strictly implement the security invariants defined in **[DOC-ARCH-011: Zero-Trust Secure System Design & Engineering Standards](../01-architecture/secure-system-design.md)** prior to implementation:

1. **Mandatory gRPC Auth Interceptor:** Every gRPC server must register `core/middleware.UnaryServerAuthInterceptor()` and `StreamServerAuthInterceptor()`. Direct reliance on mock auth in non-test binaries is forbidden.
2. **Subject vs Caller Invariant (IDOR Prevention):** Handlers and application services must never trust a `userID` or `workspaceID` passed in the request body/URL without matching it against the authenticated `Principal` in `context.Context` (unless caller holds verified `SYSTEM_ADMIN` role).
3. **Multi-Tenant Storage Scoping:** Object keys must strictly start with `tenants/{workspaceID}/*`. Presigned URLs for read or write must verify database tenant ownership before signing. File upload sizes must be verified server-side via S3 metadata (`StatObject`), never trusting client payload claims.
4. **Webhook HMAC & SSRF Defense:** Incoming webhooks must require HMAC-SHA256 signatures with service startup Fail-Fast on missing secrets. All outbound HTTP clients fetching external URLs must use `core/security.NewSSRFSafeHTTPClient` which blocks private, loopback, and cloud metadata IP ranges.
5. **Financial Concurrency & Tenant Idempotency:** Distributed locks and idempotency keys in Redis must be workspace-scoped (`lemmo:idempotency:{workspace_id}:{operation}:{key}`) and validate request payload SHA-256 hashes. Database unique constraints must be composite (`UNIQUE(workspace_id, idempotency_key)`). Database failures after ledger reservation must trigger immediate compensating void transactions.

---

---

## 8.1. لاگ و رهگیری توزیع‌شده (Logging & Distributed Tracing — D-26 تا D-30)

معماری رهگیری و ثبت وقایع در پلتفرم لمو مطابق مصوبات معماری **D-26 تا D-30** (و وظیفه `TASK_OBS_01`) پیاده‌سازی شده است:

1. **جداسازی کامل از Core (D-28):** کتابخانه `core` فقط ناظر و ارائه‌دهنده پروتکل‌های مرزی است و هیچ میان‌افزار اجرایی (runtime middleware) برای لاگ، trace یا recovery صادر نمی‌کند. هر میکروسرویس ماژول رهگیری اختصاصی خود را در مسیر `internal/observability/` نگهداری می‌کند که توسط ابزار رسمی `lemmo-cli observability <service-name>` اسکلت‌بندی و تولید می‌شود (دارای سرآیند D-18).
2. **قرارداد رویداد لاگ (`log-event.schema.json` — D-29):** تمام لاگ‌های خروجی سرویس‌ها باید روی `stdout` با ساختار یکنواخت JSON مطابق قرارداد نسخه‌دار `contracts/platform/observability/log-event.schema.json` ثبت شوند:
   - **فیلدهای الزامی:** `ts` (فرمت RFC3339 در مبنای UTC)، `level`، `service`، `version`، `msg`، `trace_id` (هگز ۳۲ کاراکتری W3C)، `span_id` (هگز ۱۶ کاراکتری)، `request_id`.
   - **فیلدهای اختیاری هوش مصنوعی (ADR-027 §۲.۳):** `model`, `provider`, `tokens_in`, `tokens_out`, `cost`, `latency_ms`, `caller_service`.
   - **فیلدهای اکیداً ممنوع:** ثبت محتوای پرامپت خام (`prompt`, `raw_prompt`)، توکن‌های دسترسی (`token`, `api_key`)، اطلاعات احراز هویت (`authorization`)، کلیدهای محرمانه (`secret`, `password`) در لاگ مطلقاً ممنوع است و توسط هندلر قراردادی فیلتر و حذف می‌شود.
3. **انتشار W3C Trace Context (D-27 / D-30):** انتقال زنجیره رهگیری در مرزهای شبکه بر اساس استاندارد رسمی W3C `traceparent` و با استفاده از SDK رسمی OpenTelemetry (`go.opentelemetry.io/otel/propagation` و `trace`) انجام می‌گیرد:
   - گیت‌وی ورودی (Kong) و میان‌افزارهای HTTP/gRPC سرویس‌ها در صورت نبود `traceparent`، شناسه معتبر ۳۲ رقمی هگز تصادفی غیرصفر تولید کرده و آن را در هدرهای پاسخ بازتاب می‌دهند.
   - شناسه‌های ساختگی غیر W3C (نظیر پیشوندهای `tr-...` یا UUID نامعتبر) در سرتاسر مسیر اجرایی ممنوع هستند.
4. **بک‌اند رهگیری در MVP (D-27):** بک‌اند رهگیری در فاز کنونی مبتنی بر JSON روی `stdout` و فرمان جست‌وجوی تایم‌لاین `make trace TRACE_ID=<id>` در ریشه `api/` است. اتصال به Collector یا Exporter بیرونی در فاز کنونی خاموش بوده و برای پس از MVP (بسته REL-01) زمان‌بندی شده است.

---

## 9. Secure Service Blueprint & Pre-Implementation Patterns (الگوهای طلایی راه‌اندازی سرویس امن)

To completely eliminate security regressions during the development of new microservices (such as `iam-service`, `billing-service`, `notification-service`), developers must adhere strictly to these 5 standard implementation blueprints. **No custom or ad-hoc security logic is permitted.**

### Blueprint 9.1: Mandatory gRPC Server Bootstrap
Every new gRPC service in `api/services/<name>/cmd/` must wire observability, recovery, authentication and health check interceptors. Unauthenticated traffic must never reach business logic:

```go
// Standard gRPC Server Bootstrap Pattern (AIP-193, Zero-Trust & Observability D-26..D-30)
observability.InitLogger(observability.Config{
    Service: "<ServiceName>",
    Version: GitCommit,
    Level:   cfg.LogLevel,
})

s := grpcServer.NewServer(
    grpcServer.ChainUnaryInterceptor(
        observability.UnaryServerInterceptor(),
        observability.UnaryRecoveryInterceptor(),
        middleware.UnaryServerAuthInterceptor(),
    ),
    grpcServer.ChainStreamInterceptor(
        middleware.StreamServerAuthInterceptor(),
    ),
)
lemmov1.Register<ServiceName>Server(s, handler)
reflection.Register(s) // Automatically exempted in middleware.isExemptMethod
```

### Blueprint 9.2: Outgoing gRPC Client Identity Propagation
When a microservice calls another internal gRPC service, it **must never send a naked context**. The authenticated caller's identity and W3C trace context must be explicitly propagated to downstream RPCs:

```go
// In api/services/<name>/internal/adapters/clients/<target>_client.go
func (c *TargetGRPCClient) ExecuteOperation(ctx context.Context, req *lemmov1.Request) (*lemmov1.Response, error) {
    // MANDATORY: Propagate caller AuthContext and W3C TraceContext (D-27 / TASK_OBS_01)
    outCtx := middleware.PropagateAuthMetadata(ctx)
    outCtx = observability.InjectGRPCMetadata(outCtx)
    
    resp, err := c.client.ExecuteOperation(outCtx, req)
    if err != nil {
        return nil, fmt.Errorf("failed downstream call to target-service: %w", err)
    }
    return resp, nil
}
```

### Blueprint 9.3: Anti-IDOR Resource Authorization (Zero-Trust Actor Check)
Every HTTP/REST endpoint and gRPC method operating on a user-owned or workspace-owned resource must verify ownership using the authenticated `Principal` from context:

```go
// In HTTP Router or gRPC Handler
func (r *Router) authorizeResourceAccess(req *http.Request, targetOwnerID string) error {
    callerID := req.Header.Get("X-User-ID")
    if callerID == "" {
        return domain.ErrUnauthorized // 401 Unauthorized
    }

    // 1. Direct match: Principal owns the requested resource
    if callerID == targetOwnerID {
        return nil
    }

    // 2. Administrative override: Only verified roles injected by Gateway
    rolesHeader := req.Header.Get("X-User-Roles")
    for _, role := range strings.Split(rolesHeader, ",") {
        cleanRole := strings.ToLower(strings.TrimSpace(role))
        if cleanRole == "admin" || cleanRole == "system" || cleanRole == "superadmin" {
            return nil
        }
    }

    // 3. Deny cross-tenant / foreign access by default (Fail-Closed)
    return domain.ErrPermissionDenied // 403 Forbidden
}
```

### Blueprint 9.4: Multi-Tenant Boundary Enforcement (`ValidateTenant`)
Every service dealing with tenant or workspace resources must invoke `middleware.ValidateTenant`:

```go
// In gRPC Handler or Application Service
func (s *Service) HandleWorkspaceAction(ctx context.Context, requestedTenant string) error {
    // Validates that requestedTenant matches context tenant.
    // If context tenant is empty, returns codes.Unauthenticated (SEC-03).
    // If mismatch occurs, returns codes.PermissionDenied.
    tenantID, err := middleware.ValidateTenant(ctx, requestedTenant)
    if err != nil {
        return err
    }

    // Proceed with verified tenantID
    return s.repo.ExecuteInTenant(ctx, tenantID)
}
```

### Blueprint 9.5: Mandatory Security Regression Test Template
Every service handling identity, tenant, or protected resources **must include automated tests** covering the 4 canonical adversarial scenarios in its test suite:

```go
func TestService_SecurityAdversarialMatrix(t *testing.T) {
    handler := setupTestHandler()

    t.Run("Scenario 1: Authenticated caller accesses own resource (PASS)", func(t *testing.T) {
        req := httptest.NewRequest("GET", "/api/v1/resource/user-A", nil)
        req.Header.Set("X-User-ID", "user-A")
        rec := httptest.NewRecorder()
        handler.ServeHTTP(rec, req)
        assert.Equal(t, http.StatusOK, rec.Code)
    })

    t.Run("Scenario 2: Authenticated caller accesses foreign resource (DENY 403)", func(t *testing.T) {
        req := httptest.NewRequest("GET", "/api/v1/resource/user-B", nil)
        req.Header.Set("X-User-ID", "user-A")
        rec := httptest.NewRecorder()
        handler.ServeHTTP(rec, req)
        assert.Equal(t, http.StatusForbidden, rec.Code)
    })

    t.Run("Scenario 3: Unauthenticated caller accesses resource (DENY 401)", func(t *testing.T) {
        req := httptest.NewRequest("GET", "/api/v1/resource/user-A", nil)
        // No caller ID set (headers stripped at edge)
        rec := httptest.NewRecorder()
        handler.ServeHTTP(rec, req)
        assert.Equal(t, http.StatusUnauthorized, rec.Code)
    })

    t.Run("Scenario 4: Unauthorized caller attempts role spoofing (DENY 403)", func(t *testing.T) {
        req := httptest.NewRequest("GET", "/api/v1/resource/user-B", nil)
        req.Header.Set("X-User-ID", "user-A")
        req.Header.Set("X-User-Roles", "member,developer") // Non-admin spoofing
        rec := httptest.NewRecorder()
        handler.ServeHTTP(rec, req)
        assert.Equal(t, http.StatusForbidden, rec.Code)
    })
}
```

---

## 10. Pre-PR Security Checklist & Acceptance Invariants (چک‌لیست الزامی پیش از تایید PR)

Before any backend Pull Request or task is submitted for review, the developer must verify and sign off on this 7-point checklist:

- [ ] **SEC-CHK-1 (Interceptors):** `middleware.UnaryServerAuthInterceptor()` is registered on all gRPC servers.
- [ ] **SEC-CHK-2 (RPC Propagation):** All internal downstream gRPC clients wrap context with `middleware.PropagateAuthMetadata(ctx)`.
- [ ] **SEC-CHK-3 (Anti-IDOR):** No handler trusts raw request path/body identifiers without asserting `callerID == targetID` or checking administrative role.
- [ ] **SEC-CHK-4 (Tenant Boundary):** `middleware.ValidateTenant(ctx, tenantID)` is invoked on all workspace-scoped mutations.
- [ ] **SEC-CHK-5 (Fail-Fast Secrets):** All required secrets and connection strings cause immediate process abort (`os.Exit(1)`) if absent at startup per [DOC-ARCH-009](../01-architecture/decisions/ADR-009-service-owned-deployment-and-financial-ledger.md).
- [ ] **SEC-CHK-6 (Composite Idempotency):** Database unique constraints for idempotent operations are scoped to tenant `(workspace_id, idempotency_key)`.
- [ ] **SEC-CHK-7 (Adversarial Tests):** Unit test suite includes regression tests verifying HTTP 401 on unauthenticated calls, HTTP 403 on foreign resource access, and rejection of spoofed headers.

---

## 11. Summary of Engineering Standards

| Area | Mandated Standard | Enforcement Mechanism |
| :--- | :--- | :--- |
| **Formatting** | `gofmt` & `goimports` | CI gate (`gofmt -l` must be empty) |
| **Go Style** | Google Go Style Guide + Uber Go Style Guide | Code review & PR checklist |
| **Linting** | `golangci-lint` (govet, staticcheck, errcheck, gosec, gocyclo min 15) | CI check (`golangci-lint run`) |
| **Layout** | Modular feature-based layout under `internal/<domain>/` | Architecture boundary review |
| **Tooling** | Centralized `tools/<name>/` with independent `go.mod`, README, CHANGELOG | PR gate & tool checklist |
| **Versioning** | Semantic Versioning 2.0.0 with path-prefixed Git tags | Tagging CI release pipeline |
| **Changelog** | Keep a Changelog format with human-curated sections | PR review requirement |
| **Error Handling** | `google.rpc.Status` (AIP-193) + RFC 7807 at REST boundary | Central error middleware & SDK generation |
| **Proto & RPC** | Google Protobuf Style + Buf CLI | CI gates (`buf lint`, `buf breaking`) |
| **Migrations** | `golang-migrate` with sequential 6-digit numbers (`up`/`down` pairs) | Migration lint and CI test runs |
| **Security & Zero-Trust** | Pre-coding invariants per [DOC-ARCH-011](../01-architecture/secure-system-design.md) & Blueprints in Sec 9 | Security test suite & Architecture PR Gate (Sec 10) |


