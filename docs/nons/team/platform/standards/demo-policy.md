---
layout: doc
title: سیاست پیش‌نمایش
description: استاندارد دموی سرویس — HTML/CSS ساده، قوانین فنی، چرخه عمر و همگام‌سازی
version: 1.0.0
status: PRIVATE
author: xoxxel
owner: xoxxel
created_at: 2026-06-07
updated_at: 2026-06-07
tags:
  - Backend
  - Standard
  - Demo
  - Documentation
reviewers:
  - Backend Team
---

# سیاست پیش‌نمایش

**Demo Policy**

نسخه 1.0 | الزامی برای همه سرویس‌ها

---

## 1. اصل اساسی

**هر سرویس باید یک پیش‌نمایش (Demo) داشته باشد.**

دمو یک صفحه HTML/CSS ساده است که عملکرد سرویس را بدون نیاز به اجرای آن نمایش می‌دهد.

---

## 2. ساختار دمو

```
demo/
├── index.html          # صفحه اصلی دمو (ورودی)
├── styles.css          # (اختیاری) استایل‌ها
├── app.js              # (اختیاری) اسکریپت‌ها
└── assets/             # منابع استاتیک
    ├── logo.svg
    └── ...
```

---

## 3. قوانین فنی

| قانون              | توضیح                                                     |
| ------------------ | --------------------------------------------------------- |
| بدون فریم‌ورک      | فقط HTML و CSS ساده — بدون React, Vue, Svelte             |
| بدون Build Step    | باید مستقیماً با `open demo/index.html` در مرورگر باز شود |
| بدون CDN           | همه منابع به صورت محلی — بدون لینک به CDN خارجی           |
| بدون وابستگی خارجی | هیچ فایلی از سرور خارجی لود نشود                          |
| خودکفا             | همه چیز در پوشه `demo/` موجود باشد                        |

```html
<!-- ✅ درست -->
<link rel="stylesheet" href="styles.css" />
<script src="app.js"></script>

<!-- ❌ غلط -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
/>
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
```

---

## 4. محتوای دمو

### صفحه اصلی (`index.html`) باید شامل:

| بخش                     | توضیح                                  |
| ----------------------- | -------------------------------------- |
| عنوان سرویس             | نام سرویس با توضیح یک خطی              |
| مسئولیت‌ها              | لیست کارهایی که سرویس انجام می‌دهد     |
| نقاط پایانی (Endpoints) | جدول مسیرهای API با نمونه درخواست/پاسخ |
| رویدادها (Events)       | رویدادهای منتشر شده و مصرف شده         |
| سناریوهای خطا           | نمونه خطاهای ممکن                      |
| مدل داده (Data Model)   | ساختار موجودیت‌های اصلی                |

### مثال بخش Endpoints:

```html
<h3>نقاط پایانی</h3>
<table>
  <tr>
    <th>Method</th>
    <th>Path</th>
    <th>Description</th>
    <th>Request</th>
    <th>Response</th>
  </tr>
  <tr>
    <td>POST</td>
    <td>/v1/orders</td>
    <td>ایجاد سفارش جدید</td>
    <td><pre>{ "productId": "...", "quantity": 1 }</pre></td>
    <td><pre>{ "data": { "id": "...", "status": "pending" } }</pre></td>
  </tr>
</table>
```

---

## 5. چرخه عمر دمو

### فاز 1: Blueprint — طراحی اولیه

Blueprint شامل README پیشنهادی سرویس است — بدون دمو یا کد اجرایی:

- هدف سرویس
- مسئولیت‌ها و حوزه
- نقاط پایانی پیشنهادی
- رویدادهای پیشنهادی

### فاز 1.5: دمو — پس از تأیید Blueprint

پس از بررسی و تأیید دقیق Blueprint، یک دموی اولیه ساخته می‌شود:

- هدف سرویس
- نقاط پایانی نهایی
- رویدادهای نهایی

### فاز 2: توسعه — همگام‌سازی

هر تغییری که رفتار سرویس را تغییر می‌دهد باید دمو را به‌روزرسانی کند:

| تغییر در سرویس          | اقدام در دمو             |
| ----------------------- | ------------------------ |
| اضافه شدن endpoint جدید | افزودن به جدول endpoints |
| تغییر payload پاسخ      | بروزرسانی نمونه پاسخ     |
| اضافه شدن رویداد جدید   | افزودن به لیست رویدادها  |
| تغییر سناریوی خطا       | بروزرسانی نمونه خطا      |

### فاز 3: انتشار — دموی نهایی

در زمان انتشار `v1.0.0`، دمو باید **کاملاً همگام** با سرویس باشد.

---

## 6. قوانین PR

| قانون                   | توضیح                                                |
| ----------------------- | ---------------------------------------------------- |
| تغییر رفتار = تغییر دمو | PRای که رفتار را تغییر می‌دهد باید دمو را به‌روز کند |
| بررسی در Review         | Reviewer باید دمو را چک کند                          |
| دمو در CI               | دمو باید در CI باز شود (Lint یا بررسی ساختار)        |

---

## 7. مثال حداقلی `index.html`

```html
<!DOCTYPE html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>دمو — سرویس سفارش</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <header>
      <h1>سرویس سفارش (Order Service)</h1>
      <p>مدیریت فرآیند ایجاد، پرداخت، تحویل و اختلاف سفارشات</p>
    </header>

    <section>
      <h2>مسئولیت‌ها</h2>
      <ul>
        <li>ایجاد و مدیریت سفارشات</li>
        <li>مدیریت چرخه عمر سفارش (Pending → Paid → Delivered → Completed)</li>
        <li>مدیریت اختلافات و انصراف</li>
      </ul>
    </section>

    <section>
      <h2>نقاط پایانی</h2>
      <table>
        <tr>
          <th>Method</th>
          <th>Path</th>
          <th>Description</th>
        </tr>
        <tr>
          <td>POST</td>
          <td>/v1/orders</td>
          <td>ایجاد سفارش</td>
        </tr>
        <tr>
          <td>GET</td>
          <td>/v1/orders/:id</td>
          <td>دریافت سفارش</td>
        </tr>
      </table>
    </section>

    <footer>
      <p>نسخه 1.0 | <a href="https://github.com/nons-api">Repository</a></p>
    </footer>
  </body>
</html>
```

---

## 8. رویدادها در دمو

```html
<section>
  <h2>رویدادها (Events)</h2>

  <h3>منتشر می‌کند (Publishes)</h3>
  <ul>
    <li><code>nons.order.created</code> — سفارش جدید ایجاد شد</li>
    <li><code>nons.order.paid</code> — سفارش پرداخت شد</li>
    <li><code>nons.order.delivered</code> — سفارش تحویل شد</li>
  </ul>

  <h3>مصرف می‌کند (Subscribes)</h3>
  <ul>
    <li><code>nons.payment.released</code> — وجه آزاد شد</li>
  </ul>
</section>
```

---

## خلاصه

| مورد                      | وضعیت  |
| ------------------------- | ------ |
| وجود دمو                  | اجباری |
| بدون فریم‌ورک             | اجباری |
| بدون CDN                  | اجباری |
| خودکفا                    | اجباری |
| همگام با سرویس            | اجباری |
| به‌روزرسانی در PR         | اجباری |
| دمو پس از تأیید Blueprint | اجباری |
