| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Canvas Dual-Mode Architecture & Dynamic Node Port Specifications |
| **Title (FA)** | معماری دوحالته بوم (طراحی و تولید) و مشخصات پورت‌های پویای نودها |
| **ID** | DOC-MOD-001 |
| **Category** | `modules` |
| **Status** | `Approved` |
| **Owner** | Core Architecture & Canvas Module Team |
| **Last Updated** | 2026-09-28 |
| **Summary (EN)** | Architectural specification for Canvas Dual-Mode (Free Design Mode vs Paid Workflow Mode), dynamic and extensible node port schemas, and unhardcoded LoRA/Prompt variable socket configurations. |
| **Summary (FA)** | مشخصات معماری دوحالته کانواس (حالت رایگان طراحی در برابر حالت پردازشی ورک‌فلو) و ساختار انعطاف‌پذیر و داینامیک پورت‌ها و متغیرهای نودها بدون هاردکد کردن. |
| **Tags** | `canvas`, `modules`, `design-mode`, `workflow-mode`, `dynamic-ports`, `nodes`, `lora`, `prompt` |

---

# معماری دوحالته بوم کانواس و مشخصات پورت‌های پویای نودها

## ۱. زمینه و نیازمندی‌های کلیدی (Context & Requirements)

محیط کاری بوم لمو (**Lemmo Canvas**) باید پاسخگوی دو نیاز کاملاً متفاوت اما مکمل کاربران باشد:
1. **طراحی دستی و برداری (Visual Art & Vector Design):** نیاز به ترسیم اشکال هندسی، تایپوگرافی، چیدمان لایه‌ای و تنظیمات بصری که ماهیتی تعاملی و سبک دارد.
2. **پایپ‌لاین هوش مصنوعی مبتنی بر نودها (Node-based Generative Workflow):** اتصال نودهای پردازشی، تولید متن به تصویر، اعمال سبک‌های LoRA، تصاویر رفرنس و اجرای محاسبات سنگین بر پایه کارت‌های گرافیک.

برای دستیابی به تجربه کاربری یکپارچه و بهینه‌سازی هزینه‌های زیرساخت، بوم کانواس به صورت **دوحالته (Dual-Mode)** معماری می‌شود و سیستم اتصالات نودها از رویکرد ایستا و هاردکدشده به رویکرد **پورت‌های کامپوزیت و پویا (Dynamic & Extensible Ports)** ارتقا می‌یابد.

---

## ۲. معماری دوحالته بوم کانواس (Canvas Dual-Mode Architecture)

محیط بوم دارای دو حالت عملیاتی مشخص است که در مدل داده پروژه و رابط کاربری تفکیک می‌شوند:

```text
               ┌────────────────────────────────────────────────────────┐
               │                     Lemmo Canvas                       │
               └───────────────────────────┬────────────────────────────┘
                                           │
                 ┌─────────────────────────┴─────────────────────────┐
                 ▼                                                   ▼
   ┌───────────────────────────┐                       ┌───────────────────────────┐
   │        Design Mode        │                       │       Workflow Mode       │
   │    (حالت طراحی دستی)      │                       │     (حالت تولید نودها)    │
   ├───────────────────────────┤                       ├───────────────────────────┤
   │ • اشکال برداری (Shapes)   │                       │ • گراف جهت‌دار (DAG)       │
   │ • متن و تایپوگرافی دستی  │                       │ • نودهای هوش مصنوعی       │
   │ • فرم‌ها و لایه‌بندی UI   │                       │ • تنظیمات LoRA و پرامپت   │
   │ • کاملاً کلاینت‌ساید      │                       │ • پردازش سروری سنگین (GPU)│
   │ • ۱۰۰٪ رایگان (Free Tier) │                       │ • نیازمند مصرف سهمیه/توکن │
   └───────────────────────────┘                       └───────────────────────────┘
```

### ۲.۱. حالت طراحی دستی (`Design Mode`)
- **شرح کارکرد:** این حالت محیطی شبیه به ابزارهای طراحی برداری (مانند فیگما یا بوم‌های نقاشی) را در اختیار کاربر می‌گذارد. کاربر می‌تواند اشکال پایه (مستطیل، دایره، چندضلعی)، متن‌های برداری، فریم‌ها، کادربندی‌ها و خطوط راهنما را ایجاد و ترکیب کند.
- **مدل تجاری و هزینه:** **کاملاً رایگان (Free Tier / Zero Token Consumption).** کلیه عملیات این حالت به صورت کلاینت‌ساید در مرورگر رندر شده و نیازی به رزرو منابع کارت گرافیک یا کسر کردیت از کاربر ندارد.
- **ذخیره‌سازی داده:** لایه‌های برداری و چیدمان دستی تحت فیلد `design_layers` در ساختار JSON گراف پروژه در `project-service` ذخیره می‌شوند.

### ۲.۲. حالت تولید و ورک‌فلو (`Workflow Mode` / `Generation Mode`)
- **شرح کارکرد:** حالت گراف نودها که در آن کاربر نودهای مختلف ورودی، پرامپت، مدل‌ها، فیلترها و خروجی را با سیم‌های اتصال (Edges) به یکدیگر وصل می‌کند تا یک پایپ‌لاین تولید تصویر یا محتوا را تشکیل دهد.
- **مدل تجاری و هزینه:** **پردازشی و مصرف‌کننده سهمیه (Quota-Enforced).** این حالت نیازمند اعتبارسنجی پیش از اجرا توسط `quota-service`، ارکستراسیون در `orchestrator-service` و ارسال کارهای سنگین به صف `job-service` جهت اجرا روی گره‌های GPU است.

---

## ۳. سیستم پورت‌های منعطف و پویای نودها (Dynamic & Extensible Ports)

### ۳.۱. اصل عدم هاردکد کردن پورت‌ها (No Hardcoded Rigidity)
در نسخه‌های ابتدایی، اتصال نودها غالباً با پورت‌های از پیش تعریف‌شده و سفت و سخت محدود می‌شود. این رویکرد پاسخگوی نیازهای واقعی پایپ‌لاین‌های مدرن AI نیست؛ زیرا یک نود پرامپت ممکن است بسته به متن خود نیازمند چندین متغیر داینامیک باشد، یا یک نود تصویر نیازمند چند مدل LoRA همزمان یا چندین تصویر رفرنس (مانند ControlNet و IP-Adapter) گردد.

**قاعده حاکم:**  
هیچ پورتی در سیستم نباید به گونه‌ای هاردکد شود که افزودن ورودی‌های تکمیلی نیازمند تغییر در کدهای هسته باشد. نودها باید بتوانند **پورت‌های پویا (Dynamic Ports)** را بر اساس کانفیگ یا نیاز کاربر در زمان ران‌تایم بپذیرند.

---

### ۳.۲. الگوهای پورت‌های پویا در نودهای کلیدی

#### ۱. نود پرامپت متنی (Prompt / Template Node)
- **ورودی‌های پویا:** کاربر در متن پرامپت می‌تواند از سینتکس قالب‌بندی استفاده کند (مثلاً `A cinematic portrait of {character} in {setting}, {lighting} lighting`).
- نود به صورت خودکار یا با دکمه کاربر، به ازای هر متغیر تمپلیت یک پورت ورودی متنی پویا باز می‌کند:
  - پورت ورودی ۱: `var:character` (نوع: `PORT_DATA_TYPE_TEXT`)
  - پورت ورودی ۲: `var:setting` (نوع: `PORT_DATA_TYPE_TEXT`)
  - پورت ورودی ۳: `var:lighting` (نوع: `PORT_DATA_TYPE_TEXT`)
- این پورت‌ها می‌توانند از خروجی نودهای دیگر (مثلاً نودهای تولید متن LLM یا مقادیر استاتیک) پر شوند.
- **خروجی:** متن نهایی کامل‌شده (`PORT_DATA_TYPE_TEXT`).

#### ۲. نود تولید تصویر (Image Generation / Synth Node)
این نود باید مجموعه‌ای غنی از پورت‌های ورودی ماژولار را به صورت اختیاری و افزایشی پشتیبانی کند:
- **پورت‌های پایه:**
  - `prompt` (الزامی): متن هدایت‌کننده تصویر (`PORT_DATA_TYPE_TEXT`).
  - `negative_prompt` (اختیاری): متن موارد نامطلوب برای حذف از خروجی.
- **پورت‌های افزایشی و ماژولار (Dynamic Sockets):**
  - **پورت‌های LoRA (`lora_input`):** فایل‌های استایل و وزن‌های فاین‌تیون‌شده (LoRA) جهت اعمال سبک و هویت خاص به تصویر. کاربر می‌تواند چندین پورت LoRA اضافه کند (`lora_1`, `lora_2`).
  - **پورت‌های رفرنس (`reference_image`):** تصاویر مرجع برای هدایت ژست، عمق یا ساختار تصویر (ControlNet / IP-Adapter).
  - **پورت ماسک (`mask`):** ماسک برداری یا رستری جهت عملیات Inpainting موضعی روی بخش خاصی از بوم.
- **خروجی نود:** تصویر تولیدشده نهایی (`PORT_DATA_TYPE_IMAGE`) و متادیتای تولید (Seed، زمان، مصرف).

---

## ۴. بازتاب معماری در قراردادها و مدل‌های داده (`contracts/`)

برای پشتیبانی از پورت‌های پویا و دو مود بوم، قراردادهای Protobuf و اسکیماهای JSON به شرح زیر استانداردسازی می‌شوند:

### ۴.۱. افزودن حالت‌های بوم (`CanvasMode`)
در قرارداد نودها (`contracts/lemmo/v1/node.proto`)، وضعیت اجرایی بوم تصریح می‌شود:

```protobuf
enum CanvasMode {
  CANVAS_MODE_UNSPECIFIED = 0;
  // Free vector and shape drawing mode (zero GPU / zero credit cost).
  CANVAS_MODE_DESIGN = 1;
  // Node-based AI graph workflow execution mode (quota-managed).
  CANVAS_MODE_WORKFLOW = 2;
}
```

### ۴.۲. بازتعریف تایپ‌های داده پورت (`PortDataType`)
تکمیل تایپ‌های مورد نیاز نودهای پیشرفته:
```protobuf
enum PortDataType {
  PORT_DATA_TYPE_UNSPECIFIED = 0;
  PORT_DATA_TYPE_IMAGE = 1;
  PORT_DATA_TYPE_MASK = 2;
  PORT_DATA_TYPE_TEXT = 3;
  PORT_DATA_TYPE_NUMBER = 4;
  PORT_DATA_TYPE_BOOLEAN = 5;
  PORT_DATA_TYPE_LATENT = 6;
  PORT_DATA_TYPE_MODEL = 7;     // Base checkpoints (SDXL, Flux, etc.)
  PORT_DATA_TYPE_LORA = 8;      // LoRA style and character weights
  PORT_DATA_TYPE_CONTROL = 9;   // ControlNet and reference conditioning
  PORT_DATA_TYPE_JSON = 10;
}
```

### ۴.۳. پشتیبانی از پورت‌های نمونه بوم در `CanvasNode`
هر نود روی بوم می‌تواند علاوه بر پورت‌های ثابت اعلام‌شده توسط `NodeTypeDefinition`، فهرستی از پورت‌های داینامیک را در خود نگه دارد:

```protobuf
message CanvasNode {
  string id = 1;
  string node_type_id = 2;
  string title = 3;
  CanvasPosition position = 4;
  map<string, string> config = 5;
  map<string, string> static_inputs = 6;

  // Dynamic user-defined or template ports added to this specific node instance.
  repeated PortDefinition dynamic_ports = 7;
}
```

---

## ۵. تاثیر بر سرویس‌های بک‌اند

| سرویس | نقش در معماری جدید |
|---|---|
| **`project-service`** | ذخیره‌سازی داده‌های هر دو حالت (اشکال Design Mode و گراف نودهای Workflow Mode همراه با `dynamic_ports`). |
| **`node-registry-service`** | رجیستری انواع نودها، اعلام قوانین پذیرش پورت‌های پویا (`allows_dynamic_inputs`) و اعتبارسنجی اتصالات گراف. |
| **`orchestrator-service`** | حل متغیرهای داینامیک پرامپت‌ها و لود وزن‌های LoRA قبل از ساخت پاکت جاب برای ورکرها. |
| **`quota-service`** | اعمال هزینه صفر برای عملیات Design Mode و محاسبه دقیق کسر اعتبار صرفاً در زمان اجرای گراف Workflow Mode. |
