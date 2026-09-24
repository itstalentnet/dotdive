---
layout: doc
title: عیب‌یابی و حل مشکلات (Troubleshooting)
description: راهنمای حل مشکلات رایج توسعه محلی پلتفرم NONS — احراز هویت، گیت‌وی، کلاستر و یکپارچه‌سازی پنل ادمین
version: 1.2.0
status: Active
author: Antigravity
owner: Backend Team
created_at: 2026-07-15
updated_at: 2026-07-23
---

# عیب‌یابی و حل مشکلات (Troubleshooting)

در این راهنما، مشکلات رایجی که ممکن است در طول توسعه محلی بک‌اند پلتفرم NONS (مخصوصاً در ارتباط با کلاستر K3d، گیت‌وی Traefik و ابزارهای Ory) رخ دهند، به همراه راه‌حل‌های تست‌شده و قطعی آن‌ها مستند شده است.

---

## ۱. اختلال در ارتباط با دامنه‌های لوکال (خطای ۵۰۲ یا Timeout)

> [!WARNING]
> **علت اصلی:** روشن بودن ابزارهای تغییر آی‌پی (VPN / Proxy) روی سیستم میزبان.

### نشانه:
هنگام تلاش برای دسترسی به آدرس‌های اینگرس محلی (مثل `http://nons.local/v1/auth/hydra/...`) با خطای `HTTP ERROR 502` یا عدم اتصال مواجه می‌شوید، در حالی که آدرس آی‌پی در ابزار `ping nons.local` به درستی به `127.0.0.1` اشاره می‌کند.

### راه‌حل:
1. **خاموش کردن VPN:** قبل از شروع تست عملی جریان‌ها، فیلترشکن یا پروکسی خود را خاموش کنید.
2. **تنظیم Split Tunneling:** در صورتی که نیاز مبرم به VPN دارید، آدرس‌های زیر را در بخش Bypass یا استثناهای برنامه پروکسی خود وارد کنید:
   * `127.0.0.1`
   * `localhost`
   * `nons.local`

---

## ۲. خطای ۵۰۲ در مرحله تبادل توکن (Token Exchange)

> [!IMPORTANT]
> **علت اصلی:** عدم دسترسی پاد درون کلاستر به سرویس لوکال خارج از کلاستر.

### نشانه:
مرورگر با موفقیت کد احراز هویت را دریافت کرده و به آدرس بازگشت منتقل می‌شود، اما هنگام ارسال درخواست `POST` به `/oauth2/token` جهت تبادل کد با توکن، با خطای `502 Bad Gateway` مواجه می‌شوید. لاگ‌های Hydra عدم دسترسی به `token-hook` را نشان می‌دهند.

### علت فنی:
ابزار Hydra در کلاستر در حال اجراست و طبق تنظیمات برای تزریق نقش‌ها، قلاب توکن را روی `http://login-consent-app:3002/token-hook` صدا می‌زند. اما از آنجا که `login-consent-app` روی سیستم لوکال شما (خارج از کلاستر) بالا آمده است، پادِ Hydra نمی‌تواند این دامنه را در شبکه داخلی کوبرنتیز پیدا کند.

### راه‌حل:
یک سرویس از نوع `ExternalName` در کلاستر بسازید تا ترافیک‌های دامنه `login-consent-app` را به کامپیوتر میزبان هدایت کند:

۱. فایل `deploy-bridge.yaml` را ایجاد کنید:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: login-consent-app
  namespace: nons-platform
spec:
  type: ExternalName
  externalName: host.docker.internal
```
۲. آن را به کلاستر اعمال کنید:
```bash
kubectl apply -f deploy-bridge.yaml
```

---

## ۳. عدم ریدایرکت پس از احراز هویت (گیر کردن در داشبورد دمو)

> [!CAUTION]
> **علت اصلی:** عدم تعریف دامنه بازگشت در لیست سفید (Whitelist) کراتوس.

### نشانه:
پس از وارد کردن ایمیل و ثبت کد OTP در صفحه ورود دمو، کاربر به جریان رضایت (Consent) در Hydra بازگردانده نمی‌شود و در صفحه داشبورد دمو (`/v1/auth/dashboard`) متوقف می‌شود.

### علت فنی:
ابزار Ory Kratos پارامتر `return_to` را جهت امنیت بیشتر بررسی می‌کند. اگر دامنه بازگشت (در اینجا `http://localhost:3002` یا `http://nons.local`) در لیست سفید کراتوس نباشد، کراتوس ریدایرکت را بلاک کرده و کاربر را به آدرس پیش‌فرض داشبورد می‌فرستد.

### راه‌حل:
۱. فایل کانفیگ کراتوس را در مسیر [auth-ui/.kratos/kratos.yml](file:///C:/Users/ASUS/Documents/GitHub/nons/auth-ui/.kratos/kratos.yml) باز کنید.
۲. دامنه‌های مورد نظر را به آرایه `allowed_return_urls` اضافه کنید:
```yaml
selfservice:
  allowed_return_urls:
    - http://localhost:3000
    - http://localhost:3001
    - http://localhost:3002
    - http://nons.local
```
۳. کانتینر کراتوس را مجدداً راه‌اندازی کنید تا تغییرات اعمال شوند:
```bash
docker rm -f nons-kratos
# اجرای مجدد کانتینر با والیوم متصل‌شده
docker run -d --name nons-kratos -p 4433:4433 -p 4434:4434 -v <مسیر_کامل_پروژه>/auth-ui/.kratos:/etc/config/kratos oryd/kratos:v1.3.1 serve -c /etc/config/kratos/kratos.yml --dev --watch-courier
```

---

## ۴. خطای اجباری بودن S256 در PKCE

### نشانه:
هنگام آغاز درخواست احراز هویت، خطا یا ریدایرکتی با این پیغام در مرورگر دریافت می‌کنید:
> `Clients must use code_challenge_method=S256, plain is not allowed.`

### علت فنی:
پلتفرم NONS برای امنیت بیشتر، استفاده از متد ساده (`plain`) را غیرفعال کرده و تمامی کلاینت‌ها را مجبور به رمزنگاری با الگوریتم SHA-256 می‌سازد.

### راه‌حل:
هنگام ایجاد چالش PKCE در سمت فرانت‌اند یا اسکریپت‌های تست:
۱. حتماً پارامتر `code_challenge_method` را برابر با `S256` قرار دهید.
۲. چالش را از طریق هش SHA-256 و انکودِ Base64URL (بدون padding) بر روی `verifier` تولید کنید.

---

## ۵. خطای عدم یافتن داده‌های PKCE برای درخواست (Unable to find initial PKCE data)

### نشانه:
در مرحله تبادل توکن خطای زیر را دریافت می‌کنید:
> `The provided authorization grant... is invalid, expired, revoked... Unable to find initial PKCE data tied to this request`

### علت‌های احتمالی:
1. **کد احراز هویت منقضی شده:** کدهای صادر شده (`ory_ac_...`) عمر کوتاهی (معمولاً ۶۰ ثانیه) دارند. عملیات تبادل را سریع‌تر انجام دهید.
2. **یک‌بار مصرف بودن کد:** هر کد پس از اولین استفاده (حتی تلاش ناموفق)، به صورت خودکار باطل می‌شود. باید جریان را از نو شروع کرده و کد جدیدی بگیرید.
3. **عدم تطابق Verifier با Challenge:** اطمینان حاصل کنید رشته ارسالی در `code_verifier` دقیقاً همان مقداری است که هش چالش از روی آن ساخته شده است. هرگونه عدم تطابق به دلایل امنیتی منجر به حذف اطلاعات جلسه و باطل شدن کد می‌شود.

---

## ۶. تداخل پروکسی/VPN در ارتباطات محلی پنل ادمین (خطای ۵۰۲ یا ۵۰۴)

> [!WARNING]
> **علت اصلی:** هدایت ترافیک دامنه‌های لوکال (localhost, nons.local) به پروکسی خارجی VPN در محیط اجرای Node.js و Go.

### نشانه:
هنگام اجرای برنامه پنل ادمین (`npm run dev`) یا استارت میکروسرویس‌های بک‌اند، فراخوانی به آدرس‌های محلی مثل `localhost:3010/v1/auth/session` با خطای `502 Bad Gateway` مواجه می‌شود در حالی که به صورت مستقیم درخواست کار می‌کند.

### علت فنی:
ابزارهای فعال پروکسی یا VPN، متغیرهای سیستم‌عامل مانند `HTTP_PROXY` و `HTTPS_PROXY` را مقداردهی می‌کنند. موتور Node.js و کتابخانه HTTP زبان Go به صورت پیش‌فرض تمام ترافیک‌های ارسالی را از این پروکسی عبور می‌دهند؛ در نتیجه دامنه‌های محلی پلتفرم به جای مسیریابی داخلی، به سرور خارجی VPN هدایت شده و مسدود می‌شوند.

### راه‌حل:
باید آدرس‌های لوکال را از پروکسی مستثنی کنیم. این کار با تنظیم متغیر `NO_PROXY` در کدهای راه‌انداز انجام می‌شود:

۱. **در سمت پنل ادمین (Vite)**: در فایل [vite.config.ts](file:///C:/Users/ASUS/Documents/GitHub/nons/admin-panel/vite.config.ts) قبل از فراخوانی تنظیمات، کد زیر را قرار دهید:
```typescript
if (typeof process !== 'undefined') {
  process.env.NO_PROXY = 'localhost,127.0.0.1,nons.local,' + (process.env.NO_PROXY || '')
}
```

۲. **در سمت میکروسرویس‌های Go**: در بدو ورود متد `main()` متغیر محیطی را به صورت دستی ست کنید:
```go
os.Setenv("NO_PROXY", "localhost,127.0.0.1,nons.local,host.docker.internal")
```

---

## ۷. تداخل پورت ۳۰۱۰ پنل ادمین و مسدود شدن جریان احراز هویت

> [!IMPORTANT]
> **علت اصلی:** باز ماندن فرآیندهای قدیمی Node.js روی پورت ۳۰۱۰ سیستم میزبان.

### نشانه:
سیستم ورود با موفقیت انجام می‌شود اما پس از ریدایرکت کاربر، پنل ادمین خطای احراز هویت داده یا کلاً لود نمی‌شود؛ و یا سرور توسعه به طور خودکار روی پورت ۳۰۱۱ بالا می‌آید.

### علت فنی:
پروژه `auth-ui` و کانفیگ‌های CORS در سرور احراز هویت، دامنه مجاز بازگشت را روی پورت ۳۰۱۰ ست کرده‌اند (`http://localhost:3010`). اگر یک فرآیند لوکال قدیمی پورت ۳۰۱۰ را اشغال کرده باشد، برنامه جدید روی ۳۰۱۱ استارت می‌خورد که منجر به بروز خطاهای CORS یا عدم انطباق با ریدایرکت‌های Ory Kratos می‌شود.

### راه‌حل:
۱. فرآیند قدیمی مسدودکننده پورت ۳۰۱۰ را در سیستم‌عامل پیدا کرده و ببندید:
   * **در ویندوز (PowerShell)**:
     ```powershell
     # پیدا کردن شناسه فرآیند (PID)
     Get-NetTCPConnection -LocalPort 3010
     # کشتن فرآیند (مثلاً PID = 3616)
     Stop-Process -Id 3616 -Force
     ```
۲. مجدداً پروژه پنل ادمین را اجرا کنید تا پورت اصلی ۳۰۱۰ را تصاحب کند.

---

## ۸. خطای ۵۰۲ روی آدرس `/v1/users/me` یا کاربران در پنل مدیریت

> [!CAUTION]
> **علت اصلی:** عدم اجرای میکروسرویس `user-service` روی سیستم میزبان یا عدم ثبت پروفایل به علت خاموش بودن NATS.

### نشانه:
کاربر با موفقیت لاگین می‌کند، اما در صفحه کاربری یا درخواست به آدرس `/v1/users/me` با خطای `502 Bad Gateway` روبه‌رو می‌شود.

### علت فنی:
۱. گیت‌وی کلاستر (Traefik) درخواست‌های `/v1/users` را به صورت `ExternalName` به پورت **۳۰۰۳** سیستم میزبان هدایت می‌کند. اگر سرویس `user-service` روی سیستم شما فعال نباشد، گیت‌وی خطای ۵۰۲ می‌دهد.
۲. سرویس `user-service` در حالت پیش‌فرض فایل محلی `.env` را برای دیتابیس لود نمی‌کند که باعث خطای عدم دسترسی به `DATABASE_URL` می‌شود.
۳. در صورت خاموش بودن کلاستر NATS محلی، رویدادهای عضویت به دیتابیس کاربران منتقل نشده و جدول دیتابیس فاقد ردیف کاربری مربوطه است (خطای ۴۰۴).

### راه‌حل:
۱. **پیاده‌سازی لودر محیطی در Go**: در فایل اصلی میکروسرویس کاربران، متد خوانش فایل `.env` را پیاده‌سازی کنید تا متغیرها به صورت خودکار لود شوند.
۲. **اجرای سرویس**: مطمئن شوید سرویس کاربران روی پورت ۳۰۰۳ در حال اجراست:
   ```bash
   cd services/user-service
   go build -o user-service.exe cmd/main.go
   ./user-service.exe
   ```
۳. **تزریق کاربر (Seeding) در نبود NATS**: اگر NATS غیرفعال است، ردیف کاربر را به صورت مستقیم در دیتابیس محلی `user_db` درج کنید:
   ```sql
   INSERT INTO users (id, public_id, username, display_name, avatar_id, preferences, status) 
   VALUES ('<USER_UUID>', 'pub_<USER_UUID>', 'admin', 'Admin User', 'default_01', '{"language": "fa", "theme": "dark", "currency": "IRT"}', 'ACTIVE') 
    ON CONFLICT (id) DO NOTHING;
    ```

---

## ۹. خطای ۵۰۰ در auth-service هنگام SubmitEntry — Kratos در CrashLoopBackOff

> [!CAUTION]
> **علت اصلی:** عدم اجرای migration دیتابیس Kratos پس از آپگرید نسخه.

### نشانه:
مرورگر خطای `500 Internal Server Error` نمایش می‌دهد. در console مرورگر:
```
Registry Error (SubmitEntry): Error: {"error":"Internal Server Error"}
```
در لاگ auth-service:
```
handleEntry: identity check failed
failed to list identities: Get "http://kratos:4434/admin/identities": dial tcp ...:4434: connect: connection refused
```
پاد Kratos در وضعیت `CrashLoopBackOff` با لاگ:
```
Unable to locate the table
```

### علت فنی:
Kratos پس از آپگرید به نسخه `v26.2.0` نیاز به migration دیتابیس دارد. اگر دیتابیس `kratos` خالی باشد (بدون جدول)، Kratos هنگام استارت fail کرده و وارد `CrashLoopBackOff` می‌شود. auth-service نیز که به Kratos وابسته است، با خطای `connection refused` مواجه می‌شود.

### راه‌حل:
۱. اجرای migration با دستور زیر (یک بار کافیست):
```bash
kubectl run -n nons-platform kratos-migrate --image=oryd/kratos:v26.2.0 --restart=Never --rm -it --command -- kratos migrate sql "postgres://nons:nons@postgres:5432/kratos?sslmode=disable" -y
```

۲. ری‌استارت Kratos (اختیاری — بعد از migration پاد قبلی restart می‌شود):
```bash
kubectl rollout restart -n nons-platform deploy/kratos
```

۳. ری‌استارت auth-service:
```bash
kubectl rollout restart -n nons-platform deploy/auth-service
```

---

## ۱۰. عدم اتصال user-service لوکال به PostgreSQL داخل کلاستر K3d

> [!IMPORTANT]
> **علت اصلی:** user-service روی سیستم میزبان اجرا می‌شود ولی PostgreSQL داخل کلاستر K3d است.

### نشانه:
لاگ user-service هنگام استارت:
```
Failed to ping PostgreSQL
failed to connect to 'user=nons database=user_db':
  [::1]:5432 (localhost): dial error: dial tcp ...:5432: connectex: No connection could be made
```

### علت فنی:
PostgreSQL داخل کلاستر K3d (`nons-platform`) در حال اجراست و از طریق سرویس داخلی `postgres:5432` در دسترس است. user-service که روی سیستم میزبان (لوکال) اجرا می‌شود، به `localhost:5432` متصل می‌شود که PostgreSQLای روی آن listening نیست.

### راه‌حل:
۱. پورت PostgreSQL کلاستر را به سیستم لوکال فوروارد کنید (در یک ترمینال جدا):
```bash
kubectl port-forward -n nons-platform svc/postgres 5432:5432
```

۲. اطمینان حاصل کنید دیتابیس `user_db` در PostgreSQL کلاستر وجود دارد:
```bash
kubectl exec -n nons-platform deploy/postgres -- psql -U nons -c "CREATE DATABASE user_db;"
```

۳. در صورت فعال بودن SSL در PostgreSQL، پارامتر `?sslmode=disable` را به کانکشن استرینگ اضافه کنید:
```
DATABASE_URL=postgresql://nons:nons@localhost:5432/user_db?sslmode=disable
```

۴. برای Redis نیز (در صورت نیاز):
```bash
kubectl port-forward -n nons-platform svc/redis 6379:6379
```

---

## ۸. خطای ۴۰۱ در لیست کاربران پنل ادمین (Admin Panel — `GET /v1/users` → 401)

> [!CAUTION]
> **علت اصلی:** استفاده از generated SDK client که `Authorization: Bearer` می‌فرستد، در حالی که `user-service` فقط `X-User-Id` header را می‌شناسد.

### نشانه:

در مرورگر، درخواست `GET /v1/users` با خطای زیر مواجه می‌شود:

```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
```

در حالی که کاربر لاگین بوده و session فعال است.

### علت فنی:

سه لایه احراز هویت جداگانه در پلتفرم NONS وجود دارد و هر سرویس از header متفاوتی استفاده می‌کند:

| سرویس | Header احراز هویت | روش |
|---|---|---|
| `user-service` | `X-User-Id: <uuid>` | خواندن مستقیم در `getAuthUserID()` |
| `iam-service` | `X-User-ID: <uuid>` یا `Authorization: Bearer <uuid>` | middleware |
| `auth-service` | Cookie `session` (Kratos) | کوکی |

frontend admin panel از یک **generated SDK client** (در `.nons/sdk/generated/api-client/user-service.ts`) برای `listUsers` استفاده می‌کرد. این client به شکل زیر request می‌فرستاد:

```ts
// ❌ اشتباه — generated client
'Authorization': `Bearer ${getToken()}`
// getToken() همیشه '' بود چون setTokenGetter هرگز صدا زده نشده بود
```

اما `user-service` در handler.go:

```go
// handler.go
func getAuthUserID(r *http.Request) string {
    return r.Header.Get("X-User-Id") // نه Authorization!
}
```

نتیجه: bearer خالی → user-service نمی‌تواند user ID را شناسایی کند → 401.

### راه‌حل:

به جای generated client، از SDK wrapper با `X-User-Id` header استفاده کنید:

```ts
// ✅ درست — src/registry/user-service.ts
function getUserIdHeader(): Record<string, string> {
  const auth = useAuthStore()
  const userId = auth.state.user?.id
  if (!userId) return {}
  return { 'X-User-Id': userId }  // همان چیزی که user-service می‌خواند
}

// در registry:
listUsers: (cursor?, limit?, status?, search?) =>
  userService.listUsers(cursor, limit, status, search, getUserIdHeader())
```

و در SDK client، `credentials: 'include'` اضافه شود تا کوکی Kratos هم ارسال شود:

```ts
// src/sdk/client.ts
const response = await fetch(url, {
  ...options,
  credentials: 'include', // ✅ کوکی session Kratos ارسال می‌شود
  headers: { ...headers, ...(options?.headers as Record<string, string> | undefined) },
})
```

### قانون کلی:

> [!IMPORTANT]
> هرگز از generated client در `.nons/sdk/generated/` برای endpointهایی که نیاز به احراز هویت دارند استفاده نکنید. این فایل‌ها **فقط برای type reference** هستند. همیشه از `src/sdk/` wrapper که header را صحیح set می‌کند استفاده کنید.

---

## ۹. یکپارچه‌سازی permission‌ها با IAM واقعی (Admin Panel — «دسترسی غیرمجاز» روی همه صفحات)

> [!WARNING]
> **علت اصلی:** permission keyهایی در frontend تعریف شده بودند که IAM backend هرگز آن‌ها را نمی‌شناسد.

### نشانه:

- منوهای ناوبری (Users، Roles، Permissions، ...) در sidebar نمایش داده نمی‌شوند.
- صفحات IAM با پیغام «دسترسی غیرمجاز» بلاک می‌شوند.
- کاربر ادمین login کرده ولی پنل خالی است.

### علت فنی:

frontend permission keyهای اختراعی داشت که IAM backend هرگز آن‌ها را emit نمی‌کند:

```ts
// ❌ اشتباه — constants.ts قبلی
USERS: { VIEW: 'users.view' }      // IAM این key را نمی‌شناسد
ROLES: { VIEW: 'roles.view' }      // IAM این key را نمی‌شناسد
PERMISSIONS: { VIEW: 'permissions.view' } // IAM این key را نمی‌شناسد
```

Permission keyهای واقعی که IAM service از طریق `GET /v1/iam/me/context` برمی‌گرداند (مطابق `002_seed_defaults.sql`):

```
admin.access        ← هر کاربر با role ADMIN این را دارد
product.create / product.edit / product.delete / product.publish
order.create / order.cancel
wallet.withdraw / wallet.view
ticket.view / ticket.resolve
```

### راه‌حل:

**۱. constants.ts** — فقط keyهای واقعی IAM:

```ts
// ✅ درست — src/permissions/constants.ts
export const PERMISSIONS = {
  ADMIN: { ACCESS: 'admin.access' }, // تنها key ادمین پنل
  PRODUCT: { CREATE: 'product.create', ... },
  ORDER: { ... },
  WALLET: { ... },
  TICKET: { ... },
} as const
```

**۲. menu.ts و schema‌ها** — همه به `admin.access` متصل:

```ts
// هر کاربر با role ADMIN این permission را دارد
permission: PERMISSIONS.ADMIN.ACCESS  // 'admin.access'
```

**۳. store.ts** — parse صحیح پاسخ IAM:

```ts
// IAM context response: { permissions: { "admin.access": true, ... } }
const ctx: { permissions?: Record<string, boolean> } = await response.json()
return Object.entries(ctx.permissions ?? {})
  .filter(([, allowed]) => allowed === true)
  .map(([key]) => key)
// نتیجه: ['admin.access', 'product.create', ...]
```

### نقشه Role → Permission در IAM:

| Role | Capability | Permissions دریافتی |
|---|---|---|
| `ADMIN` | `ADMIN_ACCESS` | `admin.access` |
| `SELLER` | `SELLING` + `BUYING` | `product.*` + `order.*` |
| `BUYER` | `BUYING` | `order.create`, `order.cancel` |
| `FINANCE_AGENT` | `FINANCE` | `wallet.withdraw`, `wallet.view` |
| `SUPPORT_AGENT` | `SUPPORT` | `ticket.view`, `ticket.resolve` |

> [!TIP]
> برای اضافه کردن permission جدید به پنل ادمین، ابتدا در migration IAM تعریف کنید (`INSERT INTO permissions`), سپس به یک capability وصل کنید، و در آخر در `constants.ts` frontend اضافه کنید. ترتیب مهم است.
