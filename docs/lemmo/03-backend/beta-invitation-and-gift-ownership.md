| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Beta Invitation, Access Gate, and One-Time Gift Ownership |
| **Title (FA)** | مالکیت دعوت بتا، دروازه دسترسی و هدیه یک‌باره |
| **ID** | DOC-BE-014 |
| **Category** | `architecture` |
| **Status** | `Draft` |
| **Owner** | Platform Architecture / Backend Lead |
| **Last Updated** | 2026-10-23 |
| **Summary (EN)** | Defines the seven-stage beta onboarding path and fixes ownership: invitation, beta capacity, single-use enforcement, and credit-promo rules belong to `access-promo-service` (D-53 / ADR-025); the gift is issued only through the Quota Claim engine (D-03); the studio client only displays and calls the contract. Records measured gaps and the 2026-10-23 closure of P-3. |
| **Summary (FA)** | مسیر هفت‌مرحله‌ای آنبوردینگ بتا و مالکیت آن را تثبیت می‌کند: دعوت، سقف ظرفیت، مصرف یک‌باره و قواعد پروموی اعتباری متعلق به `access-promo-service` (D-53 / ADR-025) است؛ اعطای هدیه فقط از مسیر موتور Claim در Quota (D-03) انجام می‌شود؛ کلاینت استودیو تنها نمایش می‌دهد و قرارداد را فراخوانی می‌کند. شکاف‌های اندازه‌گیری‌شده و بسته‌شدن P-3 در ۲۰۲۶-۱۰-۲۳ ثبت شده است. |
| **Tags** | `beta`, `invitation`, `onboarding`, `quota`, `claim`, `gateway`, `p06`, `p08` |

# Beta Invitation, Access Gate, and One-Time Gift Ownership

## 1. Scope and motivation

This document fixes the ownership and the end-to-end shape of the limited-beta
onboarding path. It exists because a live run of the seven-stage path with a
brand-new user on 2026-10-14 showed that the path is **not implemented in
production code**, and that the only existing implementation of parts of it is
test-only scaffolding plus a fabricated client-side screen.

The decision is recorded here first, per the governance rule that no technical
document may lag behind an approved decision.

## 2. The seven-stage path (canonical)

| # | Stage | Owner | Contract status |
|---|---|---|---|
| 1 | Registration / login (passwordless) | `auth-service` (Kratos) | **Working** |
| 2 | Beta access check for the authenticated user | `access-promo-service` (D-53 / ADR-025) | **Missing** |
| 3 | Invite code entry page when access is absent | Studio client (display only) | **Missing** |
| 4 | Invite validation, capacity ceiling, single-use enforcement, activation | `access-promo-service` (D-53 / ADR-025) | **Missing** (test-only) |
| 5 | Workspace / Wallet provisioning and one-time gift claim | `workspace-service` + `quota-service` Claim engine + `ledger-service` | Wallet: **Working**. Gift claim over the network: **Missing** |
| 6 | Studio entry (draft-only prompt) | Studio client | **Working** |
| 7 | History, refresh, re-login | Studio client + backend | **Working** |

## 3. Ownership rules (decided)

1. **The studio client never decides access.** It renders the contract result and
   calls the responsible endpoint. A frontend redirect alone is explicitly *not*
   an access control (ADR-016 §2.9 fail-closed).
2. **Financial decisions live only in the financial owner.** Invite validation,
   beta capacity, single-use enforcement, and gift issuance are performed
   server-side. **Invite/capacity/promo rules are owned by `access-promo-service`
   (D-53 / ADR-025); the gift claim path follows the Service Responsibility Registry
   (DOC-ARCH-013 §5.5): `access-promo-service` (eligibility, capacity) →
   `quota-service` (gift amount) → `ledger-service` (TigerBeetle transfer).**
   No new financial logic is added to `access-promo-service`, `auth-service`, or any client.
3. **Idempotency is mandatory.** Retrying a redemption must not consume the
   invite twice nor issue the gift twice. The Claim table already enforces this
   with `uq_user_gift_claims_user_code (user_id, gift_code)`; the invite
   consumption must be equally atomic in `access-promo-service`.
   *Verified in STB-01:* the generic grant capability does **not** satisfy this —
   a replay and five concurrent calls each produced an additional bucket. It is
   therefore kept fail-closed rather than authorized.
4. **Gateway enforcement is required.** Beta access must be enforced at the
   edge, not only by client routing, so that a direct API call cannot bypass it.
5. **Clear messages are part of the contract.** Invalid, expired, already-used
   and capacity-exhausted codes must each map to a distinct machine-readable
   `reason` (AIP-193 / RFC 7807) with a localized message, not a single generic
   failure.
6. **The prompt survives onboarding.** The initial prompt is carried through
   login and activation and arrives in the studio as a **draft only**; it is
   never auto-sent (B07 / D02).

## 4. Measured gaps as of 2026-10-14

The following were reproduced on the running system, not inferred from source
reading alone.

| Gap | Evidence |
|---|---|
| **G-A. No beta access check.** A brand-new authenticated user proceeds straight into the studio with no gate. | `GET /api/v1/me/context` with a new-user session returned `200` with `workspaces: []`; the studio rendered normally. |
| **G-B. No invite endpoint exists.** No HTTP or gRPC route accepts an invite code. | `quota-service` HTTP routes are only `pricing`, `estimate`, `grant`; gRPC service has no claim/invite RPC. |
| **G-C. Invite validation, capacity ceiling and single-use are test-only.** | `LimitedBetaGatekeeper`, `ErrBetaCapacityReached` exist only in `api/services/quota-service/tests/live/beta_invite_onboarding_live_test.go`. |
| **G-D. The gift Claim engine is unreachable over the network.** `ClaimUserGift` exists in production `service.go` but has no RPC. | No `rpc` for claim in `contracts/lemmo/v1/quota.proto`; all `user_gift_claims` rows in the database belong to `user-live-*` test identities. |
| **G-E. Fabricated client-side redemption screen.** The studio settings "Promo Code" panel invented a 250-credit promo locally on submit and showed success without any backend call. | `app/src/modules/settings/components/panels/PromoPanel.tsx` (pre-fix): hardcoded promo array plus a `handleApplyPromo` that only pushed local state. |
| **G-F. Gateway does not enforce beta access.** The edge enforcer checks session and workspace membership only. | `api/infra/gateway/config/kong.yml` global plugins `lemmo-ip-guard` and `lemmo-access-enforcer`; no beta-access rule. |
| **G-G. A new user is locked out of their own workspace.** Membership exists in Postgres but the Redis membership-version projection is never written by any production component, so the edge answers 403. | New user `17faa4b2-…` owned workspace `9e57c5ce-…`; `workspace_memberships` had the `owner` row; `lemmo:membership:version:<ws>:<user>` was empty; every scoped request returned `403 ERROR_REASON_WORKSPACE_FORBIDDEN`; after seeding the key manually the same request returned `200`. |
| **G-H. `degraded` conflates "no workspace" with "financial outage".** | A new user with no workspace received `entitlements.status = "degraded"`, which the studio renders as an unknown balance and a blocked Generate button, instead of an onboarding state. |

## 5. Remediation ownership

| Gap | Package | Action |
|---|---|---|
| G-I | **STB-01** | **Done (pending independent review):** HTTP route removed, gRPC grant fail-closed behind a version-controlled policy, fabricated amount default removed, regression + isolated live tests added. |
| G-A, G-B, G-C, G-D, G-F | **P06** (beta access) | Add the invite contract, the responsible service endpoint, atomic consumption, capacity ceiling, distinct error reasons, and edge enforcement. |
| G-E | **P08** (studio integrity) | **Fixed in this pass** — the panel no longer simulates redemption. |
| G-G | **P06 / gateway membership projection** | Provide the production writer for the membership-version projection; manual seeding is a dev-only workaround. |
| G-H | **P08** (context contract) | Split the context readiness contract so "no workspace" is an onboarding state distinct from financial `degraded`. |

## 6. Resolved ownership decision (2026-10-23) — G-A..G-D unblocked

**Decision:** the permanent owner of beta invitation, beta capacity, single-use
consumption, and credit-promo rules is **`access-promo-service`** (D-53,
[ADR-025](../01-architecture/decisions/ADR-025-access-promo-service-ownership.md)).
The financial effect remains exclusively in `quota-service` via the Claim engine
(D-03). **P-3 is closed**; the previous open question is history.

- The baseline text ("Beta access owner must be determined in B01; new service
  name is not predetermined") is **superseded** as of 2026-10-23.
- This decision fixes **ownership and boundaries only**. API, data model, event
  contract, capacity source, and atomic redeem+claim behaviour are designed in
  the implementation task **now that ADR-025 is approved**; no code may start before
  that implementation task.
- Stages 2–5 must still not be closed by client-side behaviour; the studio only
  renders the contract and calls the owner service.
- Reference: [MVP Decision Register (DOC-GOV-004)](../09-governance/decision-register.md#d-03), [D-53](../09-governance/decision-register.md#d-53), and [ADR-025](../01-architecture/decisions/ADR-025-access-promo-service-ownership.md).

## دامنه جاری MVP — دستور مالک محصول 2026-10-15

توالی تحویل در [رودمپ اصلی](./roadmap.md) نسخه ۵ است: تشخیص‌پذیری → مالکیت دائمی و بک‌اند ورود/دعوت/اعتبار → چت و تولید تصویر با زبان طبیعی و command → آماده‌سازی فرانت بر اساس قرارداد → اتصال سرتاسری → عرضه محدود. هیچ سرویس مسئولیت دامنه دیگر را موقتاً نمی‌پذیرد. Quota مالک فعلی Wallet و اثر مالی است؛ نام Wallet به معنی تصویب سرویس تازه نیست. **مالک دائمی قواعد دعوت/ظرفیت/پروموی اعتباری از ۲۰۲۶-۱۰-۲۳ `access-promo-service` است (D-53، [ADR-025](../01-architecture/decisions/ADR-025-access-promo-service-ownership.md)).** سرویس جدید فقط با اثبات خلأ دامنه و ثبت قرارداد/استقرار/مالک داده ایجاد می‌شود. عبارت «مالک دعوت/Promo هنوز تصویب نشده» در نسخه‌های پیشین **سابقه** است و دیگر جاری نیست.

عبارت مالک Auth/Workspace در تسک تاریخی P06 با ابهام ثبت‌شده در سند مالکیت بتا سازگار نیست و اثبات تصویب نهایی مالکیت تلقی نمی‌شود؛ تعیین تکلیف آن ورودی مرحله ۲ است. تا آن زمان مسئولیت موقت اضافه نمی‌شود. متن قبلی این اسناد و گزارش‌ها شاهد تاریخی است، نه مجوز اجرای مالکیت مبهم.

## 7. Ratified Architecture Decisions (D-68 to D-73) — Access & Promo System

Following the ratification of ADR-025 and architectural decisions [D-68 to D-73](../09-governance/decision-register.md):

1. **Client & Internal API Contracts (D-68):** External client surface routes through Kong: `POST /api/v1/promos/claim` (with mandatory `Idempotency-Key` header) and `GET /api/v1/promos/validate/{code}`. Internal service communications use gRPC with idempotency keys; consumption events are published via RabbitMQ.
2. **Data Model & Lifecycle (D-69):** Invite codes are stored in `invite_codes` with secure SHA-256 code hashes, status lifecycle, usage caps, and expiration timestamps. User redemptions are recorded in `invite_code_redemptions` with a unique index preventing multi-use.
3. **Beta Capacity Ceiling (D-70):** Beta user capacity limits are driven by version-controlled `config/default.yaml` with environment override capability via `BETA_MAX_CAPACITY`.
4. **Atomic Redemption & Claim Coordination (D-71):** Atomic coordination between invite redemption and credit claim uses the Transactional Outbox pattern, with deterministic idempotency keys (`Idempotency-Key = user_id + code_hash`) ensuring safe replay and retry behavior.
5. **Workspace vs Beta Invite Domain Decoupling (D-72):** Strict domain boundary is maintained: workspace membership invites belong exclusively to `workspace-service`, while beta platform access invites belong exclusively to `access-promo-service`.
6. **Admin & Operational Tooling (D-73):** Phase 1 admin operations and code generation are managed through `lemmo-cli` subcommands and database management scripts; web-based admin dashboards are deferred to post-beta.
