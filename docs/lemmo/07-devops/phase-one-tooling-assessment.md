| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Phase One Diagnostic Tooling and Automation Assessment |
| **Title (FA)** | ارزیابی ابزار و اتوماسیون برای شروع مرحله یک |
| **ID** | DOC-OPS-004 |
| **Category** | `devops` |
| **Status** | `Draft` |
| **Owner** | Platform / Backend / Operations |
| **Last Updated** | 2026-10-15 |
| **Summary (EN)** | Evaluates existing service scaffolding and operational tools, records a reproduced false-success diagnostic result, and proposes bounded shared instrumentation, conformance and runtime evidence before phase-one rollout. |
| **Summary (FA)** | ارزیابی ابزارهای موجود تولید سرویس و تشخیص؛ ثبت موفقیت کاذب بازتولیدشده و پیشنهاد ابزار مشترک، بررسی انطباق و شواهد واقعی پیش از rollout مرحله یک. |
| **Tags** | `automation`, `diagnostics`, `scaffolding`, `phase-one`, `evidence` |

# ارزیابی پیش از شروع مرحله یک

## نتیجه و حدود ارزیابی

ابزار پایه موجود است؛ ساخت یک پلتفرم اتوماسیون جدید لازم نیست. پیشنهاد: **core مشترک + ارتقای generator موجود + checker مستقل + runner عملیاتی محدود**. تولید فایل، انطباق ساختاری، تست رفتار ابزار و سلامت سرویس زنده چهار ادعای متفاوت‌اند.

این دور فقط ارزیابی است. ابزارهای پروژه تغییر نکردند؛ سرویس جدید در repo ساخته نشد؛ Docker واقعی، داده سرویس‌ها و API پولی فراخوانی نشدند. دو اجرای آفلاین در `/tmp/lemmo-tool-assessment-X33FpM` انجام شد: تولید اسکلت با CLI و آزمون معنای نتیجه trace با فرمان‌های بدل. خروجی آن‌ها اثبات runtime محصول نیست.

## موجودی و توصیه بازاستفاده

| ابزار فعلی | شاهد و نتیجه | تصمیم پیشنهادی |
| --- | --- | --- |
| `api/tools/lemmo-cli` | `main.go:134-145` فایل‌های قالب را تعریف می‌کند؛ اجرای آفلاین `service assessment --base-dir ...` موفق و ۱۲ فایل تولید شد؛ templateMainGo interceptor ورودی trace دارد | همان CLI ارتقا یابد؛ generator موازی نسازیم |
| قالب CLI | cmd/main.go، Dockerfile و لایه‌های پایه تولید می‌کند؛ config/default.yaml، deploy/compose.yaml، readiness وابستگی و contract check تولید نمی‌کند | هنوز قالب استاندارد نهایی سرویس جدید نیست؛ با cmd/server/main.go و استقرار سرویس‌محور قواعد فعلی همگام شود |
| core bootstrap/middleware/outbox | logger JSON، interceptor ورودی و TraceID موجود | رفتار مشترک اینجا پیاده شود؛ generator فقط wiring را تولید کند، نه کپی logger در هر سرویس |
| `api/scripts/dev/trace.sh` | ابزار واقعاً وجود دارد؛ نتیجه SUCCESS با یک لاگ و شواهد ناقص آفلاین بازتولید شد | تا اصلاح، مرجع پذیرش سلامت نیست؛ از موجودی/ایده اتصال آن استفاده و نتیجه‌گیری بازطراحی شود |
| `api/Makefile` و `dev_verify.go` | make doctor/trace موجود نیست؛ dev-verify gRPC مستقیم و عملیات نوشتنی دارد؛ خطای Gateway می‌تواند فقط warning شود | Make ورودی runnerهای واضح باشد؛ dev-verify به doctor فقط‌خواندنی تغییرنام داده نشود |
| `api/scripts/deploy_guard.sh` | build failure را کنترل می‌کند؛ اما `POST_BUILD_IMAGE=unknown` مقایسه image را دور می‌زند و probe پیش‌فرض سلامت Quota است | مفید ولی شاهد قطعی هر سرویس نیست؛ identity نامعلوم باید incomplete باشد. این ابزار deploy می‌کند؛ داخل doctor اجرا نشود |
| workflow `context-resilience.yml` | تست و vet و یک آزمون live مختص Context/Quota دارد | شروع خوبی است؛ گیت انطباق همه سرویس‌ها یا شاهد journey کامل نیست؛ وضعیت run زنده در این دور بررسی نشد |
| `db_backup.sh --verify` | صحت اولیه فایل dump را می‌سنجد | شاهد restore نیست؛ خارج از اصلاح اصلی مرحله یک، در برنامه DR حفظ شود |

در محیط ارزیابی Go، Docker و buf در PATH بودند؛ jq، grpcurl و shellcheck با command lookup یافت نشدند. این فقط موجودی ابزار است؛ Docker daemon یا اتصال سرویس بررسی نشده. نصب ابزار تازه شرط تدوین قرارداد نیست؛ runner باید وابستگی ناموجود را صریح گزارش کند.

## آنچه برای همه سرویس‌ها می‌توان خودکار کرد

۱. **تولید اسکلت سرویس جدید با CLI موجود:** wiring core logging/trace، hookهای readiness، config غیرحساس نسخه‌دار، deployment مستقل، شناسه نسخه و skeleton آزمون انطباق. readiness باید وابستگی‌های واقعی تعریف‌نشده را ناقص نشان دهد، نه پاسخ ۲۰۰ ساختگی. نام نقش‌محور و ساختار cmd/server رعایت شود.

۲. **بررسی سرویس‌های موجود:** checker فقط‌خواندنی با inventory نسخه‌دار از سرویس، entrypoint، transport، health، وابستگی‌های ضروری و دامنه rollout. کشف از Compose/فایل‌های سرویس؛ override مستند برای موارد متفاوت. هیچ مقدار secret در inventory نباشد. نبود declaration مساوی غیرضروری‌بودن سرویس نیست.

۳. **نصب خودکار روی کد قدیمی ممنوع به‌عنوان پیش‌فرض:** CLI فعلی `--force` دارد و می‌تواند فایل موجود را بازنویسی کند؛ rollout موجود با diff قابل بازبینی باشد. generator ابتدا در دایرکتوری موقت تولید و compile/contract check شود؛ خروجی تولیدی سالم فرض نشود.

۴. **تست رفتار مشترک:** HTTP/gRPC ورودی/خروجی، SSE و پیام async با trace معتبر/نامعتبر؛ پالایش داده؛ propagation پس از ذخیره outbox؛ reason معلوم/نامعلوم. regex وجود import جای مشاهده رفتار نیست. generator نسخه‌دار باشد تا drift قابل گزارش بماند.

۵. **فرمان عملیاتی واقعی:** make doctor برای وضعیت نسخه/وابستگی با عملیات خواندنی و timeout؛ make trace برای timeline و مرزهای مفقود. runner در tests/live یا tests/e2e طبق قواعد پروژه و Make صرفاً wrapper باشد. ابزار تشخیص به endpoint واقعی متصل شود؛ test fixture فقط برای بررسی خود ابزار است.

## معیار اعتبار نتیجه

| شاهد | چه چیزی را ثابت می‌کند | چه چیزی را ثابت نمی‌کند |
| --- | --- | --- |
| تولید فایل و بررسی ساختار | قالب/metadata وجود دارند | build، رفتار یا سلامت سرویس |
| compile / vet / تست قرارداد | رفتار محدود کد روی ورودی‌های بررسی‌شده | readiness image مستقر یا کل journey |
| آزمون آفلاین runner با وابستگی بدل | در نبود داده/خطا، ابزار نتیجه صحیح می‌دهد | موفقیت مسیر محصول |
| doctor روی نسخه مستقر | بررسی‌های ضروری مشخص در همان زمان پاسخ داده‌اند | کامل‌شدن تولید یا صحت همه حالت‌های مالی |
| trace با hopهای کامل | زنجیره مشاهده‌شده و داده مرتبط به عملیات | تضمین موفقیت بدون رکورد وضعیت/خروجی نهایی |
| journey واقعی و تطبیق نتیجه | رفتار مسیر کاربر روی snapshot معین | پوشش تمام خرابی‌ها یا ظرفیت بلندمدت |

خروجی runner باید برای هر check وضعیت PASS/FAIL/INCOMPLETE، reason، منبع شاهد و زمان داشته باشد. فقط وقتی همه checkهای لازم شواهد کافی دارند جمع‌بندی PASS مجاز است. نبود log یا دسترسی، خطای parser، timeout و نسخه نامعلوم INCOMPLETE است. خروجی process برای FAIL/INCOMPLETE غیرصفر؛ status دقیق در JSON چون Make ممکن است exit code را تبدیل کند.

حداقل evidence bundle: زمان UTC، command، source revision/dirty fingerprint، image digest، نسخه config بدون داده حساس، نتایج checkها، trace/job/event ID و exit status. output خام Redis/body/کوکی/credential ذخیره نشود. snapshot و evidence قابل بازتولید باشند؛ امضای PASS خود ابزار جای بازبین مستقل را نمی‌گیرد.

## ترتیب پیشنهادی شروع مرحله یک

| گام | خروجی | شرط توقف دامنه |
| --- | --- | --- |
| A — تثبیت قرارداد | پنج تصمیم M0 رودمپ و schema نتیجه ابزار؛ owner core و نقش بازبین | تصمیم Wallet/Promo و نصب استک مرکزی وارد این گام نشود |
| B — اعتمادپذیری ابزار | رفع false-success، timeout، داده حساس و query ناامن در ابزار trace؛ inventory محدود و evidence format | ابزار تشخیصی تعمیر/seed/replay/deploy نکند |
| C — پیاده‌سازی core و یک مسیر پایلوت | یک مسیر HTTP/gRPC و مرز async موجود با log/trace/error متصل | از بازنویسی همه سرویس‌ها خودداری شود |
| D — generator و checker | قالب اصلاح‌شده و بررسی انطباق؛ service fixture موقت و آزمون رفتار | rollout همه سرویس‌ها شرط خروج پایلوت نیست |
| E — بررسی مستقل runtime | doctor + trace روی یک موفقیت و شکست مجاز؛ نسخه و شواهد معلوم | کاربر تازه/Claim کامل مرحله ۲ پیش‌نیاز پایلوت نیست |

توصیه: A→B/C→D→E؛ B و C می‌توانند با قرارداد مشترک مستقل پیش بروند، اما هیچ خروجی سلامت پیش از اصلاح نتیجه‌گیری ابزار پذیرفته نشود. برای سرویس‌های جدید generator از ابتدا قرارداد را اعمال کند؛ سرویس‌های موجود مسیر MVP تدریجی تطبیق یابند.

بریف مرحله یک هنوز در این ارزیابی ساخته یا اجرا نشده است؛ بعد از تصمیم دامنه، مطابق checklist اصلی تدوین می‌شود. این پیشنهاد الزام ایجاد ابزار بزرگ یا خرید سرویس بیرونی ندارد. Collector و dashboard همان REL-01 پس از MVP می‌مانند.

## ثبت باگ و تبدیل بعدی به تسک

طبق دستور مالک محصول، مرجع گزارش باگ و اختلال **[incidents/](./incidents/index.md)** است؛ شامل نقص غیرمسدودکننده و اشکال ابزار هم می‌شود. هر مورد مشاهده، شواهد، اثر، وضعیت RCA (تأییدشده/فرضیه)، محدودیت موقت، مالک نقش، اولویت و شرط بازگشت داشته باشد. سپس تسک مرتبط از آن استخراج یا به تسک موجود ادغام شود؛ گزارش تاریخی حذف نمی‌شود.

دفتر بدهی `.task/active/STB_POST_MVP_DEBT.md` تنها ردیاب زمان‌بندی/تعویق و لینک گزارش است، نه محل موازی شرح باگ. نقض قواعد تحویل همچنان در VIOLATIONS_LOG نیز با لینک incident ثبت می‌شود. ساخت تسک و اجرای اصلاحات در این دور ارزیابی انجام نشده است.

یافته تازه: [INC-2026-10-15-DIAG-01](./incidents/INC-2026-10-15-diagnostic-tool-false-success.md). تصمیم اجرایی پیشنهادی: اصلاح آن شرط اتکا به trace در مرحله یک است؛ مشاهده آن کل محصول را خراب اعلام نمی‌کند.
