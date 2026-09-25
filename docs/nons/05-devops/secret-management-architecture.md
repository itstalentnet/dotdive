---
layout: doc
title: معماری مدیریت اسرار
description: تعریف معماری رسمی مدیریت Secrets — مرز GitHub/Kubernetes/Vault، چرخه حیات و مالکیت
version: 1.0.0
status: PRIVATE
author: Antigravity
owner: Devops Team
created_at: 2026-06-16
updated_at: 2026-06-16
tags:
  - Secrets
  - Security
  - Kubernetes
  - GitHub
  - Vault
reviewers:
  - Devops Team
  - Backend Team
  - Platform Team
---

# معماری مدیریت اسرار

**Secret Management Architecture**

---

## ۱. اصول معماری

### ۱.۱ قوانین طلایی

1. **هیچ رازی در Repository ذخیره نمی‌شود** — نه در کد، نه در config، نه در Dockerfile.
2. **هر راز یک منبع حقیقت واحد دارد** — GitHub Secrets برای CI، K8s Secrets برای Runtime.
3. **دسترسی به رازها بر اساس Least Privilege** — هر سرویس فقط به رازهای خود دسترسی دارد.
4. **چرخه حیات رازها مدیریت می‌شود** — ایجاد، چرخش، انقضا و حذف.
5. **در محیط توسعه، مقادیر پیش‌فرض مجاز است** — اما `.env.example` فقط placeholder داشته باشد.

### ۱.۲ مدل لایه‌ای (Layered Model)

```
+----------------------------+
| GitHub Secrets             |  ← لایه CI: Tokenهای دسترسی به Registry، Deployment
+----------------------------+
| Kubernetes Secrets         |  ← لایه Runtime: Passwordها، API Keyها، Session Secrets
+----------------------------+
| External Secrets Operator  |  ← لایه Sync (فاز ۲): همگام‌سازی خودکار از Vault به K8s
+----------------------------+
| HashiCorp Vault            |  ← لایه نهایی (فاز ۳): منبع حقیقت تمام رازها
+----------------------------+
```

---

## ۲. مرزهای ذخیره‌سازی (Storage Boundaries)

### ۲.۱ چه اطلاعاتی در GitHub نگهداری می‌شود

| راز | Scope | GitHub Environment | توضیح |
|-----|-------|-------------------|-------|
| `REGISTRY_USERNAME` | CI | `staging`, `production` | <span v-pre>${{ github.actor }}</span> |
| `REGISTRY_TOKEN` | CI | `staging`, `production` | PAT با scopes `write:packages`, `delete:packages` |
| `K3S_KUBECONFIG` | CI | `production` | Kubeconfig برای استقرار روی K3s |
| `WEBHOOK_SECRET` | CI | `production` | Token امن وب‌هوک Kratos |
| `SLACK_WEBHOOK` | CI | `production` | Webhook برای اعلان خطاهای CI |

**قوانین GitHub Secrets:**

| قانون | توضیح |
|-------|-------|
| Environment Protection | Production نیازمند required reviewer + wait timer |
| Shared Secrets ممنوع | هر سرویس Environment مجزا ندارد — از Repository secrets استفاده نشود |
| Rotation | حداقل هر ۹۰ روز یکبار |
| Audit | تغییرات از طریق GitHub Audit Log قابل ردیابی باشد |

### ۲.۲ چه اطلاعاتی در Kubernetes نگهداری می‌شود

| Secret | Namespace | سرویس‌های مصرف‌کننده | Type |
|--------|-----------|---------------------|------|
| `postgres-credentials` | `nons-platform` | Kratos, Hydra, Core | `Opaque` |
| `kratos-config` | `nons-platform` | Kratos | `Opaque` |
| `hydra-config` | `nons-platform` | Hydra | `Opaque` |
| `auth-service-env` | `nons-platform` | Auth Service | `Opaque` |
| `ghcr-pull` | `nons-platform` | همه سرویس‌ها | `docker-registry` |
| `nats-config` | `nons-platform` | Core, Auth Service | `Opaque` |

**نمونه Manifest:**

```yaml
# k8s Secret — فقط برای محیط توسعه
apiVersion: v1
kind: Secret
metadata:
  name: auth-service-env
  namespace: nons-platform
type: Opaque
stringData:
  SESSION_SECRET: "تولید شده توسط Devops — هرگز در Git"
  WEBHOOK_SECRET_TOKEN: "تولید شده توسط Devops — هرگز در Git"
  OAUTH_CLIENT_SECRET: "تولید شده توسط Devops — هرگز در Git"
```

### ۲.۳ چه اطلاعاتی هرگز نباید داخل Repository قرار بگیرند

| مورد | خطر | جایگزین |
|------|------|---------|
| Passwordهای واقعی در `.env.example` | نشت به مخزن عمومی | استفاده از placeholders: `YOUR_PASSWORD_HERE` |
| `KUBECONFIG` با دسترسی Production | دسترسی غیرمجاز به کلاستر | GitHub Secrets + CI |
| `GHCR_PAT` | پوش تصویر غیرمجاز | GitHub Secrets + Environment protection |
| Session Secret واقعی | جعل Session کاربران | K8s Secrets در زمان استقرار |
| هر نوع API Key یا Token واقعی | سوءاستفاده سرویس‌های خارجی | Vault (فاز ۳) یا K8s Secrets |

---

## ۳. الگوی مصرف Secrets در Helm

### ۳.۱ تعریف در values.yaml

```yaml
# deploy/helm/auth-service/values.yaml
secret:
  existingSecret: auth-service-env
  keys:
    sessionSecret: SESSION_SECRET
    webhookToken: WEBHOOK_SECRET_TOKEN
    oauthClientSecret: OAUTH_CLIENT_SECRET
```

### ۳.۲ مصرف در Deployment

```yaml
# deploy/helm/auth-service/templates/deployment.yaml
env:
  - name: SESSION_SECRET
    valueFrom:
      secretKeyRef:
        name: {{ .Values.secret.existingSecret }}
        key: {{ .Values.secret.keys.sessionSecret }}
  - name: WEBHOOK_SECRET_TOKEN
    valueFrom:
      secretKeyRef:
        name: {{ .Values.secret.existingSecret }}
        key: {{ .Values.secret.keys.webhookToken }}
```

---

## ۴. چرخه حیات Secrets (Secret Lifecycle)

### ۴.۱ ایجاد (Creation)

| مرحله | مسئول | ابزار |
|-------|-------|-------|
| تولید مقدار امن | Devops | `openssl rand -base64 32` |
| ذخیره در GitHub Secrets | Devops | GitHub UI / `gh secret set` |
| ذخیره در K8s Secrets | Devops / CI | `kubectl create secret` |
| ارجاع در Helm Chart | Backend Team | `values.yaml` + `secretKeyRef` |

### ۴.۲ چرخش (Rotation)

| راز | بازه چرخش | روش | تأثیر |
|-----|----------|------|-------|
| Database Passwords | هر ۱۸۰ روز | `ALTER USER ... PASSWORD` + rollout |短暂 Downtime |
| Session Secrets | هر ۹۰ روز | تغییر + rollout تدریجی | Session logout کاربران |
| Registry Token | هر ۹۰ روز | GitHub Token refresh | بدون تأثیر |
| Webhook Token | هر ۹۰ روز | تغییر در Kratos + Auth Service | هماهنگی لازم است |
| API Keys خارجی | بر اساس سیاست provider | دستی | وابسته به provider |

### ۴.۳ انقضا و حذف (Expiration & Deletion)

| مرحله | اقدام | مسئول |
|-------|-------|-------|
| ۳۰ روز قبل | اعلان به تیم | Devops |
| ۷ روز قبل | یادآوری + ایجاد راز جدید | Devops |
| روز انقضا | انتقال به راز جدید + حذف راز قدیمی | Devops |
| پس از حذف | تأیید عدم استفاده | Devops |

---

## ۵. مالکیت Secrets (Secret Ownership)

| راز | تیم مالک | تیم‌های مصرف‌کننده |
|-----|---------|-------------------|
| `postgres-credentials` | Devops | Backend (همه سرویس‌ها) |
| `kratos-config` | Backend | Backend |
| `hydra-config` | Backend | Backend |
| `auth-service-env` | Backend | Backend |
| `ghcr-pull` | Devops | همه |
| `nats-config` | Devops | Backend |
| GitHub Environment Secrets | Devops | CI/CD |

---

## ۶. نقشه راه آینده (Roadmap)

| قابلیت | فاز | وضعیت | توضیح |
|--------|-----|-------|-------|
| **External Secrets Operator** | فاز ۲ | 📅 برنامه‌ریزی‌شده | Sync خودکار از Vault به K8s Secrets |
| **HashiCorp Vault** | فاز ۳ | 📅 برنامه‌ریزی‌شده | منبع حقیقت متمرکز تمام رازها |
| **Secret Rotation Automation** | فاز ۳ | 📅 برنامه‌ریزی‌شده | چرخش خودکار بر اساس بازه زمانی |
| **Audit Logging** | فاز ۳ | 📅 برنامه‌ریزی‌شده | ثبت همه دسترسی‌ها به رازها |
| **Dynamic Secrets** | فاز ۴ | 🔭 ایده | تولید موقت راز برای هر سرویس |
| **PKI Integration** | فاز ۴ | 🔭 ایده | صدور خودکار گواهی mTLS |

---

## ۷. خلاصه

| حوزه | تصمیم |
|------|--------|
| Storage Boundary | GitHub Secrets (CI) ← K8s Secrets (Runtime) ← Vault (آینده) |
| محیط توسعه | مقادیر placeholder در `.env.example` + K8s Secrets محلی |
| محیط Production | GitHub Environments + K8s Secrets واقعی |
| Rotation | ۹۰ روز برای Tokenها، ۱۸۰ روز برای Passwordها |
| Ownership | Devops مالک زیرساخت، Backend مالک سرویس |
| Never in Repo | Passwordها، Tokenها، API Keyها، Session Secrets |
