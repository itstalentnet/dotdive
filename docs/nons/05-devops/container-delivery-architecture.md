---
layout: doc
title: معماری تحویل کانتینر
description: معماری جامع ساخت، ثبت، انتشار و استقرار تصاویر کانتینر در پلتفرم NONS
version: 1.0.0
status: APPROVED
author: Antigravity
owner: Devops Team
created_at: 2026-06-15
updated_at: 2026-06-15
tags:
  - DevOps
  - Container
  - Registry
  - Architecture
  - Delivery
reviewers:
  - Devops Team
  - Backend Team
  - Platform Team
---

# معماری تحویل کانتینر

**Container Delivery Architecture**

---

## ۱. Container Registry Strategy

### ۱.۱ ارائه‌دهنده رسمی

| مؤلفه | تصمیم |
|-------|--------|
| ارائه‌دهنده | **GitHub Container Registry (ghcr.io)** |
| دلیل | هم‌خوانی با GitHub به عنوان بستر CI/CD و Source Control |
| جایگزین | Docker Hub (رد شد — محدودیت نرخ pull برای CI) |
| مهاجرت آینده | در صورت نیاز به Multi-Cloud، به ECR یا GCR انتقال داده شود |

### ۱.۲ نام‌گذاری مخازن (Repository Naming)

```
ghcr.io/nons/{service-name}
```

| مؤلفه | قانون |
|-------|-------|
| Prefix | `ghcr.io/nons/` |
| Service Name | دقیقاً مطابق نام دایرکتوری سرویس در `services/` |
| Private Images | همه تصاویر به صورت **Private** ایجاد می‌شوند |
| Public Images | فقط تصاویر پایه و ابزارهای عمومی می‌توانند Public باشند |

مثال‌ها:

```
ghcr.io/nons/auth-service
ghcr.io/nons/gateway
ghcr.io/nons/core
ghcr.io/nons/postgres-init
```

### ۱.۳ قوانین Namespace Ownership

| Namespace | مالک | سطح دسترسی |
|-----------|------|-----------|
| `ghcr.io/nons/` | Devops Team | Admin |
| `ghcr.io/nons/*` | Backend Team | Write (Push) |
| سایر | ممنوع | — |

### ۱.۴ احراز هویت Registry

| مرحله | مکانیسم |
|-------|---------|
| CI Push | Personal Access Token (PAT) با scopes: `write:packages`, `delete:packages` |
| Developer Push | GitHub CLI (`gh auth login`) یا PAT |
| K3s Pull | `imagePullSecrets` با Pull Token |
| K3d Pull | `k3d image import` (بدون نیاز به registry خارجی) |

**روش ایجاد Token برای CI/CD:**

```bash
# GitHub Secrets
REGISTRY_USERNAME=${{ github.actor }}
REGISTRY_TOKEN=${{ secrets.GITHUB_TOKEN }}
```

**روش ایجاد Token برای K3s:**

```bash
kubectl create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username=$GITHUB_ACTOR \
  --docker-password=$GITHUB_PAT \
  --namespace nons-platform
```

### ۱.۵ Retention Policy

| نوع تصویر | مدت نگهداری | خودکار |
|-----------|------------|--------|
| Release Tags (`v*`) | نامحدود | ❌ |
| Commit SHA Tags | ۹۰ روز | ✅ |
| Branch Tags | ۳۰ روز پس از حذف برنچ | ✅ |
| Latest | ۱ نسخه | ✅ |

### ۱.۶ تصاویر مجاز و ممنوع

| مجاز | ممنوع |
|------|-------|
| `ghcr.io/nons/*` | Docker Hub (برای تصاویر اختصاصی سرویس) |
| تصاویر پایه عمومی (Alpine, Node, Go) | تصاویر با منبع نامشخص |
| تصاویر اسکن‌شده امنیتی | تصاویر با آسیب‌پذیری HIGH |

---

## ۲. Image Build Strategy

### ۲.۱ استاندارد OCI

همه تصاویر کانتینر باید با استاندارد **OCI Image Format** ساخته شوند.

| ابزار | وضعیت |
|-------|-------|
| Docker CLI (`docker build`) | ✅ فعلی |
| BuildKit | ✅ توصیه شده (فعلاً اختیاری) |
| Ko (Go images) | بررسی آینده |
| Podman | امکان جایگزینی در فاز ۵ |

### ۲.۲ Image Versioning Policy

| تگ | معنی | مثال | Immutable |
|----|------|------|-----------|
| `{major}.{minor}.{patch}` | Release SemVer | `1.2.0` | ✅ بله |
| `{version}-rc.{n}` | Release Candidate | `1.2.0-rc.1` | ✅ بله |
| `{version}-beta.{n}` | Beta | `1.2.0-beta.1` | ✅ بله |
| `sha-{commit}` | هر commit به برنچ اصلی | `sha-a1b2c3d4` | ✅ بله |
| `latest` | آخرین Release | `latest` | ❌ خیر (متحرک) |
| `{branch-name}` | برنچ توسعه | `main`, `develop` | ❌ خیر (متحرک) |

**قوانین:**

1. **همه تگ‌ها به جز `latest` و `{branch-name}` باید Immutable باشند.**
2. **تگ `latest` فقط روی آخرین Release پایدار مجاز است** (هرگز روی `alpha` یا `beta`).
3. **تگ `sha-{commit}` باید برای هر commit به `main`/`master` ایجاد شود.**
4. **بازنویسی تگ Release ممنوع است** — اگر اشتباه شد، تگ جدید با PATCH بعدی ایجاد شود.

### ۲.۳ Commit SHA Tagging

```bash
IMAGE_TAG="sha-${GITHUB_SHA::8}"
docker build -t ghcr.io/nons/auth-service:${IMAGE_TAG} .
docker push ghcr.io/nons/auth-service:${IMAGE_TAG}
```

### ۲.۴ Release Tagging

```bash
# Create Git Tag
git tag auth-service/v1.2.0
git push origin auth-service/v1.2.0

# Build & Push
docker build -t ghcr.io/nons/auth-service:1.2.0 .
docker push ghcr.io/nons/auth-service:1.2.0

# Also update 'latest'
docker tag ghcr.io/nons/auth-service:1.2.0 ghcr.io/nons/auth-service:latest
docker push ghcr.io/nons/auth-service:latest
```

### ۲.۵ Multi-Architecture (Future Consideration)

| معماری | وضعیت | زمان |
|---------|-------|------|
| `linux/amd64` | ✅ فعلی | اکنون |
| `linux/arm64` | ⏳ بررسی | فاز ۵ |
| Apple Silicon | ⏳ بررسی | فاز ۵ |

```bash
# Future: Multi-arch build
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/nons/auth-service:1.2.0 \
  --push .
```

---

## ۳. Deployment Artifact Strategy

### ۳.۱ زنجیره Artifact

```text
Source Code (Git)
    ↓
Build (CI)
    ↓
Container Image (ghcr.io)  ←── Helm Chart (deploy/helm/)
    ↓                                  ↓
image.tag: "1.2.0"  ←──────  values.yaml
    ↓
kubectl apply / helm upgrade
    ↓
Running Pod
```

### ۳.۲ رابطه Source Code و Image

| Source Change | Image Build | Tag |
|--------------|-------------|-----|
| Commit به `main` | ✅ خودکار | `sha-{commit}` |
| Pull Request | ✅ خودکار | `sha-{commit}` + `pr-{number}` |
| Git Tag `v*` | ✅ خودکار | `{version}` |
| Manual Trigger | ✅ دستی | مطابق هدف |

### ۳.۳ رابطه Image و Helm Chart

Helm Chart سرویس شامل `values.yaml` است که `image.repository` و `image.tag` را تعریف می‌کند:

```yaml
# deploy/helm/auth-service/values.yaml
image:
  repository: ghcr.io/nons/auth-service
  tag: latest
  pullPolicy: IfNotPresent
```

**قوانین:**

| محیط | image.tag | نحوه تنظیم |
|------|-----------|-----------|
| توسعه محلی (K3d) | `latest` | `--set image.tag=latest` + `k3d image import` |
| Staging | `sha-{commit}` | CI خودکار |
| Production | `{version}` | Release workflow دستی |

### ۳.۴ Image Promotion بین محیط‌ها

```text
Build (CI)
  ↓
Registry: ghcr.io/nons/auth-service:sha-a1b2c3d4
  ↓
[Staging]  helm upgrade --set image.tag=sha-a1b2c3d4
  ↓  (validation passed)
[Production] helm upgrade --set image.tag=sha-a1b2c3d4
  ↓
[Release] git tag + docker tag + push {version}
```

### ۳.۵ Environment-Specific Values

| محیط | فایل Values | نحوه استفاده |
|------|------------|-------------|
| Local | `deploy/environments/local/values.yaml` | پیش‌فرض K3d |
| Staging | `deploy/environments/staging/values.yaml` | CI/CD |
| Production | `deploy/environments/production/values.yaml` | Release Workflow |

```bash
helm install nons-auth-service ./deploy/helm/auth-service \
  -n nons-platform \
  -f ./deploy/environments/local/values.yaml
```

---

## ۴. Security Considerations

### ۴.۱ Registry Authentication

| مؤلفه | مکانیسم |
|-------|---------|
| Push از CI | `GITHUB_TOKEN` |
| Pull از K3s | `imagePullSecrets` با `ghcr-pull` secret |
| Pull از K3d | `k3d image import` (محلی) |
| Developer Pull | `docker login ghcr.io` با PAT |

### ۴.۲ Secret Handling

| راز | کجا ذخیره شود | کجا هرگز ذخیره نشود |
|-----|---------------|--------------------|
| Registry Token | GitHub Secrets / K8s Secrets | Image layer, env file |
| PAT | GitHub Secrets | Image, git log |
| Pull Secret | K8s Secret (namespace) | Code, Helm values in git |

### ۴.۳ Image Provenance

| مکانیسم | وضعیت |
|---------|-------|
| Docker Content Trust | ❌ غیرفعال (بررسی در فاز ۵) |
| Cosign (Signature) | ❌ بررسی در فاز ۵ |
| SBOM | ❌ بررسی در فاز ۵ |
| SLSA Level | ❌ هدف: Level 2 در فاز ۵ |

### ۴.۴ Supply Chain Security Roadmap

| قابلیت | فاز | تأثیر |
|--------|-----|-------|
| Image Signing (Cosign) | فاز ۵ | تأیید اصالت تصاویر |
| Vulnerability Scanning | فاز ۵ | اسکن خودکار در CI |
| SBOM Generation | فاز ۵ | شفافیت وابستگی‌ها |
| Policy Enforcement | فاز ۵ | ممنوعیت تصاویر اسکن‌نشده |
| Multi-Arch Build | فاز ۵ | پشتیبانی arm64 |
| GitOps (ArgoCD/Flux) | فاز ۵ | استقرار خودکار declarative |

---

## ۵. خلاصه

| حوزه | تصمیم اصلی |
|------|-----------|
| Registry | `ghcr.io/nons/*` — همه Private |
| Image Tag | SemVer برای Release, `sha-{commit}` برای هر commit |
| Immutable Tags | همه تگ‌ها به جز `latest` و `{branch}` |
| Helm Integration | `image.tag` در `values.yaml` + override به ازای محیط |
| Pull از K3s | `imagePullSecrets` |
| Pull از K3d | `k3d image import` (بدون registry خارجی) |
| Retention | Release: نامحدود \| SHA: ۹۰ روز \| Branch: ۳۰ روز |
| Security | مرحله‌ای — فاز ۵ برای امضا و اسکن |
