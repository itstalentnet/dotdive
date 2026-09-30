| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Backend Phased Roadmap, Milestone Gates & Service Execution Plan |
| **Title (FA)** | نقشه راه پیاده‌سازی گام‌به‌گام بک‌اند، گیت‌های کیفیت و برنامه اجرایی سرویس‌ها |
| **ID** | DOC-BE-005 |
| **Category** | `backend` |
| **Status** | `Approved` |
| **Owner** | Backend Team / @platform |
| **Last Updated** | 2026-09-28 |
| **Summary (EN)** | Authoritative backend roadmap defining Phase 1 MVP services (10 services), reordered stages 5-8, milestone quality gates (Gate 0-4), and MVP hooks. |
| **Summary (FA)** | نقشه راه مرجع پیاده‌سازی بک‌اند شامل ۱۰ سرویس فاز ۱ (MVP)، ترتیب اصلاح‌شده مراحل ۵ تا ۸، گیت‌های کنترل کیفیت (Gate 0 تا 4) و قلاب‌های توسعه‌پذیری MVP. |
| **Tags** | `backend`, `roadmap`, `milestones`, `architecture`, `services`, `mvp` |

---

# نقشه راه پیاده‌سازی گام‌به‌گام بک‌اند (Backend Roadmap & Quality Gates)

> **اصل بنیادین حاکمیت معماری (Governance Invariant):**  
> این سند، منبع واحد حقیقت (SSOT) برای گام‌های اجرایی، توالی تحویل سرویس‌ها و گیت‌های کنترل کیفیت در مخزن `api/` است. تمامی مراحل پیاده‌سازی باید دقیقاً با استانداردهای قراردادهای Proto ([DOC-BE-003](./contracts.md))، اصول کدنویسی Go Clean Architecture ([DOC-BE-004](./style-guide.md)) و خط مشی رسانه‌ها ([DOC-BE-006](./media-and-model-pipeline.md)) همگام باشند.

---

## ۱. کاتالوگ رسمی ۱۰ سرویس فاز ۱ (Phase 1 MVP Scope)

فاز ۱ پلتفرم Lemmo منحصراً شامل ۱۰ میکروسرویس زیر است. کلیه سرویس‌های دیگر (`version`, `subscription`, `plugin-runtime`, `chat`, `audit`, `notification`) مربوط به فازهای ۲، ۲.۵ و ۳ هستند:

| # | سرویس | مسئولیت و دامنه | وضعیت پیاده‌سازی |
|---|---|---|---|
| ۱ | `project-service` | ذخیره و مدیریت پروژه‌های بوم، قفل همزمانی (Optimistic Locking)، نگهداری داده‌های JSONB دیزاین و ورک‌فلو | ✅ پیاده‌شده و تست‌شده (Stage 3) |
| ۲ | `node-registry-service` | رجیستری مرکزی انواع نودها و ابزارها، پورت‌های پویا (`var:`, `lora:`, `control:`) و کاتالوگ داخلی | ✅ پیاده‌شده و تست‌شده (Stage 4) |
| ۳ | `orchestrator-service` | موتور ارزیابی و اجرای گراف‌های DAG، مرتب‌سازی توپولوژیک، ولیدیشن اتصالات و رزرو اعتبار با `QuotaChecker` | ✅ پیاده‌شده و تست‌شده (Stage 5) |
| ۴ | `job-service` | مدیریت صف‌های اجرایی ناهمگام، استیت ماشین وضعیت‌های جاب و انتشار رویدادها در RabbitMQ | ✅ پیاده‌شده و تست‌شده (Stage 6) |
| ۵ | `storage-service` | مدیریت باکت‌های S3 در MinIO، دریافت امن مدیا از ورکرها، صدور Presigned URLs و متد تمدید امضا | ✅ پیاده‌شده و تست‌شده (Stage 6) |
| ۶ | `model-router-service` | رجیستری ۴ لایه‌ای پراویدرها، مسیریابی هوشمند، فالبک ۳ سطحی، Token Bucket در Redis و circuit breaker | ✅ پیاده‌شده و تست‌شده (Stage 7) |
| ۷ | `image-service` | ورکر ناهمگام سبک ابری جهت فراخوانی APIهای Fal/Replicate/OpenAI، پولینگ/وبهوک و آپلود به S3 | ✅ پیاده‌شده و تست‌شده (Stage 7) |
| ۸ | `quota-service` | مدیریت سهمیه‌ها و اعتبارسنجی حق اجرا (Entitlement)، رزرو دوسفره اعتبار و مسدودسازی کیف‌پول خالی | ✅ پیاده‌شده و تست‌شده (Stage 8) |
| ۹ | `usage-service` | سیستم دفترکل تغییرناپذیر (Credit Ledger) با مدل Bucket، ردیابی هزینه‌های دلاری پراویدر و محاسبه حاشیه سود | ✅ پیاده‌شده و تست‌شده (Stage 8) |
| ۱۰ | `workspace-service` | مدیریت ورک‌اسپیس‌ها، تننت‌ها، نقش‌های کاربری پروژه و تنظیم سیاست‌های پرداخت‌کننده (Payer Policy) | 📋 در صف اجرا (Stage 9 — پایان فاز ۱) |

---

## ۲. توالی مهندسی مراحل ۵ تا ۹ (Execution Stages)

به منظور جلوگیری از بن‌بست‌های وابستگی (به‌ویژه نیاز حیاتی ورکر تصویر به فضای ذخیره‌سازی S3 پیش از تولید اولین تصویر)، توالی مراحل به شرح زیر تثبیت شده است:

```mermaid
flowchart LR
    S5["مرحله ۵ ✅<br>orchestrator-service<br>(DAG Engine + QuotaChecker)"] --> S6["مرحله ۶ ✅<br>job-service + storage-service<br>(RabbitMQ Queue + MinIO S3)"]
    S6 --> S7["مرحله ۷ ✅<br>model-router + image-service<br>(Generic REST Adapter + Cloud Worker)"]
    S7 --> S8["مرحله ۸ ✅<br>quota-service + usage-service<br>(Credit Ledger + Payer Policy)"]
    S8 --> S9["مرحله ۹ 📋<br>workspace-service<br>(Multi-Tenancy + Gate 5)"]
```

### مرحله ۵: موتور ارکستراسیون گراف (`orchestrator-service`)
- **دامنه:**
  - پیاده‌سازی معماری Clean Architecture در `services/orchestrator-service/`.
  - اعتبارسنجی گراف و کشف دورها با الگوریتم Kahn (Topological Sorting).
  - پیاده‌سازی اینترفیس `QuotaChecker` جهت بررسی اولیه سهمیه پیش از ثبت جاب.
  - پشتیبانی از پورت‌های پویا (`dynamic_prefix`) و تطبیق نوع داده‌ها (Type Coercion Allowlist).
  - تولید تسک‌های اجرایی نودها و ارسال به `job-service`.

### مرحله ۶: مدیریت جاب‌ها و ذخیره‌سازی اشیاء (`job-service` + `storage-service`)
- **دامنه:**
  - **job-service:** استیت ماشین وضعیت‌های جاب (`PENDING`, `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `CANCELLED`)، توزیع در صف‌های RabbitMQ و استریم رویدادهای پیشرفت لحظه‌ای با SSE.
  - **storage-service:** راه‌اندازی کلاینت MinIO، اندپوینت آپلود، تولید Presigned URLs برای دانلود امن (TTL ۱۵ دقیقه) و اندپوینت تمدید امضا (`POST /assets/{id}/sign`) در خطای ۴۰۳.

### مرحله ۷: مسیریابی ابری و ورکر تصویر (`model-router-service` + `image-service`)
- **دامنه:**
  - **model-router-service:** کاتالوگ مدل‌ها، رجیستری ۴ لایه‌ای (Provider, ProviderInstance, Model, RoutingGroup)، آداپتور عمومی اعلانی (Generic REST Adapter) بدون نیاز به کد برای پراویدرهای استاندارد، الگوریتم توکن‌باکت در Redis برای ریت‌لیمیت حساب پلتفرم، و فالبک ۳ سطحی (Instance -> Model -> Equivalence Group).
  - **image-service:** ورکر کلاینت ابری مستقل برای فراخوانی APIهای ابری (Fal.ai, Replicate)، شنود وب‌هوک با امضای HMAC یا Fallback به Polling در محیط محلی، دانلود خروجی و آپلود به `storage-service`.

### مرحله ۸: اقتصاد و دفترکل کردیت (`quota-service` + `usage-service`) ✅
- **وضعیت:** تکمیل ۱۰۰٪ و تست‌شده (Milestone Gate 4 Closed)
- **دامنه پیاده‌شده:**
  - سیستم دفترکل تغییرناپذیر کردیت (Append-Only Credit Ledger) با مدل Bucket و تاریخ انقضا (`expires_at`).
  - الگوی دو فازی Reserve و Settle با بازگشت وجه در صورت شکست (Compensating Transaction) روی موتور `financial-ledger` (ADR-009).
  - سیاست پرداخت‌کننده (Payer Policy) بر اساس ورک‌اسپیس محل پروژه (`member_pays`, `workspace_pays`, `hybrid`).
  - توقف قطعی با خطای `WORKSPACE_WALLET_EMPTY` در صورت خالی بودن کیف‌پول سازمان و مدیریت حالت opt-in عضو.
  - اعمال کارمزد پلتفرم روی پراویدرهای کاستوم کاربر (`byo_fee`).
  - ردیابی هزینه دلاری پراویدرها (`provider_cost_micros`) و محاسبه حاشیه سود پلتفرم.

### مرحله ۹: مدیریت فضاهای کاری و سازمان‌ها (`workspace-service`) 📋
- **وضعیت:** در صف اجرا (Final Step of Phase 1 — Milestone Gate 5 مصوب [ADR-010](../01-architecture/decisions/ADR-010-workspace-service-and-phase1-completion.md))
- **دامنه:**
  - راه‌اندازی سرویس دهم با پورت‌های gRPC `50060` و HTTP `8089` (کانتینر `lemmo-svc-workspace`).
  - پایگاه داده اختصاصی `lemmo_workspace` با ۴ جدول: `workspaces` (با ستون رسمی `on_wallet_empty` و وضعیت `provisioning`)، `workspace_memberships`، `workspace_invitations` و `workspace_settings`.
  - الگوی تاب‌آوری Provisioning والت در تعامل همگام gRPC با `quota-service` و انتشار رویدادهای `workspace.created` و `workspace.payer_policy_updated` به RabbitMQ.
  - تجرید کنترل دسترسی‌ها با اینترفیس انتزاعی `PermissionManager` (آداپتور محلی `LocalMembershipAdapter` با پشتیبانی از `X-Mock-Roles` و آداپتور ریموت `KetoPermissionAdapter`).
  - تفکیک کامل رفتار فضاهای کاری شخصی (`PERSONAL`) و سازمانی (`TEAM`).
  - چرخه حیات امن دعوت‌نامه‌ها با توکن‌های تصادفی رمزنگاری‌شده، هش SHA-256 و انقضای کانفیگ‌پذیر (`invitation_expiry_duration`).
  - استقرار مستقل سرویس در `services/workspace-service/deploy/compose.yaml` ذیل قوانین ADR-009.

---

## ۳. پنج قلاب حیاتی توسعه‌پذیری (Mandatory MVP Hooks)

برای ممانعت از بازنویسی‌های پرهزینه در فازهای ۲ و ۳، این ۵ قلاب در کدهای فاز ۱ الزامی هستند:
1. **مدل Bucket و `expires_at` در لجر:** ✅ پیاده‌سازی کامل سطل‌ها و کسر با الگوریتم FEFO در `quota-service` و `usage-service`.
2. **فیلد `actor_type` در لجر و گیت‌وی:** ✅ پشتیبانی از مقادیر `USER`، `API_KEY` و `SYSTEM` در اسکیما ۱۹ فیلدی دفترکل.
3. **انتشار رویداد `provider.call.completed`:** ✅ ثبت هزینه هر فراخوانی پراویدر ابری به میکرو‌دلار (`provider_cost_micros`).
4. **نگاشت خطای Content Policy و مرحله no-op:** ✅ نگاشت کدهای خطای پالیسی به `CONTENT_POLICY_VIOLATION_PROVIDER` و آزادسازی آنی اعتبار رزرو‌شده.
5. **حداقل بک‌آپ به عنوان شرط انتشار MVP (E4.6):** ✅ اسکریپت پشتیبان‌گیری استاندارد `tools/backup/db_backup.sh` برای هر ۱۰ پایگاه داده با سوییچ اعتبارسنجی `--verify`.

---

## ۴. گیت‌های کنترل کیفیت تحویل (Milestone Quality Gates)

```
[Gate 0: اسکلت Day 0] ✅ بسته شد
       │
       ▼
[Gate 1: پایداری پروژه و اعتبارسنجی MockAuth] ✅ بسته شد
       │
       ▼
[Gate 2: ارکستراسیون گراف و تفکیک تسک‌ها] ✅ بسته شد (پایان مرحله ۵)
       │
       ▼
[Gate 3: ایجاد صف جاب، ذخیره شیء و تولید تصویر نهایی] ✅ بسته شد (پایان مرحله ۷)
       │
       ▼
[Gate 4: چرخه کامل مالی، لجر اتمیک و آماده‌سازی انتشار MVP] ✅ بسته شد (پایان مرحله ۸)
       │
       ▼
[Gate 5: استقرار چندمستأجری، فضاهای کاری و بسته شدن نهایی فاز ۱] 📋 (پایان مرحله ۹)
```

- **معیار پذیرش Gate 2 (پایان مرحله ۵):** ✅ بسته شد.
- **معیار پذیرش Gate 3 (پایان مرحله ۷):** ✅ بسته شد.
- **معیار پذیرش Gate 4 (پایان مرحله ۸):** ✅ بسته شد (چرخه کامل رزرو و تسویه، لجر ۱۹ فیلدی تغییرناپذیر، خطای `WORKSPACE_WALLET_EMPTY`، Spike لجر مالی، و اسکریپت بک‌آپ).
- **معیار پذیرش Gate 5 (پایان مرحله ۹ — آزمون ۹ مرحله‌ای E2E در `tests/e2e/phase1_gate5_test.go`):**  
  بسته شدن نهایی و رسمی فاز ۱ کل پلتفرم بک‌اند مستلزم قبولی تست سرتاسری لایو در ۹ گام متوالی است:
  1. ساخت فضای سازمانی (`TEAM`) با سیاست `workspace_pays` در `workspace-service`.
  2. ارسال دعوت‌نامه برای عضو جدید با نقش `editor` و پذیرش دعوت با توکن معتبر.
  3. شارژ اولیه کیف‌پول سازمانی در `quota-service`.
  4. ایجاد پروژه و گراف نود هوش مصنوعی در `project-service` ذیل همین سازمان.
  5. اجرای گراف در `orchestrator-service` و قفل موفق اعتبار از کیف‌پول سازمان.
  6. توزیع تسک در صف `job-service` و فراخوانی ورکر تولید تصویر در `image-service`.
  7. ذخیره پایدار تصویر در MinIO (`storage-service`) و تسویه موفق اعتبار در `quota-service` و ثبت در لجر ۱۹ فیلدی `usage-service`.
  8. شبیه‌سازی اتمام موجودی والت سازمان و مسدود شدن قطعی اجرای عضو با خطای `WORKSPACE_WALLET_EMPTY` (تایید رفتار `on_wallet_empty = block`).
  9. **آزمون فالبک مدل و قاعده `min(tier)`:** شبیه‌سازی خطای پراویدر اصلی، سوییچ خودکار به مدل فالبک در `model-router-service`، و اعتبارسنجی کسر وجه نهایی بر اساس کمینه نرخ مدل درخواستی و فالبک طبق تصمیم مصوب A3.1.
