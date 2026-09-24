/**
 * Login page — /login
 * Google OAuth + Email OTP (magic code)
 */
import type { Metadata } from "next";
import { LogoIcon } from "@/components/ui/logo";
import { EmailLoginForm } from "@/components/ui/email-login-form";

export const metadata: Metadata = {
  title: "ورود",
  robots: { index: false },
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
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
        {/* Header */}
        <div className="login-header">
          <LogoIcon size={36} />
          <h1 className="login-title">ورود به dotdive</h1>
          <p className="login-subtitle">
            فقط ایمیل‌های مجاز می‌توانند وارد شوند
          </p>
        </div>

        {/* Error message */}
        {params.error && (
          <div className="login-error" role="alert">
            {params.error === "unauthorized"
              ? "این ایمیل دسترسی ندارد."
              : "خطایی رخ داد. دوباره امتحان کنید."}
          </div>
        )}

        {/* Google OAuth */}
        <a
          href={`/api/auth/google?next=${encodeURIComponent(next)}`}
          className="google-btn touch-target"
        >
          <GoogleIcon />
          <span>ورود با گوگل</span>
        </a>

        <div className="login-divider">
          <span>یا</span>
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
          padding: 1.5rem;
          background: var(--dd-surface-0);
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          background: var(--dd-surface-1);
          border: 1px solid var(--dd-border);
          border-radius: 16px;
          padding: 2.5rem 2rem;
        }
        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .login-title {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          color: var(--dd-text-primary);
          margin-top: 0.75rem;
          margin-bottom: 0.4rem;
        }
        .login-subtitle {
          font-size: 0.85rem;
          color: var(--dd-text-muted);
        }
        .login-error {
          background: color-mix(in srgb, #ef4444 12%, var(--dd-surface-2));
          border: 1px solid color-mix(in srgb, #ef4444 30%, transparent);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-size: 0.85rem;
          color: #ef4444;
          margin-bottom: 1.25rem;
          text-align: center;
        }
        .google-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          width: 100%;
          padding: 0.7rem;
          background: var(--dd-surface-2);
          border: 1px solid var(--dd-border);
          border-radius: 8px;
          font-family: var(--font-heading);
          font-size: 0.9rem;
          color: var(--dd-text-primary);
          text-decoration: none;
          transition: all 0.15s;
        }
        .google-btn:hover {
          background: var(--dd-surface-3);
          border-color: var(--dd-text-muted);
          color: var(--dd-text-primary);
        }
        .login-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-block: 1.25rem;
          color: var(--dd-text-muted);
          font-size: 0.82rem;
        }
        .login-divider::before,
        .login-divider::after {
          content: "";
          flex: 1;
          border-top: 1px solid var(--dd-border);
        }
      `}</style>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}
