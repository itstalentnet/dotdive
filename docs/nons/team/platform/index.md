---
layout: doc
title: پلتفرم
description: معماری سیستم، استانداردهای مهندسی، دیاگرام‌ها و قراردادهای سطح پلتفرم
version: 1.0.0
status: PRIVATE
author: xoxxel
owner: xoxxel
created_at: 2026-06-09
updated_at: 2026-06-09
tags:
  - Platform
  - Architecture
  - Standards
  - Diagrams
reviewers:
  - Backend Team
  - Devops
  - Product Team
---

# پلتفرم

**Platform Documentation**

این بخش شامل معماری کلان سیستم، استانداردهای مهندسی، دیاگرام‌های معماری و قراردادهای سطح پلتفرم است. مستندات اینجا متعلق به یک تیم خاص نیست — مرجع رسمی تصمیمات و قواعد فراتیمی هستند.

---

## معماری سیستم

| سند | توضیح |
| --- | --- |
| [معماری پروژه](./Architecture) | معماری Monorepo، لایه‌ها، سرویس‌ها و اصول معماری |

## استانداردهای مهندسی

### عمومی

| سند | توضیح |
| --- | --- |
| [استایل گاید](./standards/index) | نمای کلی تمام استانداردها — راهنمای یکپارچه |
| [خط مشی زبان](./standards/language-policy) | زبان رسمی کد، موارد مجاز فارسی، ممنوعیت‌ها |
| [قراردادهای نام‌گذاری](./standards/naming-conventions) | فایل‌ها، دیتابیس، env vars، Docker، NATS، API |
| [ساختار مخزن](./standards/repository-structure) | ساختار استاندارد سرویس، monorepo |
| [نسخه‌بندی](./standards/versioning-policy) | Semantic Versioning، پیش‌انتشار، تگ‌گذاری |
| [امنیت](./standards/security-policy) | رازها، parameterized queries، JWT، cookies |

### مستندات و ارتباطات

| سند | توضیح |
| --- | --- |
| [مستندات سرویس](./standards/docs-policy) | فایل‌های اجباری docs/، قوانین به‌روزرسانی |
| [الگوی README](./standards/readme-template) | ساختار اجباری README.md |
| [تغییرات (CHANGELOG)](./standards/changelog-policy) | ساختار Keep a Changelog |

### قراردادهای API و رویداد

| سند | توضیح |
| --- | --- |
| [استاندارد رویداد](./standards/event-standard) | استاندارد رسمی طراحی و انتشار رویدادها در NATS |
| [قرارداد رویداد](./standards/event-contract) | پوسته استاندارد NATS، فیلدها، versioning payload |

### توسعه و کیفیت

| سند | توضیح |
| --- | --- |
| [تست](./standards/testing-policy) | واحد و یکپارچه، CI، پوشش، قوانین |
| [استاندارد لاگ‌نویسی](./standards/logging-standard) | JSON ساختاریافته، سطوح، قوانین PII |
| [تعریف انجام شده (DoD)](./standards/definition-of-done) | چک‌لیست کامل پذیرش Feature/PR |

### چرخه عمر سرویس

| سند | توضیح |
| --- | --- |
| [بلوپرینت](./standards/blueprint-policy) | الزامات پیش از توسعه، تأیید تیمی |
| [دمو (پیش‌نمایش)](./standards/demo-policy) | HTML/CSS ساده، قوانین فنی |
| [گیت](./standards/git-policy) | فرمت کامیت، برنچ، workflow، PR |

## دیاگرام‌های معماری

| سند | توضیح |
| --- | --- |
| [جریان کلی](./diagrams/container_diagram) | معماری سطح بالا — ارتباط کانتینرها و لایه‌ها |
| [جریان رویدادها](./diagrams/event_driven_architecture) | معماری رویدادمحور با NATS JetStream |

## سرویس‌های جدید

| سند | توضیح |
| --- | --- |
| [درگاه ورودی (gateway)](./gateway/index) | درگاه API Gateway واحد، مسیریابی و امنیت لبه پلتفرم |
| [سرویس ارز (currency-service)](../backend/services/currency-service) | تنها مرجع نرخ ارز و تبدیل مبلغ در پلتفرم |
| [سرویس تسویه (settlement-service)](../backend/services/settlement-service) | کمیسیون، تسویه فروشنده و مدیریت refund |

---

## مخاطبان این مستندات

- معماران سیستم (System Architects)
- توسعه‌دهندگان تمام تیم‌ها
- مهندسان پلتفرم (Platform Engineers)
- رهبران فنی (Technical Leads)
