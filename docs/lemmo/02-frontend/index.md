---
title: "معماری فرانت‌اند"
description: "معماری Workspace در Next.js، سیستم پلاگین، SDK و مدیریت استیت"
order: 2
icon: "layout"
---

| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Frontend Architecture & Engineering Guidelines |
| **Title (FA)** | راهنمای مهندسی و معماری فرانت‌اند |
| **ID** | DOC-FE-000 |
| **Category** | `frontend` |
| **Status** | `Active` |
| **Owner** | Frontend Team |
| **Last Updated** | 2026-09-16 |
| **Summary (EN)** | Central index for frontend architecture, state management, routing, and coding conventions. |
| **Summary (FA)** | نمایه مرکزی معماری فرانت‌اند، مدیریت استیت، روتینگ و استانداردهای کدنویسی کلاینت. |
| **Tags** | `frontend`, `react`, `typescript`, `vite`, `spa` |

---

# مستندات فرانت‌اند (Frontend Engineering)

این بخش به عنوان منبع موثق مستندات فنی تیم فرانت‌اند عمل می‌کند. کلیه تصمیمات پیرامون رابط کاربری، روتینگ، تعامل با APIها و الگوهای مدیریت استیت در این پوشه ثبت و نگهداری می‌شوند.

## ساختار و اسناد این بخش
- [معماری فرانت‌اند Workspace — ساختار پوشه‌ها و قوانین وابستگی (DOC-FE-001)](./workspace-architecture.md): راهنمای قفل‌شده ساختار دایرکتوری Next.js، قوانین وابستگی یک‌طرفه و تاب‌آوری ماژولار.
- [تصمیمات کلیدی معماری Workspace — سیستم پلاگین، SDK و Job Manager (DOC-FE-002)](./workspace-decisions.md): تشریح سیستم ابزار بر پایه Schema-driven، درگاه متمرکز `@/sdk` و مدیریت بلادرنگ پردازش‌های هوش مصنوعی.
- [پروژه‌های جانبی، منابع مشترک و وابستگی‌های Workspace (DOC-FE-003)](./workspace-dependencies.md): راهنمای فونت‌ها، توکن‌ها، مخزن مستندات و پکیج آیکون Synthline.
- **مدیریت استیت:** استور متمرکز Zustand برای وضعیت‌های کلاینت/Job و TanStack Query برای استیت و کش سرور.
- **ارتباط با سرور و کلاینت API:** الگوی SDK Gateway با کدهای Type-safe اتوماتیک و رهگیری خطاهای مالی و پلن.
- **قوانین باندری:** مرزهای ایمپورت لایه‌ها (`app → modules → tool-engine → sdk → backend`).

## اسناد کلیدی مرتبط
- [قوانین ایجنت‌ها و الزامات کدنویسی (DOC-ARCH-001)](../01-architecture/AGENTS.md)
- [نمای کلی ماژول‌های دامنه و فیچرها (DOC-MOD-000)](../06-modules/index.md)
- [راهنمای استایل و دیزاین سیستم (DOC-DS-001)](../04-design-system/STYLEGUIDE.md)
