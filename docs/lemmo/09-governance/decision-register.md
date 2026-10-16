| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | MVP Architecture & Governance Decision Register |
| **Title (FA)** | ماتریس رسمی تصمیم‌های معماری و حاکمیتی MVP |
| **ID** | DOC-GOV-004 |
| **Category** | `governance` |
| **Status** | `Active` |
| **Owner** | Senior Architect / Project Management |
| **Last Updated** | 2026-10-16 |
| **Summary (EN)** | Authoritative registry tracking all architectural decisions (D-01 to D-15), conflict resolutions (C-1 to C-5 approved by PM), and pending action items (P-1 to P-6) for Lemmo MVP. Links directly to SSOT documents and specifies publication targets. |
| **Summary (FA)** | جدول و ماتریس رسمی کلیه تصمیمات معماری مصوب (D-01 تا D-15)، وضعیت تعارض‌های مصوب (C-1 تا C-5)، مقاصد ثبت و انتشار، و پیگیری بندهای باز (P-1 تا P-6). |
| **Tags** | `governance`, `decisions`, `adr`, `mvp`, `matrix`, `ssot`, `conflicts` |

---

# ماتریس رسمی تصمیم‌های معماری و حاکمیتی MVP (Decision Register)

این سند مرجع یکپارچه و رسمی وضعیت تمامی تصمیمات راهبردی، فنی و حاکمیتی اتخاذشده در جلسات برنامه‌ریزی نسخه MVP پلتفرم Lemmo است. هیچ تسکی بدون ارجاع صریح به یکی از شناسه‌های این جدول مجاز به آغاز عملیات نیست.

---

## ۱. جدول ماتریس تصمیم‌ها و مقاصد انتشار (D-01 تا D-15)

| شناسه | موضوع تصمیم | وضعیت | پیوند به مرجع تصمیم | ثبت‌شده در (Destination SSOT) | تاریخ ثبت |
| :---: | :--- | :---: | :--- | :--- | :---: |
| | **D-01** | **بسته مرحله صفر (M0-01 تا M0-05):** لاگ JSON، استانداردهای خطا، ابزارهای make trace/doctor، تست‌های کنترل‌شده. | `تأییدشده` | [ADR-022 M0](../01-architecture/decisions/ADR-022-platform-reliability-and-observability.md) | [`03-backend/mvp-operational-readiness.md`](../03-backend/mvp-operational-readiness.md#۱۱۱-دامنه-مصوب-مرحله-۱-از-adr-022-تصمیم-d-01) §۱۱.۱ | ۲۰۲۶-۱۰-۱۶ |
| **D-02** | **قرارداد شناسه رهگیری:** هدر `traceparent` (W3C)، کد `request_id` برای کاربر، `x-trace-id` فقط روی لبه. | `تأییدشده` | [Style Guide](../03-backend/style-guide.md) | [`03-backend/mvp-operational-readiness.md`](../03-backend/mvp-operational-readiness.md#۱۱۲-قرارداد-شناسه-رهگیری-و-درگاه-لبه-تصمیم-d-02) §۱۱.۲ و [`style-guide.md`](../03-backend/style-guide.md#41-central-error-catalog-schema--unknown-error-invariants-decision-d-11) §۴.۱ | ۲۰۲۶-۱۰-۱۶ |
| **D-03** | **مالکیت دائمی سرویس دعوت و Promo:** منع مسئولیت موقت، محدودیت به چرخه عمر کد، اعمال مالی با Claim در Quota. | `منتظر ADR (P-3)` | [Beta Ownership](../03-backend/beta-invitation-and-gift-ownership.md) | [`03-backend/beta-invitation-and-gift-ownership.md`](../03-backend/beta-invitation-and-gift-ownership.md#6-open-question-requiring-a-decision-blocking-g-ag-d) §۶ و [`roadmap.md`](../03-backend/roadmap.md#۶-فاز-۳-صورت‌حساب-مانیتایزیشن-و-سیستم-اعلان‌ها-phase-3-roadmap) مرحله ۲۰ | ۲۰۲۶-۱۰-۱۶ |
| **D-04** | **نیت‌خوانی و هوش انسانی در چت:** متن آزاد با deepseek-flash؛ دستورها مستقیم؛ متن مبهم = سوال؛ تولید فقط با کلیک. | `تأییدشده` | [Agent Spec](../03-backend/agent-service-spec.md) | [`03-backend/agent-service-spec.md`](../03-backend/agent-service-spec.md#۷-الزامات-مصوب-d-04-مسیر-پردازش-متن-آزاد-و-فرمان‌ها-در-mvp) §۷ | ۲۰۲۶-۱۰-۱۶ |
| **D-05** | **خروج بوم از دامنه MVP:** تعویق بوم، ارکستراسیون گراف و ماک‌های setTimeout به پس از MVP. | `تأییدشده` | [Backend Roadmap](../03-backend/roadmap.md) | [`03-backend/roadmap.md`](../03-backend/roadmap.md#مرحله-17c) مرحله 17C، مدخل `DEBT-CANVAS-01` و معیار ۴ Gate 6 | ۲۰۲۶-۱۰-۱۶ |
| **D-06** | **هدیه، ظرفیت و شارژ مجدد:** حذف گردش تأیید ادمین؛ شارژ با کد؛ مقادیر از کانفیگ نسخه‌دار (بدون هاردکد). | `تأییدشده` | [Credit & Ledger](../03-backend/credit-and-ledger.md) | [`03-backend/credit-and-ledger.md`](../03-backend/credit-and-ledger.md#۱۰-الزامات-مصوب-d-07-و-وضعیت-یافته-f-4-در-بودجه-mvp) §۱۰ و [`roadmap.md`](../03-backend/roadmap.md) مرحله 17B بسته B08 | ۲۰۲۶-۱۰-۱۶ |
| **D-07** | **سیستم حسابداری و سقف بودجه پلتفرم:** سقف ماندگار ۲ دلار تجمعی در `quota-service` شامل تماس‌های Intent LLM. | `تأییدشده` | [Credit & Ledger](../03-backend/credit-and-ledger.md) | [`03-backend/credit-and-ledger.md`](../03-backend/credit-and-ledger.md#۱۰-الزامات-مصوب-d-07-و-وضعیت-یافته-f-4-در-بودجه-mvp) §۲ و §۱۰ | ۲۰۲۶-۱۰-۱۶ |
| **D-08** | **استقرار محیط Staging واقعی:** راه‌اندازی زنده روی دامنه واقعی با پورت‌های ۸۰/۴۴۳ و تقدم 18A تا 18C. | `تأییدشده` | [DevOps Index](../07-devops/index.md) | [`07-devops/index.md`](../07-devops/index.md#۸-الزامات-مصوب-d-08-استقرار-محیط-staging-و-جریان-تحویل) §۸ و [`03-backend/roadmap.md`](../03-backend/roadmap.md) سرفصل مرحله ۱۸ | ۲۰۲۶-۱۰-۱۶ |
| **D-09** | **تفکیک مسئولیت‌های ۴ نقشی:** تثبیت نقش‌های مدیر پروژه (PM)، ارشد (Senior)، مجری (Executor) و ناظر مستقل (Observer). | `تأییدشده` | [Task Rules](./task-template-and-review-rules.md) | [`09-governance/task-template-and-review-rules.md`](./task-template-and-review-rules.md#۱-تفکیک-نقش‌های-چهارگانه-مهندسی-engineering-roles--governance---d-09) §۱ | ۲۰۲۶-۱۰-۱۶ |
| **D-10** | **ساماندهی مستندات (پله اول):** تدوین ۳ سند کلیدی، گزارش‌های ۵ تعارض، رفع خطای گیت مستندات و حفظ تاریخچه. | `تکمیل شد` | [DOC-ORG-01](../../../../.task/active/DOC-ORG-01.md) | [`index.md`](../index.md)، [`current-path.md`](./current-path.md)، [`decision-register.md`](./decision-register.md) و [`task-template-and-review-rules.md`](./task-template-and-review-rules.md) | ۲۰۲۶-۱۰-۱۶ |
| **D-11** | **استاندارد لاگ، رهگیری و کاتالوگ خطا:** لاگ یکسان JSON روی stdout، استاندارد خطای چندزبانه با `help_key` و doctor. | `تأییدشده` | [Style Guide](../03-backend/style-guide.md) | [`03-backend/style-guide.md`](../03-backend/style-guide.md#41-central-error-catalog-schema--unknown-error-invariants-decision-d-11) §۴.۱ و [`mvp-operational-readiness.md`](../03-backend/mvp-operational-readiness.md#۱۱۳-کاتالوگ-متمرکز-خطا-و-اسکافولدینگ-تصمیم-d-11) §۱۱.۳ | ۲۰۲۶-۱۰-۱۶ |
| **D-12** | **قواعد تسک، ناظر و دفتر بدهی:** قرارداد تسک، اعتبارسنجی ناظر با بازتولید شواهد، ثبت بدهی و تعریف ۵ مانع لانچ. | `تأییدشده` | [Task Rules](./task-template-and-review-rules.md) | [`09-governance/task-template-and-review-rules.md`](./task-template-and-review-rules.md#۴-ضوابط-موانع-لانچ-و-ثبت-بدهی‌های-فنی-launch-blockers--debt-registry---d-12) §۳، §۴ و §۵ | ۲۰۲۶-۱۰-۱۶ |
| **D-13** | **بررسی فرایند واقعی سرویس‌ها:** آزمون سه‌لایه فقط‌خواندنی، خروجی سه‌حالته استاندارد (۰, ۱, ۲) و منع تلقی SKIP به PASS. | `تأییدشده` | [Readiness](../03-backend/mvp-operational-readiness.md) | [`03-backend/mvp-operational-readiness.md`](../03-backend/mvp-operational-readiness.md#۱۱۴-استاندارد-سه‌لایه-بررسی-فرایند-واقعی-سرویس‌ها-تصمیم-d-13) §۱۱.۴ | ۲۰۲۶-۱۰-۱۶ |
| **D-14** | **تثبیت قراردادهای OpenAPI و SDK:** استفاده از `public_base_url` واحد، امضای Presigned با آدرس عمومی و `help_key`. | `تأییدشده` | [Contracts](../03-backend/contracts.md) | [`03-backend/contracts.md`](../03-backend/contracts.md#۵-الزامات-مصوب-d-14-استانداردهای-openapi-و-sdk-در-mvp) §۵ | ۲۰۲۶-۱۰-۱۶ |
| **D-15** | **ترتیب توالی اجرای ۵ مرحله‌ای:** تقدم مستندات و لاگ/trace، سپس ابزارهای بررسی، سرویس‌های دسترسی، و فرانت. | `تأییدشده` | [Current Path](./current-path.md) | [`09-governance/current-path.md`](./current-path.md#۲-اولویت‌بندی-توالی-اجرا-مطابق-تصمیم-d-15) §۲ و [`roadmap.md`](../03-backend/roadmap.md#مسیر-جاری-تحویل-mvp--نسخه-۵-2026-10-15) سرفصل نسخه ۵ | ۲۰۲۶-۱۰-۱۶ |

---

## ۲. جدول وضعیت و تایید تعارض‌های معماری (C-1 تا C-5)

پیرو تصمیمات رسمی مدیر پروژه (PM) و تأیید صریح مالک محصول در تاریخ **۲۰۲۶-۱۰-۱۶**، تمامی گزارش‌های تعارض پنج‌گانه به شرح زیر قطعی و مصوب شدند:

| شناسه | موضوع تعارض مصوب | تصمیم مرتبط | وضعیت تایید مالک | سند و بخش اعمال نشانه‌گذاری |
| :---: | :--- | :---: | :---: | :--- |
| **C-1** | تعویق چرخه بوم، ارکستراسیون و بدهی `DEBT-CANVAS-01` به پس از لانچ MVP | D-05 | **تأیید قطعی شد (۲۰۲۶-۱۰-۱۶)** | [`roadmap.md`](../03-backend/roadmap.md) در مرحله 17C، جدول بدهی‌ها و معیار ۴ Gate 6 |
| **C-2** | حذف گردش کار تایید دستی ادمین برای شارژ و جایگزینی با ورود مستقیم کد هدیه/پرومو | D-06 | **تأیید قطعی شد (۲۰۲۶-۱۰-۱۶)** | [`roadmap.md`](../03-backend/roadmap.md) در مرحله 17B (بسته B08) و [`credit-and-ledger.md`](../03-backend/credit-and-ledger.md) |
| **C-3** | انتقال چرخه عمر کد دعوت/پرومو به MVP و ماندن کمپین و تخفیف در مرحله ۲۰ فاز ۳ | D-03 | **تأیید قطعی شد (۲۰۲۶-۱۰-۱۶)** | [`roadmap.md`](../03-backend/roadmap.md) در سرفصل مرحله ۲۰ |
| **C-4** | ابهام در مالکیت Auth/Workspace در بریف تاریخی؛ الزام به تصویب ADR مستقل پیش از مرحله ۲ | D-03 / P-3 | **تأیید قطعی شد (۲۰۲۶-۱۰-۱۶)** | [`beta-invitation-and-gift-ownership.md`](../03-backend/beta-invitation-and-gift-ownership.md) در بخش ۶ |
| **C-5** | تقدم استقرار زنده محیط Staging (مراحل 18A تا 18C) به صورت موازی با مراحل اولیه | D-08 | **تأیید قطعی شد (۲۰۲۶-۱۰-۱۶)** | [`07-devops/index.md`](../07-devops/index.md) در بخش ۸ و [`roadmap.md`](../03-backend/roadmap.md) |

---

## ۳. جدول پیگیری موارد باز (P-1 تا P-6)

| شناسه | شرح موضوع نیازمند تصمیم یا اقدام | مالک تصمیم | تاریخ هدف | وضعیت | گام بعدی |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **P-1** | محدودیت قطعی دامنه سرویس Access/Promo به چرخه عمر کد (صدور، انقضا، لغو، ظرفیت و مصرف). | مالک محصول / PM | ۲۰۲۶-۱۰-۱۶ | **تأیید صریح شد** | لحاظ در دامنه ADR سرویس در اقدام P-3. |
| **P-2** | حذف کامل گردش کار تأیید ادمین برای شارژ و جایگزینی با فرم ورود کد هدیه/دعوت. | مالک محصول / PM | ۲۰۲۶-۱۰-۱۶ | **تأیید صریح شد** | اعمال در کلاینت استودیو در مرحله ۴ فرانت. |
| **P-3** | تدوین و تصویب ADR رسمی معماری و مالکیت سرویس Access/Promo پیش از شروع کدنویسی مرحله ۲. | ارشد معماری | قبل از مرحله ۲ | `در انتظار تدوین ADR` | صدور تسک مستقل نگارش ADR توسط PM. |
| **P-4** | انتخاب مقادیر عددی دقیق برای سقف ظرفیت کاربران بتا، انقضا و میزان هدیه اولیه در فایل کانفیگ. | مالک محصول / تیم مالی | قبل از لانچ Staging | `باز (بدون هاردکد)` | ثبت مقادیر مصوب در `config/default.yaml` سرویس‌ها. |
| **P-5** | نهایی‌سازی مشخصات سرور ابری، دامنه اینترنتی و گواهی امنیتی جهت استقرار محیط Staging. | تیم DevOps / PM | فاز ۱۸ (موازی) | `در انتظار بریف سرور` | صدور بریف زیرساخت Staging توسط PM. |
| **P-6** | تعیین تاریخ تقویمی هدف برای عرضه محدود (Beta Launch). | مالک محصول | نامشخص | `باز (هدایت با گیت‌های کیفیت)` | تصمیم‌گیری پس از گذر از گیت‌های مرحله ۵. |
