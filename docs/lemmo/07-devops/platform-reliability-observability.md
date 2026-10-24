| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Platform Reliability and Observability |
| **Title (FA)** | قابلیت اطمینان و مشاهده‌پذیری پلتفرم |
| **ID** | DOC-OPS-003 |
| **Category** | `devops` |
| **Status** | `Draft` |
| **Owner** | Platform / Backend / Operations (proposed roles) |
| **Last Updated** | 2026-10-15 |
| **Summary (EN)** | Source-based inventory and phased reliability plan covering telemetry, health, recovery, idempotency, messaging, provider isolation, audit, alerting and disaster recovery. Separates existing code from runtime acceptance and MVP needs from post-MVP work. |
| **Summary (FA)** | موجودی مبتنی بر کد و برنامه قابلیت اطمینان؛ تفکیک امکانات موجود، شکاف‌ها و پذیرش عملیاتی، با حداقل پیش از MVP و توسعه پس از آن. |
| **Tags** | `reliability`, `observability`, `recovery`, `operations`, `mvp` |

# Platform Reliability & Observability

## دامنه و وضعیت

این سند پاسخ به چک‌لیست مشاور و درخواست مالک محصول برای ثبت کمبودها در رودمپ است. مشاهده سورس در 2026-10-15 انجام شده؛ تغییرات جاری و commit‌نشده Job/Quota نیز در آن حضور دارند. وجود کلاس، فایل، تست یا نام فناوری اثبات کارکرد نسخه مستقر نیست. هیچ fault injection، درخواست پولی، استقرار یا restore در این بررسی انجام نشده است.

قابلیت مشترک پلتفرم تعریف می‌شود، نه میکروسرویس اجباری میان Gateway و سرویس‌ها. تصمیم جاری دامنه MVP در [رودمپ بک‌اند](../03-backend/roadmap.md) حفظ می‌شود. جزئیات اجرایی پیشنهادی جدید این سند Draft هستند؛ انتخاب محصول مانیتورینگ، عدد SLO و تخصیص افراد هنوز تصویب نشده‌اند. قرارداد حداقلی trace/log و فرمان‌های Make در [DOC-BE-015](../03-backend/mvp-operational-readiness.md) نگهداری می‌شوند و اینجا تکرار نمی‌شوند.

## ۱. موجودی واقعی قابلیت‌ها

مسیرهای کد نسبت به ریشه ورک‌اسپیس‌اند. «مشاهده نشد» محدود به دامنه بررسی است، نه ادعای نبود در محیط بیرونی. Composeهای `api/infra/` و `api/services/`، core، Job، Image، Model Router، Quota، ابزار backup و اسناد DevOps بررسی شدند.

| قابلیت | وضعیت بر اساس سورس | شاهد | شکاف و مرحله |
| --- | --- | --- | --- |
| Distributed tracing / logging | پیاده‌سازی مسیر بتا (TASK_OBS_01 / D-26..D-30) | `api/services/{agent,quota,storage,model-router}-service/internal/observability/`؛ `api/contracts/platform/observability/log-event.schema.json` (سابقه و بدهی تاریخی: `api/core/middleware/trace.go:76`) | انتشار W3C traceparent در Kong و ۴ سرویس بتا برقرار شد؛ لاگ استاندارد JSON روی stdout + فرمان `make trace TRACE_ID=<id>` فعال است. استک مرکزی Collector/Exporter در REL-01 پس از MVP |
| Collector / metrics / logs / dashboards | استک استقرار در Composeهای بررسی‌شده مشاهده نشد | جست‌وجوی Collector/OTel، Prometheus، Grafana، Loki، Tempo، Jaeger در Composeها | وجود import کتابخانه OTel معادل Collector نیست؛ استک مرکزی در REL-01 پس از MVP |
| Job recovery / reconciliation | جزئی و دامنه‌ای | `api/services/job-service/internal/app/service.go:358` (outbox)؛ `api/services/quota-service/internal/app/service.go:423,1351,1456`؛ `api/services/image-service/internal/app/service.go:592` | بازنشر outbox، بازیابی Claim/رزرو و upload موجود؛ sweeper جامع برای RUNNING رهاشده و تضمین پایان همه Jobها اثبات نشده؛ REL-02 |
| Idempotency / deduplication | پایه موجود | `api/core/idempotency/keys.go:41` و `redis.go`؛ `api/services/image-service/internal/app/service.go:100` | lookup کار موجود و کلید scoped وجود دارد؛ رقابت هم‌زمان و رفتار Provider پس از timeout باید مستقل بررسی شود. STB-03/04 و REL-02؛ trace جای کلید idempotency نیست |
| Timeout / retry / circuit breaker | جزئی | `api/services/image-service/internal/adapters/consumer/rabbitmq_consumer.go:260`؛ `api/services/model-router-service/internal/app/service.go:41,134` و `internal/domain/model.go:130` | consumer timeout و reconnect دارد؛ breaker در انتخاب instance خوانده می‌شود، اما در کد تولیدی model-router فراخوانی RecordSuccess/RecordFailure خارج از تعریف پیدا نشد. از وجود کلاس نتیجه حفاظت عملی نگیریم؛ REL-03 |
| Transactional outbox / inbox | outbox موجود؛ inbox جامع تأیید نشد | `api/core/outbox/`؛ `api/services/job-service/internal/domain/outbox.go`؛ `internal/adapters/postgres/job_repository.go:337,433` | outbox و publisher confirm در تغییرات فعلی وجود دارند؛ atomicity تمام مسیرهای retry و dedup پایدار consumer پذیرش جامع ندارد؛ REL-02 |
| Health / readiness | ناقص | `api/services/quota-service/internal/adapters/http/handler.go:34,141`؛ `api/services/agent-service/internal/adapters/http/handler.go:35,46` | health و ready به پاسخ ثابت متصل‌اند؛ healthcheck لجر echo است. بررسی وابستگی ضروری در STB-09/10 |
| DLQ / failure replay | DLQ موجود؛ replay عملیاتی امن اثبات نشده | `api/services/job-service/internal/adapters/rabbitmq/publisher.go:149-195`؛ `api/services/image-service/internal/adapters/consumer/rabbitmq_consumer.go:266` | تعریف DLX/DLQ و Nack وجود دارد؛ ابزار اپراتوری replay با کنترل اثر مالی، مجوز و ممیزی مشاهده نشد؛ REL-02 |
| Provider concurrency / isolation | کنترل‌های جزئی | `api/services/model-router-service/internal/app/service.go:139` (rate limit)؛ `api/services/image-service/internal/adapters/consumer/rabbitmq_consumer.go:201,237` (QoS و حلقه پردازش) | RPM و prefetch به‌تنهایی bulkhead مستقل هر Provider نیستند؛ ظرفیت، صف انتظار و جلوگیری از انسداد سایر Providerها در REL-03 |
| Audit trail | دامنه‌ای، نه سراسری | `api/services/reference-data-registry/internal/domain/audit.go`؛ `migrations/000002_create_audit_logs_table.up.sql`؛ `03-backend/services.md`، audit-service برنامه آینده | لاگ تشخیصی جای رکورد ممیزی پایدار نیست؛ پوشش اقدامات حساس و مالک هر رخداد در REL-04 |
| SLO / alerting / runbooks | runbook و incident موجود؛ SLO و alert عملیاتی یکپارچه تأیید نشد | [فهرست runbookها](./runbooks/index.md)، [رخدادها](./incidents/index.md) | هدف، پنجره اندازه‌گیری، مالک اعلان و کانال عملیاتی در REL-01؛ پیش از MVP دستور تشخیص و مسئول پاسخ مشخص باشد |
| Disaster recovery | سیاست و ابزار dump موجود؛ restore اثبات نشده | [سیاست فعلی backup](./index.md)؛ `api/tools/backup/db_backup.sh:63-80` | verify فقط nonempty/header dump را می‌سنجد؛ بازیابی PG، لجر و objectها، PITR و اندازه‌گیری RPO/RTO باید بررسی شود؛ حداقل بازیابی لانچ در STB-10 و تکمیل REL-05 |

«هیچ‌چیز نداریم» و «همه‌چیز آماده است» هر دو نادرست‌اند. وضعیت غالب، پیاده‌سازی جزئی با شکاف اتصال و شواهد runtime است. مشکلات فوق خودکار blocker لانچ یا تخلف تأییدشده اعلام نشده‌اند؛ اثر در مسیر منتخب باید بازتولید شود.

## ۲. پنج محور قرارداد Reliability

### شناسه و انتشار context

مرجع قرارداد جزئی DOC-BE-015 است. HTTP/gRPC ورودی و خروجی، پاسخ خطا، SSE، outbox ذخیره‌شده و consumer باید به trace و شناسه پایدار عملیات متصل باشند. در SSE قطع اتصال مرورگر به معنای شکست اجرای Provider نیست؛ بازیابی وضعیت از سرویس مالک انجام شود. هدرهای trace داده غیرقابل‌اعتمادند و مجوز دسترسی ایجاد نمی‌کنند.

### سلامت و قطع وابستگی

Liveness از readiness و journey جدا باشد. فقط وابستگی ضروری برای همان قابلیت، با deadline محدود بررسی شود؛ قطع Provider یا collector باعث restart دسته‌جمعی سرویس‌ها نشود. Context می‌تواند خواندن تاریخچه را ادامه دهد درحالی‌که تولید مالی مسدود است، مطابق قرارداد مصوب همان دامنه. نبود workspace حالت onboarding است، نه اختلال زیرساخت.

### Timeout، retry، circuit breaker و idempotency

Deadline و بودجه retry در config نسخه‌دار و تحت مالکیت مرز فراخوانی باشند؛ retryهای چندلایه نباید هزینه و تعداد تلاش را چندبرابر کنند. timeout Provider به معنی اجرا نشدن نیست. در نتیجه نامعلوم، بازیابی با provider_request_id یا قابلیت idempotency همان Provider بررسی شود؛ ارسال مجدد کور مجاز نیست. ثبت موفقیت/شکست واقعی باید breaker را تغذیه کند. ظرفیت و صف انتظار هر Provider جدا و محدود شوند؛ نام و مقادیر آستانه‌ها هنگام تدوین بریف تعیین شوند، نه به شکل ثابت در سورس.

### مالکیت recovery و reconciliation

| مسئولیت | مالک پیشنهادی در مرز موجود | مرز اختیار |
| --- | --- | --- |
| وضعیت پایدار Job، تشخیص کار رهاشده و هماهنگی تلاش | job-service | ادعای دریافت پاسخ Provider را از Worker بگیرد؛ خودش پول را اصلاح نکند |
| درخواست Provider، نتیجه نامعلوم و بازیابی upload | image-service و adapterهای Provider | از نتیجه موجود استفاده کند؛ upload مجدد نباید inference تازه بسازد |
| رزرو، Claim، تسویه و تطبیق با لجر | quota-service | تنها مرجع تغییر اثر مالی؛ compensation با شواهد و هویت عملیات |
| ثبت Asset و صحت دسترسی فایل | storage-service با caller مالک فرایند | فایل بدون metadata یا metadata بدون فایل تشخیص داده شود؛ repair جدا از گزارش |
| وضعیت پیام و نمایش پایان در UI | agent-service + SDK/UI | وضعیت UI را به‌جای وضعیت واقعی Job/مالی ننشاند |
| workflow چندمرحله‌ای در دامنه مصوب | orchestrator-service موجود | نام مفهومی Workflow Service در پیشنهاد، مجوز ایجاد سرویس تازه نیست |

این تفکیک جزئیات اجرایی پیشنهادی است؛ قراردادهای مصوب دامنه مقدم‌اند. تعمیر خودکار، replay و اصلاح داده مستقیماً از collector یا داشبورد انجام نمی‌شوند. ابتدا تشخیص فقط‌خواندنی، سپس عملیات مجاز، محدود، idempotent و ممیزی‌شده در سرویس مالک.

### Logging، metrics، alerting و عملیات

stdout JSON و جمع‌آوری محلی برای MVP کافی‌اند. در گسترش بعدی، telemetry از مسیر تجاری جدا باشد؛ exporter ناهمگام، queue و حافظه محدود، timeout و شمارنده dropped signals داشته باشد. Collector سلامت و ظرفیت خودش را گزارش کند. نشت payload و secret قبل از export کنترل شود و retention/دسترسی محدود باشد.

Metrics پیشنهادی: نرخ خطا و latency مسیر، سن قدیمی‌ترین Job/outbox، تعداد کارهای نامعلوم، backlog/DLQ، خطای upload، ظرفیت Provider و شکست reconciliation. trace_id، job_id و user_id به label متریک تبدیل نشوند تا cardinality نامحدود ایجاد نکنند. audit امنیتی/مالی تابع سیاست نگهداری مستقل و پایدار است و با sampling/drop لاگ تشخیصی حذف نمی‌شود.

SLOها ابتدا به صورت تعریف شاخص، پنجره، دامنه و مالک نوشته شوند؛ عدد هدف پس از baseline و تصمیم مالک ثبت شود. برای هر alert یک اقدام و runbook وجود داشته باشد؛ صرف dashboard معیار آمادگی نیست.

## ۳. استک مرکزی آینده؛ انتخاب ابزار هنوز نهایی نیست

الگوی هدف: SDK/سرویس‌ها/workerها → export مستقل → Collector → ذخیره trace/metric/log → نمایش و alert. این فلش‌ها مسیر telemetry هستند، نه عبور درخواست تجاری. استقرار مطابق Docker Compose پروژه و نام‌گذاری اجزا بر اساس نقش خواهد بود.

OpenTelemetry Collector گزینه جمع‌آوری؛ Tempo یا Jaeger گزینه trace؛ Prometheus گزینه metrics؛ Loki گزینه logs و Grafana گزینه نمایش‌اند. نصب همه ابزارها یا انتخاب هم‌زمان Tempo و Jaeger لازم نیست. هزینه عملیاتی، retention، امنیت، حجم داده و توان تیم معیار انتخاب‌اند. این سند هیچ‌یک را نصب‌شده یا انتخاب قطعی اعلام نمی‌کند.

الگوی Collector Gateway در [مستند رسمی OpenTelemetry](https://opentelemetry.io/docs/collector/deploy/gateway/) دریافت telemetry روی endpoint مشترک را توضیح می‌دهد؛ «Gateway» آن با API Gateway تجاری پروژه متفاوت است. طبق [راهنمای resiliency](https://opentelemetry.io/docs/collector/resiliency/)، queue محدود، retry و ذخیره پایدار اختیاری نیز از دست‌رفتن telemetry را در همه شرایط ناممکن نمی‌کنند. تحمل قطع collector باید در برنامه خود سرویس‌ها هم بررسی شود؛ صرف نصب ابزار تضمین استقلال نیست.

## ۴. مرور محدود حالت‌های شکست پیش از توسعه

| مرز شکست | شاهد لازم | پاسخ محدود MVP / مسیر تکمیل |
| --- | --- | --- |
| ثبت Job موفق، انتشار صف ناموفق | Job/event پایدار و وضعیت dispatch | بررسی outbox موجود؛ failure/retry قابل تشخیص؛ پوشش جامع REL-02 |
| Worker پس از شروع Provider قطع می‌شود | Job/attempt/provider_request_id و نتیجه معلوم یا نامعلوم | انتظار بی‌پایان پنهان نباشد؛ retry پولی کور ممنوع؛ sweeper جامع REL-02 |
| Provider پاسخ می‌دهد ولی upload شکست می‌خورد | نتیجه Provider و وضعیت Asset | بازیابی از خروجی موجود بررسی شود؛ همه حالت‌های خرابی REL-02 |
| رزرو/تسویه timeout می‌شود | هویت عملیات و receipt/lookup لجر | نتیجه نامعلوم صریح؛ اصلاح مالی با سرویس مالک؛ ماتریس جامع در بدهی موجود |
| پیام تکراری یا poison می‌رسد | event ثابت، تلاش‌ها و نتیجه dedup/DLQ | replay خودکار سراسری اضافه نشود؛ REL-02 |
| یک Provider کند می‌شود | صف، زمان انتظار و ظرفیت سایر Providerها | اثر مسیر لانچ مشاهده شود؛ bulkhead و breaker متصل REL-03 |
| collector یا دیسک لاگ از دسترس خارج می‌شود | latency مسیر و مصرف منابع/drop | rollout telemetry مسیر اصلی را متوقف نکند؛ log rotation محدود؛ REL-01 |
| پایگاه داده/لجر/فایل از دست می‌رود | restore در محیط ایزوله و تطبیق داده‌ها | شاهد حداقلی بازیابی برای لانچ؛ برنامه کامل REL-05 |

این مرور read-only طراحی است؛ اجرای خرابی و عملیات بازیابی نیازمند محیط مجاز و بریف محدود است. باگ پیچیده غیرمسدودکننده در دفتر بدهی باقی می‌ماند؛ مشاهده اثر مالی نادرست، از دست رفتن خروجی یا قطع مسیر اصلی برای تصمیم محدودسازی لانچ برمی‌گردد.

## ۵. تحویل مرحله‌ای و شواهد پذیرش

شناسه‌های REL بسته‌های رودمپ‌اند، نه تسک اجرایی آماده. پیش از اجرا بریف TASK با checklist قالب اصلی و برچسب‌های مرتبط ساخته شود؛ نقش مسئول به معنی تخصیص فرد نیست. مرجع توالی در [رودمپ اصلی](../03-backend/roadmap.md) است.

- **پیش از MVP — STB-05..10:** trace/log/error مسیر منتخب، readiness صادقانه، doctor/trace، یک journey واقعی و شکست قابل تشخیص؛ شاهد بازیابی حداقلی و دستور رسیدگی. بدون سرویس تجاری جدید یا الزام استک مرکزی.
- **REL-01 — پس از MVP / Platform & Operations:** telemetry مرکزی، metric/SLO/alert و دسترسی/retention؛ پذیرش با ارسال signal، قطع collector بدون اختلال محصول، اعلان قابل اقدام و کنترل ظرفیت. وابسته به قرارداد STB-05.
- **REL-02 — پس از MVP / Job, Image, Quota, Storage:** stuck-job reconciliation، inbox/dedup و replay مجاز؛ پذیرش با crash/redelivery و نبود inference/اثر مالی مضاعف. ادامه بدهی‌های STB-DEBT-01..03 و 05؛ پروژه موازی تعمیر مالی ایجاد نشود.
- **REL-03 — پس از MVP / Model Router & Image:** اتصال واقعی breaker و جداسازی ظرفیت Provider؛ پذیرش با کندی یک Provider و ادامه دیگری، سقف retry/concurrency و بازگشت کنترل‌شده مدار. اعداد در config.
- **REL-04 — پس از MVP / Security & Domain Owners:** موجودی رخدادهای حساس، audit پایدار و عملیات replay ممیزی‌شده؛ ابتدا قابلیت دامنه‌ای موجود، سپس تصمیم مستقل درباره audit-service از قبل برنامه‌ریزی‌شده. پذیرش با actor/action/target/outcome و دسترسی/نگهداری مشخص.
- **REL-05 — پس از MVP / Operations & Data Owners:** restore واقعی PG، financial-ledger و object storage، پوشش DBهای فعال و تطبیق بین داده‌ها؛ اندازه‌گیری RPO/RTO و برنامه تمرین. سیاست فعلی DevOps هدف RPO کمتر از ۱۵ دقیقه و RTO کمتر از ۴ ساعت را دارد؛ دستیابی به آن هنوز در این بررسی اثبات نشده و هدف جدید جعل نمی‌شود.

تمام بسته‌ها Planned و فاقد پذیرش runtime این دور هستند. شروع بازبینی بدهی‌ها اولین برنامه‌ریزی پس از لانچ است؛ تاریخ و افراد بعد از تعیین لانچ تخصیص می‌یابند. هیچ معیار CI باز با این برنامه PASS یا N/A نمی‌شود.


## همگام‌سازی با ADR-022 — پیشنهاد ثبت‌شده

مرجع: [ADR-022](../01-architecture/decisions/ADR-022-platform-reliability-and-observability.md)، وضعیت **Draft / Proposed**؛ متن زیر پیشنهاد معماری است و ادعای تصویب جزئیات یا اجرای قابلیت‌ها نیست. جهت‌گیری قبلی مالک محصول درباره دامنه MVP محفوظ است.

۱. Observability قابلیت مشترک و خارج از مسیر تجاری است؛ سرویس واسط اجباری میان Gateway و سرویس‌ها ایجاد نمی‌شود. قطع collector نباید عملیات محصول را متوقف کند؛ export ناهمگام و منابع آن محدود باشند.

۲. trace/context در HTTP، gRPC، SSE، outbox و broker منتقل شود؛ شناسه پایدار Job/event/attempt برای بازیابی حفظ شود. trace جای idempotency یا هویت امنیتی نیست. لاگ JSON پالایش‌شده، reason/domain و کد پیگیری تا UI حفظ شوند.

۳. liveness، readiness وابستگی ضروری و journey واقعی سه ادعای مستقل‌اند. پاسخ ثابت UP، وجود کانتینر و موفقیت تست in-process به‌تنهایی سلامت محصول را ثابت نمی‌کنند. فرمان عملیاتی باید شکست و بررسی ناقص را غیرموفق گزارش کند.

۴. recovery در سرویس مالک باقی می‌ماند: Job مالک چرخه Job، Image مالک تعامل Provider و بازیابی خروجی، Quota مالک اثر مالی، Storage مالک Asset و Agent مالک چرخه پیام است؛ این مرزبندی مالکیت‌های مصوب ADR-018..020 را جابه‌جا نمی‌کند. timeout Provider شکست قطعی نیست و retry پولی کور مجاز نیست.

۵. timeout/retry budget، circuit breaker، idempotency و جداسازی ظرفیت در مرز فراخوانی اعمال شوند. آستانه‌ها در config نسخه‌دار باشند. وجود کلاس breaker یا صف DLQ جای اثبات اتصال به رفتار واقعی و replay امن را نمی‌گیرد.

۶. قبل از MVP حداقل trace/log/error، readiness صادقانه، doctor/trace و یک مسیر موفق و شکست قابل تشخیص در STB-05..10 هدف است. استک مرکزی، recovery جامع، bulkhead پیشرفته، audit گسترده و DR کامل در REL-01..05 پس از MVP پیگیری شوند؛ شاهد بازیابی حداقلی لانچ حذف نمی‌شود.

۷. تعویق باگ پیچیده، رفع‌شدن یا پذیرش کامل نیست؛ ریسک، محدودیت و شرط بازگشت ثبت شوند. اثر مشاهده‌شده بر امنیت، مالی یا مسیر اصلی برای تصمیم محدودسازی لانچ بازگردد. checklist، CI و بازبینی مستقل با این ADR دور زده نمی‌شوند.

۸. انتخاب Collector/backendها، عدد SLO، کانال اعلان و افراد مسئول از این تصمیم نتیجه نمی‌شود. audit پایدار امنیتی/مالی با telemetry قابل sampling/drop یکی نیست. این ADR مالک بتا/Promo را تعیین نمی‌کند و هیچ سرویس تجاری جدیدی تصویب نمی‌کند.


## تفکیک گیت تشخیص اولیه از پذیرش محصول — رودمپ نسخه ۵

طبق دستور مالک محصول در 2026-10-15، اول تشخیص‌پذیری، سپس تکمیل backend با مالکیت دائمی، سپس آماده‌سازی frontend و اتصال کامل انجام می‌شود. گیت مرحله اول روی یک مسیر موجود منتخب و شکست کنترل‌شده همان مسیر است؛ تکمیل دعوت/Claim/چت جدید پیش‌نیاز آن نیست. هر مسیر تازه استاندارد trace/log را هنگام توسعه می‌پذیرد؛ journey کامل مرورگر تا اثر مالی و ذخیره در مرحله اتصال بررسی می‌شود. STB-10 پذیرش نهایی محصول است و شروع تکمیل backend را مسدود نمی‌کند. متن قبلی درباره journey نهایی در این دامنه خوانده شود؛ این تفکیک حذف شواهد یا تصویب ضمنی جزئیات Draft نیست.
