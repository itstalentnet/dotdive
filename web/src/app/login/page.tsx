import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock, Shield } from "lucide-react";
import { LogoIcon } from "@/components/ui/logo";
import { EmailLoginForm } from "@/components/ui/email-login-form";

export const metadata: Metadata = {
  title: "ورود به دات دایو",
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string; email?: string; reason?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next =
    params.next && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/projects";

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Top return link */}
        <div style={{ marginBottom: "1rem" }}>
          <Link href="/" className="back-link">
            <ArrowRight size={13} strokeWidth={2} />
            <span>بازگشت به صفحه اصلی</span>
          </Link>
        </div>

        {/* Header */}
        <div className="login-header">
          <div className="login-logo-container">
            <LogoIcon size={24} />
          </div>
          <h1 className="login-title">ورود به دات دایو</h1>
          <p className="login-subtitle">
            دسترسی به مستندات خصوصی تیم‌های مهندسی
          </p>
        </div>

        {/* Error message */}
        {params.error && (
          <div className="login-error" role="alert">
            {params.error === "unauthorized" ? (
              <span>
                ایمیل {params.email ? <strong dir="ltr">{params.email}</strong> : "شما"} مجاز به دسترسی به پروژه‌های خصوصی نیست.
              </span>
            ) : params.error === "misconfigured" ? (
              <span>تنظیمات احراز هویت در سیستم کامل نیست (Client ID یا Client Secret ثبت نشده است).</span>
            ) : params.error === "token_exchange_failed" ? (
              <span>
                {params.reason === "redirect_uri_mismatch"
                  ? "آدرس بازگشت (Redirect URI) با کنسول گوگل همخوانی ندارد. لطفاً هر دو آدرس https://www.dotdive.ir/api/auth/google/callback و https://dotdive.ir/api/auth/google/callback را در کنسول گوگل ثبت کنید."
                  : params.reason === "invalid_client"
                  ? "کلید Client Secret در تنظیمات Vercel اشتباه یا منقضی است. لطفاً متغیر GOOGLE_CLIENT_SECRET را در Vercel بررسی کنید."
                  : params.reason === "invalid_grant"
                  ? "کد احراز هویت گوگل منقضی یا نامعتبر شده است. لطفاً دوباره امتحان کنید."
                  : `خطا در تأیید با گوگل${params.reason ? ` (${params.reason})` : ""}.`}
              </span>
            ) : (
              <span>خطایی در فرآیند ورود رخ داد. دوباره امتحان کنید.</span>
            )}
          </div>
        )}

        {/* Google OAuth */}
        <a
          href={`/api/auth/google?next=${encodeURIComponent(next)}`}
          className="google-btn"
        >
          <GoogleIcon />
          <span>ورود با حساب گوگل</span>
        </a>

        <div className="login-divider">
          <span>یا ورود با کد یک‌بارمصرف</span>
        </div>

        {/* Email OTP */}
        <EmailLoginForm next={next} />
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.25rem;
          background-color: var(--dd-surface-0);
        }
        .login-card {
          width: 100%;
          max-width: 360px;
          background: var(--dd-surface-1);
          border: 1px solid var(--dd-border);
          border-radius: 8px;
          padding: 1.75rem 1.5rem;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          color: var(--dd-text-muted);
          transition: color 0.12s;
        }
        .back-link:hover {
          color: var(--dd-text-secondary);
        }
        .login-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .login-logo-container {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: var(--dd-surface-2);
          border: 1px solid var(--dd-border);
          margin-bottom: 0.75rem;
        }
        .login-title {
          font-family: var(--font-heading);
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--dd-text-primary);
          margin-bottom: 0.25rem;
        }
        .login-subtitle {
          font-size: 0.78rem;
          color: var(--dd-text-muted);
        }
        .login-error {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 5px;
          padding: 0.5rem 0.75rem;
          font-size: 0.78rem;
          color: #f87171;
          margin-bottom: 1rem;
          text-align: center;
        }
        .google-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          height: 34px;
          background: var(--dd-surface-2);
          border: 1px solid var(--dd-border);
          border-radius: 6px;
          font-family: var(--font-body);
          font-size: 0.825rem;
          font-weight: 500;
          color: var(--dd-text-primary);
          text-decoration: none;
          transition: all 0.12s;
        }
        .google-btn:hover {
          background: var(--dd-surface-hover);
          border-color: var(--dd-border-focus);
        }
        .login-divider {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-block: 1rem;
          color: var(--dd-text-muted);
          font-size: 0.72rem;
        }
        .login-divider::before,
        .login-divider::after {
          content: "";
          flex: 1;
          border-top: 1px solid var(--dd-border-subtle);
        }
      `}</style>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}
