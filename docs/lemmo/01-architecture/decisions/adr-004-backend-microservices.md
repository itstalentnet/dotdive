| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | ADR-004: Proposed Backend Service and Tenant Boundaries |
| **Title (FA)** | ADR-004: پیشنهاد مرز سرویس‌ها و مدل چندمستأجری بک‌اند |
| **ID** | DOC-ARCH-004 |
| **Category** | `architecture` |
| **Status** | `Draft` |
| **Owner** | Backend & Platform Team |
| **Last Updated** | 2026-09-23 |
| **Summary (EN)** | Proposed decision record for independent backend services, tenant/project authorization and durable AI execution; pending architecture review. |
| **Summary (FA)** | ثبت پیشنهاد استقلال سرویس‌های بک‌اند، مجوز پروژه‌ای و اجرای پایدار هوش مصنوعی؛ در انتظار بررسی معماری. |
| **Tags** | `adr`, `backend`, `microservices`, `multi-tenancy` |

---

# ADR-004: پیشنهاد مرز سرویس‌ها و مدل چندمستأجری بک‌اند

## زمینه

فرانت لمو مسیر تولید AI، بوم، فایل، اعضا، افزونه و اعتبار را نشان می‌دهد؛ درخواست ۲۰۲۶-۰۹-۲۳ هدف میکروسرویس و دعوت تیم به پروژه را صریح می‌کند. `api` هنوز پیاده‌سازی دامنه ندارد. [ممیزی فرانت](../../backend/frontend-requirements-audit.md) وضعیت مشاهده‌شده و [ارزیابی نونز](../../backend/dotdive-reuse-assessment.md) محدودیت انتقال معماری قبلی را ثبت کرده‌اند.

## تصمیم پیشنهادی — هنوز تصویب نشده

1. سرویس‌ها بر اساس bounded context، با داده و استقرار مستقل مطابق [DOC-BE-003](../../backend/architecture.md) ساخته شوند. مونورپو به معنای shared database یا release اجباری همزمان نیست.
2. Workspace مرز tenant و billing، Project مرز همکاری، Team گروه اعضای همان tenant باشد. احراز هویت از مجوز منبع جدا و مدل دسترسی مطابق [DOC-BE-004](../../backend/auth-and-workspace.md) باشد.
3. اجرای AI پایدار و asynchronous با outbox/inbox، idempotency و Saga رزرو/تسویه اعتبار باشد؛ frontend state مرجع Job نیست.
4. schema-driven plugins و SDK واحد مطابق تصمیم Active فرانت حفظ شوند؛ استقلال افزونه به قرارداد نسخه‌دار و runtime مناسب متکی باشد، طبق [DOC-BE-008](../../backend/plugin-contract.md).
5. انتخاب‌های زبان، IdP، broker، استقرار و سیاست‌های تجاری طبق گیت‌های [DOC-BE-009](../../backend/decision-register.md) بررسی شوند. این ADR بدون امضای تیم آن انتخاب‌ها را قفل نمی‌کند.

## گزینه‌ها

کپی کامل نونز به دلیل تفاوت دامنه و نبود مدل مالکیت پروژه کافی نیست. مونولیت ماژولارِ پیش‌نویس اولیه لمو هزینه عملیات کمتری داشت اما استقلال استقرار مورد درخواست فعلی را تأمین نمی‌کند. سرویس جدا برای هر entity/tool وابستگی و هزینه عملیات بی‌دلیل می‌سازد. پیشنهاد حاضر مرزهای درشت و قابل توسعه را انتخاب می‌کند.

## پیامدها

مزیت: تیم‌ها، workerها و دامنه‌ها می‌توانند مستقل منتشر و مقیاس‌دهی شوند؛ مرز داده و مجوز روشن است. هزینه: تراکنش توزیع‌شده، latency وابستگی، replay، reconciliation، observability و on-call از ابتدا باید ساخته شوند. شکست یک جزء نباید به fail-open امنیتی یا اثر مالی تکراری منجر شود.

این سند مرجع جزئیات تکراری ایجاد نمی‌کند؛ اسناد ارجاع‌شده مالک قرارداد مربوط‌اند. هیچ ADR مصوب تاریخی یا قاعده Active فرانت با این پیش‌نویس منسوخ نمی‌شود. قبل از ارتقا به Approved، تصمیم‌های D01–D09 اصلی و T01–T06، مسئول اجرا و گیت‌های پذیرش ثبت شوند.
