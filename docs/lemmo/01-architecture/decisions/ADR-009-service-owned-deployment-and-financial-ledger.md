| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | ADR-009: Service-Owned Deployment Boundary and Financial Ledger Architecture |
| **Title (FA)** | ADR-009: الگوی استقرار مستقل هر سرویس (Service-Owned Deploy) و معماری دفترکل مالی (Financial Ledger) |
| **ID** | DOC-ARCH-009-ADR |
| **Category** | `architecture` |
| **Status** | `Approved` |
| **Owner** | Core Architecture & Backend Team |
| **Last Updated** | 2026-09-29 |
| **Summary (EN)** | Architectural decision establishing service-owned deployment boundaries via Docker Compose include, role-based infrastructure naming (financial-ledger), FinancialLedgerPort abstraction, and configuration-driven parameters. |
| **Summary (FA)** | تصمیم مصوب معماری مبنی بر مالکیت استقرار مستقل هر سرویس از quota-service به بعد با Docker Compose include، نام‌گذاری مبتنی بر نقش (Role-Based)، تجرید FinancialLedgerPort و پیکربندی دینامیک پورت و تایم‌اوت. |
| **Tags** | `adr`, `architecture`, `deployment`, `quota-service`, `financial-ledger`, `docker-compose`, `ledger` |

---

# ADR-009: الگوی استقرار مستقل هر سرویس و معماری Financial Ledger

## ۱. زمینه و انگیزه (Context)

در جریان توسعه مایکروسرویس‌های پلتفرم Lemmo و ورود به پیاده‌سازی سرویس سهمیه و رزرو اعتبارات (`quota-service`) و نیازمندی دفترکل تغییرناپذیر، دو مسئله کلیدی معماری مطرح گردید:

1. **مدیریت زیرساخت‌های اختصاصی سرویس‌ها (Service Deployment Ownership):** پیش از این، کلیه تعاریف زیرساختی و کانتینرها در یک فایل ریشه (`infra/compose/dev.yml`) تجمیع می‌شدند. با افزایش تعداد سرویس‌ها و ورود زیرساخت‌های تخصصی، این الگو سبب نقض مرزهای دامنه سرویس، پیچیدگی همگام‌سازی و عدم امکان توسعه مستقل زیرساخت توسط تیم مالک سرویس می‌شد.
2. **وابستگی نام‌گذاری معماری به ابزار (Tool Coupling vs. Role-Based Naming):** استفاده از نام محصولات یا ابزارهای خاص (مانند موتور تخصصی حسابداری TigerBeetle) در سطح نام‌گذاری سرویس‌ها، کانتینرها، کلیدهای کانفیگ و متغیرهای محیطی سبب وابستگی شدید معماری به یک پیاده‌سازی خاص می‌گردد، به گونه‌ای که هرگونه تغییر احتمالی موتور در آینده مستلزم مایگریشن گسترده نام‌ها در کل سیستم خواهد بود.

---

## ۲. تصمیمات مصوب معماری (Decisions)

### ۲.۱. مالکیت استقرار اختصاصی هر سرویس (Service-Owned Deployment)
از سرویس `quota-service` به بعد، هر سرویس جدید **مالک کامل زیرساخت اختصاصی خودش** است:
- کد منبع، پیکربندی، تعاریف Docker/Compose، ولوم‌ها، healthcheckها و متغیرهای اتصال همگی در پوشه همان سرویس قرار می‌گیرند:
  ```text
  services/<service-name>/
  ├── deploy/
  │   ├── compose.yaml
  │   └── config/
  │       └── <service-name>.yaml
  ```
- فایل Compose ریشه پروژه (`infra/compose/dev.yml`) صرفاً وظیفه Composition کلی را از طریق دستور استاندارد `include` بر عهده دارد:
  ```yaml
  include:
    - ../../services/quota-service/deploy/compose.yaml
  ```
- زیرساخت‌های واقعاً مشترک فعلی (PostgreSQL، RabbitMQ و MinIO) بدون تغییر در جایگاه خود باقی مانده و مشمول مایگریشن در این مرحله نیستند. دیتابیس منطقی `lemmo_quota` همچنان در نمونه مشترک Postgres مستقر بوده اما مالکیت منطقی آن در اختیار `quota-service` است.

### ۲.۲. استاندارد فنی Compose و حداقل نسخه
- جهت ماژولار کردن و حفظ رزولوشن صحیح مسیرهای نسبی درون ماژول سرویس، **Docker Compose native `include`** به عنوان استاندارد انحصاری پروژه تصویب گردید.
- **حداقل نسخه الزامی:** `Docker Compose >= 2.20.0` در تمام محیط‌های توسعه، CI و Staging الزامی است.

### ۲.۳. قانون نام‌گذاری مبتنی بر نقش (Role-Based Naming, NOT Tool Name)
کلیه اجزای زیرساختی جدید منحصراً بر اساس **نقش معماری** خود نام‌گذاری می‌شوند:
- **نام سرویس و کانتینر:** `financial-ledger` / `lemmo-svc-financial-ledger`
- **ولوم:** `financial-ledger-data`
- **کلید کانفیگ:** `financial_ledger`
- **پیشوند متغیرهای محیطی:** `FINANCIAL_LEDGER_*`
- **نام‌های ممنوعه در معماری:** کلمات `tigerbeetle`، `lemmo-infra-tigerbeetle` و `TIGERBEETLE_*` در سطح نام سرویس، کانتینر، کانفیگ و کد منبع ممنوع هستند.
- **استثنای مجاز:** نام ابزار صرفاً در مقدار ایمیج داکر به عنوان پیاده‌سازی فعلی مجاز است:
  ```yaml
  image: ghcr.io/tigerbeetle/tigerbeetle:0.16.27
  ```

### ۲.۴. تجرید قرارداد و ممنوعیت هاردکد (FinancialLedgerPort & Dynamic Config)
- لایه دامنه و اپلیکیشن `quota-service` از طریق اینترفیس انتزاعی **`FinancialLedgerPort`** با موتور دفترکل مالی تعامل می‌کند و هیچ وابستگی مستقیمی به پکیج‌های ابزار در لایه هسته بیزینس وجود نخواهد داشت.
- **ممنوعیت هاردکد پورت و تایم‌اوت:** پورت اتصال و تایم‌اوت رزرو دوفازی (`reservation_timeout`) نباید به صورت `const` در کدهای Go هاردکد شوند؛ این مقادیر الزاماً از فایل پیکربندی `services/quota-service/deploy/config/quota-service.yaml` یا متغیرهای محیطی خوانده می‌شوند (مقدار اولیه تایم‌اوت: `300s`).

---

## ۳. پیامدها و اثرات (Consequences)

### نکات مثبت (Positive)
- ایزولاسیون کامل دامنه‌های زیرساختی و تسهیل نگهداری مستقل سرویس‌ها.
- امکان تعویض یا ارتقای موتور دفترکل بدون نیاز به تغییر در قراردادهای سرویس یا رینیم‌کردن کلیدها و سرویس‌ها.
- رفع خطاهای ناشی از هاردکد کردن مقادیر عملیاتی مطابق با [DOC-ARCH-009](../configuration-and-secrets.md).

### الزامات و محدودیت‌ها (Constraints)
- ارتقای اجباری داکر کامپوز به نسخه ۲.۲۰ یا بالاتر در تمام پایپ‌لاین‌های CI.
- لزوم اجرای اعتبارسنجی `docker compose config -q` در تست‌های CI جهت تضمین سلامت لینک‌های `include`.
