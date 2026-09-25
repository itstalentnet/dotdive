---
layout: doc
title: الگوی رجیستری (Registry Pattern)
description: تصمیم رسمی معماری و استانداردهای پیاده‌سازی الگوی رجیستری (Registry) در فرانت‌اند
version: 1.1.0
status: PRIVATE
author: Antigravity
owner: xoxxel
created_at: 2026-06-30
updated_at: 2026-06-30
tags:
  - Frontend
  - Registry Pattern
  - ADR
  - Decoupling
reviewers:
  - Frontend Team
  - Backend Team
---

# تصمیم معماری الگوی رجیستری (Registry Pattern Decision)

الگوی رجیستری به عنوان لایه میانی اتصال‌دهنده برنامه‌/صفحات فرانت‌اند (`Pages` / `Templates`) به API Client تولیدشده عمل می‌کند. ثبت این تصمیم با هدف خروج وابستگی‌های فنی وب‌سرویس از بدنه لایه‌های نمایش و کامپوننت‌های پنل صورت گرفته است.

---

## دلیل اتخاذ تصمیم (Context)

در توسعه رابط‌های کاربری چندگانه، صفحات نباید مستقیماً API Client را فراخوانی کنند. ایجاد لایه واسط به ما اجازه می‌دهد:
1. **استقلال لایه رندرینگ:** فریم‌ورک‌های بصری مجزا (مانند React و Vue) بدون وابستگی مستقیم به API Client، صرفاً رجیستری را صدا می‌زنند.
2. **شبیه‌سازی آسان داده‌ها (Mocking):** با جداسازی متدها، می‌توان به سادگی داده‌های فیک را جهت تست‌های بصری یا دمو بدون فعال بودن وب‌سرویس‌ها به صفحات تزریق کرد.

---

## الگوی جریان ارتباطی (Conceptual Flow)

جریان ارتباطی داده‌ها و متدها از لایه نمایش تا API سرور به صورت زیر است:

```mermaid
graph LR
    Page[Page / Template] --> Registry[Registry]
    Registry --> APIClient[API Client]
    APIClient --> API[API / Backend]
    
    style Registry fill:#f9f,stroke:#333,stroke-width:2px
```

---

## قوانین و محدودیت‌های توسعه (Strict Rules)

1. **ممنوعیت مصرف مستقیم API Client:** هیچ صفحه یا قالبی (`Page` / `Template`) مجاز به فراخوانی یا ایمپورت مستقیم کلاس‌ها یا نمونه‌های API Client نیست. تمام فراخوانی‌ها باید از کانال واسط رجیستری عبور کنند.
2. **پوشش‌دهی از رجیستری محلی:** ساختار متدهای API Client از Service Manifestها (تولیدشده توسط `nons registry build`) تأمین می‌شود. لایه رجیستری (Registry) این متدها را در زمان اجرا مصرف می‌کند.
3. **عدم ارتباط مستقیم با وب‌سرویس در لایه نمایش:** صفحات کلاینت نباید نگران کوکی‌ها، هدرها، پروتکل‌های شبکه یا خطاهای خام HTTP باشند. لایه رجیستری خطاها را قالب‌بندی کرده و خروجی تمیز را تحویل صفحه می‌دهد.

---

## نمونه پیاده‌سازی ساختاری (TypeScript Structure Example)

### تعریف ساختار میانی رجیستری (`src/registry/users.registry.ts`)

لایه رجیستری از مصنوعات تولیدشده توسط `nons generate` استفاده می‌کند. متدهای API Client از روی Service Manifestها به صورت خودکار تولید شده‌اند:

```typescript
// کد تولیدشده توسط CLI — مسیر: .nons/generated/api-client/
// این کدها توسط nons generate بازتولید می‌شوند — ویرایش دستی ممنوع
// بدون وابستگی NPM — کاملاً تایپ‌پذیر
import { userClient } from '../../.nons/generated/api-client/user';

export const usersRegistry = {
  /**
   * دریافت لیست کاربران
   */
  async list() {
    try {
      // استفاده از متد تولیدشده API Client
      const users = await userClient.list();
      return users;
    } catch (error) {
      console.error('Registry Error (Users List):', error);
      throw error;
    }
  },

  /**
   * ایجاد کاربر جدید
   */
  async create(data: { name: string; email: string }) {
    const cleanData = {
      ...data,
      email: data.email.toLowerCase().trim()
    };
    return userClient.create(cleanData);
  }
};
```
