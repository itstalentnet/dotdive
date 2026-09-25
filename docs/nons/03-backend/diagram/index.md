---
layout: doc
title: دیاگرام‌ها
description: نمای کلی دیاگرام‌ها، نحوه ارتباط کانتینرها و ارتباط داخلی سرویس‌ها
version: 0.1.0
status: PRIVATE
author: xoxxel
owner: xoxxel
created_at: 2026-06-06
updated_at: 2026-06-09
tags:
  - Backend
  - Diagram
  - Architecture
reviewers:
  - Backend Team
  - Devops
  - Product Team
---

# دیاگرام‌ها
**Diagrams**
نمای کلی از دیاگرام‌ها، نحوه ارتباط کانتینرها و ارتباط داخلی سرویس‌ها

---
## [1.جریان کلی](/docs/team/platform/diagrams/container_diagram)
**Architecture Overview**
نمای کلی معماری سرویس‌ها و کانتینرها، ارتباط بین لایه‌های Infrastructure، Identity، Core Business و Operational از طریق API Gateway و Event Bus

---

## [2.جریان احراز هویت و مجوزها](./authentication_authorization_flow)
**Authentication & Authorization Flow**
نقشه کامل سرویس احراز هویت (Auth Service)، تعریف قوانیم در IAM، و بررسی دسترسی low-latency

---
## [3.چرخه عمر سفارش](./order_lifecycle)
**Order Lifecycle**
وضعیت‌های سفارش از ایجاد تا تکمیل یا داوری، تعامل با  سرویس پرداخت و سیستم ضمانت پرداخت

---
## [4.فرآیند داوری](./dispute_resolution_flow)
**Dispute Resolution Flow**
ثبت اختلاف، تخصیص داور، جمع‌آوری شواهد از سرویس چت، صدور حکم و اجرای آن از طریق پرداخت و وضعیت سفارش 

---
## [5.جریان رویدادها](/docs/team/platform/diagrams/event_driven_architecture)
**Event Driven Architecture**
معماری بر پایه رویداد ها با NATS JetStream، ارتباط همگام سازی بین سرویس‌ها و نقش سرویس جریان رویدادها در انتشار/مصرف رویدادها

---
## [6.فرآیند نظارت و اعمال محدودیت](./moderation_restriction_flow)
**Moderation & Restriction Flow**
تشخیص تخلف توسط  سیستم داوری از طریق خواندن رویداد های گفتگو ، اعمال محدودیت از طریق IAM و تأثیر آن بر دسترسی کاربر

---
## [7.انتشار محصول تا نمایش در جستجو](./product_publishing_flow)
**Product Publishing Flow**
انتشار محصول در بازار ، ایجاد نسخه‌بندی، بروزرسانی موجودی، رویدادها و نهایتاً انتشار در Elasticsearch توسط Search Service
