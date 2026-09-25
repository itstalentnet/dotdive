# لایه قراردادها و پکیج‌های اشتراکی

**Contracts & Shared Packages**

این بخش شامل دو لایه مجزا است: **قراردادهای پلتفرم (Proto)** و **پکیج‌های اشتراکی (TypeScript)**. برای توضیح دقیق این رویکرد، [معماری لایه قراردادها](./shared-packages-architecture) را ببینید.

---

## ساختار

```text
nons-api/contracts/        ← لایه قراردادهای پلتفرم (Proto — Source of Truth)
├── envelope.proto
├── registry.proto
├── errors.proto
└── permissions.proto

nons-api/packages/         ← پکیج‌های اشتراکی
├── contracts/    → @nons/contracts  (generated from Proto)
├── events/       → @nons/events     (generated from Proto)
└── logging/      → @nons/logging    (قرارداد ثبت وقایع — مستقل)
```

---

## لایه‌ها

### [قراردادهای پلتفرم (Contract Layer)](./shared-packages-architecture)

قراردادهای مشترک پلتفرم در قالب **Protocol Buffers** در `nons-api/contracts/` تعریف می‌شوند. Bindingهای TypeScript و Go از طریق Buf در CI تولید می‌شوند. هیچ زبانی مالک قراردادها نیست — Proto منبع حقیقت است.

### [تایپ‌ها (Type Catalog)](./type_catalog)

مرجع واژگان رسمی دامنه و مدل‌های داده‌ای مشترک. تایپ‌های مورد نیاز فرانت‌اند توسط `nons generate` در `.nons/generated/types/` تولید می‌شوند. Domain Types در سرویس‌های مربوطه تعریف می‌شوند.

### [قراردادها (Contracts)](./contract_catalog)

مرجع رسمی قراردادهای پلتفرم (Proto) و قراردادهای دامنه‌ای (در سرویس‌ها). Platform Contracts در `nons-api/contracts/` با Proto تعریف می‌شوند. Domain Contracts در هر سرویس نگهداری می‌شوند.

### [کاتالوگ رویدادها (Event Catalog)](./event-catalog)

مرجع رسمی تعریف، نسخه‌بندی و نگهداری رویدادهای پلتفرم. Event Envelope در Proto تعریف می‌شود. نام رویدادها و payloadها در Catalog با فرمت YAML/JSON نگهداری می‌شوند.

### [قرارداد ثبت وقایع (Logging Contract)](../standards/logging-standard)

مرجع رسمی ساختار لاگ‌های پلتفرم. این بخش تنها قرارداد، ساختار، فیلدهای اجباری، سطوح لاگ و قوانین اعتبارسنجی را تعریف می‌کند. **پیاده‌سازی لاگر نیست** — سرویس‌ها در انتخاب کتابخانه آزاد هستند. این قرارداد در Proto تعریف نمی‌شود (خارج از محدوده ADR-Platform-001).

### [راهنمای مدیریت قراردادها با CLI (nons)](./nons-ContractManagement-guide)

راهنمای معماری `nons` به عنوان ابزار مدیریت قرارداد (Contract Management Tool) پلتفرم — دریافت OpenAPI، ساخت Registry، مدیریت Bundle و تولید مصنوعات پروژه.

### [راهنمای ابزار خط فرمان Nons CLI](./cli-reference)

راهنمای کامل نصب، راه‌اندازی و استفاده از دستورات ابزار خط فرمان رسمی `nons` — مدیریت رجیستری، باندل‌ها و تولید مصنوعات پروژه.

---

## قوانین نگهداری

1. هر پکیج باید دارای README و مستندات کامل باشد
2. تغییرات باید از طریق CHANGELOG پیگیری شود
3. نسخه‌بندی مطابق استاندارد Semantic Versioning
4. هرگونه تغییر مخرب باید با افزایش Major Version همراه باشد
5. **`nons-api/contracts/` (Proto):** تغییرات با Buf بررسی می‌شوند — breaking change detection اجباری
6. **`.nons/generated/` (مصنوعات کلاینت):** کدها توسط `nons generate` تولید می‌شوند — ویرایش دستی ممنوع
7. **`nons-api/packages/logging`:** مطابق قوانین قبلی

---

## منابع مرتبط

- [معماری لایه قراردادها](./shared-packages-architecture) — توضیح کامل رویکرد Proto
- [ADR-Platform-001: Contract Layer](../ADR/ADR-Platform-001) — سند تصمیم معماری لایه قراردادها
- [ADR-Platform-004: Platform CLI، Registry و استراتژی تولید مصنوعات](../ADR/ADR-Platform-004) — سند تصمیم یکپارچه‌سازی کلاینت و رجیستری
- [ADR-Platform-005: Generator Metadata و Template-per-Framework](../ADR/ADR-Platform-005) — معماری جنریتور و استراتژی template
- [استاندارد نام‌گذاری](../standards/naming-conventions)
- [نسخه‌بندی](../standards/versioning-policy)
- [ساختار مخزن](../standards/repository-structure)

