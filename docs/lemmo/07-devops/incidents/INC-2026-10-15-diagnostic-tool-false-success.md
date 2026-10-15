| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Diagnostic Trace False Success with Missing Downstream Evidence |
| **Title (FA)** | موفقیت کاذب ابزار رهگیری با نبود شواهد پایین‌دست |
| **ID** | DOC-OPS-INC-003 |
| **Category** | `devops` |
| **Status** | `Active` |
| **Owner** | Platform / Diagnostic Tooling (role; unassigned) |
| **Last Updated** | 2026-10-15 |
| **Summary (EN)** | Offline reproduction shows trace.sh returning SUCCESS and exit zero with one Gateway log and missing downstream evidence. Records tooling risks and acceptance conditions; no production outage is claimed. |
| **Summary (FA)** | بازتولید آفلاین نشان داد trace.sh با یک لاگ Gateway و نبود شواهد پایین‌دست موفقیت و کد صفر می‌دهد؛ نقص ابزار ثبت شده و ادعای اختلال محصول نشده است. |
| **Tags** | `incident`, `diagnostics`, `false-success`, `phase-one` |

# INC-2026-10-15-DIAG-01

وضعیت: **Open / اصلاح نشده**. نوع: نقص ابزار تشخیصی؛ شدت اثر واقعی بر کاربران تعیین نشده. اولویت پیشنهادی: قبل از استفاده از trace به‌عنوان گیت مرحله یک. مالک فردی و تسک اصلاحی هنوز تخصیص نیافته‌اند؛ مطابق دستور کاربر پس از ارزیابی به بریف مرحله یک ادغام شود.

## مشاهده و اثر

در `api/scripts/dev/trace.sh` وجود هر لاگ منطبق `FOUND_LOGS=1` می‌کند (خط ۶۳) و نبود error قابل تشخیص باعث چاپ SUCCESS می‌شود (خطوط ۱۸۵–۱۸۷). پوشش hopهای ضروری و وضعیت نهایی عملیات بررسی نمی‌شود. نتیجه می‌تواند اپراتور را درباره سلامت مسیر گمراه کند. گزارش تاریخی `.task/audits/REPORT_DIAG_AGENT_NO_RESULT.md:27` ابزار را موفق معرفی کرده؛ این بازتولید اعتبار عمومی آن ادعا را محدود می‌کند، نه اینکه همه شواهد تاریخی را باطل کند.

## بازتولید آفلاین و شاهد

در پوشه موقت `/tmp/lemmo-tool-assessment-X33FpM/bin` دو فرمان بدل برای Docker و curl قرار گرفت و PATH فقط برای subprocess ارزیابی پیشوند گرفت. Docker واقعی فراخوانی نشد؛ هیچ دیتابیس یا کلید خصوصی خوانده نشد.

قرارداد fixture قابل بازتولید:

- `docker ps ...`: خروجی خالی با exit 0، مانند نبود match.
- `docker logs lemmo-edge-gateway`: فقط یک رکورد INFO با `request_id=assessment-request-01` و `event=accepted`؛ exit 0.
- بقیه `docker logs` و همه `docker exec`: exit 1؛ داده‌ای ندارند.
- `curl`: exit 7؛ داده‌ای ندارد.
- اجرای اسکریپت واقعی `bash api/scripts/dev/trace.sh assessment-request-01` با PATH fixture.

نتیجه مشاهده‌شده:

```text
>> ALL MONITORED HOPS PASSED OR COMPLETED WITHOUT LOGGED ERRORS
>> STATUS: SUCCESS
script_exit=0
```

خروجی موقت: `/tmp/lemmo-tool-assessment-X33FpM/trace-result.txt`. این فایل دائمی نیست؛ قرارداد fixture و نتیجه در همین سند برای بازتولید ثبت شده‌اند. انتظار صحیح: INCOMPLETE و exit غیرصفر. این سناریو تست خود ابزار است، نه journey محصول.

## علت ریشه‌ای تأییدشده

- شرط موفقیت «داده‌ای یافت شد و error شناخته‌شده ندیدیم» است؛ شرط پوشش کامل و نتیجه نهایی وجود ندارد.
- exit status فرمان docker ps به‌جای وجود container match بررسی می‌شود؛ خروجی خالی می‌تواند exit صفر داشته باشد.
- خطاهای ابزارهای پایین‌دست با `|| true`/پیام عمومی پنهان می‌شوند؛ جمع‌بندی پوشش ناقص را ثبت نمی‌کند.
- انتخاب اولین شکست طبق ترتیب containerها انجام می‌شود، نه رابطه علّی یا timeline قطعی.

## ریسک‌های همراه؛ مشاهده سورس، بدون آزمون سوءاستفاده

- ورودی REQ_ID مستقیماً داخل SQL جای‌گذاری می‌شود؛ فقط نام «read-only» مانع injection نیست. query باید parameterized و با دسترسی فقط‌خواندنی باشد.
- Redis KEYS و خواندن مقدار خام می‌تواند پرهزینه باشد یا payload خصوصی را نمایش دهد؛ استفاده محدود از metadata مجاز و scan کران‌دار لازم است.
- جست‌وجوی همه logها بدون پنجره زمانی و تفسیر ورودی به‌عنوان regex؛ مقایسه literal/structured و محدودیت زمان/حجم لازم است.
- fallback اعتبارنامه و مقصد سخت‌کد در ابزار وجود دارد؛ مقدارها اینجا تکرار نمی‌شوند. missing credential باید fail-fast باشد.

این ریسک‌ها در سرویس زنده آزمایش نشدند و اثبات نشت یا نفوذ نیستند.

## اقدام پیشنهادی و معیار بسته‌شدن

۱. وضعیت هر dependency و hop ضروری جدا؛ SUCCESS فقط با شاهد کافی. نبود permission/tool/data، parser failure و timeout برابر INCOMPLETE و غیرصفر.
۲. جداسازی timeline مشاهده‌شده از نتیجه تجاری؛ نتیجه نهایی از سرویس مالک با خواندن مجاز، نه حدس regex.
۳. query امن، حذف خروجی داده حساس، config نسخه‌دار و زمان/حجم محدود؛ هیچ mutation، restart یا grant.
۴. گیت خودکار ابزار: partial evidence، empty container match، unavailable dependency، malformed output، deadline و complete success؛ نمونه complete success تنها وقتی شاهد نتیجه واقعی لازم را دارد پذیرفته شود.
۵. بازبین مستقل fixture فوق و یک مسیر مجاز واقعی را بازتولید کند. گیت فعلاً **فاقد گیت** است؛ تا اجرا و شواهد باز می‌ماند.

بریف اصلاحی در مرحله بعد طبق قالب انطباق تهیه شود. تا آن زمان trace فعلی فقط سرنخ دستی است، نه گیت تأیید سلامت؛ اجرای آن روی داده واقعی پیش از رفع query/پالایش توصیه نمی‌شود.
