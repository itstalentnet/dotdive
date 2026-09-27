| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | DevOps, CI/CD Pipelines & Docker Infrastructure Guide |
| **Title (FA)** | راهنمای زیرساخت، خطوط CI/CD و استقرار مبتنی بر Docker |
| **ID** | DOC-OPS-000 |
| **Category** | `devops` |
| **Status** | `Active` |
| **Owner** | DevOps / SRE Team |
| **Last Updated** | 2026-09-26 |
| **Summary (EN)** | Authoritative guide for Docker-centric hosting, deployment, multi-stage builds, Docker Compose orchestration, and CI/CD pipelines. |
| **Summary (FA)** | راهنمای مرجع زیرساخت میزبانی و استقرار منحصراً مبتنی بر داکر، ارکستراسیون با Docker Compose، فایل‌های چندمرحله‌ای و خطوط CI/CD. |
| **Tags** | `devops`, `cicd`, `docker`, `docker-compose`, `deployment`, `infrastructure` |

---

# زیرساخت، میزبانی و دوآپس (DevOps & Docker Infrastructure)

> **اصل بنیادین زیرساخت (Docker-Only Invariant):**  
> فضای رسمی و انحصاری استقرار، میزبانی و ارکستراسیون سرویس‌های پلتفرم **Lemmo** به‌طور کامل بر پایه **Docker** و **Docker Compose** است. هیچ ارکستراتور دیگری (مانند Kubernetes / k8s) در این پروژه استفاده نمی‌شود و کلیه ارجاعات پیشین به سایر ابزارها از مستندات حذف و فاقد اعتبار است.

---

## ۱. ارکان معماری میزبانی بر بستر داکر

زیرساخت پلتفرم Lemmo از سه لایه اصلی تشکیل شده است:

1. **کانتینرسازی مستقل هر سرویس (Multi-Stage Dockerfiles):**  
   هر میکروسرویس در `services/<name>/` و برنامه‌های فرانت‌اند (`app/` و `auth/`) دارای یک `Dockerfile` چندمرحله‌ای بهینه‌سازی‌شده برای کامپایل سبک با ایمیج پایه `alpine` هستند تا ایمیج نهایی فاقد ابزارهای بیلد اضافه و در حداقل حجم ممکن باشد.

2. **ارکستراسیون محیطی با Docker Compose (`infra/`):**  
   مدیریت کانتینرها، پایگاه‌های داده و شبکه‌های ایزوله از طریق فایل‌های Compose انجام می‌گیرد:
   - `infra/docker-compose.yml`: استک پایه و محیط توسعه محلی (PostgreSQL, Redis, RabbitMQ, MinIO).
   - `infra/compose/docker-compose.staging.yml`: محیط پیش‌تولید همگام با متغیرهای تست.
   - `infra/compose/docker-compose.prod.yml`: محیط پروداکشن با تنظیمات `restart: always`، لاگ‌های محدودشده، والیوم‌های ماندگار و محدودیت منابع (Resource Limits).

3. **سرویس دیسکاوری و شبکه داخلی (Docker Network DNS):**  
   تمام ارتباطات میان‌سرویسی gRPC و HTTP از طریق شبکه داخلی داکر (`lemmo-net`) و بر اساس نام سرویس‌ها (Container Hostname) انجام می‌شود؛ بنابراین هیچ آدرس IP یا دامنه ثابتی در کدها هاردکد نمی‌شود.

---

## ۲. تفکیک سخت‌افزاری و تخصیص کارت‌های گرافیک (GPU Acceleration)

برای جلوگیری از درگیری منابع وب با پردازش‌های سنگین هوش مصنوعی:
- **کانتینرهای عمومی (CPU Pool):** سرویس‌های اصلی، درگاه API و دیتابیس‌ها بر روی سرورهای استاندارد CPU اجرا می‌شوند.
- **کانتینرهای هوش مصنوعی (GPU Pool):** کانتینر سرویس `image-service` و ورکرها بر روی سرور مجهز به کارت‌های گرافیکی اجرا شده و با استفاده از **NVIDIA Container Toolkit** دسترسی مستقیم به GPU دریافت می‌کنند:
  ```yaml
  services:
    image-service:
      image: lemmo/image-service:latest
      deploy:
        resources:
          reservations:
            devices:
              - driver: nvidia
                count: all
                capabilities: [gpu]
  ```

---

## ۳. مدیریت متغیرهای محیطی و امنیت (Secrets Management)

- **هیچ رازی در گیت کامیت نمی‌شود:** فایل‌های `.env` در تمام مخازن در `.gitignore` ثبت شده‌اند.
- **تزریق مقادیر:** در محیط استقرار، متغیرها از طریق فایل‌های `.env` امن روی سرور، `docker compose --env-file` یا متغیرهای سیستمی (System Environment Variables) به کانتینرها تزریق می‌شوند.

---

## ۴. خطوط یکپارچه‌سازی و استقرار مداوم (CI/CD Pipelines)

پایپ‌لاین‌های GitHub Actions وظایف زیر را بر عهده دارند:
1. **تست و لینت خودکار:** اجرای `golangci-lint`، تست‌های واحد Go و تست‌های TypeScript در هر Pull Request.
2. **بررسی قراردادها:** اجرای `buf lint` و `buf breaking` برای اطمینان از عدم شکست پروتکل‌های Proto.
3. **بیلد ایمیج‌های داکر:** ساخت خودکار ایمیج‌های داکر سرویس‌ها و پوش به رجیستری کانتینر خصوصی پلتفرم.
4. **استقرار پیوسته (CD):** دستور پول کردن ایمیج جدید و اجرای `docker compose up -d` بدون اختلال در سرویس‌دهی (Zero-Downtime).
