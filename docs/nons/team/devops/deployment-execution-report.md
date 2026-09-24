---
layout: doc
title: گزارش دستورات استقرار و خودکارسازی
description: گزارش دقیق تمامی دستورات اجرا شده برای استقرار پروداکشن به همراه فایل خودکارسازی Makefile
version: 1.0.0
status: PRIVATE
author: Antigravity
owner: Devops Team
created_at: 2026-06-17
updated_at: 2026-06-17
tags:
  - Deployment
  - Commands
  - Makefile
  - Automation
  - Kubernetes
reviewers:
  - Devops Team
  - Backend Team
---

# گزارش دستورات استقرار و خودکارسازی
**Deployment Execution Report & Makefile Automation Blueprint**

---

## ۱. اقدامات انجام شده روی سرور پروداکشن (توسط کاربر)

اقداماتی که مستقیماً روی سرور عملیاتی اوبونتو (`ubuntu@63.177.99.79` با IP داخلی `172.31.42.183`) صورت گرفت:

### ۱.۱. نصب و راه‌اندازی کلاستر سبک K3s
کلاستر سبک کوبرنتیز (K3s) با غیرفعال‌سازی پیش‌فرض Traefik (برای نصب نسخه سفارشی شده با Helm) راه‌اندازی شد.

### ۱.۲. استخراج Kubeconfig سالم
برای ایجاد دسترسی ایمن از سیستم محلی/سیستم CI/CD به کلاستر سرور، محتوای فایل دسترسی خوانده شده و به صورت Base64 فشرده شد:
```bash
sudo cat /etc/rancher/k3s/k3s.yaml | base64 -w 0
```

### ۱.۳. لود تصاویر بیلد شده در containerd (گام نهایی)
به دلیل استفاده از `Never` برای سیاست Pull تصاویر در چارت auth-service، تصاویر بیلد شده باید مستقیماً وارد زیرسیستم containerd کلاستر K3s شوند:
```bash
# خروجی گرفتن از داکر محلی
docker save ghcr.io/nons/auth-service:latest -o auth-service.tar

# انتقال فایل tar به سرور و ایمپورت در containerd پروداکشن
sudo k3s ctr images import auth-service.tar
```

---

## ۲. اقدامات انجام شده روی سیستم محلی (توسط دستیار)

تمامی دستوراتی که برای برقراری ارتباط، ساخت سکرت‌ها و استقرار چارت‌های Helm در فضای نام‌های مربوطه کلاستر پروداکشن اجرا شد:

### ۲.۱. رمزگشایی و اصلاح Kubeconfig برای اتصال خارجی
با اجرای اسکریپت `decode.js` مقادیر Base64 رمزگشایی شده، آدرس سرور به IP عمومی تغییر یافت و با توجه به محدودیت TLS SAN گواهی پیش‌فرض کلاستر، قابلیت نادیده گرفتن بررسی CA فعال گردید:
```bash
node decode.js
```
*خروجی تولید شده:* ایجاد فایل `kubeconfig-prod.yaml` با تغییر مقدار سرور به `https://63.177.99.79:6443` و افزودن `insecure-skip-tls-verify: true`.

### ۲.۲. ایجاد فضاهای نام (Namespaces) روی کلاستر پروداکشن
```bash
kubectl --kubeconfig kubeconfig-prod.yaml create namespace nons-platform
kubectl --kubeconfig kubeconfig-prod.yaml create namespace nons-system
```

### ۲.۳. تعریف سکرت‌های کوبرنتیز (Kubernetes Secrets)
تمام پسوردهای قوی، توکن‌ها و کلیدهای سشن در فضای نام `nons-platform` ثبت شدند:

```bash
# 1. سکرت دانلود تصاویر از رجیستری گیت‌هاب (docker-registry)
kubectl --kubeconfig kubeconfig-prod.yaml create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username="<YOUR_GITHUB_USERNAME>" \
  --docker-password="<YOUR_GHCR_PAT_TOKEN>" \
  --namespace nons-platform

# 2. اطلاعات ورود و پسورد دیتابیس PostgreSQL
kubectl --kubeconfig kubeconfig-prod.yaml create secret generic postgres-credentials \
  --from-literal=POSTGRES_USER="nons" \
  --from-literal=POSTGRES_PASSWORD="OQg3i4DxQLvnkj45YQ8u0cp80Y0QFRPowtTmn14R71+uWTh4" \
  --namespace nons-platform

# 3. کلیدهای امنیتی داخلی Ory Kratos
kubectl --kubeconfig kubeconfig-prod.yaml create secret generic kratos-secrets \
  --from-literal=KRATOS_SECRET="185e07e2ab5d151613e390500ccc476a1c82c80f57bacfb9b5a34d8d556f97cc" \
  --namespace nons-platform

# 4. کلیدهای سرفصل سیستم و نمک رمزنگاری Ory Hydra
kubectl --kubeconfig kubeconfig-prod.yaml create secret generic hydra-secrets \
  --from-literal=HYDRA_SYSTEM_SECRET="ac852a2e4195e04f0379f9bc40170672a0115b700c256016a5ea8aa0f7fcc323" \
  --from-literal=HYDRA_PAIRWISE_SALT="1d23bf3f3ccc8ff03b698068653b4352" \
  --namespace nons-platform

# 5. متغیرهای محیطی حساس سرویس واسط هویت (auth-service)
kubectl --kubeconfig kubeconfig-prod.yaml create secret generic auth-service-env \
  --from-literal=SESSION_SECRET="HVF7ButVKilinbXtuIGpgfyOeApqE8DH8D1IaqZZ04Khnuge" \
  --from-literal=WEBHOOK_SECRET_TOKEN="33f5d286f3df7dd156be5f635c4f570c08dc0503c7d324fba3dd89239d47f9f5" \
  --from-literal=OAUTH_CLIENT_ID="nons-client" \
  --from-literal=OAUTH_CLIENT_SECRET="1dNRDxyzlLBL4gz2ShWkLyHYxV1Ryoy3ZqvVotLHSRIh2Q8G" \
  --namespace nons-platform

# 6. اطلاعات SMTP برای سیستم ارسال ایمیل Kratos
kubectl --kubeconfig kubeconfig-prod.yaml create secret generic kratos-smtp \
  --from-literal=SMTP_CONNECTION_URI="smtps://user:password@smtp.example.com:465/?skip_ssl_verify=false" \
  --namespace nons-platform
```

### ۲.۴. آماده‌سازی باینری Helm
برای اجرای فرآیند استقرار در ویندوز، نسخه پرتابل Helm دانلود و در دایرکتوری محلی قرار گرفت:
```powershell
New-Item -ItemType Directory -Force -Path temp_helm
Invoke-WebRequest -Uri https://get.helm.sh/helm-v3.14.0-windows-amd64.zip -OutFile temp_helm\helm.zip
Expand-Archive -Path temp_helm\helm.zip -DestinationPath temp_helm -Force
Move-Item -Path temp_helm\windows-amd64\helm.exe -Destination temp_helm\helm.exe -Force
```

### ۲.۵. اعمال تعاریف پایه شبکه (Traefik CRDs & RBAC)
قبل از استقرار API Gateway، ابتدا منابع سفارشی (`CustomResourceDefinitions`) و دسترسی‌های نقش گیت‌وی به کلاستر اعمال شد:
```bash
# نصب CRDهای پیش‌فرض Traefik v3
kubectl --kubeconfig kubeconfig-prod.yaml apply -f https://raw.githubusercontent.com/traefik/traefik/v3.7/docs/content/reference/dynamic-configuration/kubernetes-crd-definition-v1.yml

# نصب مجوزهای دسترسی تراژیک
kubectl --kubeconfig kubeconfig-prod.yaml apply -f https://raw.githubusercontent.com/traefik/traefik/v3.7/docs/content/reference/dynamic-configuration/kubernetes-crd-rbac.yml
```

### ۲.۶. بیلد تصاویر میکروسرویس‌ها به صورت محلی
تصاویر میکروسرویس‌ها با داکر محلی ساخته شدند:
```bash
# بیلد سرویس احراز هویت
docker build -t ghcr.io/nons/auth-service:latest -f services/auth-service/Dockerfile .

# بیلد هسته Go کنترل پلن
docker build -t ghcr.io/nons/core:latest -f core/Dockerfile core/
```

### ۲.۷. استقرار گام‌به‌گام چارت‌های Helm در پروداکشن
استقرار طبق ترتیب وابستگی‌های معماری به کلاستر سرور ارسال شد:

```bash
# ۱. استقرار پایگاه‌داده PostgreSQL
.\temp_helm\helm.exe upgrade --install postgres .\nons-api\deploy\helm\postgres -n nons-platform --kubeconfig kubeconfig-prod.yaml

# ۲. استقرار کش و مدیریت نشست‌های Redis
.\temp_helm\helm.exe upgrade --install redis .\nons-api\deploy\helm\redis -n nons-platform --kubeconfig kubeconfig-prod.yaml

# ۳. استقرار گذرگاه پیام‌رسان NATS JetStream
.\temp_helm\helm.exe upgrade --install nats .\nons-api\deploy\helm\nats -n nons-platform --kubeconfig kubeconfig-prod.yaml

# ۴. استقرار سرویس مدیریت هویت Ory Kratos (شامل جاب pre-install مهاجرت جداول)
.\temp_helm\helm.exe upgrade --install kratos .\nons-api\deploy\helm\kratos -n nons-platform --kubeconfig kubeconfig-prod.yaml

# ۵. استقرار سرویس OAuth2 پروتکل Ory Hydra (شامل جاب pre-install مهاجرت جداول)
.\temp_helm\helm.exe upgrade --install hydra .\nons-api\deploy\helm\hydra -n nons-platform --kubeconfig kubeconfig-prod.yaml

# ۶. استقرار سرویس واسط احراز هویت auth-service
.\temp_helm\helm.exe upgrade --install auth-service .\nons-api\deploy\helm\auth-service -n nons-platform --kubeconfig kubeconfig-prod.yaml

# ۷. استقرار درگاه ارتباطی API Gateway (Traefik v3)
.\temp_helm\helm.exe upgrade --install gateway .\nons-api\deploy\helm\gateway -n nons-system --kubeconfig kubeconfig-prod.yaml
```

---

## ۳. فایل خودکارسازی استقرار (Makefile Blueprint)

شما می‌توانید با استفاده از قالب زیر، یک فایل به نام `Makefile` در روت پروژه ایجاد کنید تا تمام مراحل فوق را به صورت خودکار و تک‌دستوری اجرا نمایید:

```makefile
# Makefile - NONS Production Deployment Automation
.PHONY: all bootstrap secrets crds deploy-infra deploy-identity deploy-apps clean status

KUBECONFIG = kubeconfig-prod.yaml
KUBECTL = kubectl --kubeconfig=$$(KUBECONFIG)
HELM = ./temp_helm/helm.exe --kubeconfig=$$(KUBECONFIG)

# اطلاعات پیش‌فرض گیت‌هاب برای ریجستری
GH_USER ?= nons
GH_PAT ?= your_personal_access_token_here

all: bootstrap secrets crds deploy-infra deploy-identity deploy-apps status

# ۱. راه‌اندازی پیش‌نیازها و نیم‌اسپیس‌ها
bootstrap:
	@echo "Creating namespaces..."
	$$(KUBECTL) create namespace nons-platform --dry-run=client -o yaml | $$(KUBECTL) apply -f -
	$$(KUBECTL) create namespace nons-system --dry-run=client -o yaml | $$(KUBECTL) apply -f -

# ۲. ایجاد سکرت‌ها در کلاستر پروداکشن
secrets:
	@echo "Creating Kubernetes secrets..."
	-$$(KUBECTL) create secret docker-registry ghcr-pull \
		--docker-server=ghcr.io \
		--docker-username="$$(GH_USER)" \
		--docker-password="$$(GH_PAT)" \
		--namespace nons-platform -o yaml --dry-run=client | $$(KUBECTL) apply -f -
	-$$(KUBECTL) create secret generic postgres-credentials \
		--from-literal=POSTGRES_USER="nons" \
		--from-literal=POSTGRES_PASSWORD="OQg3i4DxQLvnkj45YQ8u0cp80Y0QFRPowtTmn14R71+uWTh4" \
		--namespace nons-platform -o yaml --dry-run=client | $$(KUBECTL) apply -f -
	-$$(KUBECTL) create secret generic kratos-secrets \
		--from-literal=KRATOS_SECRET="185e07e2ab5d151613e390500ccc476a1c82c80f57bacfb9b5a34d8d556f97cc" \
		--namespace nons-platform -o yaml --dry-run=client | $$(KUBECTL) apply -f -
	-$$(KUBECTL) create secret generic hydra-secrets \
		--from-literal=HYDRA_SYSTEM_SECRET="ac852a2e4195e04f0379f9bc40170672a0115b700c256016a5ea8aa0f7fcc323" \
		--from-literal=HYDRA_PAIRWISE_SALT="1d23bf3f3ccc8ff03b698068653b4352" \
		--namespace nons-platform -o yaml --dry-run=client | $$(KUBECTL) apply -f -
	-$$(KUBECTL) create secret generic auth-service-env \
		--from-literal=SESSION_SECRET="HVF7ButVKilinbXtuIGpgfyOeApqE8DH8D1IaqZZ04Khnuge" \
		--from-literal=WEBHOOK_SECRET_TOKEN="33f5d286f3df7dd156be5f635c4f570c08dc0503c7d324fba3dd89239d47f9f5" \
		--from-literal=OAUTH_CLIENT_ID="nons-client" \
		--from-literal=OAUTH_CLIENT_SECRET="1dNRDxyzlLBL4gz2ShWkLyHYxV1Ryoy3ZqvVotLHSRIh2Q8G" \
		--namespace nons-platform -o yaml --dry-run=client | $$(KUBECTL) apply -f -
	-$$(KUBECTL) create secret generic kratos-smtp \
		--from-literal=SMTP_CONNECTION_URI="smtps://user:password@smtp.example.com:465/?skip_ssl_verify=false" \
		--namespace nons-platform -o yaml --dry-run=client | $$(KUBECTL) apply -f -

# ۳. دانلود Helm و نصب پکیج‌های پایه Traefik CRDs
crds:
	@echo "Applying Traefik v3 CRDs and RBAC..."
	$$(KUBECTL) apply -f https://raw.githubusercontent.com/traefik/traefik/v3.7/docs/content/reference/dynamic-configuration/kubernetes-crd-definition-v1.yml
	$$(KUBECTL) apply -f https://raw.githubusercontent.com/traefik/traefik/v3.7/docs/content/reference/dynamic-configuration/kubernetes-crd-rbac.yml

# ۴. بیلد تصاویر میکروسرویس‌ها
build-images:
	@echo "Building Docker images..."
	docker build -t ghcr.io/nons/auth-service:latest -f services/auth-service/Dockerfile .
	docker build -t ghcr.io/nons/core:latest -f core/Dockerfile core/

# ۵. استقرار سرویس‌های پایه دیتابیس و مسیریابی
deploy-infra:
	@echo "Deploying Postgres, Redis, and NATS..."
	$$(HELM) upgrade --install postgres ./nons-api/deploy/helm/postgres -n nons-platform
	$$(HELM) upgrade --install redis ./nons-api/deploy/helm/redis -n nons-platform
	$$(HELM) upgrade --install nats ./nons-api/deploy/helm/nats -n nons-platform

# ۶. استقرار سرویس‌های مدیریت هویت
deploy-identity:
	@echo "Deploying Kratos and Hydra..."
	$$(HELM) upgrade --install kratos ./nons-api/deploy/helm/kratos -n nons-platform
	$$(HELM) upgrade --install hydra ./nons-api/deploy/helm/hydra -n nons-platform

# ۷. استقرار اپلیکیشن و درگاه خروجی
deploy-apps:
	@echo "Deploying auth-service and API Gateway..."
	$$(HELM) upgrade --install auth-service ./nons-api/deploy/helm/auth-service -n nons-platform
	$$(HELM) upgrade --install gateway ./nons-api/deploy/helm/gateway -n nons-system

# ۸. لاگ و بررسی آخرین وضعیت پادها
status:
	@echo "Listing all pods on the cluster:"
	$$(KUBECTL) get pods -A
```
