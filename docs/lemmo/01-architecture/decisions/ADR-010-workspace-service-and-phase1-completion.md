| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | ADR-010: Workspace Service Architecture, Multi-Tenancy Governance, and Phase 1 Milestone Gate 5 Acceptance |
| **Title (FA)** | ADR-010: معماری سرویس فضاهای کاری، مدل چندمستأجری و معیارهای پذیرش گیت ۵ و اتمام فاز ۱ |
| **ID** | DOC-ARCH-010-ADR |
| **Category** | `architecture` |
| **Status** | `Approved` |
| **Owner** | Core Architecture & Backend Team |
| **Last Updated** | 2026-09-30 |
| **Summary (EN)** | Ratified architectural decision for workspace-service, lemmo_workspace database schema with on_wallet_empty, provisioning state pattern for wallet creation, dual-adapter IAM permission manager, configurable invitation TTL, and 9-step E2E integration test closing Phase 1. |
| **Summary (FA)** | تصمیم مصوب معماری پیرامون سرویس فضاهای کاری، اسکیمای دیتابیس lemmo_workspace با ستون on_wallet_empty، الگوی وضعیت provisioning برای ساخت والت، آداپتور دوگانه مجوزهای IAM، انقضای کانفیگ‌پذیر دعوت‌نامه و آزمون ۹ مرحله‌ای E2E جهت بستن فاز ۱. |
| **Tags** | `adr`, `architecture`, `workspace-service`, `multi-tenancy`, `iam`, `gate5`, `phase1` |

---

# ADR-010: معماری سرویس فضاهای کاری، حاکمیت چندمستأجری و بسته شدن فاز ۱ بک‌اند

## ۱. زمینه و هدف (Context)

با نهایی‌سازی و تایید استیج ۸ (سرویس‌های سهمیه و دفترکل کردیت)، پلتفرم بک‌اند Lemmo به مرحله پایانی فاز اول نقشه راه یعنی **استیج ۹: پیاده‌سازی `workspace-service` و بستن رسمی Milestone Gate 5** رسید.
سرویس فضاهای کاری دهمین میکروسرویس از بسته ۱۰ سرویس مصوب فاز ۱ است که نقش مرز سازمان‌ها (Tenants)، گروه‌های کاری، عضویت، احراز دسترسی پروژه‌ها و ارتباط با کیف‌پول سازمانی را بر عهده دارد. برای یکپارچه‌سازی بدون ابهام این سرویس با اکوسیستم موجود، تصمیمات زیر پیرامون پورت‌ها، اسکیما، تعاملات مالی، الگوهای تاب‌آوری و آزمون سرتاسری به تصویب رسید.

---

## ۲. تصمیمات مصوب معماری (Decisions)

### ۲.۱. تخصیص پورت‌ها و هویت شبکه (OQ-015)
- **پورت gRPC:** `50060`
- **پورت HTTP Gateway:** `8089`
- **نام کانتینر رسمی:** `lemmo-svc-workspace`
- **استقرار:** تابع الگوی مصوب ADR-009 در `services/workspace-service/deploy/compose.yaml` که از طریق `include:` در فایل ریشه `infra/compose/dev.yml` فراخوانی می‌شود.

### ۲.۲. پایگاه داده و اسکیمای `lemmo_workspace` (OQ-016)
سرویس مالک انحصاری دیتابیس `lemmo_workspace` است. مایگریشن اولیه `000001_init_workspace_schema.up.sql` شامل ۴ جدول تفکیک‌شده به شرح زیر است:
1. **جدول `workspaces`:**
   - `workspace_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `tenant_id VARCHAR NOT NULL`
   - `name VARCHAR NOT NULL`
   - `slug VARCHAR UNIQUE NOT NULL`
   - `type VARCHAR NOT NULL` (مقادیر: `PERSONAL`, `TEAM`)
   - `status VARCHAR NOT NULL DEFAULT 'provisioning'` (مقادیر: `provisioning`, `active`, `suspended`)
   - `owner_user_id VARCHAR NOT NULL`
   - `payer_policy VARCHAR NOT NULL DEFAULT 'member_pays'` (مقادیر: `member_pays`, `workspace_pays`, `hybrid`)
   - `on_wallet_empty VARCHAR NOT NULL DEFAULT 'block'` (مقادیر: `block`, `member_fallback`) — **ستون رسمی جهت مدیریت رفتار اتمام اعتبار سازمان**
   - `monthly_credit_ceiling BIGINT NOT NULL DEFAULT 0`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
2. **جدول `workspace_memberships`:**
   - `membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE`
   - `user_id VARCHAR NOT NULL`
   - `role VARCHAR NOT NULL` (مقادیر: `owner`, `admin`, `editor`, `runner`, `viewer`)
   - `status VARCHAR NOT NULL DEFAULT 'active'` (مقادیر: `active`, `suspended`)
   - `joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
   - قید یکتایی: `UNIQUE(workspace_id, user_id)`
3. **جدول `workspace_invitations`:**
   - `invitation_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE`
   - `inviter_user_id VARCHAR NOT NULL`
   - `invitee_email VARCHAR NOT NULL`
   - `role VARCHAR NOT NULL`
   - `token_hash VARCHAR NOT NULL UNIQUE` (هش SHA-256)
   - `status VARCHAR NOT NULL DEFAULT 'pending'` (مقادیر: `pending`, `accepted`, `rejected`, `expired`)
   - `expires_at TIMESTAMPTZ NOT NULL`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
4. **جدول `workspace_settings`:**
   - `workspace_id UUID PRIMARY KEY REFERENCES workspaces(workspace_id) ON DELETE CASCADE`
   - `allowed_models JSONB NOT NULL DEFAULT '[]'`
   - `require_admin_approval BOOLEAN NOT NULL DEFAULT false`
   - `default_resolution VARCHAR NOT NULL DEFAULT '1024x1024'`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### ۲.۳. قراردادهای مرجع Protobuf (OQ-017)
فایل `contracts/lemmo/v1/workspace.proto` شامل متدهای استاندارد زیر تدوین می‌شود:
- **مدیریت فضاهای کاری:** `CreateWorkspace`, `GetWorkspace`, `UpdateWorkspace`, `DeleteWorkspace`, `ListUserWorkspaces`
- **مدیریت اعضا و دعوت‌نامه‌ها:** `InviteMember`, `AcceptInvitation`, `RejectInvitation`, `RemoveMember`, `UpdateMemberRole`, `ListWorkspaceMembers`
- **حاکمیت سیاست و تنظیمات:** `GetWorkspaceSettings`, `UpdateWorkspaceSettings`, `UpdateWorkspacePayerPolicy`
- اینام‌های رسمی: `WorkspaceType`, `WorkspaceRole`, `InvitationStatus`, `PayerPolicy`, `OnWalletEmptyAction`.

### ۲.۴. الگوی تجرید مدیریت دسترسی IAM / Keto (OQ-018)
مشابه الگوی موفق `FinancialLedgerPort` در استیج ۸، دسترسی‌ها و کنترل نقش‌ها از طریق یک اینترفیس انتزاعی در لایه پورت‌ها پیاده‌سازی می‌شود:
```go
type PermissionManager interface {
    AssignRole(ctx context.Context, tenantID, userID, role string) error
    RevokeRole(ctx context.Context, tenantID, userID, role string) error
    CheckAccess(ctx context.Context, tenantID, userID, requiredRole string) (bool, error)
}
```
- **آداپتور محلی (`LocalMembershipAdapter`):** پیاده‌سازی پیش‌فرض که مستقیماً جداول `workspace_memberships` را در دیتابیس بررسی کرده و از هدر `X-Mock-Roles` در محیط محلی پشتیبانی می‌کند.
- **آداپتور Keto (`KetoPermissionAdapter`):** پیاده‌سازی بر پایه کلاینت gRPC/REST به Ory Keto که با تنظیم متغیر `KETO_ENDPOINT` فعال می‌شود.

### ۲.۵. تعامل با `quota-service` و الگوی وضعیت Provisioning (OQ-019)
برای ساخت کیف‌پول سازمانی بدون ایجاد وابستگی شکننده همگام دوفازی:
1. فضای کاری ابتدا با وضعیت `status = 'provisioning'` در دیتابیس ثبت می‌شود.
2. سرویس تلاش می‌کند از طریق فراخوانی همگام gRPC به `quota-service` کیف‌پول سازمان (`OwnerTypeWorkspace`) را بسازد.
3. همزمان رویداد رسمی `workspace.created` به RabbitMQ (در صف `lemmo.events`) منتشر می‌شود.
4. در صورت موفقیت gRPC، وضعیت بلافاصله به `active` ارتقا می‌یابد. در صورت عدم دسترسی موقت به `quota-service`، کانسیومر رویداد یا فرآیند Retry وضعیت را پس از آماده‌سازی کیف‌پول به `active` تغییر می‌دهد.
5. **قاعده حاکمیتی:** تا زمانی که وضعیت سازمان `provisioning` است، هیچ‌گونه اجرای گراف یا تراکنش اعتباری در آن مجاز نیست.
6. تغییرات سیاست پرداخت (`UpdateWorkspacePayerPolicy`) نیز علاوه بر به‌روزرسانی محلی، رویداد `workspace.payer_policy_updated` را به صف پیام ارسال می‌کند.

### ۲.۶. تمایز فضای شخصی و سازمانی (OQ-020)
- **فضای شخصی (`PERSONAL`):** در زمان عضویت اولیه کاربر ساخته می‌شود، غیرقابل حذف است، امکان دعوت عضو جدید ندارد، سیاست پرداخت آن ثابت (`member_pays`) و `on_wallet_empty` آن همواره `block` است.
- **فضای سازمانی (`TEAM`):** توسط کاربر ایجاد می‌شود، دارای اعضای متعدد با نقش‌های مشخص است، سیاست پرداخت و اکشن کیف‌پول خالی (`block` یا `member_fallback`) در آن توسط مالک/ادمین قابل تغییر است.

### ۲.۷. امنیت دعوت‌نامه‌ها و انقضای کانفیگ‌پذیر (OQ-021)
- تولید توکن تصادفی با امنیت بالا (`crypto/rand`).
- ذخیره‌سازی صرفاً به صورت هش امن SHA-256 در فیلد `token_hash`.
- **منع هاردکد مدت انقضا (DOC-ARCH-009):** مدت اعتبار توکن دعوت‌نامه نباید به صورت `const` در کد نوشته شود؛ این مقدار از کلید پیکربندی `invitation_expiry_duration` در `default.yaml` (با پیش‌فرض `168h` معادل ۷ روز) و متغیر محیطی `INVITATION_EXPIRY_DURATION` خوانده می‌شود.

### ۲.۸. آزمون جامع سرتاسری و معیار پذیرش Milestone Gate 5 (OQ-022)
بسته شدن رسمی فاز اول بک‌اند مستلزم قبولی تست سرتاسری `tests/e2e/phase1_gate5_test.go` در ۹ مرحله متوالی و پیوسته است:
1. ساخت فضای سازمانی (`TEAM`) با سیاست `workspace_pays` در `workspace-service`.
2. ارسال دعوت‌نامه برای عضو جدید با نقش `editor` و پذیرش دعوت‌نامه با توکن معتبر.
3. شارژ اولیه کیف‌پول سازمانی در `quota-service`.
4. ایجاد پروژه و گراف نود هوش مصنوعی در `project-service` ذیل همین سازمان.
5. اجرای گراف در `orchestrator-service` و قفل موفق اعتبار از کیف‌پول سازمان.
6. توزیع تسک در صف `job-service` و فراخوانی ورکر تولید تصویر در `image-service`.
7. ذخیره پایدار تصویر در MinIO (`storage-service`) و تسویه موفق اعتبار در `quota-service` و ثبت در لجر ۱۹ فیلدی `usage-service`.
8. شبیه‌سازی اتمام موجودی والت سازمان و مسدود شدن قطعی اجرای عضو با خطای `WORKSPACE_WALLET_EMPTY` (تایید رفتار `on_wallet_empty = block`).
9. **آزمون فالبک مدل و قاعده `min(tier)`:** شبیه‌سازی خطای پراویدر اصلی، سوییچ خودکار به مدل فالبک در `model-router-service`، و اعتبارسنجی کسر وجه نهایی بر اساس کمینه نرخ مدل درخواستی و فالبک طبق تصمیم مصوب A3.1.

---

## ۳. پیامدها و اثرات (Consequences)
- کلیه ۱۰ میکروسرویس فاز اول طبق نقشه‌راه تکمیل شده و سیستم به وضعیت جامع چندمستأجری ایزوله با مرزهای مشخص مالی و اعتباری ارتقا می‌یابد.
- بستر کاملاً آماده اتصال زنده فرانت‌اند (`NEXT_PUBLIC_API_MODE=live`) و استقرار نهایی در محیط سرورهای تست خواهد بود.
