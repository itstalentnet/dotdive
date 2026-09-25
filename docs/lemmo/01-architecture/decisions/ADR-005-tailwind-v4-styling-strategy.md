| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | ADR-005: Frontend Styling Strategy with Tailwind CSS v4 in app/ |
| **Title (FA)** | ADR-005: استراتژی استایل‌دهی فرانت‌اند با Tailwind CSS v4 در app/ |
| **ID** | DOC-ARCH-005 |
| **Category** | `architecture` |
| **Status** | `Approved` |
| **Owner** | Frontend Architecture Team |
| **Last Updated** | 2026-09-26 |
| **Summary (EN)** | Authoritative decision locking Tailwind CSS v4 as the official styling strategy for app/, superseding CSS Modules. |
| **Summary (FA)** | ثبت تصمیم مصوب استفاده از Tailwind CSS v4 به عنوان استراتژی استایل‌دهی اپلیکیشن استودیو (app/) و حذف الزام CSS Modules. |
| **Tags** | `adr`, `frontend`, `tailwind`, `styling` |

---

# ADR-005: استراتژی استایل‌دهی فرانت‌اند با Tailwind CSS v4 در `app/`

## زمینه (Context)
در اسناد اولیه فرانت‌اند، استفاده از فایل‌های CSS Modules هم‌مکان (`X.module.css`) به عنوان استراتژی پیشنهادی مطرح شده بود. در جریان توسعه استودیوی Workspace (`app/`) و ارزیابی بهره‌وری تیم، نیاز به هماهنگی مستقیم با اکوسیستم توکن‌های طراحی (`@lemmo-lab/tokens`)، بهره‌مندی از کلاس‌های ابزاری (Utility-first)، متغیرهای CSS و رعایت ویژگی‌های منطقی جهت دوجهته‌سازی RTL/LTR بدون سربار فایل‌های ماژول مطرح شد. این موضوع در پرسش باز OQ-001 بررسی و تصمیم نهایی آن قفل گردید.

## تصمیم رسمی (Decision)
1. **Tailwind CSS v4** به عنوان استراتژی رسمی، انحصاری و مصوب استایل‌دهی برای پروژه Workspace Studio (`app/`) تعیین شد.
2. پیکربندی مبتنی بر `@tailwindcss/postcss` به همراه ادغام مستقیم با توکن‌های طراحی پلتفرم (`@lemmo-lab/tokens`) است.
3. الزام نگهداری و ساخت فایل‌های CSS Modules هم‌مکان (`*.module.css`) منسوخ شد.
4. پروژه `app/` تحت هیچ شرایطی نباید به CSS Modules بازگردانده شود.
5. رعایت قوانین جهت‌گیری دوگانه (RTL/LTR) با استفاده از کلاس‌های معادل CSS Logical Properties الزامی است.

## پیامدها (Consequences)
- **مزایا:** افزایش چشمگیر سرعت توسعه رابط کاربری، حذف کدهای اضافه استایل، تطابق کامل با استک روز Next.js 16 و React 19، بهره‌گیری از سرعت و کامپایلر مدرن Tailwind v4.
- **تأثیر بر مستندات:** اسناد معماری فرانت‌اند (`DOC-FE-001` و `DOC-ARCH-001`) برای بازتاب این تصمیم به‌روزرسانی شده‌اند.
