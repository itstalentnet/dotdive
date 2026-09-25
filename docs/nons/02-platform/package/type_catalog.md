# سیاست مدل‌های داده

**Type Catalog Policy**

نسخه 2.0 | مرجع رسمی تعاریف داده‌ای سیستم

> **به‌روزرسانی:** با تصویب ADR-Platform-001، انواع داده‌ای پلتفرم (Platform Types) در Proto تعریف می‌شوند. با تصویب ADR-Platform-004، تایپ‌های مورد نیاز فرانت‌اند دیگر به عنوان پکیج جداگانه توزیع نمی‌شوند و توسط `nons generate` در `.nons/generated/types/` تولید می‌شوند. این سند مرجع واژگان رسمی دامنه است، نه قراردادهای پلتفرم.

---

## 1. هدف

Type Catalog مجموعه‌ای از تعاریف داده‌ای مشترک در سطح پلتفرم است — شامل مدل‌های داده‌ای مشترک، شناسه‌ها، Enumها، Value Objectها و واژگان رسمی دامنه (Canonical Domain Vocabulary).

این بخش **منبع حقیقت (Single Source of Truth)** برای **واژگان دامنه** است و برای جلوگیری از تکرار تعاریف و ایجاد درک مشترک از مفاهیم دامنه ایجاد شده است. هیچ منطق اجرایی یا وابستگی به فریم‌ورک‌ها در این پکیج وجود ندارد.

---

## 2. تفکیک Platform Types و Domain Types

### Platform Types — در Proto

انواع داده‌ای مشترک پلتفرم که در `nons-api/contracts/` با Proto تعریف می‌شوند:

```protobuf
// contracts/envelope.proto
message EventEnvelope { ... }
```

```protobuf
// contracts/errors.proto
enum PlatformErrorCode { ... }
```

این types از Proto تولید می‌شوند و Bindingهای TS/Go از طریق Buf در CI ساخته می‌شوند.

### Domain Types — در سرویس‌ها

انواع داده‌ای مختص هر دامنه (مانند `User`, `Order`, `Money`) در داخل همان سرویس تعریف می‌شوند:

```text
nons-api/services/order-service/src/types/
nons-api/services/payment-service/src/types/
nons-api/services/wallet-service/src/types/
```

مثال:

```ts
// services/order-service/src/types/order.ts
export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  amount: number;
  status: OrderStatus;
  createdAt: Date;
}

export type OrderStatus =
  | "created"
  | "active"
  | "completed"
  | "cancelled"
  | "disputed";
```

---

## 3. محل نگهداری (Type Catalog)

> **نکته:** فهرست زیر یک کاتالوگ مستنداتی (Docs Catalog) است. Platform Types در `nons-api/contracts/*.proto` تعریف می‌شوند و تایپ‌های مورد نیاز فرانت‌اند توسط `nons generate` در `.nons/generated/types/` تولید می‌شوند. Domain Types در هر سرویس تعریف می‌شوند.

```text
types/  (Docs Catalog — فقط برای مستندات)
├── identity/
├── commerce/
├── payment/
├── moderation/
└── common/
```

---

## 4. Type چیست؟

Type یک مفهوم داده‌ای است.

مثال:

```text
UserId
OrderId
WalletId
ZoneId
Currency
Money
```

---

## 5. نمونه

```ts
// .nons/generated/types/models/commerce/money.ts

export type Currency = "USD" | "IRR" | "TRY";

export interface Money {
  amount: bigint;
  currency: Currency;
}
```

> این type یک Domain Type است — در سرویس مربوطه تعریف می‌شود. اگر نیاز به اشتراک بین سرویس‌ها داشته باشد، از طریق Proto Binding تأمین می‌شود.

---

## 6. هدف Type Catalog

Type Catalog برای موارد زیر استفاده می‌شود:

- ایجاد زبان مشترک بین تیم‌ها
- تعریف مفاهیم دامنه
- مستندسازی مدل‌های داده
- کاهش ابهام در طراحی سرویس‌ها

---

## 7. فرمت تایپ‌ها

### Platform Types — Proto

```protobuf
// contracts/envelope.proto
message EventEnvelope {
  string event_name = 1;
  string event_version = 2;
  // ...
}
```

### Domain Types — TypeScript / زبان سرویس

```ts
// services/order-service/src/types/order.ts
export interface Order {
  id: string;
  amount: number;
  status: OrderStatus;
}
```

---

## 8. تفاوت Type و Contract

Type:

```text
مدل داده
```

مثال:

```text
Money
User
OrderSummary
```

Contract:

```text
قرارداد تبادل داده
```

مثال:

```text
CreateOrderRequest
CreateOrderResponse
```

---

## 9. مالکیت

| Type              | مالک            | لایه             |
| ----------------- | --------------- | ---------------- |
| EventEnvelope     | Platform Team   | Platform (Proto) |
| PlatformErrorCode | Platform Team   | Platform (Proto) |
| Money             | payment-service | Domain           |
| User              | auth-service    | Domain           |
| Order             | order-service   | Domain           |

---

## 10. اصل مرجع واحد

Type Catalog تنها مرجع معتبر تعاریف واژگان دامنه سیستم است.

تمامی مستندات، قراردادها، رویدادها و سرویس‌ها باید از همین تعاریف استفاده کنند تا زبان مشترک دامنه در سراسر پلتفرم حفظ شود.

برای Platform Types، `nons-api/contracts/` (Proto) مرجع معتبر است.
برای Domain Types، خود سرویس مرجع معتبر است.
