| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Microservice Standard Blueprint, Reference Scaffolding, Service Manifest, and Conformance Engine (`ADR-024`) |
| **Title (FA)** | الگوی استاندارد میکروسرویس، اسکلت مرجع، مانیفست سرویس و موتور اعتبارسنجی انطباق مبتنی بر `lemmo-cli` |
| **ID** | ADR-024 |
| **Category** | `architecture` |
| **Status** | `Draft` |
| **Owner** | Platform Architecture & Tech Lead |
| **Last Updated** | 2026-10-18 |
| **Summary (EN)** | Authoritative specification for Lemmo microservice blueprint, 50 canonical conformance rules codified in machine-readable ADR-024.rules.yaml, service manifest schema, contracts and OpenAPI governance, static AST verification via lemmo-cli, and live runtime probes aggregated into make doctor. |
| **Summary (FA)** | سند رسمی الگوی استاندارد میکروسرویس‌های لیمو، کاتالوگ ۵۰ گانه قواعد انطباق ماشین‌خوان در ADR-024.rules.yaml، مانیفست سرویس، حاکمیت قراردادها و OpenAPI، اعتبارسنجی ایستا با lemmo-cli و آزمون‌های زنده متصل به make doctor. |
| **Tags** | `adr`, `blueprint`, `conformance`, `lemmo-cli`, `manifest`, `contracts`, `openapi`, `make-doctor`, `zero-diff` |

---

# ADR-024: الگوی استاندارد میکروسرویس، اسکلت مرجع، مانیفست سرویس و اعتبارسنج انطباق

> 📖 **منبع یگانه حقیقت قواعد (SSOT):**  
> کاتالوگ جامع و رسمی کلیه قواعد این سند در فایل داده‌ای ماشین‌خوان [`ADR-024.rules.yaml`](./ADR-024.rules.yaml) (منطبق بر اسکیمای [`rules-catalog.schema.json`](./rules-catalog.schema.json)) تعریف شده است. ابزار `lemmo-cli` مستقیماً این فایل را مصرف کرده و به عنوان مجری استانداردهای مستند عمل می‌نماید (تولید سند از کد ملغی است). این سند در وضعیت **پیش‌نویس (Draft)** قرار دارد و تا زمان تصویب رسمی توسط مالک محصول، به عنوان مرجع طراحی معماری عمل می‌کند.

---

## ۱. زمینه و انگیزه تصمیم (Context)

در پی بازبینی‌های فنی و دستور مالک محصول مورخ ۲۰۲۶-۱۰-۱۸، مقرر گردید پیش از آغاز توسعه سرویس‌های جدید فاز ۲ (نظیر Access/Promo تحت ADR-025)، تمامی سرویس‌های پلتفرم از یک معماری استاندارد، زیرساخت یکپارچه، قراردادهای معتبر (Proto / OpenAPI)، مانیفست هویتی ماشین‌خوان و سازوکار ارزیابی ماشینی پیروی کنند.

### اصل حاکم بر حقیقت (Authoritative Baseline Invariant):
> **هیچ سرویس پیاده‌سازی‌شده‌ای مرجع حقیقت نیست.** استانداردهای الگو و آزمون‌های انطباق منحصراً از اسناد معماری، تصمیمات مصوب بالادستی ([ADR-007](./ADR-007-backend-contracts-and-tooling-standards.md)، [ADR-008](./ADR-008-internal-tooling-and-versioning-governance.md)، [ADR-009](./ADR-009-service-owned-deployment-and-financial-ledger.md)، [ADR-012](./ADR-012-reference-data-registry-and-client-cache.md)، [ADR-013](./ADR-013-three-tier-edge-gateway-and-bff-architecture.md)، [ADR-016](./ADR-016-request-context-governance-and-workspace-policy.md)، [ADR-018](./ADR-018-tools-platform-architecture-unified-execution-and-domain-decoupling.md)، [ADR-022](./ADR-022-platform-reliability-and-observability.md)، [ADR-023](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md)) و راهنماهای مرجع استخراج می‌گردند.

---

## ۲. متن تصمیم پیشنهادی (Proposed Decision)

استاندارد میکروسرویس‌های پلتفرم لیمو مشتمل بر **۵۰ قاعده اعتبارسنجی** (۴۳ قاعده ایستا/شرطی در `lemmo-cli check` و ۷ آزمون ران‌تایم زنده در `make verify-live`) و **مانیفست ماشین‌خوان سرویس** به شرح زیر پیشنهاد می‌گردد:

### ۲.۱. قواعد ایستای ساختار، لایه‌ها و پکیج‌ها (Directory & Packaging)

| شناسه | نام قاعده و شرح الزام فنی | شرط اعمال (CEL) | خودکاری | وضعیت | ارزیابی | گیت / مرحله | مجری | منبع | مرجع سندی |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `SB-DIR-01` | **Clean Architecture Layer Structure** | `always` | `full` | `not_started` | `filesystem` | new_service (M1) | `lemmo-cli check` | مصوب | [ADR-007-backend-contracts-and-tooling-standards §3](./ADR-007-backend-contracts-and-tooling-standards.md)، [style-guide §3](../../03-backend/style-guide.md) |
| `SB-DIR-02` | **Thin Entrypoint Main** | `always` | `full` | `not_started` | `ast` | new_service (M1) | `lemmo-cli check` | مصوب | [ADR-008-internal-tooling-and-versioning-governance §2.1](./ADR-008-internal-tooling-and-versioning-governance.md)، [style-guide §3](../../03-backend/style-guide.md) |
| `SB-DIR-03` | **Independent Go Module Definition** | `always` | `full` | `not_started` | `filesystem` | new_service (M1) | `lemmo-cli check` | مصوب | [ADR-008-internal-tooling-and-versioning-governance §2.2](./ADR-008-internal-tooling-and-versioning-governance.md)، [architecture §2](../../03-backend/architecture.md) |
| `SB-DIR-04` | **Database Migration Structure** | `manifest.storage.postgres == true` | `full` | `not_started` | `filesystem` | ratchet (M1) | `lemmo-cli check` | مصوب | [ADR-007-backend-contracts-and-tooling-standards §3](./ADR-007-backend-contracts-and-tooling-standards.md)، [style-guide §6](../../03-backend/style-guide.md) |
| `SB-DOC-01` | **Service Architectural Specification** | `always` | `full` | `not_started` | `frontmatter_parse` | ratchet (M1) | `lemmo-cli check` | مصوب | [ADR-007-backend-contracts-and-tooling-standards §3](./ADR-007-backend-contracts-and-tooling-standards.md)، [services](../../03-backend/services.md) |
| `SB-MAN-01` | **Machine-Readable Service Manifest** | `always` | `full` | `not_started` | `json_schema` | ratchet (M1) | `lemmo-cli check` | پیش‌نویس | [ADR-024-service-blueprint-and-conformance §3](./ADR-024-service-blueprint-and-conformance.md) |

### ۲.۲. قواعد پیکربندی، سکرت‌ها و انضباط کد (Configuration & Secrets)

| شناسه | نام قاعده و شرح الزام فنی | شرط اعمال (CEL) | خودکاری | وضعیت | ارزیابی | گیت / مرحله | مجری | منبع | مرجع سندی |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `SB-CFG-01` | **Versioned Configuration Default File** | `always` | `full` | `not_started` | `filesystem` | ratchet (M1) | `lemmo-cli check` | مصوب | [configuration-and-secrets §2](../configuration-and-secrets.md) |
| `SB-CFG-02` | **Startup Fail-Fast Validation** | `always` | `full` | `not_started` | `ast` | new_service (M1) | `lemmo-cli check` | مصوب | [configuration-and-secrets §3](../configuration-and-secrets.md) |
| `SB-CFG-03` | **Secret Hardcoding Fallback Ban** | `always` | `full` | `not_started` | `ast` | new_service (M1) | `lemmo-cli check` | مصوب | [configuration-and-secrets §1](../configuration-and-secrets.md) |
| `SB-CFG-04` | **Network Literal Constants Ban** | `always` | `partial` | `not_started` | `ast_and_manual_review` | ratchet (M1) | `lemmo-cli check` | مصوب | [ADR-009-service-owned-deployment-and-financial-ledger §2.4](./ADR-009-service-owned-deployment-and-financial-ledger.md)، [configuration-and-secrets §1](../configuration-and-secrets.md) |

### ۲.۳. قواعد استقرار سرویس‌محور و داکر (Deployment & Docker Hygiene)

| شناسه | نام قاعده و شرح الزام فنی | شرط اعمال (CEL) | خودکاری | وضعیت | ارزیابی | گیت / مرحله | مجری | منبع | مرجع سندی |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `SB-DEP-01` | **Service-Owned Deployment Composition** | `always` | `full` | `not_started` | `filesystem` | ratchet (M1) | `lemmo-cli check` | مصوب | [ADR-009-service-owned-deployment-and-financial-ledger §2.1](./ADR-009-service-owned-deployment-and-financial-ledger.md)، [docker-spec §3.3](../../07-devops/docker-spec.md) |
| `SB-DEP-02` | **Single Multi-Stage Dockerfile** | `always` | `full` | `not_started` | `filesystem` | new_service (M1) | `lemmo-cli check` | مصوب | [docker-spec §4](../../07-devops/docker-spec.md) |
| `SB-DEP-03` | **Container Role-Based Naming** | `always` | `full` | `not_started` | `compose_lint` | new_service (M1) | `lemmo-cli check` | مصوب | [ADR-009-service-owned-deployment-and-financial-ledger §2.3](./ADR-009-service-owned-deployment-and-financial-ledger.md)، [docker-spec §3.2](../../07-devops/docker-spec.md) |
| `SB-DEP-04` | **Build Provenance Logging in Startup** | `always` | `full` | `not_started` | `content_match` | ratchet (M1) | `lemmo-cli check` | مصوب | [docker-spec §4](../../07-devops/docker-spec.md) |
| `SB-VER-01` | **Human-Curated Changelog** | `always` | `full` | `not_started` | `filesystem` | ratchet (M1) | `lemmo-cli check` | مصوب | [ADR-008-internal-tooling-and-versioning-governance §2.6](./ADR-008-internal-tooling-and-versioning-governance.md)، [style-guide §7](../../03-backend/style-guide.md) |
| `SB-VER-02` | **Semantic Versioning and Module Git Tags** | `always` | `full` | `not_started` | `git_tags` | ratchet (M1) | `lemmo-cli check` | پیش‌نویس | [ADR-008-internal-tooling-and-versioning-governance §2.3](./ADR-008-internal-tooling-and-versioning-governance.md)، [ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance §2.1](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md) |
| `SB-IMG-01` | **Source-Derived Image Tagging & Retention** | `always` | `full` | `not_started` | `compose_lint` | ratchet (M1) | `lemmo-cli check` | پیش‌نویس | [docker-spec §4](../../07-devops/docker-spec.md)، [ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance §2.5](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md) |
| `SB-HDR-01` | **Generated File Provenance Header** | `always` | `full` | `not_started` | `content_match` | new_service (M1) | `lemmo-cli check` | پیش‌نویس | [ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance §2.3](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md) |

### ۲.۴. قراردادها، OpenAPI و کلاینت SDK (Contracts & OpenAPI)

| شناسه | نام قاعده و شرح الزام فنی | شرط اعمال (CEL) | خودکاری | وضعیت | ارزیابی | گیت / مرحله | مجری | منبع | مرجع سندی |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `SB-CTR-01` | **Protobuf Contracts Centralization & Buf Lint** | `manifest.contracts.proto.size() > 0` | `full` | `not_started` | `buf_lint_and_breaking` | new_service (M1) | `lemmo-cli check` | مصوب | [contracts §1](../../03-backend/contracts.md)، [ADR-007-backend-contracts-and-tooling-standards §2](./ADR-007-backend-contracts-and-tooling-standards.md) |
| `SB-CTR-02` | **Domain OpenAPI Specification & Single Ownership** | `manifest.contracts.openapi_domain != null` | `full` | `not_started` | `filesystem` | ratchet (M1) | `lemmo-cli check` | مصوب | [ADR-016-request-context-governance-and-workspace-policy §2.14](./ADR-016-request-context-governance-and-workspace-policy.md)، [ADR-018-tools-platform-architecture-unified-execution-and-domain-decoupling §2](./ADR-018-tools-platform-architecture-unified-execution-and-domain-decoupling.md) |
| `SB-CTR-03` | **OpenAPI Operation Compliance** | `manifest.contracts.openapi_domain != null` | `full` | `not_started` | `openapi_lint` | new_service (M1) | `lemmo-cli check` | مصوب | [ADR-016-request-context-governance-and-workspace-policy §2.2](./ADR-016-request-context-governance-and-workspace-policy.md) |
| `SB-CTR-04` | **OpenAPI Breaking Changes Gate** | `manifest.contracts.openapi_domain != null` | `full` | `not_started` | `oasdiff` | ratchet (M1) | `ci:oasdiff (proposed)` | مصوب | [contracts §4](../../03-backend/contracts.md)، [ADR-008-internal-tooling-and-versioning-governance §2.3](./ADR-008-internal-tooling-and-versioning-governance.md) |
| `SB-CTR-05` | **HTTP Error Envelope Conformance & Mapping Ownership** | `manifest.networking.inbound_http_port != null` | `partial` | `not_started` | `ast_and_contract_test` | new_service (M1) | `lemmo-cli check` | مصوب | [style-guide §4](../../03-backend/style-guide.md)، [contracts §5.3](../../03-backend/contracts.md) |
| `SB-CTR-06` | **Mutating Operation Idempotency Key** | `manifest.contracts.openapi_domain != null` | `partial` | `not_started` | `ast_and_contract_test` | ratchet (M1) | `lemmo-cli check` | مصوب | [ADR-016-request-context-governance-and-workspace-policy §2.10](./ADR-016-request-context-governance-and-workspace-policy.md) |
| `SB-CTR-07` | **Gateway Route ↔ OpenAPI Contract Parity** | `manifest.contracts.openapi_domain != null` | `full` | `not_started` | `contract_lint` | ratchet (M1) | `ci:gateway-route-conformance (proposed)` | مصوب | [ADR-013-three-tier-edge-gateway-and-bff-architecture §2.1](./ADR-013-three-tier-edge-gateway-and-bff-architecture.md) |
| `SB-CTR-08` | **Frontend SDK Freshness Zero-Diff** | `manifest.contracts.openapi_domain != null` | `full` | `not_started` | `zero_diff` | ratchet (M1) | `ci:frontend-sdk-zero-diff (proposed)` | پیش‌نویس | [ADR-016-request-context-governance-and-workspace-policy §2.14](./ADR-016-request-context-governance-and-workspace-policy.md)، [ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance §2.4](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md) |

### ۲.۵. رویدادها، امنیت، تاب‌آوری و مشاهده‌پذیری (Events, Security & Observability)

| شناسه | نام قاعده و شرح الزام فنی | شرط اعمال (CEL) | خودکاری | وضعیت | ارزیابی | گیت / مرحله | مجری | منبع | مرجع سندی |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `SB-EVT-01` | **Transactional Outbox Publishing** | `manifest.events.published.size() > 0` | `full` | `not_started` | `ast` | new_service (M1) | `lemmo-cli check` | پیش‌نویس | [architecture §2](../../03-backend/architecture.md)، [ADR-022-platform-reliability-and-observability §2](./ADR-022-platform-reliability-and-observability.md) |
| `SB-EVT-02` | **Standard Event Envelope Conformance** | `manifest.events.published.size() > 0` | `partial` | `not_started` | `ast_and_contract_test` | new_service (M1) | `lemmo-cli check` | مصوب | [contracts §۲](../../03-backend/contracts.md) |
| `SB-EVT-03` | **Traceparent Propagation in Async Events** | `manifest.events.published.size() > 0 || manifest.events.consumed.size() > 0` | `full` | `not_started` | `ast` | new_service (M1) | `lemmo-cli check` | مصوب | [current-path#f-7](../../09-governance/current-path.md#f-7)، [mvp-operational-readiness §۱۱.۲](../../03-backend/mvp-operational-readiness.md) |
| `SB-EVT-04` | **Central Event Catalog Registration** | `manifest.events.published.size() > 0` | `full` | `not_started` | `contract_lint` | ratchet (M1) | `ci:event-registry-lint (proposed)` | مصوب | [contracts §۲.۱](../../03-backend/contracts.md) |
| `SB-SEC-01` | **Service Identity & Auth Interceptor** | `manifest.networking.inbound_http_port != null || manifest.networking.inbound_grpc_port != null` | `full` | `not_started` | `ast` | new_service (M1) | `lemmo-cli check` | مصوب | [iam-service-spec §۱](../../03-backend/iam-service-spec.md)، [secure-system-design §الگوی ۱](../secure-system-design.md) |
| `SB-RES-01` | **Call Resilience & Non-blocking Dials** | `always` | `full` | `not_started` | `ast` | new_service (M1) | `lemmo-cli check` | پیش‌نویس | [ADR-022-platform-reliability-and-observability §۵](./ADR-022-platform-reliability-and-observability.md) |
| `SB-RES-02` | **Graceful Shutdown Lifecycle** | `always` | `partial` | `not_started` | `ast_and_runtime_probe` | new_service (M1) | `lemmo-cli check` | پیش‌نویس | [ADR-022-platform-reliability-and-observability §۹](./ADR-022-platform-reliability-and-observability.md) |
| `SB-LOG-01` | **Standard Structured JSON Logging** | `always` | `full` | `not_started` | `ast` | new_service (M1) | `lemmo-cli check` | مصوب | [mvp-operational-readiness §۱۱.۱](../../03-backend/mvp-operational-readiness.md)، [decision-register#d-01](../../09-governance/decision-register.md#d-01) |
| `SB-LOG-02` | **Contextual Request & Hop Logging** | `always` | `partial` | `not_started` | `ast_and_manual_review` | ratchet (M1) | `lemmo-cli check` | مصوب | [mvp-operational-readiness §۱۱.۲](../../03-backend/mvp-operational-readiness.md)، [ADR-016-request-context-governance-and-workspace-policy §۲.۲](./ADR-016-request-context-governance-and-workspace-policy.md)، [secure-system-design §الگوی ۱](../secure-system-design.md) |
| `SB-TRC-01` | **W3C Distributed Tracing** | `always` | `full` | `not_started` | `ast` | new_service (M1) | `lemmo-cli check` | مصوب | [mvp-operational-readiness §۱۱.۲](../../03-backend/mvp-operational-readiness.md)، [decision-register#d-02](../../09-governance/decision-register.md#d-02) |
| `SB-ERR-01` | **Central Error Catalog AIP-193 Conformance** | `always` | `full` | `not_started` | `ast` | new_service (M1) | `lemmo-cli check` | مصوب | [ADR-007-backend-contracts-and-tooling-standards §۱](./ADR-007-backend-contracts-and-tooling-standards.md)، [style-guide §۴.۱](../../03-backend/style-guide.md) |
| `SB-TST-01` | **Live Test Directory & Makefile Targets** | `always` | `full` | `not_started` | `filesystem` | new_service (M1) | `lemmo-cli check` | مصوب | [style-guide §۳](../../03-backend/style-guide.md) |

### ۲.۶. قواعد شرطی بر مبنای نوع و قابلیت‌های سرویس (Conditional Rules)

| شناسه | نام قاعده و شرح الزام فنی | شرط اعمال (CEL) | خودکاری | وضعیت | ارزیابی | گیت / مرحله | مجری | منبع | مرجع سندی |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `SB-CND-JSON` | **JSON Schema Validation for Dynamic Payloads** | `manifest.capabilities.dynamic_payload == true` | `full` | `not_started` | `json_schema` | new_service (M2) | `lemmo-cli check` | مصوب | [contracts §۳.۲](../../03-backend/contracts.md) |
| `SB-CND-SSRF` | **SSRF-Safe Outbound Client** | `manifest.networking.external_outbound == true` | `partial` | `not_started` | `ast_and_manual_review` | new_service (M2) | `lemmo-cli check` | مصوب | [secure-system-design §الگوی ۴](../secure-system-design.md)، [style-guide §۸](../../03-backend/style-guide.md) |
| `SB-CND-TENANT` | **Storage Tenant Prefix Isolation** | `manifest.storage.object_storage == true` | `full` | `not_started` | `ast` | new_service (M2) | `lemmo-cli check` | مصوب | [secure-system-design §الگوی ۳](../secure-system-design.md)، [style-guide §۸](../../03-backend/style-guide.md) |
| `SB-CND-RATE` | **Billable Usage Reporting** | `manifest.billable == true` | `partial` | `not_started` | `ast_and_contract_test` | new_service (M2) | `lemmo-cli check` | مصوب | [credit-and-ledger §۱](../../03-backend/credit-and-ledger.md) |
| `SB-CND-REF` | **Reference Data Architectural Pattern** | `manifest.capabilities.reference_data == true` | `partial` | `not_started` | `ast_and_manual_review` | new_service (M2) | `lemmo-cli check` | مصوب | [ADR-012-reference-data-registry-and-client-cache §۲.۱](./ADR-012-reference-data-registry-and-client-cache.md) |

### ۲.۷. مشخصات آزمون زنده ران‌تایم (`make verify-live` / `make doctor`)

| شناسه | نام قاعده و شرح الزام فنی | شرط اعمال (CEL) | خودکاری | وضعیت | ارزیابی | گیت / مرحله | مجری | منبع | مرجع سندی |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `SB-RT-01` | **Honest Dependency Readiness Probe** | `always` | `full` | `not_started` | `network_probe` | new_service (M1) | `make verify-live` | مصوب | [mvp-operational-readiness §۱۱.۱](../../03-backend/mvp-operational-readiness.md)، [decision-register#d-01](../../09-governance/decision-register.md#d-01) |
| `SB-RT-02` | **Runtime Version, Commit & Container Digest Parity** | `always` | `full` | `not_started` | `network_probe` | ratchet (M1) | `make verify-live` | پیش‌نویس | [docker-spec §۴](../../07-devops/docker-spec.md)، [ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance §۲.۱-§۲.۵](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md) |
| `SB-RT-03` | **Live W3C Traceparent Echo Probe** | `always` | `full` | `not_started` | `network_probe` | new_service (M1) | `make verify-live` | مصوب | [mvp-operational-readiness §۱۱.۲](../../03-backend/mvp-operational-readiness.md)، [decision-register#d-02](../../09-governance/decision-register.md#d-02) |
| `SB-RT-04` | **Live Outbox Health & Broker Connectivity Probe** | `manifest.events.published.size() > 0` | `full` | `not_started` | `network_probe` | ratchet (M1) | `make verify-live` | مصوب | [current-path#f-7](../../09-governance/current-path.md#f-7) |
| `SB-RT-05` | **Controlled Read-Only AIP-193 Error Probe** | `always` | `full` | `not_started` | `network_probe` | new_service (M1) | `make verify-live` | مصوب | [ADR-007-backend-contracts-and-tooling-standards §۱](./ADR-007-backend-contracts-and-tooling-standards.md)، [mvp-operational-readiness §۱۱.۴](../../03-backend/mvp-operational-readiness.md) |
| `SB-RT-06` | **Live Security & IDOR Tenant Isolation Probe** | `manifest.networking.inbound_http_port != null || manifest.networking.inbound_grpc_port != null` | `full` | `not_started` | `network_probe` | new_service (M2) | `make verify-live` | مصوب | [secure-system-design §الگوی ۲](../secure-system-design.md)، [ADR-016-request-context-governance-and-workspace-policy §۲.۲-§۲.۴](./ADR-016-request-context-governance-and-workspace-policy.md) |
| `SB-RT-07` | **Edge Gateway Route Accessibility Probe** | `manifest.contracts.openapi_domain != null` | `full` | `not_started` | `network_probe` | new_service (M5) | `ci:edge-gateway-probe (proposed)` | مصوب | [ADR-013-three-tier-edge-gateway-and-bff-architecture §۲.۱](./ADR-013-three-tier-edge-gateway-and-bff-architecture.md) |

---

### ۲.۸. انتصاب زبان بیان مشترک (CEL - Common Expression Language) و دلایل انتخاب

جهت فرموله‌سازی شرایط اعمال قواعد (`applies_when`)، زبان استاندارد **CEL (Common Expression Language)** انتخاب شده است. دلایل فنی این تصمیم عبارتند از:
1. **سرعت بسیار بالا و سربار نزدیک به صفر:** کامپایل و ارزیابی عبارات CEL در زمان بسیار کوتاه (میکروثانیه) انجام می‌شود و مناسب گیت‌های پرسرعت CI است.
2. **ایمنی حافظه و قطعیت اجرایی (Deterministic & Sandboxed):** CEL فاقد قابلیت اجرای کد دلخواه یا لوپ‌های بی‌پایان (Turing Incomplete by design) است و هیچ‌گونه Side-Effect امنیتی در محیط CI ایجاد نمی‌کند.
3. **استاندارد صنعتی ابری:** CEL زبان رسمی اعتبارسنجی در Kubernetes Admission Controllers، Envoy Gateway و ابزارهای مانیتورینگ مدرن است.
4. **پشتیبانی بومی در اکوسیستم Go:** کتابخانه رسمی `github.com/google/cel-go` به سادگی در ابزار `lemmo-cli` ادغام می‌گردد.
5. **ساختار صریح و یکپارچه:** امکان بررسی وجود فیلدها و توابع سایز بدون نیاز به مفسرهای سنگین اسکریپتی (مانند `manifest.networking.inbound_http_port != null` یا `manifest.contracts.proto.size() > 0`).

---

### ۲.۹. تفکیک مفهومی سطح خودکاری (`automation`) از وضعیت پیاده‌سازی (`implementation_status`)

پیرو تصمیم مدیریت پروژه (REV-4)، دو مفهوم خودکاری و پیاده‌سازی با دو فیلد کاملاً تفکیک‌شده تعریف می‌شوند:
- **`automation: full | partial | manual` (طراحی):** بیانگر ماهیت ذاتی قاعده است که تا چه اندازه قابل اتوماسیون قطعی ماشینی است. قواعدی نظیر `SB-CFG-04`، `SB-CTR-05`، `SB-LOG-02` و `SB-CND-REF` به دلیل ماهیت ترکیبی معنایی، به عنوان `partial` (نیازمند AST جزئی + بازبینی دستی یا تست قراردادی) اعلام شده‌اند.
- **`implementation_status: not_started | implemented` (واقعیت کد):** بیانگر وجود واقعی مجری قاعده در کد فعلی است. در زمان تدوین این پیش‌نویس، از آنجا که دستورات `lemmo-cli check`، تارگت `make verify-live` و پایپ‌لاین‌های `ci:*` هنوز در فاز اجرایی پیاده‌سازی نشده‌اند، **تمامی ۵۰ قاعده در وضعیت `not_started` ثبت شده‌اند.** گیت zero-diff در آینده وضعیت این فیلد را همگام با کدهای پیاده‌شده به روز خواهد کرد.

---

### ۲.۱۰. اصل پیشگیری از خودمعافی قواعد امنیتی و تاب‌آوری (Security Self-Exemption Ban)

> **قانون قطعی:** هیچ قاعده امنیتی، احراز هویت یا تاب‌آوری نباید با پرچم قابلیتی که خودش الزام می‌کند فعال گردد.  
یک مقدار `false` در مانیفست نباید آزمون‌های حیاتی احراز هویت، گارد IDOR، هرزپذیری (Idempotency) یا خروج تمیز (Graceful Shutdown) را دور بزند.

- **قواعد امنیتی (`SB-SEC-01`, `SB-RT-06`):** بر مبنای واقعیت شبکه (وجود پورت ورودی HTTP یا gRPC در مانیفست) فعال می‌شوند. اگر سرویسی پورت ورودی باز کند، ملزم به احراز هویت و بررسی ایزولاسیون ورک‌اسپیس است.
- **قاعده هرزپذیری (`SB-CTR-06`):** بر مبنای حضور OpenAPI سرویس فعال می‌گردد و اعتبارسنجی می‌کند که عملیات‌های جهش‌دهنده دارای کلید هرزپذیری باشند.
- **قاعده توقف تمیز (`SB-RES-02`):** برای تمامی سرویس‌ها بدون استثناء به صورت `always` فعال است.
- هرگونه معافیت استثنایی صرفاً از طریق بخش `not_applicable` با ارائه دلیل مکتوب و امضای رسمی مالک/ناظر پروژه در بازبینی PR امکان‌پذیر است.

---

## ۳. طراحی جامع مانیفست استاندارد سرویس (Service Manifest)

### ۳.۱. اصل حاکم بر مانیفست
> **اصل:** ADR-024 مرجع استاندارد است (چه قواعدی وجود دارند). مانیفست مرجع هویت سرویس است (کدام قواعد شامل این سرویس می‌شوند). خروجی `check` و `verify-live` اثبات است. **مانیفست ادعاست، نه اثبات.**

### ۳.۲. اسکیمای مانیفست (`contracts/schemas/service-manifest.json`)
```yaml
# نمونه مانیفست کامل پیش‌فرض: services/<name>/service.manifest.yaml
schema_version: "1.0.0"
name: "image-service"
kind: "go-service" # go-service | packaged-engine | planned-stub
owner: "Platform / Image Team"
tier: "tier-1"

contracts:
  proto:
    - "contracts/lemmo/v1/image.proto"
  openapi_domain: "image"

storage:
  postgres: true
  redis: true
  object_storage: true

events:
  published:
    - "image.generation.requested.v1"
    - "image.generation.completed.v1"
  consumed:
    - "workflow.step.dispatched.v1"

networking:
  inbound_grpc_port: 50051
  inbound_http_port: 8080
  external_outbound: true # نیازمند کلاینت SSRF-Safe

billable: true # نیازمند اتصال به Rate-Card سهمیه

capabilities:
  idempotency: true
  outbox: true
  auth_interceptor: true
  graceful_shutdown: true
  dynamic_payload: false # پشتیبانی از اعتبارسنجی اسکیمای JSON پویا
  reference_data: false # تبعیت از رجیستری داده‌های مرجع استاتیک

not_applicable: []
```

### ۳.۳. اعتبارسنجی چهارجانبه (Four-Way Conformance Verification)
هرگونه ناهمخوانی میان منابع چهارگانه زیر منجر به شکست (`FAIL`) قطعی در گیت CI می‌شود:
1. **مانیفست ↔ سورس‌کد (`lemmo-cli check`):** ادعای عدم دیتابیس در حالی که پکیج `adapters/postgres` وجود دارد، یا استفاده از `core/outbox` در غیاب ثبت رویداد در مانیفست.
2. **مانیفست ↔ سرویس در حال اجرا (`make verify-live`):** گزارش آمادگی دیتابیس یا وابستگی در `/readyz` که در مانیفست اظهار نشده است.
3. **مانیفست ↔ پلتفرم:** مسیر بدون روت Kong یا روت ثبت‌نشده در رجیستری رویدادها.
4. **مانیفست ↔ اسناد معماری:** تطابق نوع، پورت‌ها و مرزها با سند جامع کاتالوگ ([DOC-BE-002](../../03-backend/services.md)). مانیفست نمی‌تواند ادعایی مغایر اسناد مصوب مطرح کند.

### ۳.۴. قواعد حاکمیتی مانیفست (Manifest Governance)
- **سکوت مساوی با شکست (Silence = Failure):** کلیه کلیدهای قابلیت در مانیفست الزامی هستند. مقدار پیش‌فرض کلیدها در اسکافولد جدید `null` (= تصمیم‌گرفته‌نشده) است؛ `lemmo-cli check` سرویس را تا زمان تنظیم مقدار `true` یا `false` با دلیل صریح متوقف می‌کند.
- **تغییرات نیازمند بازبینی:** افزودن هر مورد به `not_applicable` یا تغییر سطح دسترسی نیازمند بازبینی و امضای ناظر/مالک پروژه است (با قاعده CODEOWNERS).
- **فرمان ارتقای مانیفست:** افزودن قواعد جدید به ADR-024 از طریق دستور `lemmo-cli manifest upgrade` کلیدهای جدید را با مقدار `null` به مانیفست سرویس‌ها تزریق می‌کند تا سرویس‌ها به صورت هدایت‌شده وضعیت خود را تعیین کنند.

### ۳.۵. مانیفست به عنوان مرجع یگانه حقیقت متادیتای سرویس‌ها (تصمیم مصوب، R4-10)
پیرو تصمیم رسمی مالک پروژه مورخ ۲۰۲۶-۱۰-۱۸:
> **مانیفست سرویس مرجع یگانه حقیقت (SSOT) متادیتای سرویس‌هاست.**  
> بخش متادیتای سرویس در جدول جامع مستندات [`services.md` (DOC-BE-002)](../../03-backend/services.md) (شامل نوع، مرزها، پورت‌ها و فاز استقرار) منحصراً از روی مانیفست‌های معتبر سرویس‌ها به وسیله فرمان `lemmo-cli doc-sync` تولید می‌گردد و در خط بیلد تحت گیت Zero-Diff محافظت می‌شود. ویرایش دستی این بخش در مستندات ممنوع است.  
> متن روایی و تشریحی سند معماری (چرایی مرزبندی سرویس و مسئولیت‌های دامنه) به صورت دستی توسط تیم معماری نگهداری و توسعه می‌یابد.

---

## ۴. استراتژی گیت‌های خط بیلد (CI Gates) و قاعده Ratchet

### ۴.۱. تعاریف گیت‌های ارزیابی (`gate`)
- **`gate: new_service` (الزام سرویس‌های جدید):**  
  تمامی قواعد دارای این برچسب (۳۱ قاعده) برای هر سرویس جدیدی که به مخزن افزوده می‌شود (از جمله سرویس Access/Promo فاز ۲) از روز نخست الزامی بوده و تخطی از آن‌ها موجب شکست قطعی بیلد (`FAIL`) می‌گردد.
- **`gate: ratchet` (سیاست کاهش تدریجی سرویس‌های موجود):**  
  برای سرویس‌های پیاده‌سازی‌شده موجود، انحرافات شناخته‌شده در فایل خط مبنا ثبت گردیده و در هر چرخه کاری، تعداد این انحرافات منحصراً می‌تواند کاهش یابد (سیاست کاهش یک‌طرفه - Monotonic Reduction).

### ۴.۲. ساختار و جایگاه فایل خط مبنا (`api/conformance/ratchet.yaml` — R4-9)
پیرو دستور مدیر پروژه، فایل خط مبنای Ratchet درون مخزن کد `api/` مستقر می‌گردد:
- **مسیر رسمی:** `api/conformance/ratchet.yaml`
- **حاکمیت دسترسی:** محافظت‌شده توسط CODEOWNERS منحصراً با امضای `@tech-lead` یا معمار پلتفرم.
- **قانون قطعی کاهش یک‌طرفه:** خط بیلد اجازه افزایش هیچ انحرافی را نسبت به مقدار ثبت‌شده در این فایل نمی‌دهد. هر PR که انحرافی را برطرف کند، موظف به کاهش مقدار خط مبنا در همان PR است.

### ۴.۳. سرویس‌های استاب فریز‌شده (`token-service` و `notification-service`)
پیرو تایید مالک محصول، این دو سرویس با وضعیت `Status: Planned` فریز شده و در رجیستری ratchet از گیت‌های جاری معاف می‌گردند تا در فاز اختصاصی‌شان با آخرین نسخه اسکلت و الگوهای ADR-024 اسکافولد شوند.

### ۴.۴. وضعیت پیشنهادی مجری‌های پلتفرمی (`enforced_by`)
قواعدی که در سطح کل پلتفرم یا خط بیلد تعریف شده‌اند (مانند `ci:oasdiff (proposed)`، `ci:gateway-route-conformance (proposed)`، `ci:frontend-sdk-zero-diff (proposed)` و `ci:event-registry-lint (proposed)`) صرفاً به عنوان پیشنهاد معماری در این پیش‌نویس ثبت شده‌اند. مالکیت نهایی، طراحی دقیق اسکریپت‌ها و ادغام آن‌ها در پایپ‌لاین CI منوط به تصمیم و تایید مسئولین محترم هر بخش و مدیر زیرساخت خواهد بود.
