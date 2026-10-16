| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Platform Operational Runbooks & Triage Registry |
| **Title (FA)** | نمایه مرکزی ران‌بوک‌های عملیاتی و راهنماهای تریاژ پلتفرم |
| **ID** | DOC-OPS-RB-000 |
| **Category** | `devops` |
| **Status** | `Active` |
| **Owner** | DevOps / SRE & Support Team |
| **Last Updated** | 2026-10-12 |
| **Summary (EN)** | Central index of actionable operational runbooks, step-by-step diagnostic playbooks, and failure recovery procedures across all platform domains. |
| **Summary (FA)** | نمایه و فهرست رسمی ران‌بوک‌های عملیاتی، راهنماهای واکنش سریع و رویه‌های بازیابی از خطا در تمام حوزه‌ها و میکروسرویس‌های پلتفرم لِمو. |
| **Tags** | `devops`, `runbooks`, `triage`, `playbooks`, `sre`, `operations` |

---

# نمایه ران‌بوک‌های عملیاتی و تریاژ پلتفرم (Runbook Registry - DOC-OPS-RB-000)

> **هدف این شاخه:** فراهم آوردن دسترسی متمرکز و یکپارچه به کلیه ران‌بوک‌های عملیاتی (Actionable Runbooks) برای مهندسان پشتیبانی، DevOps و توسعه‌دهندگان آن‌کال (On-Call Engineers) جهت تریاژ، ریشه‌یابی و رفع اختلالات سیستم بدون سردرگمی.

---

## ۱. فهرست ران‌بوک‌های فعال پلتفرم

| شناسه ران‌بوک | حوزه / دامنه | عنوان و خلاصه کاربرد | وضعیت | مستند تفصیلی |
|---|---|---|---|---|
| **RB-AGENT-001** | `Agent / Tools / SSE` | عیب‌یابی چرخه اجرای ابزارهای هوش مصنوعی، خطاهای رزرو سهمیه، و گیر کردن لودینگ در استودیو | `Active` | [ران‌بوک عملیاتی عیب‌یابی ایجنت (DOC-OPS-RB-001)](./RB-AGENT-001-execution-and-tool-lifecycle.md) |
| **RB-STUDIO-002** | `Studio / Context / Quota` | تریاژ بارگذاری کانتکست استودیو، بازیابی اتصال سرویس‌ها، و تطبیق کیف‌پول با ورک‌اسپیس | `Active` | [ران‌بوک عملیاتی بارگذاری کانتکست و کیف‌پول (DOC-OPS-RB-002)](./RB-STUDIO-002-context-and-wallet-resolution.md) |

---

## ۲. چارچوب استاندارد تدوین ران‌بوک جدید (Standard Runbook Template)

کلیه ران‌بوک‌های جدید ایجادشده در این پوشه باید با پیشوند `RB-<DOMAIN>-<NUM>` نام‌گذاری شده و ساختار زیر را رعایت کنند:

1. **درخت تصمیم‌گیری (Decision Tree):** دیاگرام بصری شفاف برای دنبال کردن علائم از ظاهر تا سرور.
2. **ماتریس کدهای خطا (Diagnostic Error Matrix):** انطباق دقیق با استانداردهای RFC-7807 و AIP-193 همراه با دستورات تک‌خطی CLI.
3. **پروب‌های سلامت سرویس (CLI Health Probes):** دستورات خط فرمان آماده برای ارزیابی سریع زیرساخت (داکر، پستگرس، ردیس، ربیت‌ام‌کیو، مین‌آیو).
4. **پلی‌بوک‌های بازیابی (Recovery Playbooks):** دستورالعمل‌های گام‌به‌گام و تست‌شده برای رفع هر نوع اختلال بدون آسیب به داده‌ها.
5. **معیارهای تایید رفع مشکل (Verification Checklist):** چک‌لیست اعتبارسنجی خروجی پیش از اعلام وضعیت سبز.

---

## ۳. اسناد مرتبط
- [نمایه گزارش‌های کالبدشکافی رخدادها (DOC-OPS-INC-000)](../incidents/index.md)
- [راهنمای جامع زیرساخت و دوآپس (DOC-OPS-000)](../index.md)
- [مشخصات فنی ماشین وضعیت چت ایجنت (DOC-FE-004)](../../02-frontend/agent-chat-state-and-sse-lifecycle.md)
- [مشخصات پایپ‌لاین مدل و رسانه (DOC-BE-006)](../../03-backend/media-and-model-pipeline.md)
