# راهنمای اتصال سرویس‌های بکند به پنل ادمین

**تاریخ:** 2026-07-16 (بروزرسانی: اصلاح بخش user-service بر اساس endpointهای جدید)
**وضعیت:** پیش‌نویس برای تیم پنل ادمین
**محدوده:** ۵ سرویس بکند آماده برای ادغام — `user-service`, `pool-service`, `auth-service`, `token-service`, `iam-service`

---

## ۰. مقدمه و نحوه استفاده

این سند فهرستی جامع از داده‌ها و نقاط پایانی (endpoints) هر یک از ۵ سرویس بکند را ارائه می‌دهد که می‌توانید مستقیماً به **پنل ادمین** متصل کنید. برای هر سرویس، ابتدا خلاصه‌ای از قابلیت‌های قابل نمایش در پنل آمده، سپس لیست دقیق endpointها با متد، مسیر، هدف و نوع پاسخ.

> **قراردادهای عمومی:**
> - تمام سرویس‌ها زیر پیشوند `/v1` هستند.
> - فرمت پاسخ موفق در `user-service`: `{ "success": true, "data": ..., "meta": ... }` (envelope جدید با فیلد `success`).
> - فرمت پاسخ موفق در `pool-service`: `{ "data": ... }` (envelope ساده).
> - احراز هویت پنل ادمین از طریق:
>   - `CookieSession` (کوکی `session`) — حالت پیش‌فرض پنل
>   - `BearerJWT` (هدر `Authorization: Bearer <token>`) — سرویس‌ها/CLI/موبایل
>   - `ApiKey` (هدر `X-API-Key`) — ادغام‌های خارجی و endpointهای ادمین `pool-service`
> - فرمت خطا یکسان: `{ "error": { "code": string, "message": string } }`
> - مستندات OpenAPI تولید‌شده (با ابزار `nons-openapi`) برای `user-service` و `pool-service` در `services/<name>/docs/openapi.yaml` موجود است و منبع رسمی schemaها می‌باشد.

---

## ۱. user-service — مدیریت پروفایل کاربر

**مسیر پایه:** `/v1/users`
**نوع داده‌ها:** پروفایل عمومی، پروفایل خصوصی، تنظیمات، یوزرنام، آواتار، وضعیت، لیست کاربران
**مناسب برای پنل ادمین:** لیست/جستجوی کاربران (admin)، نمایش پروفایل، ویرایش نمایشی نام و ترجیحات، نظارت بر تغییرات یوزرنام/آواتار، مدیریت آواتارهای پیش‌فرض.
**مستند OpenAPI:** `services/user-service/docs/openapi.yaml` (تولید شده، معتبر ۳.۱.۰ — ۸ مسیر)

> **تغییر فرمت پاسخ (مهم):** پاسخ موفق اکنون envelope جدید دارد:
> ```json
> { "success": true, "data": ..., "meta": { ... } }
> ```
> (پیش‌تر فقط `{ "data": ... }` بود). پاسخ خطا نیز یکسان است:
> ```json
> { "success": false, "error": { "code": string, "message": string, "details": [...] } }
> ```

### ۱.۱ قابلیت‌های قابل اتصال به پنل

| قابلیت پنل | Endpoint | دسترسی |
|---|---|---|
| لیست کاربران (صفحه‌بندی) | `GET /v1/users` | ادمین |
| جستجو/فیلتر کاربران | `GET /v1/users?status=&search=&cursor=&limit=` | ادمین |
| نمایش پروفایل عمومی | `GET /v1/users/{publicId}` | عمومی |
| پروفایل من (ادمین) | `GET /v1/users/me` | BearerJWT |
| ویرایش نام نمایشی | `PATCH /v1/users/me/profile` | BearerJWT |
| ویرایش ترجیحات | `PATCH /v1/users/me/preferences` | BearerJWT |
| تغییر یوزرنام | `PATCH /v1/users/me/username` | BearerJWT |
| تغییر آواتار | `PATCH /v1/users/me/avatar` | BearerJWT |
| لیست آواتارهای پیش‌فرض | `GET /v1/users/avatars` | عمومی |

### ۱.۲ endpointهای دقیق

| متد | مسیر | امنیت | کاربرد در پنل |
|---|---|---|---|
| GET | `/v1/users?cursor=&limit=&status=&search=` | Admin | لیست کاربران با صفحه‌بندی cursor-based و فیلتر وضعیت/جستجو |
| GET | `/v1/users/{publicId}` | Public | نمایش پروفایل عمومی (یوزرنام، نام، آواتار) |
| GET | `/v1/users/me` | BearerJWT | پروفایل کامل ادمین جاری (شامل status, created_at, updated_at) |
| PATCH | `/v1/users/me/profile` | BearerJWT | ویرایش display_name (بدنه: `{display_name}`) |
| PATCH | `/v1/users/me/preferences` | BearerJWT | ویرایش ترجیحات (بدنه: `{currency, theme, language}`) |
| PATCH | `/v1/users/me/username` | BearerJWT | تغییر یوزرنام (بدنه: `{username}`) — خطای ۴۰۹ اگر تکراری |
| PATCH | `/v1/users/me/avatar` | BearerJWT | انتصاب آواتار (بدنه: `{avatar_id}`) |
| GET | `/v1/users/avatars` | Public | لیست آواتارهای پیش‌فرض سیستم |

### ۱.۳ ساختار پاسخ‌های کلیدی (schema)

**لیست کاربران — `GET /v1/users`**
```json
{
  "success": true,
  "data": [
    {
      "public_id": "usr_xxx",
      "username": "game_lord_42",
      "display_name": "Lord",
      "avatar_url": "https://...",
      "status": "ACTIVE",
      "created_at": "2026-07-16T10:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "next_cursor": "usr_yyy",
      "prev_cursor": null,
      "has_more": true,
      "limit": 20
    }
  }
}
```

**پارامترهای `GET /v1/users`:**
| پارامتر | نوع | توضیح |
|---|---|---|
| `cursor` | string | کورسر صفحه‌بندی (از `meta.pagination.next_cursor`) |
| `limit` | int | تعداد در صفحه (پیش‌فرض ۲۰) |
| `status` | string | فیلتر وضعیت (مثلاً `ACTIVE`, `SUSPENDED`) |
| `search` | string | جستجوی متنی در یوزرنام/نام |

**آواتار پیش‌فرض — `GET /v1/users/avatars`**
```json
{
  "success": true,
  "data": [
    { "id": "default_01", "asset_url": "https://cdn.nons.app/avatars/default_01.png", "type": "DEFAULT", "status": "ACTIVE" }
  ]
}
```

### ۱.۴ تست عملی (واقعی — ۱۴۰۶/۰۷/۱۶)

سرویس روی پورت `3003` اجرا شد و endpointها با داده واقعی تست شدند:

**نتایج:**
| تست | نتیجه |
|---|---|
| `GET /v1/users` (بدون فیلتر) | ۲ کاربر برگشت، `has_more=false` |
| `GET /v1/users?search=admin` | ۱ نتیجه: `admin_user` |
| `GET /v1/users?status=ACTIVE&limit=1` | `has_more=true`، `next_cursor` مقدار داشت (صفحه‌بندی درست کار می‌کند) |
| `GET /v1/users/avatars` | ۵ آواتار پیش‌فرض (`default_01` تا `default_05`) |

**داده فعلی پایگاه (تعداد کاربران: ۲):**
```
pub_f7fe46a1 | admin_user   | ACTIVE | 2026-07-16
id123456789 | tester_123  | ACTIVE | 2026-07-10
```

> **منبع داده:** جدول `users` در PostgreSQL (پایگاه `user_db`). فیلتر `status != 'DELETED'` اعمال می‌شود. کاربران هنگام ثبت‌نام (مصرف رویداد `nons.auth.user.registered`) توسط `CreateProfile` ایجاد می‌شوند.
> **توجه:** Avatar URL در پاسخ لیست کاربران (`avatar_url`) فعلاً فقط ID آواتار را برمی‌گرداند (مثلاً `"default_01"`)، نه URL کامل — چون `avatarRepo.GetByID` در لیست صدا زده نمی‌شود (فقط در `GetProfilePublic`/`GetProfilePrivate`). پنل ادمین باید برای نمایش تصویر، `GET /v1/users/avatars` را جداگانه فراخوانی کند یا آواتار را از Pool بگیرد.

### ۱.۵ باگ اصلاح‌شده
- **مشکل:** `GET /v1/users/avatars` پاسخ را به صورت تو در تو برمی‌گرداند: `{"success":true,"data":{"data":[...]}}` (double envelope).
- **علت:** فراخوانی `sendSuccess(w, ListAvatarsResponse{...})` در حالی که `ListAvatarsResponse` خودش فیلد `data` دارد و `sendSuccess` دورش یک `data` دیگر می‌پیچد.
- **رفع:** تغییر به `sendJSON(w, http.StatusOK, ListAvatarsResponse{...})` (همان الگوی `ListUsers`).

> **نکته IAM:** تغییر یوزرنام/آواتار توسط کاربر نهایی از طریق پالیسی `iam-service` کنترل می‌شود (مالکیت پالیسی در D8/D9). پنل ادمین برای اقدامات نیابتی (impersonation) باید مجوز `users.updateProfile:any` را چک کند. لیست کاربران (`GET /v1/users`) نیازمند مجوز `users.list` است.

---

## ۲. pool-service — داده‌های مرجع و مواد (Reference Data & Material Pools)

**مسیر پایه:** `/v1/pool`
**نوع داده‌ها:** مواد یوزرنام (adjective/noun)، یوزرنام‌های رزرو شده، آواتارها، ارزهای پشتیبانی‌شده
**مناسب برای پنل ادمین:** مدیریت واژگان تولید یوزرنام، مدیریت لیست سیاه/رزرو یوزرنام، کاتالوگ آواتارها، تنظیم ارزهای سیستم.
**مستند OpenAPI:** `services/pool-service/docs/openapi.yaml` (تولید شده، معتبر ۳.۱.۰)

### ۲.۱ قابلیت‌های قابل اتصال به پنل

| قابلیت پنل | Endpoint | دسترسی |
|---|---|---|
| کاتالوگ مواد یوزرنام | `GET /v1/pool/username/materials` | عمومی (نمایش) |
| افزودن ماده جدید | `POST /v1/pool/username/materials` | ادمین (`X-API-Key`) |
| لیست یوزرنام‌های رزرو شده | `GET /v1/pool/username/reserved` | عمومی (نمایش) |
| رزرو یوزرنام جدید | `POST /v1/pool/username/reserved` | ادمین |
| بررسی در دسترس بودن | `POST /v1/pool/username/check` | عمومی |
| رزرو در زمان ثبت‌نام | `POST /v1/pool/username/reserve` | سرویس (ApiKey) |
| کاتالوگ آواتارها | `GET /v1/pool/avatars` | عمومی |
| جزئیات آواتار | `GET /v1/pool/avatars/{id}` | عمومی |
| افزودن آواتار | `POST /v1/pool/avatars` | ادمین |
| لیست ارزها | `GET /v1/pool/currencies` | عمومی |

### ۲.۲ endpointهای دقیق

| متد | مسیر | امنیت | کاربرد در پنل |
|---|---|---|---|
| GET | `/v1/pool/username/materials?category=ADJECTIVE\|NOUN` | Public | نمایش/فیلتر مواد یوزرنام |
| POST | `/v1/pool/username/materials` | ApiKey | ایجاد ماده (بدنه: `{value, category}`) |
| GET | `/v1/pool/username/reserved` | Public | نمایش یوزرنام‌های رزرو شده |
| POST | `/v1/pool/username/reserved` | ApiKey | رزرو (بدنه: `{username, reason}`) |
| POST | `/v1/pool/username/check` | Public | بررسی در دسترس بودن (بدنه: `{username}`) → `{available, reason}` |
| POST | `/v1/pool/username/reserve` | ApiKey | رزرو هنگام ثبت‌نام (بدنه: `{username}`) |
| GET | `/v1/pool/avatars` | Public | کاتالوگ آواتارها |
| GET | `/v1/pool/avatars/{id}` | Public | جزئیات آواتار |
| POST | `/v1/pool/avatars` | ApiKey | ثبت آواتار (بدنه: `{id, asset_url, category, skin_tone, tags}`) |
| GET | `/v1/pool/currencies` | Public | لیست ارزها (code, name, symbol, precision, country) |

> **نکته معماری:** `pool-service` فقط **مواد** را فراهم می‌کند؛ الگوریتم تولید یوزرنام (adjective_noun_NNN) در `user-service` (Consumer) باقی می‌ماند (D2). پنل ادمین نباید خودش یوزرنام تولید کند — فقط مواد را مدیریت کند.

---

## ۳. auth-service — احراز هویت و نشست (Kratos wrapper)

**مسیر پایه:** `/v1/auth`
**تکنولوژی:** ORY Kratos + Go wrapper، پشتیبانی از JSON (بدون HTML) از طریق هدر `Accept: application/json`
**مناسب برای پنل ادمین:** نمایش وضعیت نشست ادمین، مدیریت جریان‌های ورود/ثبت‌نام، تایید/رد درخواست‌ها، صفحه خطا و تنظیمات.

### ۳.۱ قابلیت‌های قابل اتصال به پنل

| قابلیت پنل | Endpoint | توضیح |
|---|---|---|
| وضعیت نشست فعلی | `GET /v1/auth/session` | `{authenticated, user, logoutUrl}` |
| شروع جریان ورود/ثبت‌نام | `POST /v1/auth/entry` | برمی‌گرداند `{flowId, type}` |
| فرم ورود | `GET/POST /v1/auth/login` | دریافت/ارسال flow |
| فرم ثبت‌نام | `GET/POST /v1/auth/register` | دریافت/ارسال flow (شامل فیلدهای OTP) |
| خروج | `GET /v1/auth/logout` | باطل‌سازی نشست |
| داشبورد | `GET /v1/auth/dashboard` | اطلاعات کاربر (JSON در صورت `Accept: application/json`) |
| تنظیمات | `GET/POST /v1/auth/settings` | تغییر رمز/Recovery |
| اعتبارسنجی توکن | `GET /v1/auth/validate` | بررسی اعتبار |
| تایید (Verification) | `GET/POST /v1/auth/verification` | تایید ایمیل/شماره |
| صفحه خطا | `GET /v1/auth/error` | نمایش خطاهای Kratos |
| URL هدایت OIDC | `GET /v1/auth/oidc-url` | دریافت URL ریدایرکت تامین‌کننده |
| وبهوک ثبت‌نام | `POST /v1/auth/webhooks/kratos/register` | دریافت رویداد ثبت‌نام از Kratos |
| مسیر محافظت‌شده | `GET /v1/protected` | تست دسترسی |

### ۳.۲ endpointهای دقیق

| متد | مسیر | کاربرد در پنل |
|---|---|---|
| GET | `/v1/auth/session` | وضعیت نشست (JSON: `{authenticated, user, logoutUrl}`) |
| POST | `/v1/auth/entry` | شروع flow (پاسخ: `{flowId, type}`) |
| GET | `/v1/auth/login` | دریافت فرم ورود (FlowResponseJSON) |
| POST | `/v1/auth/login` | ارسال فرم ورود |
| GET | `/v1/auth/register` | دریافت فرم ثبت‌نام (شامل codeNodes/socialNodes) |
| POST | `/v1/auth/register` | ارسال فرم ثبت‌نام |
| GET | `/v1/auth/logout` | خروج کاربر |
| GET | `/v1/auth/dashboard` | اطلاعات داشبورد (JSON) |
| GET | `/v1/auth/settings` | فرم تنظیمات |
| POST | `/v1/auth/settings` | به‌روزرسانی تنظیمات |
| GET | `/v1/auth/validate` | اعتبارسنجی درخواست |
| GET | `/v1/auth/verification` | فرم تایید |
| POST | `/v1/auth/verification` | ارسال تایید |
| GET | `/v1/auth/error` | صفحه خطا |
| GET | `/v1/auth/oidc-url` | URL ریدایرکت OIDC |
| POST | `/v1/auth/webhooks/kratos/register` | وبهوک ثبت‌نام (داخلی) |
| GET | `/v1/protected` | تست مسیر محافظت‌شده |

> **توجه:** endpointهای `/v1/auth/static/` (فایل‌های ایستا) و خود فرم‌ها عمدتاً برای UI هستند؛ پنل ادمین ترجیحاً از نسخه JSON (هدر `Accept: application/json` یا `?format=json`) استفاده کند.

---

## ۴. token-service — صدور و اعتبارسنجی توکن (Ory Hydra)

**وضعیت:** Blueprint نهایی (نسخه ۳.۴) — پیاده‌سازی با Helm (بدون کد wrapper) + `login-consent-app`
**مسیر پایه (Public):** `/v1/auth/hydra` (از طریق Gateway)
**مناسب برای پنل ادمین:** نمایش وضعیت صدور توکن، ابطال توکن کاربران دیگر (Admin)، مشاهده JWKS، نظارت بر رویدادهای صدور/ابطال.

### ۴.۱ قابلیت‌های قابل اتصال به پنل

| قابلیت پنل | Endpoint | دسترسی |
|---|---|---|
| آغاز جریان Authorization | `GET /oauth2/auth` | عمومی (از طریق Gateway) |
| صدور/تمدید توکن | `POST /oauth2/token` | عمومی |
| ابطال توکن کاربر جاری | `POST /oauth2/revoke` | کاربر |
| **ابطال توکن سایر کاربران** | `POST /oauth2/revoke` + مجوز `token.revoke:any` | **ادمین** |
| کلیدهای عمومی (JWKS) | `GET /.well-known/jwks.json` | عمومی |
| متادیتا OIDC | `GET /.well-known/openid-configuration` | عمومی |
| خروج OIDC | `GET /oauth2/sessions/logout` | عمومی |

### ۴.۲ endpointهای دقیق (سطح Public)

| متد | مسیر (نسبت به پایه Gateway) | کاربرد در پنل |
|---|---|---|
| GET | `/v1/auth/hydra/oauth2/auth` | شروع جریان OAuth2 |
| POST | `/v1/auth/hydra/oauth2/token` | صدور/تمدید (grant_type: authorization_code, refresh_token) |
| POST | `/v1/auth/hydra/oauth2/revoke` | ابطال توکن |
| GET | `/v1/auth/hydra/.well-known/jwks.json` | دریافت کلیدهای عمومی جهت نمایش/audit |
| GET | `/v1/auth/hydra/.well-known/openid-configuration` | متادیتا |
| GET | `/v1/auth/hydra/oauth2/sessions/logout` | خروج OIDC |

> **نکته امنیتی:** Admin API هیدرا (port 4445) **فقط** در شبکه داخلی و صرفاً توسط `login-consent-app` فراخوانی می‌شود (NetworkPolicy) — پنل ادمین هرگز مستقیم به آن دسترسی ندارد.
> **مجوز Admin:** ابطال توکن کاربران دیگر نیازمند `token.revoke:any` (در IAM ثبت شده، بخش ۵).

---

## ۵. iam-service — مدیریت دسترسی‌ها (RBAC/ABAC)

**مسیر پایه:** `/v1/iam`
**نوع داده‌ها:** نقش‌ها (Role)، قابلیت‌ها (Capability)، مجوزها (Permission)، پالیسی‌ها، کاربران، محدودیت‌ها (Restriction)، اووررایدها، پلن‌ها، entitlementها، ورک‌اسپیس‌ها، لاگ حسابرسی
**مناسب برای پنل ادمین:** این سرویس **قلب پنل ادمین** است — مدیریت نقش‌ها، انتصاب نقش به کاربر، تعلیق/فعال‌سازی کاربر، محدودیت‌ها، اووررایدها، پالیسی‌ها، و جستجوی دسترسی.

### ۵.۱ قابلیت‌های قابل اتصال به پنل (تفکیک شده)

**الف) کاربران و دسترسی**
| قابلیت پنل | Endpoint |
|---|---|
| مشاهده کاربر | `GET /v1/iam/users/{id}` |
| انتصاب نقش | `POST /v1/iam/users/{id}/roles` |
| حذف نقش | `DELETE /v1/iam/users/{id}/roles/{roleKey}` |
| تغییر وضعیت (فعال/تعلیق) | `PUT /v1/iam/users/{id}/status` |
| تاریخچه وضعیت | `GET /v1/iam/users/{id}/status/history` |
| افزودن محدودیت | `POST /v1/iam/users/{id}/restrictions` |
| حذف محدودیت | `DELETE /v1/iam/users/{id}/restrictions/{key}` |
| لیست محدودیت‌ها | `GET /v1/iam/users/{id}/restrictions` |
| افزودن اوورراید | `POST /v1/iam/users/{id}/overrides` |
| حذف اوورراید | `DELETE /v1/iam/users/{id}/overrides/{overrideId}` |
| لیست اووررایدها | `GET /v1/iam/users/{id}/overrides` |
| تنظیم پلن | `PUT /v1/iam/users/{id}/plan` |
| لیست نقش‌های کاربر | `GET /v1/iam/users/{id}/roles` |
| بررسی دسترسی | `POST /v1/iam/authorization/check` |
| کانتکست دسترسی من | `GET /v1/iam/me/context` |
| کانتکست دسترسی کاربر | `GET /v1/iam/users/{id}/context` |

**ب) نقش‌ها (Roles)**
| قابلیت پنل | Endpoint |
|---|---|
| لیست نقش‌ها | `GET /v1/iam/roles` |
| جزئیات نقش | `GET /v1/iam/roles/{key}` |
| ایجاد نقش | `POST /v1/iam/roles` |
| ویرایش نقش | `PATCH /v1/iam/roles/{key}` |
| حذف نقش | `DELETE /v1/iam/roles/{key}` |
| افزودن قابلیت به نقش | `POST /v1/iam/roles/{key}/capabilities` |
| حذف قابلیت | `DELETE /v1/iam/roles/{key}/capabilities/{capKey}` |
| لیست قابلیت‌های نقش | `GET /v1/iam/roles/{key}/capabilities` |

**ج) قابلیت‌ها (Capabilities) و مجوزها (Permissions)**
| قابلیت پنل | Endpoint |
|---|---|
| لیست قابلیت‌ها | `GET /v1/iam/capabilities` |
| جزئیات قابلیت | `GET /v1/iam/capabilities/{key}` |
| ایجاد قابلیت | `POST /v1/iam/capabilities` |
| ویرایش قابلیت | `PATCH /v1/iam/capabilities/{key}` |
| حذف قابلیت | `DELETE /v1/iam/capabilities/{key}` |
| افزودن مجوز به قابلیت | `POST /v1/iam/capabilities/{key}/permissions` |
| حذف مجوز | `DELETE /v1/iam/capabilities/{key}/permissions/{permKey}` |
| لیست مجوزهای قابلیت | `GET /v1/iam/capabilities/{key}/permissions` |
| لیست مجوزها | `GET /v1/iam/permissions` |
| جزئیات مجوز | `GET /v1/iam/permissions/{key}` |
| ایجاد مجوز | `POST /v1/iam/permissions` |
| ویرایش مجوز | `PATCH /v1/iam/permissions/{key}` |
| حذف مجوز | `DELETE /v1/iam/permissions/{key}` |

**د) پالیسی‌ها (Policies)، محدودیت‌ها، اووررایدها، پلن‌ها**
| قابلیت پنل | Endpoint |
|---|---|
| لیست پالیسی‌ها | `GET /v1/iam/policies` |
| جزئیات پالیسی | `GET /v1/iam/policies/{id}` |
| ایجاد پالیسی | `POST /v1/iam/policies` |
| ویرایش پالیسی | `PATCH /v1/iam/policies/{id}` |
| حذف پالیسی | `DELETE /v1/iam/policies/{id}` |
| اجرای پالیسی (تست) | `POST /v1/iam/policies/{id}/execute` |
| لیست محدودیت‌ها | `GET /v1/iam/restrictions` |
| جزئیات محدودیت | `GET /v1/iam/restrictions/{key}` |
| ایجاد محدودیت | `POST /v1/iam/restrictions` |
| ویرایش محدودیت | `PATCH /v1/iam/restrictions/{key}` |
| حذف محدودیت | `DELETE /v1/iam/restrictions/{key}` |
| لیست اووررایدها | `GET /v1/iam/overrides` |
| لیست پلن‌ها | `GET /v1/iam/plans` |
| جزئیات پلن | `GET /v1/iam/plans/{key}` |
| ایجاد پلن | `POST /v1/iam/plans` |
| ویرایش پلن | `PATCH /v1/iam/plans/{key}` |
| حذف پلن | `DELETE /v1/iam/plans/{key}` |
| لیست entitlementها | `GET /v1/iam/entitlements` |
| جزئیات entitlement | `GET /v1/iam/entitlements/{key}` |
| ویرایش entitlement | `PATCH /v1/iam/entitlements/{key}` |
| حذف entitlement | `DELETE /v1/iam/entitlements/{key}` |
| تنظیم entitlement پلن | `POST /v1/iam/entitlements/plan` |
| حذف entitlement پلن | `DELETE /v1/iam/entitlements/plan/{planKey}/{entKey}` |

**ه) ورک‌اسپیس‌ها و حسابرسی**
| قابلیت پنل | Endpoint |
|---|---|
| لیست ورک‌اسپیس‌ها | `GET /v1/iam/workspaces` |
| جزئیات ورک‌اسپیس | `GET /v1/iam/workspaces/{key}` |
| ایجاد ورک‌اسپیس | `POST /v1/iam/workspaces` |
| ویرایش ورک‌اسپیس | `PATCH /v1/iam/workspaces/{key}` |
| حذف ورک‌اسپیس | `DELETE /v1/iam/workspaces/{key}` |
| جستجوی لاگ حسابرسی | `GET /v1/iam/audit` |

### ۵.۲ نمونه‌های پاسخ کلیدی

- **بررسی دسترسی:** `POST /v1/iam/authorization/check` با بدنه `{subject, permission, resource}` → نتیجه allow/deny
- **تغییر وضعیت کاربر:** `PUT /v1/iam/users/{id}/status` با بدنه `{status: "SUSPENDED"|"ACTIVE"}`
- **لاگ حسابرسی:** `GET /v1/iam/audit?actor=&action=&from=&to=` → لیست رخدادهای دسترسی

---

## ۶. نقشه راه پیشنهادی برای پنل ادمین

| اولویت | سرویس | ماژول پنل |
|---|---|---|
| ۱ (ضروری) | iam-service | مدیریت نقش‌ها، کاربران، وضعیت، حسابرسی |
| ۲ | user-service | نمایش/ویرایش پروفایل، یوزرنام، آواتار |
| ۳ | pool-service | مدیریت مواد یوزرنام، رزروها، آواتارها، ارزها |
| ۴ | auth-service | نظارت نشست، خروج اجباری، خطاها |
| ۵ | token-service | ابطال توکن ادمین، مشاهده JWKS (پس از استقرار Hydra) |

---

## ۷. منابع و مراجع

- OpenAPI (تولید شده): `services/user-service/docs/openapi.yaml`, `services/pool-service/docs/openapi.yaml`
- Blueprintها: `services/{service}/blueprint.md`
- README سرویس‌ها: `services/{service}/README.md`
- مستندات تیم: `dotdive/docs/team/backend/services/`
- ADRها: `dotdive/docs/team/backend/ADR/` (ADR-Backend-006 برای token-service، ADR-Backend-007 برای pool-service)
- رویدادهای سیستم: `nons-api/catalog/events/`
