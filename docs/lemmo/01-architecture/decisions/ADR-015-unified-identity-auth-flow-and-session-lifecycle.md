| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Unified Identity Architecture, Automatic Registration/Login Flow & Zero-Trust Session Lifecycle |
| **Title (FA)** | معماری یکپارچه هویت، جریان خودکار ثبت‌نام/ورود بدون رمز و چرخه حیات نشست امن |
| **ID** | ADR-015 |
| **Category** | `architecture` |
| **Status** | `Approved` |
| **Owner** | Security, Identity & Core Backend Architecture Team / @behroz |
| **Last Updated** | 2026-10-02 |
| **Summary (EN)** | Ratification of the live identity architecture inspired by NONS: Passwordless 6-digit OTP (Magic Code), minimal Kratos identity schema (email-only), unified entry flow with Admin API pre-check preventing duplicate identifier crashes, Edge Gateway route partitioning without forward-auth on self-service, real-time logout revocation via Redis timestamp in lemmo-access-enforcer (single MGET pipeline), and deep-link return_to preservation. |
| **Summary (FA)** | تصویب معماری زنده احراز هویت با الهام از پروژه نونز: ورود بدون رمز با کد ۶ رقمی OTP، اسکیمای مینیمال هویت Kratos (صرفاً ایمیل)، جریان ورودی یکپارچه با استعلام قبلی از Admin API جهت جلوگیری از خطای duplicate identifier، تفکیک روت‌های گیت‌وی بدون اعمال forward-auth روی self-service، ابطال بلادرنگ توکن‌ها هنگام خروج از حساب در lemmo-access-enforcer با دستور MGET ردیس، و حفظ لینک‌های عمیق بازگشت به استودیو. |
| **Tags** | `auth-service`, `ory-kratos`, `identity`, `session-lifecycle`, `logout-revocation`, `magic-code`, `kong-gateway`, `adr` |

---

# ADR-015: معماری یکپارچه هویت، جریان خودکار ثبت‌نام/ورود بدون رمز و چرخه حیات نشست امن

## ۱. زمینه و انگیزه (Context & Problem Statement)

در جریان ورود کاربر به پلتفرم Lemmo و پیاده‌سازی مرحله ۱۱ (`auth-service` مبتنی بر Ory Kratos):
1. **اصطکاک در تجربه کاربری ورود/ثبت‌نام:** در سیستم‌های سنتی، کاربر باید از قبل بداند آیا در سامانه حساب دارد یا خیر و بین دو دکمه «ورود» و «ثبت‌نام» یکی را انتخاب کند.
2. **چالش فنی بومی Kratos در ورود بدون رمز:** طبق تجربه کشف‌شده و مستند در پروژه نونز (NONS v1.3.0)، در صورتی که کاربری که قبلاً ثبت‌نام کرده، ایمیل خود را به فلو Registration بفرستد، Kratos در مرحله اول با متد `code` بدون خطا کد تایید را ارسال می‌کند، اما در مرحله دوم با خطای بحرانی `An account with the same identifier exists already` متوقف می‌شود و نشست صادر نمی‌گردد.
3. **مرز بین هویت و داده‌های رشد بیزینس:** داده‌های تجاری مانند نام، هندل یکتا، کد معرف و وضعیت ورک‌اسپیس نباید در دیتابیس هویت Kratos انباشته شوند؛ هویت Kratos صرفاً باید نگهدارنده شناسه اعتبارسنجی ورود باشد.
4. **تداخل کوکی‌های نشست در معماری چند پورتی (Cross-Origin Cookies):** فرانت‌اند لاگین (`auth/` پورت ۳۰۰۱)، استودیو (`app/` پورت ۳۰۰۰) و گیت‌وی (`infra/gateway` پورت ۸۰۰۰) هرکدام مبدا متفاوتی دارند و در صورت ارتباط مستقیم با پورت ۴۴۳۳ کراتوس، ارسال کوکی `ory_kratos_session` به دلیل سیاست‌های SameSite و CORS با شکست مواجه می‌شود.
5. **ناامنی خروج از حساب در توکن‌های کوتاه‌مدت (Logout Latency):** در صورت تکیه صرف به انقضای توکن JWT (۵ تا ۱۵ دقیقه)، خروج کاربر منجر به ابطال آنی توکن‌های از قبل صادرشده در دست مرورگر نمی‌شود.

---

## ۲. تصمیمات مصوب معماری (Decisions)

### ۲.۱. روش احراز هویت انحصاری: ورود بدون رمز با کد ۶ رقمی ایمیلی (Magic Code OTP)
* ورود فقط با **آدرس ایمیل + کد عددی ۶ رقمی OTP** انجام می‌شود.
* کلیه روش‌های رمز عبور (`password`)، شناسایی بیومتریک (`passkey`) و توکن‌های دوعاملی سخت‌افزاری (`totp`) در فاز فعلی در کانفیگ Kratos غیرفعال (`enabled: false`) هستند.
* طول عمر کد اعتبارسنجی ۱۰ دقیقه (`lifespan: 10m`) تعیین می‌شود.
* ورود با لینک جادویی (Magic Link) به دلیل سوئیچ ناخواسته بین اپلیکیشن ایمیل موبایل و مرورگر اصلی، کاملاً لغو و کنار گذاشته شد.

### ۲.۲. اسکیمای مینیمال هویت در Kratos (`identity.schema.json`)
* اسکیمای هویت Kratos صرفاً شامل دو فیلد پایه است:
  * `email`: رشته با فرمت ایمیل، الزامی، با تنظیمات credentials به عنوان `identifier: true, via: "email"`.
  * `onboarded`: بولین، با مقدار پیش‌فرض `false`.
* فیلدهای نام (`name`)، هندل کاربری (`handle`)، و کد معرف (`referral_code`) به هیچ وجه در Kratos ثبت نمی‌شوند و تماماً توسط `user-service` در بدو پردازش وب‌هوک Post-Registration مدیریت می‌گردند.

### ۲.۳. جریان ورودی یکپارچه (Unified Auth Entry Flow & Admin Pre-Check)
* رابط کاربری `auth/` فاقد صفحات ورود و ثبت‌نام مجزا است؛ کاربر فقط با یک فیلد ورود ایمیل مواجه می‌شود.
* اندپوینت `/api/v1/auth/entry` (با پشتیبانی از Native JSON و Form URL Encoded):
  1. ایمیل کاربر را دریافت می‌کند.
  2. ابتدا از طریق Kratos Admin API (`GET /admin/identities?credentials_identifier=<email>`) وجود کاربر را استعلام می‌کند (`identityExistsByEmail`).
  3. **کاربر موجود:** آغاز جریان ورود Kratos (`/self-service/login/browser`) با `method=code` و شناسه کاربر → Kratos کد را ارسال می‌کند → بازگشت `{ flowId, type: "login" }`.
  4. **کاربر جدید:** آغاز جریان ثبت‌نام Kratos (`/self-service/registration/browser`) با `method=code` و صفات ایمیل → Kratos کد را ارسال می‌کند → بازگشت `{ flowId, type: "register" }`.
  5. فرانت‌اند در گام دوم کد ۶ رقمی را تحویل گرفته و به فلو تایید ارسال می‌کند تا کوکی نشست صادر شود.

### ۲.۴. معماری گیت‌وی لبه و تفکیک مسیرها (Kong Gateway Route Partitioning)
* تمام ترافیک احراز هویت و API منحصراً از پورت **`8000`** درگاه لبه (`lemmo-edge-gateway`) عبور می‌کند:
  * **مسیر `/auth/kratos/*` (Self-Service Kratos):** بدون اعمال پلاگین Forward-Auth (Oathkeeper) مستقیماً به پورت ۴۴۳۳ کراتوس فوروارد می‌شود؛ زیرا کاربر در بدو ورود هنوز سشنی ندارد که تایید شود.
  * **مسیر `/api/v1/*` (سایر اندپوینت‌های تجاری):** از طریق پلاگین `lemmo-forward-auth` (استعلام از Oathkeeper `/decisions`) محافظت می‌شود.
* **تنظیمات CORS در Kong:**
  * پلاگین CORS با لیست صریح مبداهای مجاز (`http://localhost:3000`, `http://localhost:3001` در لوکال، و دامنه‌های معتبر پروداکشن).
  * الزام `Access-Control-Allow-Credentials: true` جهت امکان‌پذیر شدن ارسال کوکی‌های سشن در درخواست‌های Fetch جاوااسکریپت.

### ۲.۵. پروتکل ریدایرکت عمیق پساورود (`return_to`)
* پارامتر `return_to` برای حفظ آدرس کامل صفحه مقصد کاربر (Deep Link مانند `http://localhost:3000/workspace/ws_123/canvas/cnv_456`) استفاده می‌شود.
* Kratos پارامتر `return_to` را صرفاً در صورت تطابق با لیست سفید `allowed_return_urls` مجاز می‌شمارد (شامل مبداهای استودیو و اپلیکیشن‌ها بدون wildcard).

### ۲.۶. ابطال آنی نشست و توکن‌ها در لحظه خروج (Real-Time Logout Revocation)
* خروج کاربر صرفاً وابسته به انقضای ۵ دقیقه‌ای توکن JWT نخواهد بود:
  1. در لحظه خروج، فلو لاگ‌اوت Kratos نشست هویتی را منقضی می‌کند.
  2. کلید زمان خروج با برچسب زمانی فعلی در ردیس ثبت می‌شود:
     `lemmo:user:logout_at:{user_id} = <unix_timestamp_now>` (با TTL ۲۰ دقیقه).
  3. کوکی‌های `ory_kratos_session` و `lemmo_jwt` با مقداردهی `Max-Age=0` و دامنه مشترک پاک می‌شوند.
* **پلاگین `lemmo-access-enforcer` در Kong:**
  در هر درخواست ورودی به گیت‌وی، به جای درخواست‌های متعدد، با یک دستور **`MGET` (Pipeline)** ردیس سه بررسی حیاتی را با تاخیر ناچیز شبکه انجام می‌دهد:
  ```
  MGET lemmo:user:suspended:{user_id}
       lemmo:user:logout_at:{user_id}
       lemmo:membership:version:{workspace_id}:{user_id}
  ```
  اگر `iat` (زمان صدور JWT) کمتر از `logout_at` باشد، توکن بلافاصله ۴۰۱/۴۰۳ شده و درخواست مسدود می‌گردد.

### ۲.۷. مکانیزم دریافت و اعمال کد معرف (Referral Application Lifecycle)
* کد معرف در هیچ سناریویی از مسیر Kratos عبور نمی‌کند.
* دو مسیر ورود به یک اندپوینت مشترک در `user-service` منتهی می‌شوند (`POST /v1/users/me/apply-referral`):
  1. **خودکار:** ذخیره در کوکی مرورگر از طریق پارامتر URL رفرال (`?ref=CODE`) و ارسال پس از ثبت‌نام.
  2. **دستی:** ورود اختیاری در ویزارد آنبوردینگ استودیو یا بخش تنظیمات پروفایل.
* **پنجره زمانی ضدسوءاستفاده:** کد معرف تنها در یک بازه زمانی محدود و کانفیگ‌پذیر (پیش‌فرض ۷ روز پس از تاریخ ایجاد حساب) قابل اعمال است. پس از انقضای این بازه، درخواست با خطای `REFERRAL_WINDOW_EXPIRED` رد می‌شود.

### ۲.۸. سرور ایمیل محیط توسعه محلی و تست‌های لایو
* استفاده از سرور فوق‌سریع **`Mailpit`** (`axllent/mailpit`) در استک داکر (`infra/auth/compose.yaml`):
  * پورت SMTP روی `1025` جهت اتصال ماژول Courier در Kratos.
  * پورت Web / REST API روی `8025` جهت مشاهده دستی ایمیل‌ها و استخراج خودکار کد OTP در تست‌های لایو بدون نیاز به پارس کردن لاگ داکر.

---

## ۳. پیامدها و الزامات فنی (Consequences & Implementation Blueprint)

### پیامدهای مثبت (Positive)
* **حذف خطای بن‌بست duplicate identifier:** تشخیص هوشمند با Admin API مانع از گیر افتادن کاربران قبلی در فلو ثبت‌نام می‌شود.
* **تجربه کاربری Zero-Friction:** کاربر تنها ایمیل را وارد کرده و کد ۶ رقمی را تایید می‌کند؛ نیاز به به‌خاطرسپاری رمز یا انتخاب فرم وجود ندارد.
* **یکپارچگی سشن بدون باگ CORS:** هدایت کل ترافیک از پورت ۸۰۰۰ گیت‌وی مشکل کوکی‌های متناقض ساب‌دامنه‌ها را حل می‌کند.
* **امنیت Real-Time در خروج:** مسدودسازی آنی توکن‌ها بدون نیاز به بلک‌لیست دائم ردیس (انقضای خودکار ۲۰ دقیقه‌ای کلید `logout_at`).
* **کارایی بالا در گیت‌وی:** تجمیع چک‌های تعلیق، خروج و نسخه عضویت در یک `MGET` ردیس.

### الزامات پیاده‌سازی مرحله ۱۱ (Stage 11 Checklist)
1. ایجاد پوشه استقرار `services/auth-service/deploy/` شامل `compose.yaml` (کانتینرهای `kratos`, `kratos-migrate`, `mailpit`).
2. پیکربندی `kratos.yml` با روش `code`، ماژول courier به سمت Mailpit، و وب‌هوک پس از ثبت‌نام به سمت `user-service`.
3. به‌روزرسانی `infra/gateway/config/kong.yml` جهت افزودن روت‌های `/auth/kratos/` و `/api/v1/auth/` و تنظیمات CORS.
4. پیاده‌سازی کنترلر `/api/v1/auth/entry` و `/api/v1/auth/logout`.
5. به‌روزرسانی فرانت‌اند `auth/` جهت اتصال به اندپوینت یکپارچه ورودی و ارسال کد OTP.
6. ایجاد سوئیت تست لایو یکپارچه (`services/auth-service/tests/live/auth_flow_live_test.go`) جهت اعتبارسنجی سناریوی کامل ورود کاربر جدید و کاربر موجود با Mailpit.
