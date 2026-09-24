---
layout: doc
title: سیستم طراحی نانس (Design System)
description: نقطه ورود مستندات سیستم طراحی — توکن‌های گرافیکی، حالت‌های تعاملی و تایپوگرافی
version: 1.0.0
status: PRIVATE
author: xoxxel
owner: xoxxel
created_at: 2026-07-11
updated_at: 2026-07-11
tags:
  - Frontend
  - Design System
  - Tokens
  - UI Kit
reviewers:
  - Frontend Team
---

# سیستم طراحی نانس
**Nons Design System — Documentation**

اینجا شروع کنید. سیستم طراحی فقط **دادهٔ خام توکن‌ها** (YAML) را تولید می‌کند؛ CLI مستقل `nons` آن‌ها را به CSS Custom Property تبدیل می‌کند که محصولات مصرف می‌کنند.

---

## فهرست محتوا

1. [برای توسعه‌دهندگان (مصرف‌کنندگان سیستم)](#برای-توسعه‌دهندگان-مصرف‌کنندگان-سیستم)
2. [برای نگه‌دارندگان (ویرایش‌کنندگان سیستم)](#برای-نگه‌دارندگان-ویرایش‌کنندگان-سیستم)
3. [قانون طلایی](#قانون-طلایی)

---

## برای توسعه‌دهندگان (مصرف‌کنندگان سیستم)

* **[راهنمای مصرف توسعه‌دهنده (Developer Usage)](developer-usage)** — نحوهٔ مصرف توکن‌ها و بازتولید رابط کاربری مرجع. **اول این را بخوانید.**
* **[حالت‌های تعاملی (Interactive States)](interactive-states)** — الگوهای hover / active / selected / disabled (filled در مقابل selection)، رفتار light/dark.
* **[تایپوگرافی (Typography)](typography)** — قانون سلسله‌مراتب (Hierarchy Rule) و مقیاس تایپوگرافی هر محصول.

---

## برای نگه‌دارندگان (ویرایش‌کنندگان سیستم)

* **گزارش پوشش توکن‌ها (Token Coverage Report)** — حسابرسی توکن‌های موردنیاز مصرف‌کننده در برابر آنچه Registry ارائه می‌دهد (توسط نگه‌دارنده تکمیل می‌شود).
* `manifest.json` — منبع حقیقت (Source of Truth) برای رجیستری‌ها، تم‌ها، نسخه‌ها و `colorGuide`.
* `registry/*.yaml` — توکن‌های خام اولیه (Primitive). `themes/*.yaml` — نگاشت نقش‌های معنایی (Role mappings).
* `preview/index.html` — پیش‌نمایش زندهٔ light/dark مجموعهٔ توکن‌ها.
* `CHANGELOG.md` — تاریخچهٔ انتشار.

---

## قانون طلایی

توکن‌ها را مصرف کن؛ هرگز مقدار خام را به‌صورت مستقیم (hardcode) ننویس. اگر مقداری کم است، آن را به Registry اضافه کن.
