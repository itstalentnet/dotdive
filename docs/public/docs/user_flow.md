# User Flow

## Llemu — AI Creative Studio

---

## 1. هدف سند

این سند مسیرهای اصلی حرکت و تعامل کاربر در محصول Llemu را تعریف می‌کند.

تمرکز این سند بر موارد زیر است:

* نقاط ورود کاربر
* مسیرهای اصلی Navigation
* ارتباط میان بخش‌های مختلف محصول
* مسیر ایجاد و مدیریت پروژه
* مسیر کار در بوم
* مسیر استفاده از ابزارهای هوشمند
* مسیر تعامل با Llemu Agent
* مسیر استفاده از بخش الهام
* مسیر Onboarding کاربران جدید
* مسیرهای اصلی Web و Mobile

این سند شامل جزئیات UI، UX Research، Design System، Visual Design یا Implementation نیست.

---

# 2. ساختار اصلی محصول

پس از ورود کاربر، بخش‌های اصلی محصول عبارت‌اند از:

* **بوم من — My Canvas**
* **پروژه‌ها — Projects**
* **ابزارهای هوشمند — Smart Tools**
* **Llemu Agent**
* **الهام — Inspiration**
* **Token / Usage**
* **Account / Settings**

برای کاربران جدید، مسیر **Onboarding** نیز فعال می‌شود.

---

# 3. Entry Flow

## 3.1 کاربر جدید

```text
Landing
↓
Sign Up
↓
Account Creation
↓
Onboarding
↓
Dashboard
```

---

## 3.2 کاربر موجود

```text
Landing
↓
Sign In
↓
Dashboard
```

---

## 3.3 کاربر دارای Session

```text
Entry
↓
Dashboard
```

---

# 4. Onboarding Flow

Onboarding مسیر آشنایی اولیه کاربر با Llemu است.

```text
Account Creation
↓
Welcome
↓
Onboarding
↓
Product Introduction
↓
Feature Introduction
↓
Complete
↓
Dashboard
```

بخش‌های اصلی قابل معرفی در Onboarding:

* بوم من
* ابزارهای هوشمند
* Llemu Agent
* الهام
* پروژه‌ها
* سیستم Token

---

## 4.1 Product Tour

تور محصول می‌تواند پس از ورود کاربر یا در زمان دیگری اجرا شود.

```text
Dashboard
↓
Start Tour
↓
Product Area
↓
Next
↓
Product Area
↓
Next
↓
Finish
```

پس از پایان:

```text
Finish
↓
Dashboard
```

یا در صورت شروع تور از داخل بوم:

```text
Finish
↓
My Canvas
```

---

## 4.2 Learning / Tutorial

کاربر می‌تواند آموزش یک قابلیت را مشاهده کند.

```text
Learning / Help
↓
Select Topic
↓
Tutorial
↓
Complete
↓
Return to Previous Context
```

---

# 5. Dashboard Flow

Dashboard نقطه ورود اصلی کاربر پس از ورود به محصول است.

از Dashboard مسیرهای اصلی زیر در دسترس هستند:

```text
Dashboard
│
├── My Canvas
├── Projects
├── Smart Tools
├── Llemu Agent
├── Inspiration
├── Token / Usage
└── Account / Settings
```

---

# 6. My Canvas

**My Canvas** محیط اصلی خلق و ویرایش کاربر در Llemu است.

مسیر ورود:

```text
Dashboard
↓
My Canvas
```

کاربر در این محیط می‌تواند:

* پروژه جدید ایجاد کند.
* پروژه موجود را ادامه دهد.
* با AI محتوا ایجاد کند.
* عناصر را به صورت دستی ایجاد یا ویرایش کند.
* عناصر مختلف را ترکیب کند.
* از ابزارهای هوشمند استفاده کند.
* از Llemu Agent برای انجام اقدامات استفاده کند.

---

# 7. New Project Flow

ایجاد پروژه جدید از طریق My Canvas:

```text
Dashboard
↓
My Canvas
↓
New Project
↓
New Canvas
↓
Canvas Workspace
```

پس از ایجاد پروژه، کاربر وارد فضای اصلی بوم می‌شود.

---

# 8. Open Existing Project Flow

```text
Dashboard
↓
Projects
↓
Select Project
↓
Open
↓
My Canvas
↓
Canvas Workspace
```

---

# 9. Creation Entry Points

کاربر می‌تواند فرآیند خلق را از چند نقطه مختلف آغاز کند.

## از My Canvas

```text
My Canvas
│
├── AI Creation
├── Manual Editing
├── Node Composition
├── Smart Tools
└── Llemu Agent
```

## از Inspiration

```text
Inspiration
↓
Template / Prompt
↓
My Canvas
```

## از Smart Tools

```text
Smart Tools
↓
Select Tool
↓
Result
↓
My Canvas
```

## از Llemu Agent

```text
Llemu Agent
↓
Request
↓
Action
↓
My Canvas
```

---

# 10. AI Creation Flow

مسیر تولید محتوا با هوش مصنوعی:

```text
My Canvas
↓
AI Creation
↓
Enter Idea / Prompt
↓
Generate
↓
Processing
↓
Generated Results
```

پس از دریافت نتایج:

### انتخاب نتیجه

```text
Generated Results
↓
Select Result
↓
Add to Canvas
```

### تولید مجدد

```text
Generated Results
↓
Generate Again
↓
New Results
```

### رد نتیجه

```text
Generated Results
↓
Discard
↓
Creation State
```

---

# 11. Manual Editing Flow

مسیر ویرایش دستی:

```text
My Canvas
↓
Select / Create Element
↓
Edit
↓
Update Canvas
```

عناصر اصلی:

* Image
* Text
* Shape
* AI-generated Content

---

# 12. Element Editing Flow

```text
Canvas
↓
Select Element
↓
Edit Element
↓
Update
↓
Canvas
```

این جریان می‌تواند برای عناصر مختلف تکرار شود.

---

# 13. Node Composition Flow

یکی از مسیرهای اصلی Llemu، ترکیب چند عنصر برای ایجاد یک نتیجه جدید است.

```text
My Canvas
↓
Add / Select Elements
↓
Connect Elements
↓
Define Prompt / Instruction
↓
Generate
↓
Generated Result
```

سپس:

```text
Generated Result
↓
Add to Canvas
```

یا:

```text
Generated Result
↓
Generate Again
↓
New Result
```

---

# 14. Smart Tools Flow

## ورود به ابزارهای هوشمند

```text
Dashboard
↓
Smart Tools
↓
Tools
```

ابزارهای تعریف‌شده:

* Background Removal
* Upscale
* Style Transfer
* Text to Icon

---

## 14.1 General Smart Tool Flow

```text
Smart Tools
↓
Select Tool
↓
Select / Upload Content
↓
Configure
↓
Process
↓
Result
```

سپس:

```text
Result
├── Apply
│   ↓
│   My Canvas
│
└── Discard
```

---

# 15. Smart Tools From My Canvas

کاربر می‌تواند ابزارهای هوشمند را مستقیماً روی یک عنصر موجود در بوم اجرا کند.

```text
My Canvas
↓
Select Element
↓
Smart Tools
↓
Select Tool
↓
Process
↓
Result
↓
Apply
↓
My Canvas
```

---

# 16. Llemu Agent

**Llemu Agent** محیط تعامل متنی کاربر با Llemu است.

Agent می‌تواند درخواست کاربر را دریافت کرده و در صورت امکان، اقدام موردنظر را روی پروژه انجام دهد.

---

## 16.1 ورود به Agent

```text
Dashboard
↓
Llemu Agent
```

یا:

```text
My Canvas
↓
Llemu Agent
```

---

## 16.2 General Agent Flow

```text
Llemu Agent
↓
Enter Request
↓
Agent Processes Request
↓
Response / Action
```

اگر درخواست شامل تغییر روی پروژه باشد:

```text
Request
↓
Agent Action
↓
Result
↓
Apply
↓
My Canvas
```

---

## 16.3 Agent داخل My Canvas

```text
My Canvas
↓
Llemu Agent
↓
Enter Request
↓
Agent Action
↓
Updated Canvas
```

نمونه درخواست:

> سایه تصویر را کمتر کن.

یا:

> یک کادر آبی دور سوژه ایجاد کن.

---

# 17. Inspiration Flow

## ورود

```text
Dashboard
↓
Inspiration
```

محتوای اصلی Inspiration:

* Templates
* Prompts
* Examples

---

# 18. Template Flow

```text
Inspiration
↓
Browse
↓
Select Template
↓
Preview
↓
Use Template
↓
My Canvas
↓
Customize
```

پس از شخصی‌سازی:

```text
Customize
↓
Edit
↓
Final Result
```

---

# 19. Prompt Flow

```text
Inspiration
↓
Select Prompt
↓
Preview
↓
Customize
↓
Generate
↓
Generated Result
↓
Add to My Canvas
```

---

# 20. Projects Flow

## ورود

```text
Dashboard
↓
Projects
↓
Project List
```

از Project List کاربر می‌تواند:

* پروژه را باز کند.
* پروژه جدید ایجاد کند.
* پروژه را تغییر نام دهد.
* پروژه را حذف کند.

---

# 21. Create Project From Projects

```text
Projects
↓
New Project
↓
Create
↓
My Canvas
```

---

# 22. Project Open Flow

```text
Projects
↓
Select Project
↓
Open
↓
My Canvas
```

---

# 23. Project Management Flow

```text
Projects
↓
Select Project
↓
Project Actions
```

Actions:

* Open
* Rename
* Delete

در صورت حذف:

```text
Delete
↓
Confirmation
↓
Delete Project
↓
Projects
```

---

# 24. Save & Continue Flow

در طول کار:

```text
My Canvas
↓
Create / Edit
↓
Project Updated
↓
Save / Auto Save
```

خروج از پروژه:

```text
My Canvas
↓
Exit
↓
Projects / Dashboard
```

ادامه کار:

```text
Projects
↓
Open Project
↓
My Canvas
↓
Continue Editing
```

---

# 25. Token / Usage Flow

## مشاهده Token

```text
Dashboard
↓
Token / Usage
```

یا:

```text
My Canvas
↓
Token Status
```

---

## AI Action

```text
AI Action
↓
Check Token
```

### Token کافی

```text
Sufficient
↓
Process
↓
Result
↓
Token Updated
```

### Token ناکافی

```text
Insufficient
↓
Token / Usage
↓
Purchase / Upgrade
```

بخش Purchase / Upgrade در صورت نهایی شدن مدل اقتصادی محصول تکمیل خواهد شد.

---

# 26. Account Flow

```text
Dashboard
↓
Account / Settings
```

جزئیات Account Flow در این سند تعریف نمی‌شود.

---

# 27. Global Navigation

ساختار کلی Navigation:

```text
                         ┌── My Canvas
                         │
                         ├── Projects
                         │
Dashboard ───────────────┼── Smart Tools
                         │
                         ├── Llemu Agent
                         │
                         ├── Inspiration
                         │
                         ├── Token / Usage
                         │
                         └── Account / Settings
```

محور اصلی محصول:

```text
My Canvas
│
├── AI Creation
├── Manual Editing
├── Node Composition
├── Smart Tools
└── Llemu Agent
```

---

# 28. Core Creative Loop

چرخه اصلی خلق در Llemu:

```text
Idea
↓
My Canvas
↓
Create
↓
Generate
↓
Select
↓
Canvas
↓
Edit
↓
Combine
↓
Generate Again
↓
Edit
↓
Final Result
```

این چرخه می‌تواند تا رسیدن به نتیجه نهایی چندین بار تکرار شود.

---

# 29. Alternative Creation Entry Points

### شروع از My Canvas

```text
Dashboard
↓
My Canvas
↓
Create
```

### شروع از Inspiration

```text
Dashboard
↓
Inspiration
↓
Template / Prompt
↓
My Canvas
```

### شروع از Smart Tools

```text
Dashboard
↓
Smart Tools
↓
Tool
↓
Result
↓
My Canvas
```

### شروع از Llemu Agent

```text
Dashboard
↓
Llemu Agent
↓
Request
↓
Action
↓
My Canvas
```

### ادامه پروژه

```text
Dashboard
↓
Projects
↓
Project
↓
My Canvas
```

---

# 30. Primary User Flows

جریان‌های اصلی محصول:

1. **First Entry → Onboarding → Dashboard**
2. **Dashboard → My Canvas → New Project**
3. **Dashboard → Projects → Open Project → My Canvas**
4. **My Canvas → AI Creation → Generate → Canvas**
5. **My Canvas → Manual Editing → Canvas**
6. **My Canvas → Node Composition → Generate → Canvas**
7. **My Canvas → Smart Tools → Result → Canvas**
8. **Dashboard → Smart Tools → Result → My Canvas**
9. **My Canvas → Llemu Agent → Action → Canvas**
10. **Dashboard → Llemu Agent → Action → My Canvas**
11. **Dashboard → Inspiration → Template → My Canvas**
12. **Dashboard → Inspiration → Prompt → Generate → My Canvas**
13. **Dashboard → Projects → Manage Project**
14. **My Canvas → Save → Projects / Dashboard**
15. **AI Action → Token Check → Process / Insufficient Token**

---

# 31. Mobile Flow

ساختار اصلی جریان‌های Mobile با Web یکسان است:

```text
Entry
↓
Onboarding
↓
Dashboard
↓
My Canvas / Projects / Smart Tools / Agent / Inspiration
```

اما جریان‌های داخل **My Canvas** باید برای محیط Mobile و تعامل لمسی متناسب شوند.

مسیر اصلی:

```text
Dashboard
↓
My Canvas
↓
Create / Edit
↓
Save
↓
Exit / Continue
```

Mobile نسخه کوچک‌شده Web در نظر گرفته نمی‌شود؛ جریان اصلی محصول یکسان است اما دسترسی به بخش‌ها و ابزارها باید متناسب با محیط Mobile باشد.

---

# 32. Out of Scope

این سند شامل موارد زیر نیست:

* UX Research
* User Persona
* User Journey
* Wireframe
* UI Design
* Design System
* Visual Design
* Technical Architecture
* Development Flow
* API Flow
* Technical Implementation

---

# 33. Final Product Flow

مسیر سطح بالای محصول:

```text
Entry
↓
Onboarding / Sign In
↓
Dashboard
```

از Dashboard:

```text
My Canvas
→ Create / Edit / Generate

Projects
→ Open / Create / Manage

Smart Tools
→ Select Tool → Process → Result

Llemu Agent
→ Request → Response / Action

Inspiration
→ Template / Prompt → My Canvas

Token / Usage
→ Usage / Status

Account
→ Account Settings
```

و مرکز تجربه خلق:

```text
My Canvas
↓
Create
↓
Generate
↓
Edit
↓
Combine
↓
Improve
↓
Final Result
```

**My Canvas** مرکز اصلی فعالیت کاربر در Llemu است و سایر بخش‌ها در صورت نیاز کاربر را به بوم بازمی‌گردانند.
