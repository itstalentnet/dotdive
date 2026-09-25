| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | ADR-004: Proposed Backend Service and Tenant Boundaries |
| **Title (FA)** | ADR-004: پیشنهاد مرز سرویس‌ها و مدل چندمستأجری بک‌اند |
| **ID** | DOC-ARCH-004 |
| **Category** | `architecture` |
| **Status** | `Approved` |
| **Owner** | Backend & Platform Team |
| **Last Updated** | 2026-09-26 |
| **Summary (EN)** | Decision record for independent backend services, tenant/project authorization and durable AI execution based on ratified backend specifications. |
| **Summary (FA)** | ثبت تصمیم استقلال سرویس‌های بک‌اند، مدل چندمستأجری و اجرای پایدار بر اساس معماری مصوب nons-api. |
| **Tags** | `adr`, `backend`, `microservices`, `multi-tenancy` |

---

# ADR-004: پیشنهاد مرز سرویس‌ها و مدل چندمستأجری بک‌اند

## زمینه

فرانت لمو مسیر تولید AI، بوم، فایل، اعضا، افزونه و اعتبار را نشان می‌دهد؛ هدف میکروسرویس و دعوت تیم به پروژه بر اساس معماری nons-api در [معماری بک‌اند](../../03-backend/architecture.md) ثبت شده است.

## تصمیم رسمی

1. سرویس‌ها بر اساس bounded context، با داده و استقرار مستقل مطابق [DOC-BE-001](../../03-backend/architecture.md) ساخته شوند. مونورپو به معنای shared database یا release اجباری همزمان نیست.
2. Workspace مرز tenant و billing، Project مرز همکاری، Team گروه اعضای همان tenant باشد. کاتالوگ سرویس‌ها و تفکیک مسئولیت‌ها مطابق [DOC-BE-002](../../03-backend/services.md) است.
3. اجرای AI پایدار و asynchronous با outbox/inbox، idempotency و ثبت اتمیک مصرف در صف‌های پیام باشد.
4. قراردادهای سیستم بر پایه Protobuf و پاکت رویدادها (EventEnvelope) طبق [DOC-BE-003](../../03-backend/contracts.md) تعریف شوند.
5. استانداردهای کدنویسی زبان Go، تنظیمات golangci-lint، پاکت خطا بر اساس AIP-193 و ساختار مایگریشن‌ها مطابق [DOC-BE-004](../../03-backend/style-guide.md) است.

## گزینه‌ها

کپی کامل نونز به دلیل تفاوت دامنه و نبود مدل مالکیت پروژه کافی نیست. مونولیت ماژولارِ پیش‌نویس اولیه لمو هزینه عملیات کمتری داشت اما استقلال استقرار مورد درخواست فعلی را تأمین نمی‌کند. سرویس جدا برای هر entity/tool وابستگی و هزینه عملیات بی‌دلیل می‌سازد. پیشنهاد حاضر مرزهای درشت و قابل توسعه را انتخاب می‌کند.

## پیامدها

مزیت: تیم‌ها، workerها و دامنه‌ها می‌توانند مستقل منتشر و مقیاس‌دهی شوند؛ مرز داده و مجوز روشن است. هزینه: تراکنش توزیع‌شده، latency وابستگی، replay، reconciliation، observability و on-call از ابتدا باید ساخته شوند. شکست یک جزء نباید به fail-open امنیتی یا اثر مالی تکراری منجر شود.

این سند مرجع جزئیات تکراری ایجاد نمی‌کند؛ اسناد ارجاع‌شده مالک قرارداد مربوط‌اند. هیچ ADR مصوب تاریخی یا قاعده Active فرانت با این پیش‌نویس منسوخ نمی‌شود. قبل از ارتقا به Approved، تصمیم‌های D01–D09 اصلی و T01–T06، مسئول اجرا و گیت‌های پذیرش ثبت شوند.
