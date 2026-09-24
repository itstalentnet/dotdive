| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Workspace Feature Modules & Domain Logic Overview |
| **Title (FA)** | نمای کلی ماژول‌های دامنه و فیچرهای برنامه Workspace |
| **ID** | DOC-MOD-000 |
| **Category** | `modules` |
| **Status** | `Active` |
| **Owner** | Frontend & Module Engineers |
| **Last Updated** | 2026-09-16 |
| **Summary (EN)** | Overview of domain modules in the Lemmo workspace including tool-engine, chat, canvas, gallery, assets, and billing. |
| **Summary (FA)** | معرفی ماژول‌های دامنه مستقل در پوشه src/modules لیمو شامل موتور ابزار، چت، کانواس، دارایی‌ها و سیستم پرداخت. |
| **Tags** | `modules`, `domain-logic`, `tool-engine`, `canvas`, `chat`, `workspace` |

---

# ماژول‌های دامنه برنامه کاربردی (Workspace Modules)

مطابق با سند معماری مرجع فرانت‌اند ([DOC-FE-001](../frontend/workspace-architecture.md))، کلیه منطق‌های دامنه (Domain Logic) پروژه به صورت کاملاً ماژولار و مستقل از مسیرها (Routes) در پوشه `src/modules/` قرار دارند.

## ساختار ماژول‌ها

| ماژول | مسیر در کد | نقش و وظیفه |
| :--- | :--- | :--- |
| ⚙️ **موتور ابزارها (Tool Engine)** | `src/modules/tool-engine/` | **هسته مرکزی و منبع یگانه حقیقت ابزارها.** شامل رجیستری مانیفست‌ها، رندرر خودکار فرم‌ها از اسکیما (`schema-renderer`) و مدیریت سراسری وضعیت پردازش‌ها (`job-manager`). |
| 💬 **چت و دستورات (Chat)** | `src/modules/chat/` | سطح نمایش چت شامل پنجره گفتگو، حباب‌های پیام، پیشنهاد و تکمیل دستورات خطی (`CommandAutocomplete`) و نگاشت دستورات (`/command`) به موتور ابزار. |
| 🎨 **بوم و نودها (Canvas)** | `src/modules/canvas/` | سطح نمایش کانواس تعاملی شامل بورد گراف، منوی کشف نودها (`NodeDiscoveryMenu`) و قوانین اعتبارسنجی اتصال سوکت‌های تایپ‌شده (`typedConnection`). |
| 🖼️ **گالری و نمونه‌ها (Gallery)** | `src/modules/gallery/` | کامپوننت‌ها و هوک‌های کاوش در نمونه‌ها و الگوهای آماده مبتنی بر TanStack Query. |
| 📁 **مدیریت دارایی‌ها (Assets)** | `src/modules/assets/` | شبکه نمایش، مدیریت و دانلود تصاویر و خروجی‌های تولیدشده کاربر که با وضعیت Job Manager همگام است. |
| 💳 **اعتبارات و پلن (Billing)** | `src/modules/billing/` | نمایش کارت‌های پلن و هوک‌های موجودی توکن که مستقیماً با رهگیر خطای توکن در لایه SDK هماهنگ می‌شود. |

## قوانین مرزهای ماژول‌ها (Boundary Rules)

1. **ارتباط یک‌طرفه:** ماژول‌ها منطق اختصاصی خود را دارند؛ اما برای اجرای هرگونه ابزار هوش مصنوعی، **باید منحصراً از طریق `tool-engine`** اقدام نمایند.
2. **عدم ارتباط مستقیم بین سطوح:** سطح نمایش چت (`chat`) و سطح نمایش کانواس (`canvas`) هیچ‌گاه مستقیماً یکدیگر را ایمپورت نمی‌کنند؛ بلکه هر دو صرفاً مصرف‌کننده `tool-engine` هستند.
3. **ارتباط با سرور:** هیچ ماژولی به طور مستقیم درخواست شبکه ارسال نمی‌کند و کلیه تعاملات با بک‌اند از طریق لایه متمرکز `@/sdk` انجام می‌گیرد.

---

## اسناد مرجع
- [معماری فرانت‌اند Workspace — ساختار پوشه‌ها و قوانین وابستگی (DOC-FE-001)](../frontend/workspace-architecture.md)
- [تصمیمات کلیدی معماری: سیستم پلاگین ابزار، لایه SDK و Job Manager (DOC-FE-002)](../frontend/workspace-decisions.md)
