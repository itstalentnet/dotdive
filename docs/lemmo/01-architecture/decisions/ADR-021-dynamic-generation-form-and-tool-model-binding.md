---
title: "ADR-021: معماری فرم تولید محتوای داده‌محور، اتصال ابزار-مدل و واژگان پارامترهای استاندارد"
description: "تصویب معماری فرم تولید محتوای سرور-محور (Server-Driven UI)، اتصال مدل‌ها به تعاریف ابزار، واژگان پارامترهای استاندارد، حذف کامل آرایه‌های استاتیک فرانت‌اند و استعلام بلادرنگ قیمت"
order: 22
icon: "sliders"
---

| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Dynamic Generation Form Architecture, Tool-Model UX Binding, and Canonical Parameters |
| **Title (FA)** | معماری فرم تولید محتوای داده‌محور، اتصال ابزار-مدل و واژگان پارامترهای استاندارد |
| **ID** | ADR-021 |
| **Category** | `architecture` |
| **Status** | `Approved` |
| **Owner** | تیم معماری و پلتفرم بک‌اند / @behroz |
| **Last Updated** | 2026-10-27 |
| **Summary (EN)** | Ratifies Dynamic Generation Form Architecture (M1 to M7): Tool-as-Definition governs selectable models (`models[]` array in tool schema with order, default, badges, and `field_overrides`), technical model registry remains confined to ai-gateway (`model_alias` per D-50/D-51, superseding legacy `model_ref`), defines Canonical Parameters Vocabulary across capabilities, eliminates presets.ts and client-side model arrays (Zero-Mock per ADR-016), mandates real-time debounced price queries via POST /estimate with expected_cost and PRICE_CHANGED protection (reaffirming D4 in ADR-019), deprecates base_credit_cost in model.proto, formalizes multi-output semantics (single job, N assets with partial settlement in TigerBeetle), derives studio media tabs strictly from active tool output_type, and defines a closed server-driven UI field enum. |
| **Summary (FA)** | تصویب معماری فرم تولید محتوای داده‌محور (M1 تا M7): تعریف ابزار حاکم بر مدل‌های قابل‌انتخاب در رابط کاربری (`models[]` در اسکیمای ابزار با ترتیب، پیش‌فرض، نشان‌ها و `field_overrides`)، تفکیک رجیستری فنی به ai-gateway با ارجاع نام مستعار `model_alias` (جایگزین کلید قدیمی `model_ref` طبق مصوب D-50 و D-51 — بخش منسوخ‌شده / Superseded)، واژگان پارامترهای استاندارد برای تمام قابلیت‌ها، حذف کامل presets.ts و آرایه‌های ثابت فرانت‌اند (اصل Zero-Mock پیرو ADR-016)، استعلام زنده و دی‌بانس‌شده قیمت از POST /estimate با سقف محافظ expected_cost و خطای PRICE_CHANGED، منسوخ‌سازی base_credit_cost در model.proto، رسمیت‌بخشی به خروجی چندتایی (یک جاب و N دارایی با تسویه جزئی)، اشتقاق تب‌های استودیو از خروجی ابزارهای فعال، و مجموعه بسته انواع فیلدهای فرم سرور-محور. |
| **Tags** | `adr`, `adr-021`, `dynamic-form`, `tools-service`, `model-router`, `quota-service`, `zero-mock`, `server-driven-ui` |

---

## ۱. زمینه و انگیزه تصمیم (Context)

در امتداد اتصال موفق پایپ‌لاین تولید تصویر در چت استودیو و استقرار `tools-service` (ADR-018) و `agent-service` (ADR-020)، بازبینی تجربه کاربری پنجره تنظیمات تولید (`GenerationSettings`) و نوار ابزار ایجنت نشان داد که:
1. **نقض اصل Zero-Mock (ADR-016):** فرانت‌اند استودیو لیست مدل‌ها (`AGENT_MODELS`) و گزینه‌ها را در قالب یک آرایه استاتیک در فایل `presets.ts` نگهداری می‌کرد. افزودن یا تغییر مدل‌های فعال هوش مصنوعی نیازمند تغییر کد و دیپلوی مجدد فرانت‌اند بود.
2. **عدم تطابق تنظیمات با قابلیت‌های هر مدل:** مدل‌های مختلف هوش مصنوعی محدودیت‌ها و گزینه‌های متفاوتی برای نسبت ابعاد، رزولوشن، گام‌ها و تعداد خروجی دارند. فرم فعلی فرانت‌اند یک قالب صلب بود که نمی‌توانست گزینه‌ها را بر اساس مدل انتخابی کاربر سازگار کند.
3. **ریسک دوگانگی قیمت و محاسبات کلاینت:** برای پیش‌نمایش قیمت در فرم، فرانت‌اند نیازمند محاسبه بر اساس ضرایب بود؛ این امر با اصل قیمت‌گذاری تک‌نقطه‌ای (Single-Point Pricing در ADR-019) مغایرت داشت.
4. **ابهام در اتصال ابزار به مدل:** مشخص نبود که آیا فرانت‌اند باید مستقیماً با رجیستری مدل‌ها در `model-router-service` ارتباط برقرار کند یا مشخصات از طریق کاتالوگ ابزارها تحویل شود.

این ADR تصمیمات هفت‌گانه (**M1 تا M7**) را به عنوان قوانین قطعی معماری برای فرم داده‌محور تصویب می‌کند.

---

## ۲. تصمیمات مصوب (Decisions)

### ۲.۱. ابزار تعیین‌کننده نمایش، رجیستری مدل تعیین‌کننده وجود فنی (M1)
1. **تفکیک لایه‌ها:** لیست مدل‌های قابل‌انتخاب، ترتیب نمایش، مدل پیش‌فرض و نشان‌های کاربری (`flagship`, `fast`, `pro`) بخشی از **تعریف داده‌ای ابزار** در `tools-service` است.
2. **عدم نشت مشخصات فنی:** مشخصات فنی مدل (پراویدر ابری، فالبک، اعتبارسنجی سرتاسری) متعلق به `ai-gateway` (سابقاً model-router) است. ابزار صرفاً از طریق نام مستعار `model_alias` (کلید قدیمی `model_ref` طبق تصمیمات مصوب D-50 و D-51 منسوخ‌شده / Superseded است) به مدل ارجاع می‌دهد و اطلاعات فنی را تکرار نمی‌کند (اصل B1.1).
3. **عدم وابستگی در زمان اجرا (Runtime Decoupling):** کاتالوگ ابزارها مستقیماً از فایل‌های تعریف یا پایگاه‌داده `lemmo_tools` خوانده می‌شود تا در دسترس بودن کاتالوگ ابزارها به پایداری لحظه‌ای `ai-gateway` گره نخورد. سازگاری ارجاع `model_alias` (جایگزین ارجاع منسوخ‌شدهٔ `model_ref`) در **گیت تست CI** بررسی می‌شود.

### ۲.۲. واژگان پارامترهای استاندارد (Canonical Parameters) (M2)
1. برای هر قابلیت (`capability`) یک فهرست واحد و نسخه‌دار از کلیدهای استاندارد پارامترها تعیین می‌شود:
   `prompt`, `aspect_ratio`, `num_outputs`, `seed`, `steps`, `cfg_scale`, `resolution`, `duration_sec`.
2. فرانت‌اند و کاتالوگ ابزارها منحصراً با همین واژگان استاندارد کار می‌کنند.
3. نگاشت نام پارامتر استاندارد به فرمت خاص هر پراویدر ابری (OpenAI, Fal, Replicate, ScienceEdu) در لایه آداپتورهای `model-router-service` انجام می‌شود و فرانت‌اند و ابزار هیچ دانشی از نام‌های داخلی پراویدرها ندارند.

### ۲.۳. قیمت‌گذاری تک‌نقطه‌ای و استعلام از سرور (M3)
1. نمایش قیمت کردیت در فرم منحصراً از اندپوینت **`POST /api/v1/quota/estimate`** حاصل می‌شود.
2. هیچ فیلد قیمتی در کاتالوگ ابزارها یا تعاریف مدل‌ها وجود ندارد. فیلد `base_credit_cost` در `model.proto` منسوخ تلقی شده و نباید توسط کلاینت مصرف شود.
3. فرانت‌اند هنگام ارسال درخواست اجرا (`execute`) یا پیام چت، مقدار استعلام‌شده را در فیلد **`expected_cost`** ارسال می‌کند؛ در صورت تغییر نرخ در فاصله زمانی، سرور با خطای `PRICE_CHANGED` (HTTP 409) درخواست را رد کرده و کلاینت پس از اطلاع به کاربر قیمت تازه را می‌گیرد.

### ۲.۴. پشتیبانی از خروجی چندتایی (`num_outputs`) (M4)
1. انتخاب تعداد خروجی `num_outputs = N` به عنوان یک جاب واحد با تولید N دارایی خروجی تعریف می‌شود.
2. رزرو اعتبار اولیه در کیف‌پول کاربر برای N خروجی انجام می‌شود و پس از پایان، تسویه قطعی در Ledger بر مبنای **تعداد واقعی تصاویر تولیدشده** صورت می‌گیرد و مازاد رزرو فوراً آزاد می‌شود. در صورت شکست کامل، کل رزرو آزاد خواهد شد.

### ۲.۵. عدم ایجاد اندپوینت موازی مدل‌ها (M5)
1. در این فاز هیچ اندپوینت عمومی به نام `GET /api/v1/models` در گیت‌وی Kong رجیستر نمی‌شود؛ تمامی اطلاعات لازم فرم تولید محتوا به صورت یکپارچه از `GET /api/v1/tools` دریافت می‌شود تا فرانت‌اند نیازی به ارسال درخواست‌های موازی و ترکیب دستی داده‌ها نداشته باشد.

### ۲.۶. اشتقاق تب‌های مدیا بر پایه Zero-Mock (M6)
1. تب‌های بالای فرم تولید (تصویر، ویدیو، ...) از مقادیر `output_type` ابزارهای با وضعیت `status: "active"` استخراج می‌شوند. در غیاب ابزار فعال برای یک نوع مدیا (مانند ویدیو)، آن تب به طور کامل پنهان می‌شود. وجود ماک یا لیست ثابت در کد فرانت‌اند مطلقاً ممنوع است.

### ۲.۷. فرم سرور-محور با مجموعه بسته انواع فیلد (M7)
1. انواع فیلدهای فرم در قرارداد OpenAPI به صورت یک مجموعه بسته (Closed Enum) تعریف می‌شود:
   `textarea`, `aspect_ratio`, `model_select`, `segmented_number`, `slider`, `select`, `toggle`, `seed`, `asset_ref`.
2. افزودن مدل جدید یا تغییر گزینه‌ها صرفاً با تغییر داده‌ها صورت می‌گیرد و نیازی به تغییر کد فرانت‌اند ندارد.
3. با تغییر مدل توسط کاربر، مقادیر فیلدها بر اساس آرایه `field_overrides` مدل فعال بازنشانی می‌شوند. این منطق از طریق یک تابع خالص (`resolveFormState`) در کلاینت پیاده‌سازی می‌شود.

---

## ۳. ساختار داده‌ای تعریف ابزار با مدل‌ها

نمونه ساختار ابزار در `api/services/tools-service/catalog/text-to-image.v1.json`:

```json
{
  "id": "text-to-image",
  "version": 3,
  "category": "image-generation",
  "output_type": "image",
  "type": "generator",
  "capability": "image.generate",
  "chat_alias": ["/image", "/flux", "/img"],
  "agent_visible": true,
  "input_fields": [
    { "id": "prompt", "type": "textarea", "required": true },
    { "id": "aspect_ratio", "type": "aspect_ratio", "defaultValue": "1:1" },
    { "id": "num_outputs", "type": "segmented_number", "defaultValue": 1, "min": 1, "max": 4 },
    { "id": "model", "type": "model_select" }
  ],
  "models": [
    {
      "model_alias": "gpt-image-2", // قبلاً model_ref در پیش‌نویس اولیه (منسوخ‌شده / Superseded طبق مصوب D-50 و D-51)
      "default": true,
      "order": 1,
      "badge": "live",
      "field_overrides": {
        "aspect_ratio": { "options": ["1:1", "16:9", "9:16"] },
        "num_outputs": { "max": 4 }
      }
    },
    {
      "model_alias": "flux-dev", // جایگزین model_ref قدیمی طبق D-50 و D-51 (Superseded)
      "default": false,
      "order": 2,
      "badge": "flagship",
      "field_overrides": {
        "aspect_ratio": { "options": ["1:1", "16:9", "9:16", "4:3", "3:4"] },
        "num_outputs": { "max": 1 }
      }
    }
  ]
}
```

---

## ۴. پیامدها و الزامات فنی (Consequences)

1. **انطباق کامل با Zero-Mock:** فایل `presets.ts` در `app/src/modules/agent/constants/` برای مدل‌ها حذف شده و کلاینت کاملاً داده‌محور می‌شود.
2. **شفافیت مالی:** کاربر همواره عدد دقیق محاسبه‌شده توسط موتور Quota را مشاهده می‌کند و خطای تغییر قیمت (`PRICE_CHANGED`) مانع از سوءبرداشت می‌گردد.
3. **سهولت در توسعه:** اضافه کردن یک مدل تصویر جدید صرفاً نیازمند ثبت در دیتابیس `models` و اضافه کردن شناسه آن در فایل ابزار است؛ هیچ کدی در فرانت‌اند دستکاری نخواهد شد.
