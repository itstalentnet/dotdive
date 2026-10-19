| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | ADR-024 Rules Catalog (Service Blueprint & Conformance) |
| **Title (FA)** | کاتالوگ جامع قوانین انطباق و الگوی میکروسرویس لمو (ADR-024) |
| **ID** | DOC-ARCH-024-CATALOG |
| **Category** | `architecture` |
| **Status** | `Approved` |
| **Owner** | Core Architecture & Platform Conformance Team |
| **Last Updated** | 2026-10-19 |
| **Summary (EN)** | Canonical human-readable and machine-exportable catalog of all 50 architectural conformance rules for Lemmo microservices per ADR-024. |
| **Summary (FA)** | مرجع رسمی، انسان‌خوان و قابل استخراج ماشینی ۵۰ قاعده انطباق معماری سرویس‌های لمو مطابق با ADR-024. |
| **Tags** | `architecture`, `conformance`, `rules`, `adr-024`, `ssot` |

# کاتالوگ جامع ۵۰ قاعده الگوی میکروسرویس و ارزیابی انطباق (ADR-024 Rules Catalog)

> 🏛️ **مرجع یگانه حقیقت (SSOT — مصوب تصمیم حاکمیتی D-21 اصلاح‌شده و D-25):**  
> این سند، مرجع اصلی و انسان‌خوان کلیه ۵۰ قاعده انطباق معماری سرویس‌های لمو است. تمامی نسخه‌های ماشینی و ابزاری (از جمله `api/conformance/rules.yaml`) خروجی‌های تولیدی و دارای هدر شناسنامه D-18 این سند می‌باشند که از طریق اسکریپت `dotdive/docs/lemmo/scripts/adr024/export_catalog.py` صادر می‌گردند.

## ۱. متادیتای کاتالوگ (Catalog Metadata)

- **نسخه کاتالوگ / Version:** `7.0.0`
- **سند تصمیم / ADR:** `ADR-024`
- **تاریخ آخرین بازنگری / Last Updated:** `2026-10-18`
- **تعداد کل قواعد / Total Rules:** `50`

---

## ۲. ماتریس اجمالی قواعد (Rules Matrix Overview)

| # | شناسه | نام قاعده | دامنه | بررسی | مرحله | گیت | ابزار مجری | وضعیت منبع |
|:---:|---|---|:---:|:---:|:---:|:---:|---|:---:|
| 1 | [`SB-DIR-01`](#sb-dir-01-clean-architecture-layering-standard) | **Clean Architecture Layering Standard** | `service` | `static` | M1 | `new_service` | `lemmo-cli check` | `approved` |
| 2 | [`SB-DIR-02`](#sb-dir-02-thin-entrypoint-pattern) | **Thin Entrypoint Pattern** | `service` | `static` | M1 | `new_service` | `lemmo-cli check` | `approved` |
| 3 | [`SB-DIR-03`](#sb-dir-03-independent-go-module-isolation) | **Independent Go Module Isolation** | `service` | `static` | M1 | `ratchet` | `lemmo-cli check` | `gap` |
| 4 | [`SB-DIR-04`](#sb-dir-04-database-migrations-parity) | **Database Migrations Parity** | `service` | `static` | M1 | `ratchet` | `lemmo-cli check` | `approved` |
| 5 | [`SB-DOC-01`](#sb-doc-01-service-architectural-identity-file) | **Service Architectural Identity File** | `service` | `static` | M1 | `ratchet` | `lemmo-cli check` | `approved` |
| 6 | [`SB-MAN-01`](#sb-man-01-machine-readable-service-manifest) | **Machine-Readable Service Manifest** | `service` | `static` | M1 | `ratchet` | `lemmo-cli check` | `draft_source` |
| 7 | [`SB-CFG-01`](#sb-cfg-01-versioned-configuration-default-file) | **Versioned Configuration Default File** | `service` | `static` | M1 | `ratchet` | `lemmo-cli check` | `approved` |
| 8 | [`SB-CFG-02`](#sb-cfg-02-startup-fail-fast-validation) | **Startup Fail-Fast Validation** | `service` | `static` | M1 | `new_service` | `lemmo-cli check` | `approved` |
| 9 | [`SB-CFG-03`](#sb-cfg-03-secret-hardcoding-fallback-ban) | **Secret Hardcoding Fallback Ban** | `service` | `static` | M1 | `new_service` | `lemmo-cli check` | `approved` |
| 10 | [`SB-CFG-04`](#sb-cfg-04-network-literal-constants-ban) | **Network Literal Constants Ban** | `service` | `static` | M1 | `ratchet` | `lemmo-cli check` | `approved` |
| 11 | [`SB-DEP-01`](#sb-dep-01-service-owned-deployment-composition) | **Service-Owned Deployment Composition** | `service` | `static` | M1 | `ratchet` | `lemmo-cli check` | `approved` |
| 12 | [`SB-DEP-02`](#sb-dep-02-single-multi-stage-dockerfile) | **Single Multi-Stage Dockerfile** | `service` | `static` | M1 | `new_service` | `lemmo-cli check` | `approved` |
| 13 | [`SB-DEP-03`](#sb-dep-03-role-based-container-naming) | **Role-Based Container Naming** | `service` | `static` | M1 | `new_service` | `lemmo-cli check` | `approved` |
| 14 | [`SB-DEP-04`](#sb-dep-04-build-provenance-startup-logging) | **Build Provenance Startup Logging** | `service` | `static` | M1 | `ratchet` | `lemmo-cli check` | `approved` |
| 15 | [`SB-VER-01`](#sb-ver-01-authoritative-human-changelog) | **Authoritative Human Changelog** | `service` | `static` | M1 | `ratchet` | `lemmo-cli check` | `approved` |
| 16 | [`SB-VER-02`](#sb-ver-02-semantic-versioning-&-multi-module-git-tag) | **Semantic Versioning & Multi-Module Git Tag** | `service` | `static` | M1 | `ratchet` | `lemmo-cli check` | `draft_source` |
| 17 | [`SB-IMG-01`](#sb-img-01-version-derived-docker-image-tagging) | **Version-Derived Docker Image Tagging** | `service` | `static` | M1 | `ratchet` | `lemmo-cli check` | `draft_source` |
| 18 | [`SB-HDR-01`](#sb-hdr-01-generated-file-provenance-header) | **Generated File Provenance Header** | `service` | `static` | M1 | `ratchet` | `lemmo-cli check` | `draft_source` |
| 19 | [`SB-CTR-01`](#sb-ctr-01-protobuf-contracts-centralization-&-buf-lint) | **Protobuf Contracts Centralization & Buf Lint** | `service` | `static` | M1 | `new_service` | `lemmo-cli check` | `approved` |
| 20 | [`SB-CTR-02`](#sb-ctr-02-domain-openapi-specification-single-ownership) | **Domain OpenAPI Specification Single Ownership** | `service` | `static` | M1 | `ratchet` | `lemmo-cli check` | `approved` |
| 21 | [`SB-CTR-03`](#sb-ctr-03-openapi-operations-standards) | **OpenAPI Operations Standards** | `service` | `static` | M1 | `new_service` | `lemmo-cli check` | `approved` |
| 22 | [`SB-CTR-04`](#sb-ctr-04-openapi-breaking-changes-gate) | **OpenAPI Breaking Changes Gate** | `platform` | `static` | M1 | `ratchet` | `ci:oasdiff (proposed)` | `gap` |
| 23 | [`SB-CTR-05`](#sb-ctr-05-http-error-envelope-conformance-&-mapping-ownership) | **HTTP Error Envelope Conformance & Mapping Ownership** | `service` | `static` | M1 | `new_service` | `lemmo-cli check` | `approved` |
| 24 | [`SB-CTR-06`](#sb-ctr-06-idempotency-key-header-enforcement) | **Idempotency-Key Header Enforcement** | `service` | `static` | M1 | `ratchet` | `lemmo-cli check` | `approved` |
| 25 | [`SB-CTR-07`](#sb-ctr-07-two-way-gateway-contract-route-conformance) | **Two-Way Gateway-Contract Route Conformance** | `platform` | `static` | M1 | `ratchet` | `ci:gateway-route-conformance (proposed)` | `gap` |
| 26 | [`SB-CTR-08`](#sb-ctr-08-frontend-sdk-client-freshness-zero-diff-gate) | **Frontend SDK Client Freshness Zero-Diff Gate** | `platform` | `static` | M1 | `ratchet` | `ci:frontend-sdk-zero-diff (proposed)` | `draft_source` |
| 27 | [`SB-EVT-01`](#sb-evt-01-transactional-outbox-pattern-mandate) | **Transactional Outbox Pattern Mandate** | `service` | `static` | M1 | `ratchet` | `lemmo-cli check` | `gap` |
| 28 | [`SB-EVT-02`](#sb-evt-02-standard-eventenvelope-packing) | **Standard EventEnvelope Packing** | `service` | `static` | M1 | `new_service` | `lemmo-cli check` | `approved` |
| 29 | [`SB-EVT-03`](#sb-evt-03-traceparent-context-propagation-in-events-(f-7)) | **Traceparent Context Propagation in Events (F-7)** | `service` | `static` | M1 | `new_service` | `lemmo-cli check` | `approved` |
| 30 | [`SB-EVT-04`](#sb-evt-04-central-event-registry-registration) | **Central Event Registry Registration** | `platform` | `static` | M1 | `ratchet` | `ci:event-registry-lint (proposed)` | `approved` |
| 31 | [`SB-SEC-01`](#sb-sec-01-inbound-server-identity-&-principal-context-interceptor) | **Inbound Server Identity & Principal Context Interceptor** | `service` | `static` | M1 | `new_service` | `lemmo-cli check` | `approved` |
| 32 | [`SB-RES-01`](#sb-res-01-client-call-resilience-&-non-blocking-dial) | **Client Call Resilience & Non-Blocking Dial** | `service` | `static` | M1 | `ratchet` | `lemmo-cli check` | `draft_source` |
| 33 | [`SB-RES-02`](#sb-res-02-graceful-shutdown-protocol) | **Graceful Shutdown Protocol** | `service` | `static` | M1 | `ratchet` | `lemmo-cli check` | `draft_source` |
| 34 | [`SB-LOG-01`](#sb-log-01-standard-structured-json-logging) | **Standard Structured JSON Logging** | `service` | `static` | M1 | `new_service` | `lemmo-cli check` | `approved` |
| 35 | [`SB-LOG-02`](#sb-log-02-contextual-tracing-logging-&-pii-sanitization) | **Contextual Tracing Logging & PII Sanitization** | `service` | `static` | M1 | `ratchet` | `lemmo-cli check` | `approved` |
| 36 | [`SB-TRC-01`](#sb-trc-01-w3c-traceparent-ingress-&-egress-propagation) | **W3C Traceparent Ingress & Egress Propagation** | `service` | `static` | M1 | `new_service` | `lemmo-cli check` | `approved` |
| 37 | [`SB-ERR-01`](#sb-err-01-canonical-aip-193-error-envelope-conformance) | **Canonical AIP-193 Error Envelope Conformance** | `service` | `static` | M1 | `new_service` | `lemmo-cli check` | `approved` |
| 38 | [`SB-TST-01`](#sb-tst-01-testing-hygiene-&-makefile-targets-standard) | **Testing Hygiene & Makefile Targets Standard** | `service` | `static` | M1 | `new_service` | `lemmo-cli check` | `approved` |
| 39 | [`SB-CND-JSON`](#sb-cnd-json-dynamic-payload-json-schema-conformance) | **Dynamic Payload JSON Schema Conformance** | `service` | `static` | M2 | `new_service` | `lemmo-cli check` | `approved` |
| 40 | [`SB-CND-SSRF`](#sb-cnd-ssrf-external-outbound-ssrf-safe-http-client) | **External Outbound SSRF-Safe HTTP Client** | `service` | `static` | M2 | `new_service` | `lemmo-cli check` | `approved` |
| 41 | [`SB-CND-TENANT`](#sb-cnd-tenant-multi-tenant-object-storage-path-scoping) | **Multi-Tenant Object Storage Path Scoping** | `service` | `static` | M2 | `new_service` | `lemmo-cli check` | `approved` |
| 42 | [`SB-CND-RATE`](#sb-cnd-rate-billable-service-rate-card-integration) | **Billable Service Rate-Card Integration** | `service` | `static` | M2 | `new_service` | `lemmo-cli check` | `approved` |
| 43 | [`SB-CND-REF`](#sb-cnd-ref-static-catalog-reference-data-registry-conformance) | **Static Catalog Reference Data Registry Conformance** | `service` | `static` | M2 | `new_service` | `lemmo-cli check` | `approved` |
| 44 | [`SB-RT-01`](#sb-rt-01-live-honest-readiness-dependency-probe) | **Live Honest Readiness Dependency Probe** | `service` | `live` | M1 | `new_service` | `make verify-live` | `approved` |
| 45 | [`SB-RT-02`](#sb-rt-02-live-running-version-&-provenance-audit-probe) | **Live Running Version & Provenance Audit Probe** | `service` | `live` | M1 | `ratchet` | `make verify-live` | `gap` |
| 46 | [`SB-RT-03`](#sb-rt-03-live-traceparent-header-reflection-probe) | **Live Traceparent Header Reflection Probe** | `service` | `live` | M1 | `new_service` | `make verify-live` | `approved` |
| 47 | [`SB-RT-04`](#sb-rt-04-live-outbox-health-&-broker-connectivity-probe) | **Live Outbox Health & Broker Connectivity Probe** | `service` | `live` | M1 | `ratchet` | `make verify-live` | `gap` |
| 48 | [`SB-RT-05`](#sb-rt-05-live-aip-193-error-handling-conformance-probe) | **Live AIP-193 Error Handling Conformance Probe** | `service` | `live` | M1 | `new_service` | `make verify-live` | `approved` |
| 49 | [`SB-RT-06`](#sb-rt-06-live-anti-idor-workspace-isolation-probe) | **Live Anti-IDOR Workspace Isolation Probe** | `service` | `live` | M2 | `new_service` | `make verify-live` | `approved` |
| 50 | [`SB-RT-07`](#sb-rt-07-live-edge-gateway-route-availability-probe) | **Live Edge Gateway Route Availability Probe** | `platform` | `live` | M5 | `new_service` | `ci:edge-gateway-probe (proposed)` | `approved` |

---

## ۳. مشخصات تفصیلی قواعد (Rules Specifications)

### SB-DIR-01: Clean Architecture Layering Standard

- **ID:** `SB-DIR-01`
- **Name:** Clean Architecture Layering Standard
- **Requirement:** وجود پوشه‌های مجزای internal/domain (موجودیت‌های ناب دامنه)، internal/app (یوزکیس‌ها و سرویس‌های کاربردی)، internal/ports (اینترفیس‌های ورودی و خروجی) و internal/adapters (پیاده‌سازی آداپتورهای HTTP، gRPC و پایگاه داده).
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `filesystem`
- **Roadmap Stage:** `1`
- **Gate:** `new_service`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-007-backend-contracts-and-tooling-standards.md §۳, dotdive/docs/lemmo/03-backend/style-guide.md §3

### SB-DIR-02: Thin Entrypoint Pattern

- **ID:** `SB-DIR-02`
- **Name:** Thin Entrypoint Pattern
- **Requirement:** وجود فایل تک‌منظوره cmd/main.go صرفاً جهت سیم‌کشی وابستگی‌ها و فراخوانی لایف‌سایکل بوت‌استرپ مشترک؛ منع پیاده‌سازی لاجیک بیزینسی، هندلرهای مستقیم یا محاسبات دامنه در این فایل.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `ast`
- **Roadmap Stage:** `1`
- **Gate:** `new_service`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/03-backend/style-guide.md §3

### SB-DIR-03: Independent Go Module Isolation

- **ID:** `SB-DIR-03`
- **Name:** Independent Go Module Isolation
- **Requirement:** وجود فایل معتبر go.mod در ریشه سرویس با ماژول مستقل و پیشوند رسمی github.com/lemmo-lab/api/services/<name> بدون وابستگی مستقیم به کدهای داخلی سایر سرویس‌ها.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `filesystem`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `gap`
- **Doc Ref:** dotdive/docs/lemmo/03-backend/architecture.md §۱, dotdive/docs/lemmo/03-backend/style-guide.md §3

### SB-DIR-04: Database Migrations Parity

- **ID:** `SB-DIR-04`
- **Name:** Database Migrations Parity
- **Requirement:** وجود پوشه migrations/ حاوی فایل‌های مهاجرت با نام‌گذاری ترتیبی صفرپرشده عددی ۶رقمی زوج (up.sql و down.sql) یا وجود نشانگر صریح migrations/.no_migration در غیاب دیتابیس.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `manifest.storage.postgres == true`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `filesystem`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-007-backend-contracts-and-tooling-standards.md §۳, dotdive/docs/lemmo/03-backend/style-guide.md §6

### SB-DOC-01: Service Architectural Identity File

- **ID:** `SB-DOC-01`
- **Name:** Service Architectural Identity File
- **Requirement:** وجود فایل service.md در ریشه سرویس جهت شرح معماری، اهداف، مسئولیت‌های دامنه و مرزها؛ متادیتای فنی ماشین‌خوان منحصراً از مانیفست سرویس استخراج می‌شود.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service, packaged-engine, planned-stub]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `frontmatter_parse`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-007-backend-contracts-and-tooling-standards.md §۳, dotdive/docs/lemmo/03-backend/services.md

### SB-MAN-01: Machine-Readable Service Manifest

- **ID:** `SB-MAN-01`
- **Name:** Machine-Readable Service Manifest
- **Requirement:** وجود فایل مانیفست معتبر service.manifest.yaml در ریشه سرویس منطبق بر اسکیمای استاندارد مانیفست به عنوان مرجع حقیقت (SSOT) متادیتای ماشینی سرویس و برقراری انطباق چهارجانبه.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service, packaged-engine, planned-stub]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `json_schema`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `draft_source`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-024-service-blueprint-and-conformance.md §۳

### SB-CFG-01: Versioned Configuration Default File

- **ID:** `SB-CFG-01`
- **Name:** Versioned Configuration Default File
- **Requirement:** وجود فایل config/default.yaml در ریشه سرویس برای نگه‌داری پیش‌فرض‌های غیرحساس و تغییرپذیر و بارگذاری انحصاری کانفیگ از طریق پکیج متمرکز core/config.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `filesystem`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/configuration-and-secrets.md §۱.۲

### SB-CFG-02: Startup Fail-Fast Validation

- **ID:** `SB-CFG-02`
- **Name:** Startup Fail-Fast Validation
- **Requirement:** پیاده‌سازی اینترفیس config.Validator بر روی ساختار پیکربندی سرویس جهت توقف فوری فرآیند استارت سرویس با ثبت لاگ ساختاریافته خطا و کد خروج ۱ در صورت کانفیگ نامعتبر.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `ast`
- **Roadmap Stage:** `1`
- **Gate:** `new_service`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/configuration-and-secrets.md §۲

### SB-CFG-03: Secret Hardcoding Fallback Ban

- **ID:** `SB-CFG-03`
- **Name:** Secret Hardcoding Fallback Ban
- **Requirement:** ممنوعیت مطلق قرار دادن مقادیر پیش‌فرض یا fallback در سورس‌کد برای سکرت‌های حساس (رمز دیتابیس، کلید S3، توکن JWT و API Keyها) و الزام توقف فوری سرویس در غیاب آن‌ها.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `ast`
- **Roadmap Stage:** `1`
- **Gate:** `new_service`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/configuration-and-secrets.md §۲, dotdive/docs/lemmo/01-architecture/configuration-and-secrets.md §۳

### SB-CFG-04: Network Literal Constants Ban

- **ID:** `SB-CFG-04`
- **Name:** Network Literal Constants Ban
- **Requirement:** ممنوعیت استفاده از پورت‌ها یا آدرس‌های هاست هاردکدشده لیترال در فراخوانی‌های Listen و Dial در سورس‌کد؛ مقادیر متغیر محیطی باید از ساختار تایپ‌شده کانفیگ خوانده شوند.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `partial`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `ast_and_manual_review`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/configuration-and-secrets.md §۳, dotdive/docs/lemmo/01-architecture/decisions/ADR-009-service-owned-deployment-and-financial-ledger.md §۲.۴

### SB-DEP-01: Service-Owned Deployment Composition

- **ID:** `SB-DEP-01`
- **Name:** Service-Owned Deployment Composition
- **Requirement:** وجود مانیفست deploy/compose.yaml و پوشه تنظیمات deploy/config/ در ریشه سرویس جهت ادغام اختصاصی در کامپوز ریشه پروژه از طریق دستور بومی include:.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service, packaged-engine]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `filesystem`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-009-service-owned-deployment-and-financial-ledger.md §۲.۱, dotdive/docs/lemmo/07-devops/docker-spec.md §۳.۳

### SB-DEP-02: Single Multi-Stage Dockerfile

- **ID:** `SB-DEP-02`
- **Name:** Single Multi-Stage Dockerfile
- **Requirement:** وجود دقیقاً یک فایل با نام Dockerfile در ریشه سرویس بر پایه الگوی چندمرحله‌ای (Multi-Stage) جهت تضمین ایمیج نهایی مینیمال و امن؛ منع داکرفایلهای موازی مانند dev.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `filesystem`
- **Roadmap Stage:** `1`
- **Gate:** `new_service`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/07-devops/docker-spec.md §۴

### SB-DEP-03: Role-Based Container Naming

- **ID:** `SB-DEP-03`
- **Name:** Role-Based Container Naming
- **Requirement:** تنظیم صریح container_name با الگوی الزامی lemmo-svc-<name> در deploy/compose.yaml؛ ممنوعیت کاربرد نام ابزارها، برندهای ثالث یا نام‌های تجاری در نام کانتینر.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service, packaged-engine]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `compose_lint`
- **Roadmap Stage:** `1`
- **Gate:** `new_service`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-009-service-owned-deployment-and-financial-ledger.md §۲.۳, dotdive/docs/lemmo/07-devops/docker-spec.md §۳.۲

### SB-DEP-04: Build Provenance Startup Logging

- **ID:** `SB-DEP-04`
- **Name:** Build Provenance Startup Logging
- **Requirement:** تزریق آرگومان‌های ARG GIT_COMMIT و ARG BUILD_TIME در زمان بیلد داکر و ثبت الزامی شناسه کامیت و زمان بیلد در اولین خط لاگ خروجی استارت سرویس در main.go.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `content_match`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/07-devops/docker-spec.md §۴

### SB-VER-01: Authoritative Human Changelog

- **ID:** `SB-VER-01`
- **Name:** Authoritative Human Changelog
- **Requirement:** وجود فایل CHANGELOG.md در ریشه هر سرویس بر مبنای استاندارد Keep a Changelog همراه با دسته‌بندی‌های رسمی مجاز (Added, Changed, Deprecated, Removed, Fixed, Security).
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `filesystem`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-008-internal-tooling-and-versioning-governance.md §۲.۶

### SB-VER-02: Semantic Versioning & Multi-Module Git Tag

- **ID:** `SB-VER-02`
- **Name:** Semantic Versioning & Multi-Module Git Tag
- **Requirement:** تبعیت نسخه سرویس از SemVer 2.0.0 و انطباق سیستم تگ‌گذاری گیت با الگوی چندماژوله services/<name>/vX.Y.Z جهت تفکیک چرخه‌های انتشار مستقل در مونوریپو.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `git_tags`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `draft_source`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-008-internal-tooling-and-versioning-governance.md §۲.۳, dotdive/docs/lemmo/01-architecture/decisions/ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md §۲.۱

### SB-IMG-01: Version-Derived Docker Image Tagging

- **ID:** `SB-IMG-01`
- **Name:** Version-Derived Docker Image Tagging
- **Requirement:** استخراج تگ ایمیج داکر از نسخه سرویس با فرمت lemmo/svc-<name>:vX.Y.Z و اعمال سیاست نگه‌داری ۳ نسخه آخر و هرس ایمیج‌های آویزان (Dangling Images Pruning).
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `compose_lint`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `draft_source`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md §۲.۵

### SB-HDR-01: Generated File Provenance Header

- **ID:** `SB-HDR-01`
- **Name:** Generated File Provenance Header
- **Requirement:** درج هدر چهارگانه غیرقابل‌ویرایش در کلیه فایل‌های تولیدی توسط ژنراتورها (ابزار تولیدکننده، نسخه، دستور و اخطار منع ویرایش دستی) و اعمال گیت تازگی Zero-Diff در خط بیلد.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `content_match`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `draft_source`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md §۲.۳

### SB-CTR-01: Protobuf Contracts Centralization & Buf Lint

- **ID:** `SB-CTR-01`
- **Name:** Protobuf Contracts Centralization & Buf Lint
- **Requirement:** تمرکز قراردادهای Protobuf در contracts/lemmo/v1/ و ارجاع در مانیفست سرویس؛ ممنوعیت فایل proto محلی در سرویس و برقراری گیت‌های buf lint و buf breaking.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `manifest.networking.inbound_grpc_port != null`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `buf_lint_and_breaking`
- **Roadmap Stage:** `1`
- **Gate:** `new_service`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/03-backend/contracts.md §۱, dotdive/docs/lemmo/01-architecture/decisions/ADR-007-backend-contracts-and-tooling-standards.md §۲

### SB-CTR-02: Domain OpenAPI Specification Single Ownership

- **ID:** `SB-CTR-02`
- **Name:** Domain OpenAPI Specification Single Ownership
- **Requirement:** الزام وجود دقیقاً یک قرارداد contracts/openapi/<domain>/v1/openapi.yaml با مالکیت صریح برای هر سرویس دارای پورت ورودی HTTP؛ منع دور زدن قرارداد با تنظیم openapi_domain به null.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `manifest.networking.inbound_http_port != null`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `filesystem`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-016-request-context-governance-and-workspace-policy.md §۲.۱۴, dotdive/docs/lemmo/01-architecture/decisions/ADR-018-tools-platform-architecture-unified-execution-and-domain-decoupling.md §۲.۶

### SB-CTR-03: OpenAPI Operations Standards

- **ID:** `SB-CTR-03`
- **Name:** OpenAPI Operations Standards
- **Requirement:** الزام تعیین operationId یکتا در سطح کل سیستم و متادیتای صریح حاکمیت دسترسی x-lemmo-workspace-policy (یکی از مقادیر required, optional, none) برای هر عملیات در OpenAPI.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `manifest.contracts.openapi_domain != null`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `openapi_lint`
- **Roadmap Stage:** `1`
- **Gate:** `new_service`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-016-request-context-governance-and-workspace-policy.md §۲.۲

### SB-CTR-04: OpenAPI Breaking Changes Gate

- **ID:** `SB-CTR-04`
- **Name:** OpenAPI Breaking Changes Gate
- **Requirement:** ممنوعیت اعمال هرگونه تغییر شکست‌دهنده یا ناسازگار در اندپوینت‌های عمومی OpenAPI بدون معرفی نسخه جدید API و ارزیابی خودکار تغییرات در خط بیلد با باینری oasdiff.
- **Check:** `static`
- **Scope:** `platform`
- **Applies To:** `[go-service, packaged-engine]`
- **Applies When:** `manifest.contracts.openapi_domain != null`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `oasdiff`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `ci:oasdiff (proposed)`
- **Doc Status:** `gap`
- **Doc Ref:** dotdive/docs/lemmo/03-backend/contracts.md §۴, dotdive/docs/lemmo/01-architecture/decisions/ADR-008-internal-tooling-and-versioning-governance.md §۲.۳

### SB-CTR-05: HTTP Error Envelope Conformance & Mapping Ownership

- **ID:** `SB-CTR-05`
- **Name:** HTTP Error Envelope Conformance & Mapping Ownership
- **Requirement:** پاسخ‌های خطای HTTP باید به contracts/openapi/shared/errors.yaml (AIP-193 ErrorInfo / RFC 7807 + reason + help_key) ارجاع دهند؛ مالکیت انحصاری ترجمه خطای gRPC به HTTP در اختیار پکیج api/core/transport/http و پلاگین درگاه لبه Kong است.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `manifest.networking.inbound_http_port != null`
- **Automation:** `partial`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `ast_and_contract_test`
- **Roadmap Stage:** `1`
- **Gate:** `new_service`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/03-backend/style-guide.md §4, dotdive/docs/lemmo/03-backend/contracts.md §۵

### SB-CTR-06: Idempotency-Key Header Enforcement

- **ID:** `SB-CTR-06`
- **Name:** Idempotency-Key Header Enforcement
- **Requirement:** کلیه عملیات‌های تغییردهنده وضعیت (POST/PUT/PATCH) در سرویس دارای پورت ورودی HTTP موظف به اعلام هدر Idempotency-Key در قرارداد و سیم‌کشی میدل‌ور متمرکز core/idempotency هستند.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `manifest.networking.inbound_http_port != null`
- **Automation:** `partial`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `ast_and_contract_test`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-016-request-context-governance-and-workspace-policy.md §۲.۱۰

### SB-CTR-07: Two-Way Gateway-Contract Route Conformance

- **ID:** `SB-CTR-07`
- **Name:** Two-Way Gateway-Contract Route Conformance
- **Requirement:** انطباق دوطرفه روت‌های شبکه درگاه ورودی Kong با قراردادهای OpenAPI سرویس‌ها: هیچ روت گیت‌وی بدون قرارداد معتبر و هیچ قرارداد عمومی بدون روت متناظر در Kong مجاز نیست.
- **Check:** `static`
- **Scope:** `platform`
- **Applies To:** `[go-service, packaged-engine]`
- **Applies When:** `manifest.contracts.openapi_domain != null`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `contract_lint`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `ci:gateway-route-conformance (proposed)`
- **Doc Status:** `gap`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-013-three-tier-edge-gateway-and-bff-architecture.md §۲.۱, dotdive/docs/lemmo/03-backend/contracts.md §۵

### SB-CTR-08: Frontend SDK Client Freshness Zero-Diff Gate

- **ID:** `SB-CTR-08`
- **Name:** Frontend SDK Client Freshness Zero-Diff Gate
- **Requirement:** کدهای کلاینت تایپ‌اسکریپت تولیدی با Orval در مسیر app/src/sdk/generated/ نسبت به قراردادهای OpenAPI باید ۱۰۰٪ بدون تغییر و انحراف باشند و در CI گیت Zero-Diff اجرا شود.
- **Check:** `static`
- **Scope:** `platform`
- **Applies To:** `[go-service]`
- **Applies When:** `manifest.contracts.openapi_domain != null`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `zero_diff`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `ci:frontend-sdk-zero-diff (proposed)`
- **Doc Status:** `draft_source`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-016-request-context-governance-and-workspace-policy.md §۲.۱۴, dotdive/docs/lemmo/01-architecture/decisions/ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md §۲.۴

### SB-EVT-01: Transactional Outbox Pattern Mandate

- **ID:** `SB-EVT-01`
- **Name:** Transactional Outbox Pattern Mandate
- **Requirement:** انتشار رویدادهای دامنه منحصراً از طریق پکیج core/outbox با درج اتمیک در دیتابیس محلی سرویس در همان تراکنش؛ ممنوعیت ارسال مستقیم پیام به بروکر در هندلرهای وب.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `manifest.events.published.size() > 0`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `ast`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `gap`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-018-tools-platform-architecture-unified-execution-and-domain-decoupling.md §۲.۲, dotdive/docs/lemmo/03-backend/architecture.md §۳

### SB-EVT-02: Standard EventEnvelope Packing

- **ID:** `SB-EVT-02`
- **Name:** Standard EventEnvelope Packing
- **Requirement:** بسته‌بندی پیام‌های رویداد درون پاکت استاندارد platform.v1.EventEnvelope همراه با نام‌گذاری سه‌بخشی نسخه‌دار و فیلدهای شناسه، منبع، زمان و پی‌لود ساختاریافته.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `manifest.events.published.size() > 0`
- **Automation:** `partial`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `ast_and_contract_test`
- **Roadmap Stage:** `1`
- **Gate:** `new_service`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/03-backend/contracts.md §۲

### SB-EVT-03: Traceparent Context Propagation in Events (F-7)

- **ID:** `SB-EVT-03`
- **Name:** Traceparent Context Propagation in Events (F-7)
- **Requirement:** تزریق الزامی هدر استاندارد W3C traceparent در فیلد متادیتای هدر پیام‌های Outbox و استخراج مجدد آن در کانسومرها جهت حفظ زنجیره رهگیری در مرزهای ناهمگام (F-7).
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `manifest.events.published.size() > 0 || manifest.events.consumed.size() > 0`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `ast`
- **Roadmap Stage:** `1`
- **Gate:** `new_service`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/09-governance/current-path.md#f-7, dotdive/docs/lemmo/01-architecture/decisions/ADR-022-platform-reliability-and-observability.md §بند ۲

### SB-EVT-04: Central Event Registry Registration

- **ID:** `SB-EVT-04`
- **Name:** Central Event Registry Registration
- **Requirement:** کلیه نام‌های رویداد اعلام‌شده در لیست رویدادهای منتشره باید در contracts/lemmo/v1/events.proto و کاتالوگ متمرکز رویدادهای پلتفرم ثبت و اعتبارسنجی شده باشند.
- **Check:** `static`
- **Scope:** `platform`
- **Applies To:** `[go-service]`
- **Applies When:** `manifest.events.published.size() > 0`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `contract_lint`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `ci:event-registry-lint (proposed)`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/03-backend/contracts.md §۲.۱

### SB-SEC-01: Inbound Server Identity & Principal Context Interceptor

- **ID:** `SB-SEC-01`
- **Name:** Inbound Server Identity & Principal Context Interceptor
- **Requirement:** ثبت اینترسپتور احراز هویت در بوت‌استرپ سرور ورودی، استخراج متادیتای هویت کلاینت و انتشار امن اطلاعات احرازشده به عنوان Principal در کانتکست درخواست‌های داخلی.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `manifest.networking.inbound_http_port != null || manifest.networking.inbound_grpc_port != null`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `ast`
- **Roadmap Stage:** `1`
- **Gate:** `new_service`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/03-backend/iam-service-spec.md §1.2, dotdive/docs/lemmo/01-architecture/secure-system-design.md §الگوی ۱

### SB-RES-01: Client Call Resilience & Non-Blocking Dial

- **ID:** `SB-RES-01`
- **Name:** Client Call Resilience & Non-Blocking Dial
- **Requirement:** تنظیم صریح مهلت زمانی (Timeout)، بودجه تلاش مجدد و بریکر در فایل کانفیگ نسخه‌دار؛ ممنوعیت قطعی فراخوانی Dial مسدودکننده بدون کانتکست و زمان انقضا.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `ast`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `draft_source`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-022-platform-reliability-and-observability.md §بند ۵

### SB-RES-02: Graceful Shutdown Protocol

- **ID:** `SB-RES-02`
- **Name:** Graceful Shutdown Protocol
- **Requirement:** هندلینگ سیگنال‌های SIGTERM/SIGINT، تخلیه درخواست‌های فعال در بازه مهلت کانفیگ (Grace Period پیش‌فرض ۱۵ ثانیه) و بستن امن اتصالات دیتابیس و صف پیام.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `partial`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `ast_and_runtime_probe`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `draft_source`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-022-platform-reliability-and-observability.md §بند ۹

### SB-LOG-01: Standard Structured JSON Logging

- **ID:** `SB-LOG-01`
- **Name:** Standard Structured JSON Logging
- **Requirement:** صدور کلیه لاگ‌ها روی stdout در قالب استاندارد ساختاریافته JSON از طریق پکیج متمرکز core/bootstrap یا slog؛ منع قطعی استفاده از fmt.Print یا لاگ متنی غیرساختاریافته.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `ast`
- **Roadmap Stage:** `1`
- **Gate:** `new_service`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/03-backend/mvp-operational-readiness.md §۱۱.۱, dotdive/docs/lemmo/01-architecture/decisions/ADR-022-platform-reliability-and-observability.md §بند ۲

### SB-LOG-02: Contextual Tracing Logging & PII Sanitization

- **ID:** `SB-LOG-02`
- **Name:** Contextual Tracing Logging & PII Sanitization
- **Requirement:** درج فیلدهای الزامی request_id، hop، user_id و workspace_id در لاگ‌های بازمینه و منع اکید ثبت اطلاعات هویتی و حساس (PII: پسورد، توکن، کوکی، پرامپت خام).
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `partial`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `ast_and_manual_review`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/03-backend/mvp-operational-readiness.md §۳, dotdive/docs/lemmo/03-backend/mvp-operational-readiness.md §۱۱.۱, dotdive/docs/lemmo/03-backend/mvp-operational-readiness.md §۱۱.۲

### SB-TRC-01: W3C Traceparent Ingress & Egress Propagation

- **ID:** `SB-TRC-01`
- **Name:** W3C Traceparent Ingress & Egress Propagation
- **Requirement:** سیم‌کشی میدل‌ور core/middleware.TraceInterceptor جهت استخراج، اعتبارسنجی و بازتاب هدر استاندارد W3C traceparent در ارتباطات ورودی و خروجی شبکه.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `ast`
- **Roadmap Stage:** `1`
- **Gate:** `new_service`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/03-backend/mvp-operational-readiness.md §۱۱.۲, dotdive/docs/lemmo/01-architecture/decisions/ADR-022-platform-reliability-and-observability.md §بند ۲

### SB-ERR-01: Canonical AIP-193 Error Envelope Conformance

- **ID:** `SB-ERR-01`
- **Name:** Canonical AIP-193 Error Envelope Conformance
- **Requirement:** بازگرداندن خطاهای سرویس در قالب استاندارد google.rpc.Status حاوی ErrorInfo دامنه‌ای متصل به کاتالوگ متمرکز خطاهای پلتفرم با فیلدهای reason و domain.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `ast`
- **Roadmap Stage:** `1`
- **Gate:** `new_service`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-007-backend-contracts-and-tooling-standards.md §۱, dotdive/docs/lemmo/03-backend/style-guide.md §4.1

### SB-TST-01: Testing Hygiene & Makefile Targets Standard

- **ID:** `SB-TST-01`
- **Name:** Testing Hygiene & Makefile Targets Standard
- **Requirement:** قرارگیری آزمون‌های زنده اختصاصی در tests/live/ و وجود تارگت‌های استاندارد test و verify-live در Makefile ریشه سرویس جهت اجرای بررسی‌های یکپارچه.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `filesystem`
- **Roadmap Stage:** `1`
- **Gate:** `new_service`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/03-backend/style-guide.md §3

### SB-CND-JSON: Dynamic Payload JSON Schema Conformance

- **ID:** `SB-CND-JSON`
- **Name:** Dynamic Payload JSON Schema Conformance
- **Requirement:** اعتبارسنجی ورودی‌های دارای ساختار منعطف یا داینامیک بر مبنای اسکیماهای JSON نسخه ۲ در contracts/schemas/ برای سرویس‌های فعال‌کننده قابلیت dynamic_payload.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `manifest.capabilities.dynamic_payload == true`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `json_schema`
- **Roadmap Stage:** `2`
- **Gate:** `new_service`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/03-backend/contracts.md §۳

### SB-CND-SSRF: External Outbound SSRF-Safe HTTP Client

- **ID:** `SB-CND-SSRF`
- **Name:** External Outbound SSRF-Safe HTTP Client
- **Requirement:** استفاده اجباری از کلاینت HTTP امن با بلک‌لیست IPهای خصوصی/لوکال و DNS Pinning جهت پیشگیری از حملات جعل درخواست سمت سرور (SSRF) برای سرویس‌های دارای خروجی وب.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `manifest.networking.external_outbound == true`
- **Automation:** `partial`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `ast_and_contract_test`
- **Roadmap Stage:** `2`
- **Gate:** `new_service`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/secure-system-design.md §الگوی ۴, dotdive/docs/lemmo/03-backend/style-guide.md §8

### SB-CND-TENANT: Multi-Tenant Object Storage Path Scoping

- **ID:** `SB-CND-TENANT`
- **Name:** Multi-Tenant Object Storage Path Scoping
- **Requirement:** الزام آغاز کلیه کلیدهای اشیاء چندمستأجری در MinIO/S3 با پیشوند رسمی tenants/{workspaceID}/* و بررسی تطابق مالکیت دیتابیسی پیش از صدور Presigned URL.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `manifest.storage.object_storage == true`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `ast`
- **Roadmap Stage:** `2`
- **Gate:** `new_service`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/secure-system-design.md §الگوی ۳, dotdive/docs/lemmo/03-backend/style-guide.md §8

### SB-CND-RATE: Billable Service Rate-Card Integration

- **ID:** `SB-CND-RATE`
- **Name:** Billable Service Rate-Card Integration
- **Requirement:** گزارش‌گیری دقیق میزان مصرف منابع و اتصال به Rate-Card رسمی جهت اعتبارسنجی سهمیه و کسر اعتبار برای سرویس‌های علامت‌خورده با billable: true.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `manifest.billable == true`
- **Automation:** `partial`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `ast_and_contract_test`
- **Roadmap Stage:** `2`
- **Gate:** `new_service`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/03-backend/credit-and-ledger.md §1

### SB-CND-REF: Static Catalog Reference Data Registry Conformance

- **ID:** `SB-CND-REF`
- **Name:** Static Catalog Reference Data Registry Conformance
- **Requirement:** تبعیت داده‌های استاتیک کاتالوگ از رجیستری مرکزی داده‌های مرجع و کش دو سطحی کلاینت؛ ممنوعیت هاردکد کردن اطلاعات کاتالوگ در سورس‌کد سرویس.
- **Check:** `static`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `manifest.capabilities.reference_data == true`
- **Automation:** `partial`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `ast_and_manual_review`
- **Roadmap Stage:** `2`
- **Gate:** `new_service`
- **Enforced By:** `lemmo-cli check`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-012-reference-data-registry-and-client-cache.md §2

### SB-RT-01: Live Honest Readiness Dependency Probe

- **ID:** `SB-RT-01`
- **Name:** Live Honest Readiness Dependency Probe
- **Requirement:** پینگ ران‌تایم و واقعی وابستگی‌های حیاتی در اندپوینت /readyz؛ منع بازگرداندن پاسخ کاذب UP در صورت قطع اتصال یا عدم سلامت پایگاه داده و ردیس.
- **Check:** `live`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `network_probe`
- **Roadmap Stage:** `1`
- **Gate:** `new_service`
- **Enforced By:** `make verify-live`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/03-backend/mvp-operational-readiness.md §۴, dotdive/docs/lemmo/01-architecture/decisions/ADR-022-platform-reliability-and-observability.md §بند ۳

### SB-RT-02: Live Running Version & Provenance Audit Probe

- **ID:** `SB-RT-02`
- **Name:** Live Running Version & Provenance Audit Probe
- **Requirement:** استعلام نسخه ران‌تایم، هش کامیت گیت و دایجست ایمیج داکر از پروب زنده سرویس و تطبیق ریاضی با متادیتای بیلد و تگ گیت سورس‌کد.
- **Check:** `live`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `network_probe`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `make verify-live`
- **Doc Status:** `gap`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md §۲.۱, dotdive/docs/lemmo/01-architecture/decisions/ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md §۲.۵

### SB-RT-03: Live Traceparent Header Reflection Probe

- **ID:** `SB-RT-03`
- **Name:** Live Traceparent Header Reflection Probe
- **Requirement:** ارسال درخواست آزمایشی با هدر traceparent؛ اعتبارسنجی بازگشت همان TraceID در هدر پاسخ شبکه و ثبت لاگ همگام بر روی خروجی stdout.
- **Check:** `live`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `network_probe`
- **Roadmap Stage:** `1`
- **Gate:** `new_service`
- **Enforced By:** `make verify-live`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/03-backend/mvp-operational-readiness.md §۱۱.۲, dotdive/docs/lemmo/01-architecture/decisions/ADR-022-platform-reliability-and-observability.md §بند ۲

### SB-RT-04: Live Outbox Health & Broker Connectivity Probe

- **ID:** `SB-RT-04`
- **Name:** Live Outbox Health & Broker Connectivity Probe
- **Requirement:** استعلام وضعیت پیام‌های معلق و شکست‌خورده Outbox و اتصال بروکر پیام از طریق متادیتای اندپوینت آمادگی خود سرویس بدون اتصال مستقیم کوئری SQL به دیتابیس.
- **Check:** `live`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `manifest.events.published.size() > 0`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `network_probe`
- **Roadmap Stage:** `1`
- **Gate:** `ratchet`
- **Enforced By:** `make verify-live`
- **Doc Status:** `gap`
- **Doc Ref:** dotdive/docs/lemmo/03-backend/mvp-operational-readiness.md §۴, dotdive/docs/lemmo/03-backend/mvp-operational-readiness.md §۱۱.۴

### SB-RT-05: Live AIP-193 Error Handling Conformance Probe

- **ID:** `SB-RT-05`
- **Name:** Live AIP-193 Error Handling Conformance Probe
- **Requirement:** ارسال درخواست خواندنی با شناسه نامعتبر؛ اعتبارسنجی پاسخ بر مبنای انولوپ استاندارد خطا و کدهای AIP-193 بدون ایجاد اثر جانبی مالی یا داده‌ای.
- **Check:** `live`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `always`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `network_probe`
- **Roadmap Stage:** `1`
- **Gate:** `new_service`
- **Enforced By:** `make verify-live`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-007-backend-contracts-and-tooling-standards.md §۱, dotdive/docs/lemmo/03-backend/style-guide.md §4.1

### SB-RT-06: Live Anti-IDOR Workspace Isolation Probe

- **ID:** `SB-RT-06`
- **Name:** Live Anti-IDOR Workspace Isolation Probe
- **Requirement:** ارسال درخواست آزمایشی بدون توکن (انتظار کد ۴۰۱) و با توکن به منبع ورک‌اسپیس بیگانه (انتظار رفتار Fail-Closed و کدهای ۴۰۳/۴۰۴ بدون نشت داده).
- **Check:** `live`
- **Scope:** `service`
- **Applies To:** `[go-service]`
- **Applies When:** `manifest.networking.inbound_http_port != null || manifest.networking.inbound_grpc_port != null`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `network_probe`
- **Roadmap Stage:** `2`
- **Gate:** `new_service`
- **Enforced By:** `make verify-live`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/secure-system-design.md §الگوی ۲, dotdive/docs/lemmo/03-backend/style-guide.md §9.4

### SB-RT-07: Live Edge Gateway Route Availability Probe

- **ID:** `SB-RT-07`
- **Name:** Live Edge Gateway Route Availability Probe
- **Requirement:** آزمون سرتاسری و لایو دسترسی به روت‌های عمومی سرویس از طریق درگاه خارجی Kong Edge Gateway و تایید صحت مسیریابی ترافیک بیرونی.
- **Check:** `live`
- **Scope:** `platform`
- **Applies To:** `[go-service, packaged-engine]`
- **Applies When:** `manifest.contracts.openapi_domain != null`
- **Automation:** `full`
- **Implementation Status:** `not_started`
- **Evaluation Mechanism:** `network_probe`
- **Roadmap Stage:** `5`
- **Gate:** `new_service`
- **Enforced By:** `ci:edge-gateway-probe (proposed)`
- **Doc Status:** `approved`
- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-013-three-tier-edge-gateway-and-bff-architecture.md §۲.۱
