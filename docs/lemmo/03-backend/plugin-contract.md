| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Plugin and Tool Execution Contract |
| **Title (FA)** | قرارداد افزونه، ابزار و مرز اجرای امن |
| **ID** | DOC-BE-008 |
| **Category** | `backend` |
| **Status** | `Draft` |
| **Owner** | Backend & Platform Team |
| **Last Updated** | 2026-09-23 |
| **Summary (EN)** | Plugin classes, versioned manifests, host capabilities, isolated execution and backend independence boundaries. |
| **Summary (FA)** | قرارداد افزونه، ابزار و مرز اجرای امن؛ حاصل ممیزی کد و تحلیل معماری، برای بررسی تیم. |
| **Tags** | `plugins`, `manifest`, `capabilities`, `sandbox`, `providers` |

---

# قرارداد افزونه، ابزار و مرز اجرای امن

## ۱. معنی استقلال افزونه

**افزونه می‌تواند از کد داخلی بک‌اند مستقل باشد، اما استفاده از منابع مشترک نیازمند قرارداد و مجوز سرور است.** `dynamic import` فقط روش بارگذاری کد است و sandbox یا اجازه دسترسی ایجاد نمی‌کند. افزودن manifest برای executor موجود می‌تواند بدون deploy هسته انجام شود؛ افزودن یک backend capability جدید لزوماً نیازمند implementation/release است.

مبنای Active [تصمیمات فرانت](../frontend/workspace-decisions.md) schema-driven را مسیر پیش‌فرض و code-plugin را مسیر توسعه آینده قرار داده است. این سند همان مسیر را حفظ می‌کند. [ToolsManager](../../app/src/modules/tools/components/ToolsManager.tsx) فعلی کاتالوگ mock است؛ امنیت نصب یا اجرای افزونه در آن اثبات نشده است.

## ۲. چهار کلاس ابزار

| کلاس | نمونه | runtime | تماس بک‌اند | مدل انتشار |
| :--- | :--- | :--- | :--- | :--- |
| Schema tool | تولید تصویر، remove-bg با provider موجود | فرم عمومی + Executor سروری | از SDK با manifest و Job API | manifest نسخه‌دار؛ بدون build جدید فرانت برای fieldهای پشتیبانی‌شده |
| Local trusted tool | crop/resize محلی | bundle بررسی‌شده یا worker با resource limit | برای پردازش محلی لازم نیست؛ ذخیره خروجی از Assets API | انتشار package امضاشده/بازبینی‌شده با app |
| Third-party UI plugin | inspector اختصاصی یا ابزار حرفه‌ای واردشده | iframe جدا از origin اصلی + host bridge | فقط capabilityهای host؛ بدون session/key مستقیم | registry، approval و sandbox؛ پس از فاز schema |
| Remote executor extension | مدل/Provider جدید یا الگوریتم سروری | worker/container مستقل یا endpoint معتبر ثبت‌شده | Execution contract؛ credential سروری | deploy مستقل extension؛ هسته فقط executor binding را می‌شناسد |

برای tool محلی که فقط فایل انتخاب‌شده کاربر را در مرورگر پردازش می‌کند Job سروری و credit charge الزامی نیست. ذخیره در پروژه، خواندن Asset خصوصی یا درخواست cloud همچنان مجوز دارد. کد third-party مستقیماً داخل Node process سرویس API یا origin اصلی Next.js import نمی‌شود.

## ۳. مانیفست canonical پیشنهادی

مانیفست نصب‌شده نسخه immutable دارد؛ مثال زیر **طرح قرارداد آینده** است و با `ToolManifest` محدود SDK فعلی یکسان نیست. UI projection سازگار در SDK ساخته می‌شود.

```json
{
  "id": "lemmo.remove-bg",
  "version": "1.0.0",
  "manifestVersion": "1",
  "publisherId": "pub_lemmo",
  "display": {"name": {"en": "Remove background"}},
  "surfaces": ["chat", "canvas"],
  "renderer": {"kind": "schema"},
  "execution": {"kind": "remote", "executorKey": "image.remove-background.v1"},
  "inputSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {"imageAssetId": {"type": "string"}},
    "required": ["imageAssetId"]
  },
  "outputSchema": {"type": "array", "items": {"type": "object"}},
  "ports": {
    "inputs": [{"id": "image", "type": "image"}],
    "outputs": [{"id": "image", "type": "image"}]
  },
  "requestedCapabilities": ["assets.read.selected", "jobs.execute"],
  "pricingKey": "remove-background-standard",
  "compatibility": {"hostApi": "1"},
  "status": "published"
}
```

`executorKey` نماد allowlist است؛ URL دلخواه، نام کلاس داخلی یا کد shell نیست. `pricingKey` قیمت را از Billing resolve می‌کند؛ estimate داخل UI اجازه charge نیست. `outputSchema` در قرارداد اجرایی واقعی باید فیلدهای asset/type/status را دقیق تعریف کند؛ مثال بالا خلاصه است. schema validation با recursion/depth/size limit، بدون remote `$ref` نامطمئن و بدون اجرای expression دلخواه انجام شود.

فیلدهای code-plugin افزوده: `entryUrl`, `integrity`, `signature`, `hostApiVersion`, `networkAllowlist`, `requestedCapabilities`. امضا provenance و integrity را اثبات می‌کند، نه بی‌خطر بودن رفتار. extension permission نمی‌تواند با نام جدید خودکار وارد enforcement سرور شود.

## ۴. Registry و مالکیت تعریف

Tool Catalog مالک انتشار/نسخه canonical manifest و metadata کاتالوگ است؛ Tool Engine فرانت مصرف‌کننده همین تعریف و مالک schema-renderer/registry نمایشی طبق مبنای فرانت است. این دو schema مستقل تولید نمی‌کنند. Agent slash command، Canvas socket و فرم ابزار projection همان manifestاند. executor داخلی mapping و secrets را نگه می‌دارد؛ این بخش به browser ارسال نمی‌شود.

چرخه نسخه: `draft → reviewed → published → deprecated → disabled`. installation شامل workspaceId، محدوده پروژه، version pin، capability grant، installedBy، status و audit است. نصب توسط Admin به معنی اجازه استفاده همه کاربران نیست؛ اجرای کاربر با role خودش بررسی می‌شود.

ارتقا نسخه:

1. نسخه جدید immutable و changelog/capability diff منتشر شود.
2. تغییر input/output/ports یا افزایش capability نیازمند migration/approval explicit است؛ silent upgrade ممنوع.
3. boardها و Jobهای گذشته version قدیمی را نگه می‌دارند. migration board revision جدید می‌سازد و قابل rollback است.
4. disable اضطراری مانع run جدید شود؛ اجراهای موجود بر اساس خطر لغو/ایزوله شوند. uninstall تاریخچه و lineage را حذف نمی‌کند.
5. payload پروژه دارای node ناشناخته به شکل disabled placeholder قابل مشاهده و export بماند؛ اجرای آن رد شود.

## ۵. Host bridge و capability

قرارداد host محدود باشد: `getSelection`, `readSelectedAsset`, `requestJob`, `saveOutput`, `subscribeOwnJob`. مجوز مؤثر intersection دسترسی فعلی کاربر، grant نصب، scope اجرای plugin و policy Workspace است. plugin نمی‌تواند callerId یا workspaceId را authoritative ارسال کند. هر invocation به installationId/version، user/service principal، project، asset allowlist و expiry متصل است.

برای code-plugin:

- iframe با origin جدا و sandbox حداقلی؛ ترکیب script و same-origin در origin اصلی ممنوع. قابلیت‌های sandbox در [مرجع MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe) توضیح داده شده‌اند.
- handshake با nonce، بررسی `event.source` و origin مشخص، MessageChannel اختصاصی و schema validation روی هر پیام. در sandbox با opaque origin اتکا به `origin="null"` کافی نیست؛ source/nonce/channel الزامی‌اند.
- `postMessage` عمومی با `*` برای payload حساس ممنوع؛ policy CSP و network مقصد توسط host محدود شود. منابع پردازشی، اندازه پیام، نرخ درخواست و زمان اجرا سقف داشته باشند.
- plugin session cookie، JWT اصلی، API key، Provider secret یا لیست همه فایل‌ها را دریافت نمی‌کند. فایل انتخاب‌شده با حداقل داده یا handle محدود تحویل شود.
- اجازه read فایل، خطر کپی همان داده را دارد؛ sandbox امکان کنترل دلخواه بر داده‌ای که صریح تحویل شده ایجاد نمی‌کند. محصول باید consent، publisher و خروج شبکه را شفاف کند.

## ۶. Remote executor

Executor ورودی نسخه‌دار، job/attemptId، idempotency key، deadline و input handle محدود دریافت می‌کند؛ خروجی با metadata قابل بررسی به Assets ingest می‌رود. internal DB access یا مجوز ساخت invoice ندارد. secretها توسط محیط اجرای مستقل تزریق می‌شوند؛ endpoint user-supplied به SSRF تبدیل نشود. outbound IP/domain allowlist، منع private/link-local/metadata endpoints و validation بعد از redirect/DNS لازم است.

callback Provider امضا/secret معتبر، timestamp و replay protection دارد؛ providerRequestId به attempt و tenant در سرور resolve می‌شود، نه از body callback. resource limits و queue isolation برای publisher/tenant مانع مصرف نامحدود می‌شوند. endpoint ثالث با قطع شبکه یا تأخیر ممکن است unknown outcome داشته باشد؛ قواعد recovery [معماری](./architecture.md) اعمال می‌شود.

## ۷. توسعه‌پذیری بدون اتصال به جزئیات بک‌اند

| تغییر | نیاز به release هسته؟ |
| :--- | :--- |
| tool جدید با input field و executor موجود | خیر؛ manifest review/publish کافی |
| layout اختصاصی trusted UI | release package فرانت یا loader مورد تأیید |
| primitive field جدید در schema-renderer | بله، host UI باید پشتیبانی کند |
| provider جدید | release executor/adapter مستقل؛ نه لزوماً سرویس‌های دیگر |
| action سروری جدید مثل delete-project | بله، قرارداد permission و enforcement لازم |
| role جدید با permissionهای موجود | تغییر data runtime پس از authorization |
| تغییر قیمت | نسخه price/quote؛ نه hardcode در plugin |

## ۸. گیت عرضه افزونه

P0: فقط schema tools و executor مورد اعتماد؛ صحت schema، pin نسخه و ACL/ledger همان مسیر اصلی. P1: local tools بررسی‌شده. P2: third-party UI/runtime پس از sandbox، consent، kill switch، audit، test harness و قرارداد انتشار. داشتن صفحه Tools به‌تنهایی مجوز عرضه marketplace عمومی یا کد واردشده نامطمئن نیست.

تست‌های ضروری: manifest با executor ناشناخته؛ درخواست capability اضافه؛ دسترسی asset خارج selection؛ replay پیام host؛ callback جعلی؛ URL داخلی/redirect مخرب؛ upgrade با port ناسازگار؛ revoke installation وسط اجرا؛ tool ناشناخته در board قدیمی؛ دو اجرای یک invocation بدون charge تکراری.
