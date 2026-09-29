| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Docker Naming Conventions, Tagging Standards & Build Hygiene |
| **Title (FA)** | استانداردهای نام‌گذاری ایمیج‌ها و کانتینرهای داکر، سیاست تگ‌گذاری و انضباط بیلد |
| **ID** | DOC-OPS-001 |
| **Category** | `devops` |
| **Status** | `Approved` |
| **Owner** | DevOps & Platform Team |
| **Last Updated** | 2026-09-28 |
| **Summary (EN)** | Authoritative specification for Docker image and container naming, container_name conventions, immutable tagging, prevention of duplicate/stale images, and build provenance logging. |
| **Summary (FA)** | مشخصات و قواعد الزامی نام‌گذاری ایمیج‌ها و کانتینرها، جلوگیری از ساخت ایمیج‌های تکراری و قدیمی، سیاست‌های برچسب‌گذاری و ثبت مشخصات بیلد در لاگ. |
| **Tags** | `devops`, `docker`, `naming-conventions`, `containers`, `docker-compose`, `build-hygiene` |

---

# استانداردهای نام‌گذاری داکر، سیاست تگ‌گذاری و انضباط بیلد (Docker Naming & Hygiene)

## ۱. انگیزه و هدف (Context & Rationale)

در جریان توسعه سریع و استقرار میکروسرویس‌های پلتفرم **Lemmo**، عدم وجود یک چارچوب شفاف و سخت‌گیرانه برای نام‌گذاری ایمیج‌ها و کانتینرها منجر به بروز خطاهای انسانی بحرانی در تیم‌های توسعه و عملیات می‌شود:
1. **تداخل و ابهام در مانیتورینگ:** در صورت نبود نام‌گذاری ساختاریافته، خروجی دستور `docker ps` گنگ بوده و تفکیک سریع کانتینرهای متعلق به کدهای بیزینسی، زیرساخت پایگاه داده و برنامه‌های فرانت‌اند غیرممکن می‌شود.
2. **پدیده اجرای ایمیج‌های تاریخ‌گذشته (Stale Image Drift):** توسعه‌دهنده سورس‌کد را تغییر می‌دهد، اما به دلیل رفتار پیش‌فرض کش داکر و استفاده نادرست از برچسب `latest`، کانتینر همچنان کدهای کامپایل‌شده پیشین را اجرا می‌کند و ساعت‌ها صرف خطایابی کاذب می‌شود.
3. **تکثیر چندگانه ایمیج‌های نامتعارف (Image Proliferation):** ساخت ایمیج‌های متعدد با نام‌های سلیقه‌ای و متفرقه توسط توسعه‌دهندگان مختلف برای یک سرویس واحد، مصرف فضای دیسک را افزایش داده و ردیابی نسخه را مختل می‌سازد.

برای پایان دادن به این چالش‌ها، کلیه سرویس‌ها و ابزارهای اکوسیستم لمو ملزم به رعایت ۱۰۰٪ استانداردهای این سند هستند.

---

## ۲. ساختار استاندارد نام‌گذاری ایمیج‌های داکر (Docker Image Naming)

کلیه ایمیج‌های بیلدشده در پلتفرم لمو باید از الگوی سلسله‌مراتبی و قابل فهم زیر تبعیت کنند:

```text
[registry.domain/][namespace/]lemmo/<category>-<name>:<tag>
```

### ۲.۱. دسته‌بندی‌های رسمی ایمیج‌ها (`<category>`)

| پیشوند دسته‌بندی | نوع کامپوننت | نمونه نام ایمیج | شرح و کاربرد |
|---|---|---|---|
| **`svc-`** | میکروسرویس‌های اختصاصی بک‌اند | `lemmo/svc-project-service:dev`<br>`lemmo/svc-orchestrator-service:dev`<br>`lemmo/svc-node-registry-service:dev` | سرویس‌های مستقل تجاری و پلتفرم مستقر در `services/<name>/`. |
| **`app-`** | برنامه‌های کاربری و فرانت‌اند | `lemmo/app-studio:dev`<br>`lemmo/app-auth:dev` | استودیو ورک‌اسپیس (`app/`) و سرویس هویتی فرانت‌اند (`auth/`). |
| **`tool-`** | ابزارهای سیستمی و ژنراتورها | `lemmo/tool-lemmo-cli:v0.1.0`<br>`lemmo/tool-errgen:v0.1.0` | باینری‌ها و ابزارهای کانتینرسازی‌شده مستقر در `tools/`. |
| **`infra-`** | کامپوننت‌های سفارشی زیرساخت | `lemmo/infra-gateway:dev`<br>`lemmo/infra-otel-collector:dev` | سرویس‌های زیرساختی سفارشی‌سازی‌شده در `infra/`. |

> **قانون ایمیج‌های بالادستی (Upstream Third-Party Images):**  
> برای سرویس‌های استاندارد متن‌باز (مانند PostgreSQL, Redis, MinIO, RabbitMQ)، هرگز ایمیج بدون نام برند یا تغییرنام‌یافته ساخته نمی‌شود؛ منحصراً از ایمیج‌های رسمی و نسخه‌بندی‌شده Docker Hub با تگ دقیق استفاده می‌گردد (مثلاً `postgres:16-alpine`، `redis:7-alpine`، `rabbitmq:3-management-alpine`، `minio/minio:RELEASE.2024-01-16T16-07-38Z`).

---

## ۳. ساختار الزامی نام‌گذاری کانتینرها (`container_name`)

در کلیه فایل‌های Docker Compose (`infra/docker-compose.yml`، `infra/compose/*.yml`):
1. **تنظیم فیلد `container_name` الزامی و اجباری است.** هیچ سرویسی نباید بدون `container_name` تعریف شود تا داکر اسامی پیش‌فرض و غیرقابل پیش‌بینی (نظیر `infra-project-service-1`) ایجاد نکند.
2. الگوی رسمی نام کانتینر باید فوراً ماهیت و مالکیت فرآیند را در `docker ps` نشان دهد:

```text
lemmo-<category>-<name>
```

### ۳.۱. جدول استانداردهای کانتینر در محیط توسعه محلی

| کامپوننت | فیلد `container_name` الزامی | پورت‌های داخلی / نگاشت محلی |
|---|---|---|
| **پایگاه داده اصلی** | `lemmo-infra-postgres` | `5432:5432` |
| **ردیس کش و ایندکس** | `lemmo-infra-redis` | `6379:6379` |
| **ذخیره‌سازی S3 MinIO** | `lemmo-infra-minio` | `9000:9000` (API) / `9001:9001` (Console) |
| **صف پیام RabbitMQ** | `lemmo-infra-rabbitmq` | `5672:5672` (AMQP) / `15672:15672` (Dashboard) |
| **سرویس پروژه** | `lemmo-svc-project` | `50051:50051` (gRPC) / `8080:8080` (HTTP) |
| **سرویس رجیستری نودها** | `lemmo-svc-node-registry` | `50052:50052` (gRPC) |
| **سرویس ارکستراتور** | `lemmo-svc-orchestrator` | `50053:50053` (gRPC) |
| **موتور دفترکل مالی (نقش)** | `lemmo-svc-financial-ledger` | پورت متغیر از کانفیگ (`3000` پیش‌فرض داخلی) |
| **درگاه ورودی API** | `lemmo-infra-gateway` | `80:80` / `443:443` |

با این نام‌گذاری، هر توسعه‌دهنده‌ای با تایپ `docker ps` بلافاصله وضعیت کانتینرهای زیرساخت (`lemmo-infra-*`) و سرویس‌های در حال توسعه (`lemmo-svc-*`) را بدون کوچک‌ترین سردرگمی تشخیص می‌دهد.

### ۳.۲. قانون الزامی نام‌گذاری نقش‌محور، نه نام ابزار (Role-Based Naming — ADR-009)
تمامی سرویس‌ها، کانتینرها، والیوم‌ها و کانفیگ‌های زیرساختی جدید باید بر مبنای **نقش معماری (Role)** نام‌گذاری شوند، نه نام محصول یا ابزاری که آن نقش را پیاده می‌کند:
- **نام سرویس و کانتینر:** منحصراً بر مبنای نقش (مانند `financial-ledger` و `container_name: lemmo-svc-financial-ledger`).
- **نام‌های ممنوعه:** کاربرد اسامی برند یا محصول بیرونی (نظیر `tigerbeetle`، `lemmo-infra-tigerbeetle`، `TIGERBEETLE_PORT`) در این تعاریف ممنوع است.
- **محل مجاز نام ابزار:** صرفاً در فیلد `image:` مجاز است (`image: ghcr.io/tigerbeetle/tigerbeetle:0.16.27`). این امر تعویض ابزار را بدون کوچک‌ترین تغییر در نام‌گذاری‌ها ممکن می‌سازد.

### ۳.۳. استانداردهای استقرار مستقل سرویس‌ها (Service-Owned Deploy via `include`)
از سرویس `quota-service` به بعد:
- هر سرویس زیرساخت‌های اختصاصی خود را در `services/<name>/deploy/compose.yaml` و فایل‌های پیکربندی را در `services/<name>/deploy/config/` تعریف می‌کند.
- فایل `infra/compose/dev.yml` با دستور استاندارد `include:` این مانیفست‌ها را بارگذاری می‌نماید.
- استفاده از این الگو منوط به **`Docker Compose >= 2.20.0`** است.

---

## ۴. سیاست‌های قطعی جلوگیری از تکثیر ایمیج‌ها و خطای کش قدیمی (Hygiene & Anti-Drift)

برای پاسخ به دغدغه حیاتی اجرای اشتباه ایمیج‌های تاریخ‌گذشته یا ساخت نسخه‌های تکراری، ۵ قانون قطعی زیر تصویب و لازم‌الاجرا است:

### قانون ۱: تک‌مرجع رسمی ایمیج برای هر سرویس (Single Canonical Image)
برای هر میکروسرویس، صرفاً **یک نام رسمی ایمیج** در کل پروژه وجود دارد. ساخت ایمیج با اسامی متفرقه (مانند `my-project`، `test-proj`، `project-test` یا ایمیج‌های بدون پیشوند `lemmo/`) در تمامی کانفیگ‌ها و دستورات ترمینال ممنوع است.

### قانون ۲: ممنوعیت اتکای کورکورانه به تگ `latest` و سیاست تگ‌گذاری دومحیطه
- **در محیط توسعه محلی (Local Development):**
  - تگ رسمی: `:dev` (مثال: `lemmo/svc-project-service:dev`).
  - **فرمان الزامی:** هنگام اجرای سرویس‌ها در محیط محلی، همیشه از فلگ بیلد استفاده می‌شود تا تغییرات سورس‌کد نادیده گرفته نشود:
    ```bash
    docker compose -f infra/docker-compose.yml -f infra/compose/dev.yml up --build -d
    ```
- **در محیط‌های Staging و Production (تگ‌های غیرقابل تغییر / Immutable):**
  - استفاده از تگ `latest` در پروداکشن **اکیداً ممنوع** است.
  - هر ایمیج تولیدی در پایپ‌لاین CI/CD ملزم به داشتن دو تگ غیرقابل تغییر است:
    1. تگ نسخه معنایی: `lemmo/svc-project-service:v0.1.0`
    2. تگ هش گیت کامیت: `lemmo/svc-project-service:sha-7af3a3f`

### قانون ۳: یک داکرفایل واحد و چندمرحله‌ای برای هر سرویس (Single Multi-Stage Dockerfile)
هر سرویس منحصراً یک فایل `Dockerfile` در مسیر ریشه خود (`services/<name>/Dockerfile`) دارد. ساخت فایل‌های پراکنده و موازی نظیر `Dockerfile.dev`، `Dockerfile.local` یا `Dockerfile.prod` ممنوع است. تفاوت‌های محیطی صرفاً از طریق Multi-stage target و Build Arguments کنترل می‌شوند.

### قانون ۴: انضباط پاکسازی کش و ایمیج‌های آویزان (Dangling Images Pruning)
بیلدهای مکرر در حین کدنویسی سبب تولید ایمیج‌های آویزان بدون تگ (`<none>:<none>`) می‌شود که در دیسک رها شده و گاهی موجب اشتباه در ارجاعات می‌شوند.
توسعه‌دهندگان و خطوط CI موظف به اجرای دوره‌ای فرامین پاکسازی زیر هستند:
```bash
# پاکسازی ایمیج‌های بدون تگ و آویزان
docker image prune -f

# متوقف کردن کانتینرها و حذف کانتینرهای یتیم (Orphans)
docker compose -f infra/docker-compose.yml -f infra/compose/dev.yml down --remove-orphans
```

### قانون ۵: ردیابی اجباری شناسنامه بیلد در لاگ استارت سرویس (Build Provenance Logging)
برای اینکه توسعه‌دهنده در همان ثانیه اول مطمئن شود کانتینر دقیقاً بر اساس آخرین کامیت سورس‌کد بالا آمده است، تمامی `Dockerfile`ها متغیرهای زیر را در زمان بیلد دریافت می‌کنند:
```dockerfile
ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown
ENV APP_GIT_COMMIT=$GIT_COMMIT
ENV APP_BUILD_TIME=$BUILD_TIME
```
و در زمان راه‌اندازی هر سرویس Go (`cmd/main.go`)، اولین خط خروجی لاگ باید این مشخصات را با شفافیت کامل چاپ کند:
```json
{"level":"info","time":"2026-09-28T00:00:00Z","message":"Starting service","service":"project-service","git_commit":"7af3a3f","build_time":"2026-09-28T00:00:00Z"}
```
با اجرای دستور `docker logs lemmo-svc-project`، توسعه‌دهنده بلافاصله کامیت اجرایی را با آخرین کامیت گیت خود مقایسه کرده و در صورت هرگونه عدم تطابق کش داکر، فوراً مطلع می‌شود.

---

## ۵. فرامین استاندارد داکر در Makefile ریشه (`api/Makefile`)

برای تضمین اجرای بدون خطای انسانی، تارگت‌های زیر به فایل `api/Makefile` اضافه می‌شوند:

```makefile
# Start local development infrastructure with guaranteed fresh build
docker-dev:
	docker compose -f infra/docker-compose.yml -f infra/compose/dev.yml up --build -d

# Stop infrastructure and remove orphan containers
docker-stop:
	docker compose -f infra/docker-compose.yml -f infra/compose/dev.yml down --remove-orphans

# Clean dangling images and build cache to resolve cache issues
docker-clean:
	docker compose -f infra/docker-compose.yml -f infra/compose/dev.yml down --remove-orphans
	docker image prune -f
```
