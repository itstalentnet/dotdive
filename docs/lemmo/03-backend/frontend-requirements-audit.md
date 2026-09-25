| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Frontend Evidence and Backend Requirements |
| **Title (FA)** | ممیزی فرانت و نیازمندی‌های بک‌اند |
| **ID** | DOC-BE-006 |
| **Category** | `backend` |
| **Status** | `Draft` |
| **Owner** | Backend & Platform Team |
| **Last Updated** | 2026-09-23 |
| **Summary (EN)** | Evidence-based inventory of current UI behavior, SDK gaps, domain requirements and acceptance criteria. |
| **Summary (FA)** | ممیزی فرانت و نیازمندی‌های بک‌اند؛ حاصل ممیزی کد و تحلیل معماری، برای بررسی تیم. |
| **Tags** | `audit`, `requirements`, `frontend`, `evidence` |

---

# ممیزی فرانت و نیازمندی‌های بک‌اند

## ۱. نتیجه و حدود بررسی

لمو یک استودیوی تولید و مدیریت محتوای AI با سه سطح Agent، Canvas و Assets، به‌علاوه همکاری پروژه‌ای، ابزارهای افزونه‌ای و اعتبار مصرفی است. مرز تجاری «پروژه» باید مستقل از بوم باشد؛ یک پروژه می‌تواند گفتگو، چند بوم، فایل و اجرا داشته باشد. این تفکیک **پیشنهاد طراحی** است، نه چیزی که همین حالا در فرانت پیاده شده باشد.

ممیزی در ۲۰۲۶-۰۹-۲۳ با مطالعه کد انجام شد؛ اجرای مرورگر، تست کاربردپذیری، تست سرویس زنده یا ممیزی امنیتی اجرایی انجام نشده است. نسخه‌های بررسی‌شده: `app@a13dd33`، `dotdive@b919de3`، `api@42effce` و `docs@b28048e` به‌همراه پیش‌نویس‌های محلی بک‌اند. `api/README.md` تنها فایل غیر Git در api است؛ این بررسی وجود بک‌اند اجرایی را تأیید نمی‌کند.

برچسب‌ها: **مشاهده** = شاهد مستقیم کد؛ **نیاز صریح** = درخواست مالک محصول؛ **استنباط** = نیاز لازم برای واقعی‌شدن UI؛ **پیشنهاد** = انتخاب معماری قابل بازنگری. یک دکمه نمایشی یا مقدار mock به‌تنهایی قرارداد تجاری نیست.

## ۲. دفتر شواهد

مسیرها به فایل واقعی و نام تابع/نوع اشاره دارند تا پس از جابه‌جایی شماره خطوط هم قابل پیگیری باشند.

| شاهد | فایل و نقطه بررسی | نتیجه واقعی |
| :--- | :--- | :--- |
| E01 | [SDK types](../../app/src/sdk/types.ts)، `SdkClient` | فقط tools، jobs، chat، assets و user؛ فاقد workspace/project/team/invitation/canvas/billing mutations |
| E02 | [SDK entry](../../app/src/sdk/index.ts)، `isLiveMode` | هر دو شاخه به mock متصل‌اند؛ سوئیچ env اتصال واقعی نمی‌سازد |
| E03 | [Mock adapter](../../app/src/sdk/mock/mock-adapter.ts)، `execute` و `sendMessage` | timer محلی؛ ورودی execute استفاده نمی‌شود؛ done الزاماً Asset نمی‌سازد؛ thread نامعتبر به اولین thread می‌افتد |
| E04 | [MembersPanel](../../app/src/modules/settings/components/panels/MembersPanel.tsx)، `handleInvite` | افزودن مستقیم عضو به state و toast؛ ایمیل، توکن دعوت، پذیرش و عضویت واقعی وجود ندارد |
| E05 | [Settings types](../../app/src/modules/settings/types.ts)، `WorkspaceMember` | چهار نقش نمایشی Owner/Admin/Editor/Viewer؛ فاقد scope پروژه و موجودیت Team |
| E06 | [AgentChatView](../../app/src/modules/agent/components/AgentChatView.tsx)، `handleSubmit` | پاسخ ساختگی با timer؛ mock مستقیم، prompt، references، model، batchCount و creditsUsed |
| E07 | [Agent types](../../app/src/modules/agent/types.ts) و [AgentInputBar](../../app/src/modules/agent/components/AgentInputBar.tsx) | تصویر/ویدیو، نسبت تصویر، مدل، batch یک تا چهار، مرجع فایل و slash command |
| E08 | [CanvasManager](../../app/src/modules/canvas/components/CanvasManager.tsx) و [Canvas types](../../app/src/modules/canvas/types.ts) | فهرست پروژه‌نما، template، starred/recent؛ CanvasProject فعلی فاقد tenant و ACL |
| E09 | [CanvasWorkspaceEditor](../../app/src/modules/canvas/components/CanvasWorkspaceEditor.tsx)، `handleRunSingleNode` و `handleRunPipeline` | نود/لایه/viewport در state، اجرای timer؛ workflow پایدار، scheduler یا همکاری شبکه‌ای مشاهده نشد |
| E10 | [CanvasPropertiesPanel](../../app/src/modules/canvas/components/CanvasPropertiesPanel.tsx) | پیکربندی نود، شکل، frame و اجرای بوم؛ editor گراف فقط AI نیست |
| E11 | [AssetsManager](../../app/src/modules/assets/components/AssetsManager.tsx) | جستجو و favorite/delete محلی، دانلود از URL فایل، فیلتر generations/uploads/material |
| E12 | [ToolsManager](../../app/src/modules/tools/components/ToolsManager.tsx) و [ToolItem](../../app/src/modules/tools/types.ts) | کاتالوگ mock با نویسنده، نسخه، rating و credits؛ loader امن افزونه یا نصب سروری مشاهده نشد |
| E13 | [MasonryFeed](../../app/src/modules/feed/components/MasonryFeed.tsx) و [feed data](../../app/src/shared/data/feedData.ts) | فید، جستجو، لایک محلی و کپی prompt؛ مجوز انتشار/بازنشر نیازمند تعریف محصول |
| E14 | [ApiTokensPanel](../../app/src/modules/settings/components/panels/ApiTokensPanel.tsx)، `handleCreateToken` | ساخت prefix با Math.random و کپی همان prefix؛ کلید معتبر یا secret واقعی نیست |
| E15 | [WorkspaceSettingsPanel](../../app/src/modules/settings/components/panels/WorkspaceSettingsPanel.tsx) | autosave، retention، public links و training opt-out در state؛ toast شاهد ذخیره نیست |
| E16 | [OverviewPanel](../../app/src/modules/settings/components/panels/OverviewPanel.tsx) | آمار عضو/فضا/مصرف/پلن ثابت؛ اعداد SLA یا quota نهایی نیستند |
| E17 | [BillingPanel](../../app/src/modules/settings/components/panels/BillingPanel.tsx)، [ComputePacks](../../app/src/modules/settings/components/panels/ComputePacksPanel.tsx)، [Promo](../../app/src/modules/settings/components/panels/PromoPanel.tsx) | پلن، کارت، پک و تخفیف نمایشی؛ قواعد قیمت، بازپرداخت و پرداخت قطعی نیستند |
| E18 | [AccountPanel](../../app/src/modules/settings/components/panels/AccountPanel.tsx)، `handleVerifySubmit` | هر کد شش‌رقمی در UI موفق می‌شود؛ MFA/password نیازمند اتصال واقعی |
| E19 | [ProfilePanel](../../app/src/modules/settings/components/panels/ProfilePanel.tsx) | مشخصات، username، شبکه اجتماعی و آواتار؛ فایل آواتار با object URL محلی |
| E20 | [AuthCard](../../auth/src/components/AuthCard.tsx) و [login placeholder](../../app/src/app/(auth)/login/page.tsx) | Auth مجزا با OAuth/Magic Link شبیه‌سازی‌شده؛ login داخل app هنوز placeholder |
| E21 | [uiStore](../../app/src/stores/uiStore.ts) | ترجیحات UI پایدار محلی؛ وجود آن به معنای persistence داده‌های دامنه نیست |
| E22 | [تصمیمات فرانت](../frontend/workspace-decisions.md) | schema-driven، SDK واحد، منطق ابزار مشترک و Job Manager الزامات Active هستند |

## ۳. نیازمندی‌های عملکردی قابل تحویل

P0 = لازم برای اولین جریان واقعی و امن؛ P1 = لازم برای عرضه عمومی مطابق دامنه انتخاب‌شده؛ P2 = توسعه سازمانی/اختیاری. فازها در [برنامه اجرا](./kickstart.md) مشخص‌اند.

| ID / اولویت | منشأ | نیاز و مالک پیشنهادی | معیار پذیرش |
| :--- | :--- | :--- | :--- |
| FR01 / P0 | E18,E20 | Identity: ورود، بازیابی نشست، خروج و verified identity | refresh صفحه هویت را حفظ کند؛ خروج نشست را باطل کند؛ ایمیل تأییدنشده دعوت را قبول نکند |
| FR02 / P1 | E19,E21 | Profile: مشخصات، username یکتا، avatar و ترجیحات | تغییر پس از ورود مجدد قابل بازیابی؛ فایل غیرمجاز رد شود؛ ترجیحات هر کاربر مستقل |
| FR03 / P0 | E04,E05 + نیاز صریح | Workspace/Project: tenant شخصی/تیمی و پروژه مستقل | کاربر عضو دو workspace بتواند جابه‌جا شود؛ هیچ URL متعلق به دیگری افشا نشود |
| FR04 / P0 | نیاز صریح + E04 | دعوت شخص به پروژه و تخصیص نقش | دعوت pending دسترسی ندهد؛ پذیرش فقط توسط صاحب ایمیل؛ لغو/انقضا قابل آزمون |
| FR05 / P0 | نیاز صریح | Team به‌عنوان گروه و grant تیم به پروژه | اضافه/حذف عضو گروه روی پروژه‌های grantشده اثر کند؛ عضویت تیم به بقیه پروژه‌ها دسترسی ندهد |
| FR06 / P0 | E05,E22 | Access: نقش، رابطه و policy سروری | Viewer نتواند اجرا/نوشتن کند؛ Editor پروژه A نتواند B را بخواند یا از اعتبار B خرج کند |
| FR07 / P0 | E07,E12,E22 | Catalog: manifest نسخه‌دار و قابل‌مصرف در Chat/Canvas | یک toolVersion در هر دو سطح schema یکسان داشته باشد؛ نصب و اجرا مجوز جدا داشته باشند |
| FR08 / P0 | E03,E06 | Execution: اجرای async، cancel، retry و چند خروجی | retry درخواست یک Job بسازد؛ قطع worker دوباره‌برداشت امن؛ خروجی Asset پایدار داشته باشد |
| FR09 / P0 | E07,E11 | Assets: upload، quarantine، metadata، دانلود و lineage | فایل تأییدنشده ورودی مدل نشود؛ URL فقط پس از مجوز؛ خروجی پس از reload موجود باشد |
| FR10 / P0 | E06,E07 | Studio: thread/message و درخواست تولید | پیام پس از reload حفظ؛ references به assetId پایدار؛ خطاهای Job روی همان پیام نمایش داده شوند |
| FR11 / P0 | E08,E09 | Studio: board و revision؛ ذخیره optimistic | دو ویرایش روی یک revision به lost update منجر نشود؛ پاسخ conflict و بازیابی داشته باشد |
| FR12 / P1 | E09,E10 | Execution: snapshot گراف، اعتبارسنجی DAG و workflow run | cycle و socket ناسازگار رد؛ تغییر بوم بعد از run ورودی اجرای قبلی را عوض نکند |
| FR13 / P1 | E08 و استنباط | همکاری: presence/comments و سپس ویرایش همزمان | حذف دسترسی اتصال را متوقف کند؛ reconnect داده مجاز را بازیابی کند؛ UI team به‌تنهایی کافی نیست |
| FR14 / P0 | E16,E17 | Billing: credit account، hold/capture/release و بودجه | دو اجرای همزمان نتوانند بیش از موجودی reserve کنند؛ failure موجب دوبار شارژ/بازپرداخت نشود |
| FR15 / P1 | E17,E20 | Billing: پرداخت، پک، تخفیف و پاداش | webhook تکراری یک اثر؛ bonus پس از احراز شرایط یک‌بار؛ اعداد mock قرارداد محصول نباشند |
| FR16 / P1 | E13 | Publishing: انتشار صریح snapshot عمومی و لغو انتشار | نام/فایل/prompt خصوصی بدون انتخاب منتشر نشود؛ لینک عمومی از ACL داخلی مستقل باشد |
| FR17 / P1 | E14 | Integrations: API key و service account | secret یک‌بار نمایش، فقط hash ذخیره؛ scope و بودجه محدود؛ revoke در درخواست بعدی مؤثر |
| FR18 / P1 | E15 | Policy: retention، sharing و محدودیت Provider | team-only ایجاد لینک عمومی را منع کند؛ opt-out با provider سازگار enforce شود |
| FR19 / P0 | استنباط سازمانی | Audit/Operations: رویداد، trace و support | یک اجرا از درخواست تا ledger و Asset قابل رهگیری؛ log شامل secret یا prompt خام نباشد |
| FR20 / P2 | نیاز سازمانی + E20 | SSO/MFA policy، SCIM، export و isolation اختصاصی | tenant سازمانی سیاست ورود و چرخه خروج کارکنان قابل‌آزمون داشته باشد؛ قابلیت تجاری IdP بررسی شود |

## ۴. معنی اصطلاحات برای محصول

| اصطلاح | تعریف پیشنهادی | چه چیزی نیست |
| :--- | :--- | :--- |
| User | هویت سراسری انسانی با چند عضویت | مالک خودکار همه محتوایی که ساخته |
| Workspace | tenant، مالک داده، مرز billing و policy | صفحه یا tab رابط کاربری |
| Team | گروه اعضای یک Workspace برای grant جمعی | Workspace دوم یا صاحب کیف پول مستقل |
| Project | مرز همکاری روی محتوای یک کار مشخص | صرفاً فایل Canvas |
| Board | یک سند Canvas در پروژه | مرز پرداخت |
| Tool | قابلیت ورودی/خروجی نسخه‌دار | الزاماً کد قابل‌اجرای فرانت |
| Plugin installation | فعال‌سازی نسخه افزونه و capabilityها در tenant/project | اجازه خودکار مصرف مدل یا همه فایل‌ها |
| Job / WorkflowRun | اجرای یک ابزار / snapshot چند نود | state موقت کامپوننت |
| Credit | واحد مصرف محصول | JWT یا token مدل زبانی |

پروژه شخصی پیشنهادی در Workspace شخصی همان مدل امنیتی پروژه تیمی را دارد. دکمه solo/team در Canvas صرفاً حالت رابط است؛ نباید ACL را تغییر دهد. متن‌های کاربر title/bio/prompt بدون ترجمه اجباری ذخیره می‌شوند؛ برچسب‌های کاتالوگ می‌توانند ترجمه مدیریت‌شده داشته باشند.

## ۵. شکاف قرارداد و مسیر اتصال

| وضعیت فعلی | ریسک | اقدام لازم پیش از Live |
| :--- | :--- | :--- |
| mockهای پراکنده بیرون SDK | تغییر env اثر کامل ندارد | انتقال data access به SDK، حفظ UI و اتصال hookها به query |
| SDK فاقد tenant/project | امکان تعریف درخواست امن نیست | context صریح `{workspaceId, projectId}` و query key شامل همان context |
| `Job.resultAssetId` تک‌مقداری در برابر batchCount | خروجی‌های دو تا چهارم گم می‌شوند | `outputs[]` در قرارداد جدید؛ adapter قدیمی فقط اولین خروجی را نمایش می‌دهد |
| SDK زمان عددی؛ پیش‌نویس HTTP زمان رشته‌ای | ناسازگاری بدون تبدیل | ISO UTC در wire، تبدیل به epoch ms در facade قدیمی |
| SDK AssetType شامل text، UI شامل material | unionها برابر نیستند | enum نسخه‌دار شامل هر دو؛ capability واقعی فرمت‌ها جدا از نمایش |
| `ToolManifest`، `ToolItem`، AgentCommand و Canvas toolType جدا | افزودن ابزار چند نقطه را تغییر می‌دهد | یک manifest canonical و projectionهای نمایشی |
| status فاقد cancelled؛ node status متفاوت | لغو گم یا success کاذب می‌شود | lifecycle سرور کامل، نگاشت صریح در SDK/Job Manager |
| dateGroup/favorite در داده نمونه | خطر اشتراک ترجیح شخصی بین کاربران | favorite per-user؛ گروه زمان مشتق از timezone |
| `[filename]` در URL جزئیات | filename مجوز یا هویت پایدار نیست | resolve شناسه سروری و scope؛ filename فقط نمایش |
| thread نامعتبر fallback به نمونه | نمایش داده اشتباه | 404 برای thread نامعتبر/غیرمجاز، هیچ fallback دامنه‌ای |
| هزینه و پلن داخل mock | قیمت غیرمعتبر | quote/ledger از Billing؛ نمایش estimate با زمان اعتبار |

**گزارش انحراف از مبنای Active:** [DOC-FE-002](../frontend/workspace-decisions.md) می‌گوید «هیچ کدی ... مجاز به ایمپورت مستقیم ... mock نیست»؛ E06/E08/E11/E12 خلاف این الزام‌اند. این گزارش مبنا را حفظ می‌کند و اصلاح پیاده‌سازی را در برنامه قرار می‌دهد؛ قاعده جدید یا مجوز استثنا ایجاد نمی‌شود. ادعای «اتصال بدون تغییر صفحات» در وضعیت فعلی محقق نشده است. همچنین عبارت pre-initialization در [AGENTS فرانت](../../app/AGENTS.md) وصف وضعیت امروز نیست؛ فایل‌های زنده E01–E21 وجود دارند.

## ۶. الزامات غیرعملکردی و داده‌های لازم برای ظرفیت‌سنجی

ایزولاسیون tenant، idempotency مالی، بازیابی Job و حذف دسترسی الزامات P0 هستند. عدد ظرفیت واقعی از کد به‌دست نمی‌آید. قبل از SLA تجاری باید تعداد کاربران فعال/همزمان، workspaceها، اجرای همزمان هر provider، اندازه فایل، مدت ویدیو، گراف صدک ۹۵، بودجه cloud و محل استقرار مشخص شوند. اهداف آزمایش اولیه در [معماری](./architecture.md) قرار دارند و تضمین عملیاتی نیستند.

ریسک‌های نخستین: دسترسی افقی به Asset/Job، مصرف اعتبار با race، نصب کد نامطمئن، تکرار اجرای Provider بعد از timeout، از دست‌رفتن ویرایش بوم و افشای prompt از طریق feed. پاسخ طراحی هر کدام در [دسترسی](./auth-and-workspace.md)، [افزونه](./plugin-contract.md) و [معماری](./architecture.md) آمده است.

## ۷. بسته خروجی و تصمیم‌های باقی‌مانده

این سند فقط مالک **شاهد و نیاز** است. [ارزیابی نونز](./dotdive-reuse-assessment.md) مالک مقایسه، [معماری](./architecture.md) مالک مرز سرویس، [دسترسی](./auth-and-workspace.md) مالک ACL، [مدل داده](./data-model.md) مالک persistence، [قراردادها](./api-contracts.md) مالک wire و [دفتر تصمیم‌ها](./decision-register.md) مالک ابهام‌های باز است. هیچ‌کدام در این مرحله مصوبه تولید نیستند.
