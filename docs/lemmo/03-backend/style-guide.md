| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Backend Style Guide & Engineering Standards |
| **Title (FA)** | راهنمای استایل و استانداردهای مهندسی بک‌اند |
| **ID** | DOC-BE-004 |
| **Category** | `backend` |
| **Status** | `Approved` |
| **Owner** | Backend & Platform Team |
| **Last Updated** | 2026-09-26 |
| **Summary (EN)** | Authoritative Go source formatting, golangci-lint, package layout, error envelope, protobuf, and migration rules. |
| **Summary (FA)** | استانداردهای الزامی فرمت Go، تنظیمات golangci-lint، ساختار پکیج‌ها، پروتوباف و مایگریشن‌ها. |
| **Tags** | `backend`, `go`, `styleguide`, `lint`, `proto`, `migrations` |

---

# Backend Style Guide (`api/`) — Engineering Standards

> ⚠️ **وضعیت پیاده‌سازی در کد (`api/`):**  
> وضعیت استانداردهای این سند `Approved` است؛ اما در حال حاضر در ریپازیتوری کدهای `api/` هیچ کد Go یا کاتالوگ خطایی نوشته نشده است (در حال حاضر ۰ سرویس فعال در مخزن وجود دارد). این سند به عنوان استایل‌گاید حاکمیتی قطعی، در زمان آغاز کدنویسی در گام ۰ نقشه راه اعمال خواهد شد. استانداردهای تکمیلی کاتالوگ خطاها و ابزار اسکافولد رسماً در [ADR-007](../01-architecture/decisions/ADR-007-backend-contracts-and-tooling-standards.md) مصوب و قفل شده‌اند.

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
For services in `api/`:
- `/cmd` — One subdirectory per binary (e.g. `/cmd/service-name`); keep `main.go` thin, wiring and bootstrap only.
- `/internal` — Private application and library code; the Go compiler enforces the import boundary.
- `/pkg` — Code that is explicitly safe/intended for external modules to import (use sparingly).
- `/api` — OpenAPI/Swagger specs, JSON schema files, or protocol definition files (`.proto` sources).
- `/migrations` — Database migration SQL files (see §6).
- `/configs` — Configuration file templates or default configs.
- `/build`, `/deployments` — Packaging and deployment manifests (Dockerfiles, CI, k8s manifests).
- `/scripts` — Build, install, and analysis scripts.
- `/test` — Extra external integration test apps and test data.

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

> **Scaffolding Tooling (Ratified — [ADR-007](../../01-architecture/decisions/ADR-007-backend-contracts-and-tooling-standards.md) & [ADR-008](../../01-architecture/decisions/ADR-008-internal-tooling-and-versioning-governance.md)):**  
> Automated generation of this directory layout, `service.md`, migration pairs, and Dockerfile is handled by the canonical Go CLI in `tools/lemmo-cli` (`go run ./tools/lemmo-cli service <name>`).

---

## 4. Error Envelope: `google.rpc.Status` (AIP-193) & RFC 7807

> ✅ **تصمیم مصوب معماری: رجیستری متمرکز کدهای خطا ([ADR-007](../../01-architecture/decisions/ADR-007-backend-contracts-and-tooling-standards.md)):**  
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
3. **REST Boundary Translation (RFC 7807):**
   - At REST gateways, `google.rpc.Status` translates into an RFC-7807 Problem Details JSON format while **strictly preserving `ErrorInfo.reason`** in `details`:

```json
{
  "type": "https://errors.lemmo.net/INVALID_ARGUMENT",
  "title": "Invalid argument",
  "status": 400,
  "detail": "Field 'email' must be a valid email address",
  "code": "INVALID_ARGUMENT",
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

## 8. Summary of Engineering Standards

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

