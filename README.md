# dotdive

> دانشنامه و نقطهٔ شیرجه زدن به پروژه‌ها

وب‌سایت مستندات کاملاً فارسی با ظاهر مدرن و مینیمال.

## راه‌اندازی

```bash
# نصب وابستگی‌ها
npm --prefix web install

# اجرا در حالت توسعه
npm run dev

# ساخت محتوا
npm run build:content

# ساخت کامل
npm run build
```

## ساختار پروژه

```
dotdive/
├─ docs/                    # محتوای Markdown
│  ├─ public/               # ریشهٔ عمومی (همه می‌توانند ببینند)
│  │  ├─ index.md           # لندینگ و متادیتا
│  │  ├─ blog/              # پست‌های وبلاگ
│  │  └─ docs/              # مستندات عمومی
│  ├─ nons/                 # ریشهٔ خصوصی nons
│  └─ lemmo/                # ریشهٔ خصوصی lemmo
└─ web/                     # اپلیکیشن Next.js
   ├─ src/
   │  ├─ app/               # App Router
   │  ├─ components/        # کامپوننت‌های UI
   │  ├─ server/            # لایه‌های سرور (content, access, search, auth)
   │  └─ styles/            # استایل‌ها
   ├─ scripts/              # اسکریپت‌های بیلد
   └─ public/fonts/         # فونت‌های self-hosted
```

## متغیرهای محیطی

فایل `.env.example` را کپی کنید:

```bash
cp .env.example .env
```

## تکنولوژی‌ها

- **Next.js 16** — App Router + TypeScript
- **Tailwind CSS v4** — استایل
- **@lemmo-lab/tokens** — سیستم طراحی
- **فونت‌ها:** Morabba (عنوان) + IRANSansX (متن)
- **Markdown:** unified/remark/rehype

## اجرا از ریشه

همه دستورات از ریشهٔ مونوریپو قابل اجرا هستند:

```bash
npm run dev          # سرور توسعه (localhost:3000)
npm run build        # بیلد production
npm run typecheck    # بررسی TypeScript
npm run test         # آزمون‌ها
npm run content:check  # اعتبارسنجی محتوا
```
