| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Backend Decision and Ambiguity Register |
| **Title (FA)** | دفتر تصمیم‌ها، ابهام‌ها و گیت‌های معماری |
| **ID** | DOC-BE-009 |
| **Category** | `backend` |
| **Status** | `Draft` |
| **Owner** | Backend & Platform Team |
| **Last Updated** | 2026-09-23 |
| **Summary (EN)** | Explicit product decisions, default proposals, dependencies and architecture review gates for the api project. |
| **Summary (FA)** | دفتر تصمیم‌ها، ابهام‌ها و گیت‌های معماری؛ حاصل ممیزی کد و تحلیل معماری، برای بررسی تیم. |
| **Tags** | `decisions`, `ambiguities`, `gates`, `product`, `risks` |

---

# دفتر تصمیم‌ها، ابهام‌ها و گیت‌های معماری

## ۱. قواعد خواندن و وضعیت

تمام موارد زیر **پیشنهاد برای بازبینی** هستند؛ نیاز صریح کاربر به میکروسرویس، بررسی app/dotdive و دعوت تیم به پروژه مبنای دامنه است. سندی در این بسته با اجرای این تسک به Approved تبدیل نشده و هیچ تصمیم Active فرانت لغو نشده است. موارد با «گیت قبل از تولید» اجازه نمی‌دهند default موقت بی‌اعلان به قرارداد مشتری تبدیل شود؛ کارهای مستقل می‌توانند طبق [برنامه اجرا](./kickstart.md) پیش بروند.

مالک تصمیم‌ها نقش پیشنهادی تیم است؛ نام شخص مسئول هنوز مشخص نیست. برای تصویب، در هر ردیف نتیجه، مسئول، تاریخ، دلیل و ADR مربوط ثبت شود. تصمیم‌های مخالف با مصوبه Active باید مسیر ADR رسمی را طی کنند.

## ۲. تصمیم‌های محصول و دسترسی

| ID | ابهام / گزینه‌ها | پیش‌فرض پیشنهادی و دلیل | مالک / آخرین گیت | اثر تصمیم دیگر |
| :--- | :--- | :--- | :--- | :--- |
| D01 | Project برابر Canvas است یا ظرف چند محتوا؟ | Project ظرف Board/Thread/Asset/Job؛ همکاری به بوم محدود نیست | Product + Backend / پیش از schema G1 | یکی‌گرفتن آن‌ها توسعه Chat و Asset را به Canvas گره می‌زند |
| D02 | تیم محدود به Workspace یا قابل انتقال بین سازمان‌ها؟ | Team داخلی Workspace؛ همکاری بیرونی با guest | Product + Security / G1 | تیم cross-tenant نیاز به trust/consent و billing پیچیده دارد |
| D03 | Owner/Admin محتوای همه پروژه‌ها را می‌بیند؟ | restricted با grant صریح؛ recovery auditشده | Product + Security / پیش از rollout ACL | دسترسی implicit باید در policy، UI privacy و تست‌ها صریح شود |
| D04 | نقش project مستقل یا همان چهار نقش Workspace؟ | maintainer/editor/viewer مستقل؛ Workspace ceiling و guest | Product + Backend / G1 | role تک‌سطحی پروژه خصوصی و مهمان را مبهم می‌کند |
| D05 | admin اختیار billing دارد؟ | خیر پیش‌فرض؛ grant مالی صریح Owner | Product / پیش از checkout | دسترسی مالی ناخواسته اعضای فنی |
| D06 | guest چه چیزی می‌بیند و آیا seat مصرف می‌کند؟ | فقط پروژه‌های grantشده؛ seat pricing هنوز باز | Product + Billing / قبل از پلن عمومی | entitlement/seats و UI دعوت تغییر می‌کند |
| D07 | بودجه شخصی یا Workspace هزینه اجرا را می‌دهد؟ | Workspace account؛ پروژه/principal صرفاً cost attribution و budget | Product + Billing / G2 | انتخاب کیف پول شخصی نیاز به انتخاب صریح payer و consent دارد |
| D08 | credit، pack، bonus و refund چه قواعدی دارند؟ | واحدهای typed، قیمت versionدار؛ اعداد UI صرفاً نمونه؛ reserve/capture/release | Product + Finance / قبل از پرداخت واقعی | expiry، مالیات، currency، seat و gateway نیاز به قرارداد جدا دارند |
| D09 | حذف عضو/لغو اجرا هزینه شروع‌شده را پس می‌دهد؟ | توقف best-effort؛ هزینه واقعیِ مجاز قبل از revoke طبق policy؛ تحویل به عضو حذف‌شده ممنوع | Product + Billing / G2 | refund کامل ممکن است هزینه جذب‌شده شرکت و abuse ایجاد کند |
| D10 | revoke لینک فوراً bytes قبلی را قطع کند؟ | URL کوتاه‌عمر تا ۶۰s؛ حساس‌ها proxy؛ copy دریافت‌شده قابل پس‌گیری نیست | Security + Product / قبل از share عمومی | revoke سخت به proxy/download stream control و هزینه بیشتر نیاز دارد |
| D11 | انتشار feed شامل prompt/reference هم می‌شود؟ | snapshot صریح؛ reference و prompt خصوصی خودکار منتشر نمی‌شوند | Product / G3 | مدل consent و UI انتشار تغییر می‌کند |
| D12 | retention ۳۰/۹۰/forever روی چه چیزی است؟ | history جدا از Asset pinشده، publication، backup و ledger | Product + Security / قبل از purge | حذف ناآگاهانه فایل‌های پروژه و سوابق قابل حسابرسی |
| D13 | training opt-out چه ضمانتی می‌دهد؟ | فقط Provider مطابق policy؛ در نبود پشتیبانی reject | Product + AI / قبل از Provider واقعی | toggle بدون enforce وعده غیرواقعی به مشتری است |
| D14 | realtime collaboration در اولین عرضه لازم است؟ | save revisionدار P0؛ presence/comments P1؛ CRDT پس از نیاز روشن | Product + Studio / G3 | اگر ویرایش همزمان شرط عرضه است G3 باید شامل CRDT و conflict tests شود |
| D15 | افزونه فقط داخلی/manifest است یا کد ثالث؟ | schema-first مطابق مبنای Active؛ third-party بعد از sandbox/consent | Product + Platform / G3–G4 | import مستقیم کد ثالث در origin اصلی قابل قبول نیست |
| D16 | چه Provider/model و کدام منطقه قابل استفاده است؟ | انتخاب پس از بررسی API واقعی، SLA، residency، مجوز و هزینه | Product + AI + Ops / G2 | نام مدل در mock اثبات API یا امکان تجاری نیست |

## ۳. تصمیم‌های فنی و عملیاتی

| ID | انتخاب پیشنهادی | علت و tradeoff | شرط تغییر / گیت |
| :--- | :--- | :--- | :--- |
| T01 | microservice با مالکیت مستقل و مرز درشت | پاسخ به هدف صریح؛ هزینه distributed consistency پذیرفته می‌شود | اگر ظرفیت عملیات کافی نیست، دامنه کاهش یابد یا ADR تغییر سبک؛ اسم microservice به مونولیت توزیع‌شده داده نشود |
| T02 | Go برای سرویس‌های اصلی | امکان استفاده از تجربه نونز؛ خود این تجربه هنوز از کد تأیید نشده | G0: مهارت تیم و کد nons-api؛ گزینه دوم TypeScript/NestJS بدون تغییر قرارداد/مالکیت |
| T03 | PostgreSQL، S3-compatible، NATS JetStream، Redis غیر authoritative | داده رابطه‌ای، object بزرگ و پیام durable | G0 compatibility/license/version pin؛ benchmark پیش از ظرفیت production |
| T04 | REST/OpenAPI + event JSON schema؛ gRPC اختیاری | SDK وب مستقیم و source واحد برای هر نوع contract | proto-first فقط پس از ADR و حذف source موازی؛ codegen قبلی مشروط قابل استفاده |
| T05 | Kratos + Identity Edge؛ Hydra هنگام delegation | تفکیک هویت/نشست از OAuth و کاهش جزء بی‌مصرف | OAuth client عمومی/marketplace/mobile نیاز Hydra را جلو می‌اندازد؛ SSO license/features را تست کنید |
| T06 | RBAC+relation محدود در Access DB | عضویت و grant اتمیک؛ جلوگیری از custom policy engine عمومی | graph inheritance بزرگ → ارزیابی OpenFGA با consistency و migration آزمایش‌شده |
| T07 | عدم positive allow cache حساس در ابتدا | revoke صحیح و مدل ساده | فقط پس از latency benchmark و قرارداد freshness مجاز به cache |
| T08 | DB منطقی و credential مستقل هر سرویس | isolation و deploy مستقل؛ cluster مشترک هزینه را کاهش می‌دهد | tenant enterprise خاص یا noisy neighbor → cluster/storage اختصاصی |
| T09 | durable execution در DB+JetStream و reconciliation | ادغام با نونز؛ state machine باید قابل بازیابی باشد | workflow انسانی/انتظار طولانی/تعداد state زیاد → ارزیابی موتور workflow پایدار با ADR |
| T10 | Helm/Kubernetes برای production در صورت تیم عملیاتی | هم‌راستایی با نونز؛ HA/quorum/backup هزینه واقعی دارند | G0 بودجه/on-call؛ Compose برای local لزوماً production نیست |
| T11 | اهداف عملکردی آزمایشی [معماری](./architecture.md) | امکان تست بدون ادعای SLA اثبات‌نشده | قبل از تعهد مشتری load/restore/failure tests لازم |
| T12 | بازاستفاده کد نونز پس از ممیزی مخزن executable | dotdive صرفاً سند است | commit/tests/migrations/license/secret/config و runtime لازم؛ مانع نگارش این اسناد نیست |

## ۴. انحراف‌های کشف‌شده و حل در این بسته

| ID | مبنا / شاهد | مسئله | اقدام این بازنگری |
| :--- | :--- | :--- | :--- |
| C01 | Active DOC-FE-002 در برابر mock importهای app | Zero-Leakage فعلاً محقق نیست | مبنا حفظ؛ اصلاح UI data access در G1/G2 |
| C02 | SDK index | live هنوز mock است | fail-fast و adapter واقعی شرط گیت Live |
| C03 | پیش‌نویس DOC-BE-003/005 | پیشنهاد مونولیت در برابر هدف فعلی میکروسرویس | همان پیش‌نویس‌ها بازنگری شدند؛ تصمیم مصوب منسوخ نشد |
| C04 | SDK types در برابر DOC-BE-001 اولیه | numeric timestamp و single output در برابر ISO و batch | wire/facade تفکیک و جدول مهاجرت ثبت شد |
| C05 | data-model اولیه | wallets userمحور در برابر تیم و Workspace | billing account پیشنهادی Workspace؛ نیاز تأیید D07 |
| C06 | Workspace نونز | seller/admin area در برابر tenant لمو | مدل جدید Workspace/Team/Project؛ انتقال enum نونز رد شد |
| C07 | IAM نونز | key Proto و ادعای permission runtime بدون deploy | ترکیب role runtime؛ action تازه contract+enforcement+release |
| C08 | auth اولیه | برداشت password login از UI تنظیمات | جریان login واقعی هنوز تصمیم/اتصال لازم دارد؛ یک SSOT در IdP |
| C09 | iframe/code import | برداشت import=استقلال کامل از امنیت backend | کلاس افزونه و capability در سند مستقل تعریف شد |
| C10 | data-model اولیه | favorite مشترک و حذف نرم سراسری | favorite per-user؛ ledger append-only و retention تفکیک‌شده |

گزارش C01 انحراف کد از قاعده Active است، نه پیشنهاد تغییر آن. بازنگری اسناد Draft با درخواست فعلی انجام شده و متن هیچ ADR تاریخی Active/Approved تغییر نکرده است. پیشنهاد مرزهای اصلی در [ADR-004](../architecture/decisions/adr-004-backend-microservices.md) ثبت شده است. انتخاب‌های نهایی T01–T10 پیش از implementation باید با ADR مصوب و مرز واضح تثبیت شوند؛ این دفتر جای امضای معماری را نمی‌گیرد.

## ۵. نمونه‌های تصمیم قابل آزمون

1. مینا Editor Workspace و Maintainer پروژه A است؛ رضا فقط Viewer پروژه B. مینا نمی‌تواند با شناسه B تولید کند، رضا نمی‌تواند در B اجرا کند، حتی اگر credit زیاد باشد.
2. تیم Design روی A نقش Editor دارد. افزودن کاربر به Design در همان Workspace به A دسترسی می‌دهد؛ حذف Team grant آن مسیر را برای همه می‌بندد. وجود grant مستقیم همچنان باید به کاربر نشان داده شود.
3. افزونه local resize نیازی به job/ledger ندارد؛ همان افزونه برای ذخیره در A از host Assets API با مجوز کاربر استفاده می‌کند. دکمه cloud upscale یک Job billable با quote است.
4. دو Job همزمان و موجودی فقط برای یکی: دقیقاً یک reserve موفق و دیگری insufficient credits؛ هرگز balance منفی ناشی از race.
5. حذف عضو هنگام اجرای ویدیو: dispatch بعدی منع، attempt شروع‌شده reconcile، نتیجه برای پروژه محفوظ، عضو حذف‌شده stream یا download تازه دریافت نمی‌کند.

## ۶. داده‌های لازم برای برنامه‌ریزی نهایی

اندازه و مهارت تیم بک‌اند/DevOps، دسترسی به مخزن اجرایی نونز، بودجه ماهانه، منطقه استقرار و محدودیت Provider، تعداد tenant/user/concurrent jobs، مدت/اندازه رسانه، SLA مشتری، زمان عرضه و اولویت code-plugin باید تکمیل شوند. نبود این داده‌ها مانع پیشنهاد مرزها نیست اما تخمین نفرماه، ظرفیت قطعی و هزینه production را نامعتبر می‌کند.
