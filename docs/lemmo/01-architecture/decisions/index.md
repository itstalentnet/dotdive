---
title: "تصمیمات معماری (ADR)"
description: "سوابق رسمی تصمیم‌گیری‌های معماری مهندسی در پلتفرم لیمو"
order: 1
icon: "file-check"
---

# تصمیمات رسمی معماری (ADR) — پروژه Lemmo

این بخش شامل سوابق تصمیمات کلیدی معماری سیستم است که چرایی و چگونگی انتخاب راهکارهای فنی را مستند می‌کند.

## فهرست تصمیمات ثبت‌شده

- **[ADR-001: معماری کد فاز ۳](./ADR-001-phase3-code-architecture.md)** — ساختار پکیج‌ها، ماژول‌ها و نحوه تفکیک لایه‌های کد
- **[ADR-002: استک تست و فرم‌ها](./ADR-002-form-test-stack.md)** — انتخاب کتابخانه‌های مدیریت فرم و استراتژی آزمون
- **[ADR-003: ممیزی منبع یگانه حقیقت](./ADR-003-single-source-of-truth-audit.md)** — اعتبارسنجی انطباق با قواعد SSOT
- **[ADR-004: مایکروسرویس‌های بک‌اند](./adr-004-backend-microservices.md)** — توپولوژی سرویس‌های بک‌اند و نحوه ارتباطات
- **[ADR-005: استراتژی استایل‌دهی Tailwind CSS v4 در app](./ADR-005-tailwind-v4-styling-strategy.md)** — تثبیت Tailwind v4 و لغو الزام CSS Modules
- **[ADR-006: مرزبندی احراز هویت و تعویق سیستم کامپوننت](./ADR-006-auth-gateway-and-deferred-components.md)** — درگاه انحصاری auth و تعویق یکپارچه‌سازی کامپوننت مشترک
- **[ADR-007: استانداردهای قراردادهای بک‌اند و ابزار اسکافولد](./ADR-007-backend-contracts-and-tooling-standards.md)** — تصویب کاتالوگ خطاها، نودهای پروتوباف و CLI اسکافولد
- **[ADR-008: یکپارچه‌سازی ابزارهای داخلی، نسخه‌بندی SemVer و استاندارد چنج‌لاگ](./ADR-008-internal-tooling-and-versioning-governance.md)** — تجمیع ابزارها در tools/، قفل نهایی tools/lemmo-cli، تگ‌های پیشونددار و Keep a Changelog
- **[ADR-009: الگوی استقرار مستقل هر سرویس و معماری دفترکل مالی](./ADR-009-service-owned-deployment-and-financial-ledger.md)** — استقرار سرویس‌محور با Compose include، نام‌گذاری نقش‌محور (financial-ledger) و تجرید لجر
- **[ADR-010: معماری سرویس فضاهای کاری، مدل چندمستأجری و گیت ۵ فاز ۱](./ADR-010-workspace-service-and-phase1-completion.md)** — سرویس workspace-service، ستون on_wallet_empty، وضعیت provisioning والت، آداپتور IAM و آزمون ۹ مرحله‌ای E2E
- **[ADR-011: معماری قابلیت‌های کسب‌وکار و نقشه فازهای ۲ و ۳](./ADR-011-business-capabilities-and-phase2-roadmap.md)** — موتور دوگانه پرومو کد، نوتیفیکیشن با Novu، تفکیک افیلیت از رفرال، فید اجتماعی یکپارچه (community-service) و مدل کاربر و آنبوردینگ
- **[پروپوزال استخراج دیزاین سیستم](./proposal-design-system-extraction.md)** — طرح تفکیک پکیج دیزاین سیستم به عنوان پکیج مستقل
