"use client";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, RefreshCw, Mail, Check } from "lucide-react";

interface EmailLoginFormProps {
  next: string;
}

type Step = "email" | "code";

export function EmailLoginForm({ next }: EmailLoginFormProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setInterval(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCountdown]);

  // Auto-focus code input
  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), next }),
    });

    setLoading(false);
    setStep("code");
    setResendCountdown(60);
    if (!res.ok && res.status !== 404) {
      setError("خطا در ارسال کد. دوباره امتحان کنید.");
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), code, next }),
    });

    if (res.ok) {
      const data = await res.json();
      window.location.href = data.redirect ?? next;
      return;
    }

    setLoading(false);
    const data = await res.json().catch(() => ({}));
    setError(data.message ?? "کد نامعتبر یا منقضی شده است.");
    setCode("");
    codeRef.current?.focus();
  }

  if (step === "email") {
    return (
      <form onSubmit={handleEmailSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            آدرس ایمیل سازمانی
          </label>
          <input
            id="email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="developer@example.com"
            dir="ltr"
            autoComplete="email"
            required
            disabled={loading}
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        <button
          type="submit"
          className="submit-btn"
          disabled={loading || !email.trim()}
        >
          <span>{loading ? "در حال ارسال..." : "دریافت کد ورود"}</span>
          <ArrowLeft size={13} strokeWidth={2} />
        </button>
        <FormStyles />
      </form>
    );
  }

  return (
    <form onSubmit={handleCodeSubmit} noValidate>
      <p className="code-hint">
        اگر ایمیل <strong dir="ltr">{email}</strong> مجاز باشد، کد ۶ رقمی ارسال
        شد.
      </p>
      <div className="form-group">
        <label htmlFor="code" className="form-label">
          کد تأیید ۶ رقمی
        </label>
        <input
          id="code"
          ref={codeRef}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          className="form-input code-input"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="••••••"
          dir="ltr"
          disabled={loading}
        />
      </div>
      {error && <p className="form-error">{error}</p>}
      <button
        type="submit"
        className="submit-btn"
        disabled={loading || code.length !== 6}
      >
        <span>{loading ? "در حال تأیید..." : "ورود به سیستم"}</span>
        <Check size={13} strokeWidth={2.5} />
      </button>

      <div className="resend-row">
        <button
          type="button"
          className="resend-btn"
          disabled={resendCountdown > 0 || loading}
          onClick={() => {
            setStep("email");
            setCode("");
            setError("");
          }}
        >
          {resendCountdown > 0
            ? `ارسال مجدد (${resendCountdown}s)`
            : "ارسال مجدد کد"}
        </button>
        <button
          type="button"
          className="change-email-btn"
          onClick={() => {
            setStep("email");
            setCode("");
            setError("");
          }}
        >
          تغییر ایمیل
        </button>
      </div>
      <FormStyles />
    </form>
  );
}

function FormStyles() {
  return (
    <style>{`
      .form-group { margin-bottom: 0.85rem; }
      .form-label {
        display: block;
        font-size: 0.75rem;
        color: var(--dd-text-secondary);
        margin-bottom: 0.35rem;
        font-family: var(--font-body);
      }
      .form-input {
        width: 100%;
        height: 34px;
        padding-inline: 0.75rem;
        background: var(--dd-surface-0);
        border: 1px solid var(--dd-border);
        border-radius: 6px;
        color: var(--dd-text-primary);
        font-size: 0.825rem;
        font-family: var(--font-body);
        outline: none;
        transition: border-color 0.12s;
      }
      .form-input:focus {
        border-color: var(--dd-accent);
      }
      .form-input::placeholder {
        color: var(--dd-text-muted);
      }
      .code-input {
        height: 40px;
        font-size: 1.25rem;
        letter-spacing: 0.35em;
        text-align: center;
        font-family: var(--font-mono);
      }
      .form-error {
        font-size: 0.75rem;
        color: #f87171;
        margin-bottom: 0.65rem;
      }
      .submit-btn {
        width: 100%;
        height: 34px;
        background: #ededef;
        color: #0c0d0f;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        font-family: var(--font-body);
        font-size: 0.825rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.12s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
      }
      .submit-btn:hover {
        background: #ffffff;
      }
      .submit-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .code-hint {
        font-size: 0.75rem;
        color: var(--dd-text-secondary);
        margin-bottom: 1rem;
        line-height: 1.65;
      }
      .resend-row {
        display: flex;
        justify-content: space-between;
        margin-top: 0.85rem;
      }
      .resend-btn, .change-email-btn {
        background: none;
        border: none;
        font-size: 0.75rem;
        color: var(--dd-accent);
        cursor: pointer;
        padding: 0.15rem;
        font-family: var(--font-body);
        transition: color 0.12s;
      }
      .resend-btn:disabled {
        color: var(--dd-text-muted);
        cursor: not-allowed;
      }
      .change-email-btn:hover, .resend-btn:not(:disabled):hover {
        color: var(--dd-accent-hover);
      }
    `}</style>
  );
}
