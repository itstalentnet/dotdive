| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Incident Post-Mortem: Context Service Persistent Failure & Downstream Connection Resilience (2026-10-13) |
| **Title (FA)** | گزارش کالبدشکافی رخداد: خرابی پایدار context-service پس از شکست اتصال اولیه به سرویس کاربران |
| **ID** | DOC-OPS-INC-002 |
| **Category** | `devops` |
| **Status** | `Approved` |
| **Owner** | Core Engineering / SRE |
| **Last Updated** | 2026-10-13 |
| **Summary (EN)** | Post-mortem analysis of the 2026-10-13 incident involving context-service startup failure due to a 5-second blocking gRPC timeout to user-service, perpetual nil client retention, false 404 ErrUserNotFound mapping blocking studio entry, and permanent remediation roadmap. |
| **Summary (FA)** | گزارش کالبدشکافی رخداد ۱۳ اکتبر ۲۰۲۶ پیرامون خرابی پایدار context-service ناشی از تایم‌اوت ۵ ثانیه‌ای اتصال مسدودکننده gRPC به user-service در راه‌اندازی اولیه، ماندگاری کلاینت nil در طول عمر پردازش، نگاشت کاذب به ۴۰۴ کاربر ناموجود، مسدود شدن ورود به استودیو و نقشه راه اقدامات اصلاحی پایدار. |
| **Tags** | `incident`, `post-mortem`, `context-service`, `user-service`, `grpc`, `resilience`, `reconnect`, `readiness`, `sev-1` |

---

# گزارش کالبدشکافی رخداد: خرابی پایدار context-service پس از شکست اتصال اولیه (DOC-OPS-INC-002)

> **شناسه رخداد:** INC-2026-10-13-CONTEXT-01  
> **شدت رخداد:** `SEV-1` (مسدودسازی کامل ورود به محیط استودیو برای تمامی کاربران پلتفرم)  
> **تاریخ وقوع و تحلیل:** ۲۰۲۶-۱۰-۱۳  
> **وضعیت نهایی:** راهکار موقت اعمال شد (Mitigated) / برنامه اصلاح قطعی در رودمپ ثبت شد (Roadmap Scheduled)  
> **سند منبع رخداد:** `pending-01.md`  
> **نقشه راه اجرایی:** [نقشه راه جامع بک‌اند (DOC-BE-005)](../../03-backend/roadmap.md) — مرحله 17 و بدهی فنی `DEBT-CTX-01`

---

## ۱. خلاصه اجرایی رخداد (Executive Summary)

در تاریخ ۱۳ اکتبر ۲۰۲۶ ساعت ۰۴:۰۵ (به وقت اروپای مرکزی / برلین)، در پی بالا آمدن سرویس‌ها، تمامی کاربران هنگام ورود به محیط استودیو با خطای `404 user not found` در اندپوینت `/api/v1/me/context` مواجه شدند و امکان استفاده از استودیو به‌طور کامل مسدود گردید.

بررسی عمیق لاگ‌های اجرایی و ساختار کد کلاینت‌های سرویس `context-service` نشان داد که سرویس هنگام راه‌اندازی، حداکثر ۵ ثانیه با فلگ مسدودکننده (`grpc.WithBlock`) منتظر اتصال اولیه به `user-service` مانده و به دلیل تاخیر ۱ ثانیه‌ای کانتینر کاربران در آماده‌سازی پورت، دیال اولیه با خطای `context deadline exceeded` شکست خورده است. سرویس کانتکست با وجود لاگ کردن هشدار، به اجرای خود با کلاینت خالی (`nil`) ادامه داده و هیچ سازوکاری برای تلاش مجدد یا ساخت پس‌زمینه‌ای اتصال تعبیه نشده بود. بدتر از آن، متد خواندن کاربر در صورت `nil` بودن کلاینت، به‌اشتباه خطای `ErrUserNotFound` را بازمی‌گرداند که در درگاه لبه به `404 Not Found` تبدیل می‌شد.

با ری‌استارت دستی کانتینر `context-service` پس از آماده شدن `user-service`، اتصال برقرار شد؛ اما این نقص ساختاری نیاز به اصلاح ریشه‌ای و بازآرایی چرخه حیات کلاینت‌های gRPC در نقشه راه دارد.

---

## ۲. خط زمانی رخداد و شواهد فارنزیک (Timeline & Forensic Evidence)

### ۲.۱. گاه‌شمار رویدادها (۱۳ اکتبر ۲۰۲۶ — Berlin Time)

- **04:05:28:** کانتینر `context-service` آغاز به کار کرد.
- **04:05:33:** مهلت ۵ ثانیه‌ای اتصال gRPC به `user-service` به پایان رسید و خطای `context deadline exceeded` ثبت شد:
  ```text
  WARN could not connect to user-service on start; running with non-blocking client endpoint=lemmo-svc-user:50051 error="failed to connect to user-service on lemmo-svc-user:50051: context deadline exceeded"
  ```
- **04:05:34:** کانتینر `user-service` آماده پاسخ‌دهی شد (تنها ۱ ثانیه پس از انقضای تایم‌اوت کانتکست).
- **04:05:35 تا 04:27:14:** تمام درخواست‌های فرانت‌اند به `/api/v1/me/context` برای همه کاربران لاگین‌شده با پاسخ زیر ریجکت شدند:
  ```json
  HTTP/1.1 404 Not Found
  {"error": "user not found"}
  ```
- **04:27:15:** با اجرای ری‌استارت دستی روی `context-service`، اتصال به `user-service` برقرار شد و سرویس به حالت عادی برگشت:
  ```text
  INFO connected to user-service endpoint=lemmo-svc-user:50051
  ```

---

## ۳. کالبدشکافی محل نقص در کد (Code Defect Analysis)

### ۳.۱. نقص اول: ساخت اتصال مسدودکننده با مهلت کوتاه در سازنده کلاینت
در فایل [`api/services/context-service/internal/adapters/clients/user_client.go`](file:///home/behroz/Documents/Git/lemmo/api/services/context-service/internal/adapters/clients/user_client.go#L23-L37):
```go
func NewUserGRPCClient(endpoint string, timeout time.Duration) (*UserGRPCClient, error) {
	if timeout == 0 {
		timeout = 5 * time.Second
	}
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	conn, err := grpc.DialContext(ctx, endpoint,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithBlock(),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to user-service on %s: %w", endpoint, err)
	}
    ...
}
```
**اشکال:** استفاده از `grpc.WithBlock()` به همراه یک تایم‌اوت ثابت ۵ ثانیه‌ای باعث می‌شود در صورتی که داکر یا سیستم‌عامل کانتینر وابستگی را با چند ثانیه اختلاف راه‌اندازی کند، کل سازنده شکست بخورد و کلاینت `nil` بازگردانده شود.

### ۳.۲. نقص دوم: ادامه اجرای سرویس با کلاینت `nil` بدون حلقه بازیابی (Silent Nil Retention)
در فایل [`api/services/context-service/cmd/server/main.go`](file:///home/behroz/Documents/Git/lemmo/api/services/context-service/cmd/server/main.go#L43-L50):
```go
userClient, err := clients.NewUserGRPCClient(cfg.UserService.Endpoint, cfg.UserService.Timeout)
if err != nil {
	logger.Warn("could not connect to user-service on start; running with non-blocking client", "endpoint", cfg.UserService.Endpoint, "error", err)
} else {
	defer userClient.Close()
	logger.Info("connected to user-service", "endpoint", cfg.UserService.Endpoint)
}
```
**اشکال:** پیام هشدار لاگ ادعا می‌کند «running with non-blocking client»، در حالی که هیچ کلاینتی ساخته نشده و متغیر `userClient` برابر با `nil` باقی می‌ماند. سرویس سرور HTTP و gRPC خود را بالا می‌آورد و هیچ روتینی برای دیال مجدد در پس‌زمینه یا اتصال تنبل (Lazy Connection) وجود ندارد. در نتیجه کلاینت تا زمان ری‌استارت فیزیکی کل پردازش، برای همیشه `nil` می‌ماند.

### ۳.۳. نقص سوم: تبدیل فاجعه‌بار کلاینت خالی به خطای «کاربر ناموجود» (Misleading Error Mapping)
در فایل [`api/services/context-service/internal/adapters/clients/user_client.go`](file:///home/behroz/Documents/Git/lemmo/api/services/context-service/internal/adapters/clients/user_client.go#L44-L47):
```go
func (c *UserGRPCClient) GetUser(ctx context.Context, userID string) (*domain.UserContext, error) {
	if c == nil || c.client == nil {
		return nil, domain.ErrUserNotFound
	}
    ...
```
**اشکال:** در صورت عدم دسترسی به سرویس کاربران یا آماده نبودن کلاینت، خطای زیرساختی به جای `domain.ErrServiceUnavailable` به عنوان `domain.ErrUserNotFound` برگردانده شده است! در لایه هندلر gRPC، خطای `ErrUserNotFound` به کد وضعیت `codes.NotFound` و در درگاه لبه به `404 Not Found` تبدیل شده و این توهم را ایجاد می‌کند که حساب کاربر در دیتابیس وجود ندارد یا حذف شده است.

---

## ۴. تحلیل ریشه‌ای با متد ۵ چرا (Root Cause Analysis — 5 Whys)

1. **چرا ورود تمام کاربران به استودیو مسدود شد و خطای ۴۰۴ گرفتند؟**  
   زیرا اندپوینت `/api/v1/me/context` برای تمام شناسه‌ها خطای `user not found` صادر کرد.
2. **چرا خطای `user not found` صادر شد در حالی که کاربران در دیتابیس وجود داشتند؟**  
   زیرا در متد `GetUser`، وقتی اشاره‌گر کلاینت `nil` بود، خطای کاذب `domain.ErrUserNotFound` بازگردانده می‌شد.
3. **چرا اشاره‌گر کلاینت `nil` بود در حالی که `user-service` در حال اجرا بود؟**  
   زیرا `context-service` هیچ سازوکاری برای برقراری مجدد اتصال یا اتصال تنبل نداشت و اشاره‌گر `nil` زمان راه‌اندازی را برای تمام طول عمر پردازش حفظ کرده بود.
4. **چرا در زمان راه‌اندازی اشاره‌گر کلاینت `nil` شد؟**  
   زیرا `context-service` با مسدودسازی ۵ ثانیه‌ای منتظر بود، اما کانتینر `user-service` با ۶ ثانیه تاخیر آماده شد (یک ثانیه پس از پایان مهلت).
5. **علت ریشه‌ای نهایی چیست؟**  
   عدم رعایت استاندارد تاب‌آوری اتصالات میکروسرویسی: اتکای شکننده به ترتیب استارت کانتینرها (Startup Race Condition)، غیبت حلقه اتصال مجدد با Backoff در پس‌زمینه کلاینت‌های gRPC، و نقض معناشناسی کدهای خطا (تبدیل خطای زیرساخت به خطای بیزینسی کاربر ناموجود).

---

## ۵. اقدامات اصلاحی دائمی (Permanent Remediation Plan)

اقدامات اصلاحی زیر برای درج در نقشه راه بک‌اند تصویب شده و باید در چارچوب مرحله ۱۷ و بدهی فنی `DEBT-CTX-01` پیاده‌سازی شوند:

| ردیف | حوزه اصلاح | شرح اقدام مهندسی | فایل‌های هدف | وضعیت |
|---|---|---|---|---|
| **۱** | **چرخه حیات اتصال gRPC** | حذف `grpc.WithBlock` مسدودکننده در زمان راه‌اندازی؛ استفاده از مدیریت اتصال پیش‌فرض gRPC Go با قابلیت اتصال مجدد خودکار در پس‌زمینه، یا الگوی Lazy Client همراه با Exponential Backoff. | `internal/adapters/clients/*_client.go`<br>`cmd/server/main.go` | در صف پیاده‌سازی |
| **۲** | **اصلاح معناشناسی خطاها** | تفکیک قطعی خطای زیرساخت از خطای کسب‌وکار: آماده‌نبودن کلاینت یا خطای شبکه باید صریحاً `ErrServiceUnavailable` (کد 503 در HTTP و Unavailable در gRPC) بازگرداند. کد ۴۰۴ منحصراً زمانی صادر می‌شود که سرویس کاربران صریحاً عدم وجود کاربر را اعلام کند. | `internal/adapters/clients/user_client.go`<br>`internal/adapters/grpc/handler.go` | در صف پیاده‌سازی |
| **۳** | **تفکیک Liveness از Readiness** | جداسازی اندپوینت‌های سلامت: اندپوینت `/livez` زنده بودن پردازش و `/readyz` سلامت و آمادگی ارتباط با وابستگی‌های حیاتی را بررسی کند. صرف گوش دادن به پورت نباید کانتینر را به عنوان آماده به ترافیک شبکه تحویل دهد. | `cmd/server/main.go`<br>`internal/adapters/http/` | در صف پیاده‌سازی |
| **۴** | **پیام‌رسانی شفاف در رابط کاربری** | هدایت خطای 503 دریافتی از `/api/v1/me/context` در استودیو به بنر قابل‌فهم کاربر: «سرویس موقتاً در دسترس نیست؛ لطفاً شکیبا باشید» به جای نمایش پیام گمراه‌کننده حذف حساب یا خطای ناشناخته. | `app/src/modules/studio/`<br>`app/src/sdk/` | در صف پیاده‌سازی |
| **۵** | **تست‌های رگرسیون و گیت CI** | ایجاد تست یکپارچگی زنده (`tests/live/downstream_resilience_live_test.go`) برای اعتبارسنجی سناریوی بالا آمدن `context-service` پیش از `user-service` و همچنین قطع و وصل موقت شبکه میان سرویس‌ها بدون نیاز به ری‌استارت. | `api/services/context-service/tests/live/` | در صف پیاده‌سازی |

---

## ۶. معیارهای پذیرش خروج از رخداد (Exit & Acceptance Criteria)

1. در محیط داکر، چنانچه `context-service` قبل از `user-service` آغاز شود و سرویس کاربران با ۱۰ ثانیه تاخیر بالا بیاید:
   - در بازه اختلال، پاسخ دریافتی از گیت‌وی به ازای درخواست کانتکست الزاماً `503 Service Unavailable` باشد (نه ۴۰۴).
   - به محض آماده‌شدن `user-service`، نخستین درخواست بعدی بدون نیاز به ری‌استارت کانتینر کانتکست و بدون نیاز به ورود مجدد کاربر با موفقیت ۲۰۰ پاسخ داده شود.
2. در حین کارکرد عادی سرویس، اگر `user-service` برای ۳۰ ثانیه متوقف و سپس مجدداً راه‌اندازی شود، کلاینت به صورت خودکار بازیابی شده و وضعیت سرویس به حالت عادی برگردد.
3. آزمون‌های رگرسیون در CI با موفقیت پاس شوند.

---

## ۷. اسناد مرتبط
- [نمایه مرکزی کالبدشکافی رخدادها (DOC-OPS-INC-000)](./index.md)
- [نقشه راه جامع بک‌اند پلتفرم (DOC-BE-005)](../../03-backend/roadmap.md)
- [معماری سیستم و توپولوژی میکروسرویس‌ها (DOC-BE-001)](../../03-backend/architecture.md)
- [سند ثبت تخلفات و انحرافات معماری (VIOLATIONS_LOG.md)](../../../../.task/VIOLATIONS_LOG.md)
