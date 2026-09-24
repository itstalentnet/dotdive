| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Dotdive Architecture Reuse Assessment |
| **Title (FA)** | ارزیابی استفاده مجدد از معماری نونز در لمو |
| **ID** | DOC-BE-007 |
| **Category** | `backend` |
| **Status** | `Draft` |
| **Owner** | Backend & Platform Team |
| **Last Updated** | 2026-09-23 |
| **Summary (EN)** | Comparison of NONS documented architecture with Lemmo requirements, reuse boundaries, risks and verification gates. |
| **Summary (FA)** | ارزیابی استفاده مجدد از معماری نونز در لمو؛ حاصل ممیزی کد و تحلیل معماری، برای بررسی تیم. |
| **Tags** | `dotdive`, `nons`, `reuse`, `assessment` |

---

# ارزیابی استفاده مجدد از معماری نونز در لمو

## ۱. پاسخ مستقیم

**بله، الگوی پلتفرم نونز قابل استفاده است؛ مدل دامنه و مدل دسترسی آن قابل کپی مستقیم نیست.** توصیه این است که جداسازی Auth/Profile/Access، مالکیت داده هر سرویس، contract-first، codegen، event bus و اصول عملیات منتقل شوند؛ IAM برای tenant/project/team بازطراحی شود و دامنه تولید AI، Job، گراف، Asset و credit ledger اختصاصی لمو ساخته شود.

`dotdive` طبق [package.json](../../dotdive/package.json) یک سایت VitePress است. مسیرهای `nons-api/services/*` که در اسناد ذکر شده‌اند، در این پوشه کد اجرایی سرویس محسوب نمی‌شوند. [راهنمای شروع قبلی](../../dotdive/docs/team/backend/get-started.md) از ۲۴ سرویس و ۶ پیاده‌سازی سخن می‌گوید؛ این **گزارش سند قبلی** است، نه تأیید وضعیت فعلی کد، تست، استقرار یا کیفیت تولید. در این ممیزی سرویس‌های نونز اجرا نشده‌اند و درصد صرفه‌جویی یا زمان مهاجرت قابل اعلام نیست.

## ۲. منابع بررسی و میزان اتکا

| منبع | وضعیت اعلام‌شده در منبع | استفاده در این بررسی |
| :--- | :--- | :--- |
| [Platform Architecture](../../dotdive/docs/team/platform/Architecture.md) | معماری کل پلتفرم | توپولوژی، سرویس‌ها، Ory، IAM و Kubernetes |
| [IAM Blueprint](../../dotdive/docs/team/backend/services/iam-service.md) | APPROVED | مدل مجوز، context، Workspace، کش و مرز مالکیت |
| [Permission Model](../../dotdive/docs/team/platform/permission-model.md) | ACTIVE | Proto SSOT، metadata owner و codegen CI |
| [Auth ADR](../../dotdive/docs/team/backend/ADR/ADR-Backend-001.md) و [Token ADR](../../dotdive/docs/team/backend/ADR/ADR-Backend-006.md) | APPROVED | Kratos، Hydra و login-consent؛ ADR قدیمی تعلیق Hydra را بعداً لغو کرده |
| [Auth](../../dotdive/docs/team/backend/services/auth-service.md)، [Token](../../dotdive/docs/team/backend/services/token-service.md)، [Login Consent](../../dotdive/docs/team/backend/services/login-consent-app.md) | اسناد سرویس | مرز session و OAuth؛ دسترسی Admin API |
| [User](../../dotdive/docs/team/backend/services/user-service.md)، [Storage](../../dotdive/docs/team/backend/services/storage-service.md)، [Pool ADR](../../dotdive/docs/team/platform/ADR/ADR-Backend-007.md) | وضعیت‌ها یکسان نیست؛ Storage پیش‌نویس و Pool ADR پیشنهادی | profile قابل انتقال مفهومی؛ Pool/Storage آماده فرض نشوند |
| [Core Architecture](../../dotdive/docs/team/platform/core/Architecture.md) | PUBLIC | Core خارج از مسیر مستقیم درخواست کاربر |
| [Gateway](../../dotdive/docs/team/platform/gateway/blueprint.md) | BLUEPRINT | Traefik، ForwardAuth، routing و هدرهای هویت |
| [Event Contract](../../dotdive/docs/team/platform/standards/event-contract.md) و [Event Standard](../../dotdive/docs/team/platform/standards/event-standard.md) | PRIVATE | envelope، نسخه‌بندی و NATS |
| [Deployment readiness](../../dotdive/docs/team/devops/deployment-readiness-report.md) و [Verification findings](../../dotdive/docs/team/devops/architecture-verification-findings.md) | گزارش تاریخی | هشدار علیه معادل‌گرفتن blueprint و runtime |

## ۳. ماتریس قابلیت استفاده مجدد

«انتقال» در این جدول انتقال **اصل طراحی** است. انتقال کد همواره به بررسی مخزن اجرایی نیاز دارد.

| جزء نونز | حکم | تغییر لازم برای لمو | گیت پذیرش |
| :--- | :--- | :--- | :--- |
| Microservice + monorepo | انتقال | سرویس‌ها بر اساس bounded context لمو؛ نه ۲۴ سرویس بازار | هر سرویس image، DB credential، migration و release مستقل |
| Auth/Kratos | استفاده مشروط | UI `auth/` فعلی به flowها متصل شود؛ templates HTML سرویس قبلی لزوماً منتقل نشود | ورود، logout، recovery، CSRF و migration هویت تست شوند |
| Hydra + login-consent | استفاده در نیاز OAuth delegation | برای پلاگین محلی صرف لازم نیست؛ برای third-party consent/OIDC لازم می‌شود | PKCE، consent، audience، refresh/revoke و امنیت Admin API |
| User/Profile | انتقال مفهوم | profile/preferences؛ mapping هویت Ory به principal داخلی | ایمیل/رمز دوباره در چند DB منبع حقیقت نشوند |
| IAM/Policy Engine داخلی | بازطراحی اساسی | subject/action/resource/tenant + روابط تیم/پروژه؛ مدل قبلی user/action کافی نیست | تست ماتریس، revoke، batch check و عدم نشت tenant |
| Workspaceهای seller/admin | عدم انتقال مدل | این‌ها ناحیه محصولند؛ Workspace لمو tenant مالک داده و billing است | دو Workspace با نقش یکسان همچنان ایزوله باشند |
| Permission keys + metadata ownership | انتقال اصل | کلیدها و namespaceها برای assets/jobs/projects/plugins؛ کلیدهای فروشگاه حذف | orphan/collision/breaking check و SDK sync |
| Proto-first | انتخاب مشروط | در طرح فعلی لمو REST OpenAPI و event schema؛ Proto فقط اگر gRPC واقعاً انتخاب شود | برای هر قرارداد فقط یک source؛ codegen خروجی دستی نداشته باشد |
| NATS JetStream | انتقال | workspace/project/aggregateVersion، outbox/inbox، replay و dedupe | redelivery و crash مصرف‌کننده اثر تجاری تکراری ایجاد نکند |
| Core control plane | انتقال محدود | audit/telemetry/registry projection؛ هیچ execute وابسته همزمان به Core نباشد | خاموشی Core درخواست‌های مجاز دامنه را متوقف نکند |
| Gateway/Traefik | انتقال مشروط | strip هدرهای جعلی، backend-only trust، محدودیت body و SSE | درخواست bypass یا X-User-Id جعلی پذیرفته نشود |
| PostgreSQL + Redis | انتقال | DB مستقل سرویس؛ Redis فاقد مالکیت balance/ACL | خرابی Redis مجوز قدیمی یا موجودی جعلی نسازد |
| Wallet/TigerBeetle | بازاستفاده مفهومی | credit hold/capture/release؛ لزوماً ارز قابل برداشت نیست | reconciliation، concurrency و واحد محاسباتی مستقل |
| Storage/Pool | بخشی نو | Assets خصوصی، upload validation، lineage، preview، purge و export | فایل tenant دیگر قابل خواندن نباشد؛ Pool ابزار مرجع است نه storage محتوا |
| Kubernetes/Helm | انتقال مشروط | image/namespace/domain/secret جدید؛ HA واقعی DB و broker جدا ارزیابی شود | deploy/rollback/restore و NetworkPolicy اجرا شوند |
| Marketplace/order/escrow/settlement/KYC | خارج از هسته اولیه | فقط با نیاز تجاری فروش افزونه یا پرداخت به سازنده | ADR جدا؛ هزینه و داده غیرضروری به لمو وارد نشود |
| Currency/commission/dispute | عدم انتقال فعلی | لمو فروشگاه سفارش و داوری نیست | وجود UI و نیاز واقعی محصول پیش‌شرط |

## ۴. مسائل مشخص مدل قبلی

### ۴.۱. مجوز عمومی به‌جای رابطه با منبع

مثال `POST /v1/iam/authorization/check {userId, action}` و context شامل roles/permissions سراسری است. در Blueprint، مالکیت منبع به Relationship Service آینده واگذار شده است. این وضعیت برای لمو که از روز اول پروژه خصوصی و تیم مشترک دارد کافی نیست. `assets.read` باید درباره Asset مشخص داخل Project مشخص بررسی شود؛ داشتن permission نامی شرط لازم است، نه کافی.

### ۴.۲. کش و ابطال

کلید `iam:context:{userId}` و TTL سیصد ثانیه در سند قبلی آمده است؛ invalidation همزمان نیز پیش‌بینی شده، پس نمی‌توان گفت نونز صرفاً تا TTL صبر می‌کند. با این حال حذف عضو تیم، تغییر grant پروژه و دسترسی resource در آن مدل پوشش داده نشده‌اند. نیاز لمو شامل tenant، project، principal، action و نسخه‌های policy/membership است؛ در فاز اول نتیجه allow برای عملیات حساس از کش مثبت خوانده نمی‌شود.

پیشنهاد rollback دیتابیس در صورت شکست invalidation Redis، اتمیک‌بودن میان دو storage را تضمین نمی‌کند و race مربوط به بازپرشدن cache را حل نمی‌کند. الگوی پیشنهادی لمو: commit تغییر دسترسی در DB authoritative، نسخه افزایشی، بررسی تازه برای عملیات حساس، outbox برای قطع stream و refresh projection. جزئیات guarantee و درخواست in-flight در [سند دسترسی](./auth-and-workspace.md) است.

### ۴.۳. تعریف کلید و سیاست runtime

Permission Model می‌گوید کلید جدید در Proto و سپس codegen/seed تعریف شود؛ IAM Blueprint هم عبارتی درباره ایجاد مجوز بدون deploy دارد. این دو ادعا برای «کلید تازه و عملیات تازه» هم‌معنی نیستند. در لمو **ترکیب نقش و grant موجود** می‌تواند runtime باشد؛ **عملیات جدید** به تعریف قرارداد، enforcement در سرویس و release نیاز دارد. تغییر یک manifest نامطمئن نباید permission سروری جدید ثبت کند.

### ۴.۴. تاریخچه و آمادگی تولید

اسناد قدیمی و جدید نونز درباره Hydra تاریخچه تغییر دارند؛ نسخه فعلی معماری جایگزینی Keto با Policy Engine داخلی را تصریح می‌کند. بنابراین استناد به «نونز از Keto استفاده می‌کند» بدون توجه به تاریخچه نادرست است. همچنین گزارش readiness نبود CD، برخی chartها و ناسازگاری event subject را ثبت کرده است؛ این یافته‌های تاریخی نیاز به راستی‌آزمایی دارند، نه اینکه به وضعیت امروز تعمیم داده شوند.

### ۴.۵. رویداد و اثر بیرونی

envelope قبلی trace/version/source دارد اما برای نیاز فعلی لمو باید tenant، project، aggregateVersion و causation به آن افزوده شود. `eventId` برای همان رویداد در retry ثابت می‌ماند. ادعای exactly-once برای کل زنجیره DB→broker→Provider→payment نمی‌کنیم؛ تحویل مجدد broker باید با idempotency مصرف‌کننده و reconciliation پوشش داده شود. این نتیجه طراحی با [مدل تحویل JetStream](https://docs.nats.io/learn/jetstream/pull-consumers) سازگار است.

## ۵. گزینه‌های معماری و انتخاب

| گزینه | سود | هزینه/محدودیت | نتیجه |
| :--- | :--- | :--- | :--- |
| کپی مستقیم nons-api | bootstrap ظاهراً سریع | مدل marketplace، access ناکافی و پیچیدگی ناشناخته | رد |
| مونولیت ماژولار پیش‌نویس قبلی لمو | عملیات ساده‌تر، تراکنش محلی | هدف استقلال استقرار فعلی کاربر را برآورده نمی‌کند | گزینه معتبر برای تغییر دامنه، انتخاب فعلی نیست |
| میکروسرویس با مرزهای درشت و قرارداد روشن | استقلال deploy/data/scale؛ استفاده از تجربه قبلی | توزیع تراکنش، failure handling و عملیات از ابتدا | **پیشنهاد این بازنگری** |
| سرویس جدا برای هر entity یا هر tool | استقلال ظاهری بیشتر | dependency زیاد، release و observability پرهزینه | رد؛ provider worker pool با نیاز اجرا تفکیک شود |

دلیل پیشنهاد Go برای سرویس‌های اصلی، هم‌راستایی با طرح و تجربه نونز است؛ مهارت فعلی تیم هنوز تأیید نشده. TypeScript/NestJS نیز می‌تواند همین topology را اجرا کند. انتخاب زبان، تضمین سازمانی‌بودن نیست. [برنامه اجرا](./kickstart.md) یک گزینه اصلی مشخص و گیت تعویض زبان دارد.

## ۶. برنامه انتقال کد در صورت ارائه مخزن قبلی

1. نسخه مرجع/commit هر سرویس، مجوز استفاده، CI، dependency lock و migrationها ثبت شود؛ secret و دامنه قبلی منتقل نشوند.
2. بسته‌های فنی pure شامل error/trace/health/config از قوانین فروشگاه جدا شوند؛ shared DB model منتقل نشود.
3. Auth و Gateway در محیط ایزوله با دامنه و secret جدید بالا بیایند؛ بازیابی هویت، callback و logout واقعی بررسی شود.
4. IAM قبلی فقط با تست‌های resource/tenant/team بازاستفاده شود؛ fail شدن این گیت یعنی انتقال ایده و نوشتن پیاده‌سازی جدید.
5. codegen deterministic، migration روی دیتای آزمایشی و deploy مستقل دو نسخه متوالی بررسی شود.
6. خرابی Redis/NATS/worker، webhook تکراری، حذف عضو در حین اجرا و restore از backup تست شود.
7. زمان و درصد صرفه‌جویی **بعد از این ممیزی کد** تخمین زده شود. انتقال دیتای کاربران نونز به لمو یک تصمیم جداست و از بازاستفاده معماری نتیجه نمی‌شود.

## ۷. نتیجه اجرایی

دارایی اصلی نونز، مرزهای فکری و قراردادهای پلتفرم است. ریسک اصلی، برداشت اشتباه از عنوان Workspace و فرض آماده‌بودن IAM برای اشتراک منابع است. طرح جدید در [معماری](./architecture.md) و [مدل مجوز](./auth-and-workspace.md) این شکاف را پوشش می‌دهد؛ فهرست ابهام‌های تجاری در [دفتر تصمیم‌ها](./decision-register.md) ثبت شده است.
