/**
 * Email login form — client component
 * Handles email input → OTP code input flow
 */
"use client";
import { useState, useRef, useEffect } from "react";

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
    // Always show same message (anti-enumeration)
    setStep("code");
    setResendCountdown(60);
    if (!res.ok && res.status !== 404) {
      // Only show error if server error (not 404 which is expected for unknown emails)
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
    setError(data.message ?? "کد نادرست یا منقضی شده است.");
    setCode("");
    codeRef.current?.focus();
  }

  if (step === "email") {
    return (
      <form onSubmit={handleEmailSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            آدرس ایمیل
          </label>
          <input
            id="email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            dir="ltr"
            autoComplete="email"
            required
            disabled={loading}
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        <button
          type="submit"
          className="submit-btn touch-target"
          disabled={loading || !email.trim()}
        >
          {loading ? "در حال ارسال..." : "ارسال کد"}
        </button>
        <FormStyles />
      </form>
    );
  }

  return (
    <form onSubmit={handleCodeSubmit} noValidate>
      <p className="code-hint">
        اگر این ایمیل مجاز باشد، کدی به{" "}
        <strong dir="ltr">{email}</strong> ارسال شده است.
      </p>
      <div className="form-group">
        <label htmlFor="code" className="form-label">
          کد ۶ رقمی
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
          placeholder="123456"
          dir="ltr"
          disabled={loading}
        />
      </div>
      {error && <p className="form-error">{error}</p>}
      <button
        type="submit"
        className="submit-btn touch-target"
        disabled={loading || code.length !== 6}
      >
        {loading ? "در حال بررسی..." : "تأیید"}
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
            ? `ارسال مجدد (${resendCountdown})`
            : "ارسال مجدد"}
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
      .form-group { margin-bottom: 1rem; }
      .form-label {
        display: block;
        font-size: 0.82rem;
        color: var(--dd-text-secondary);
        margin-bottom: 0.4rem;
        font-family: var(--font-heading);
      }
      .form-input {
        width: 100%;
        padding: 0.65rem 0.875rem;
        background: var(--dd-surface-0);
        border: 1px solid var(--dd-border);
        border-radius: 8px;
        color: var(--dd-text-primary);
        font-size: 0.9rem;
        font-family: var(--font-body);
        outline: none;
        transition: border-color 0.15s;
      }
      .form-input:focus { border-color: var(--dd-accent); }
      .form-input::placeholder { color: var(--dd-text-muted); }
      .code-input {
        font-size: 1.5rem;
        letter-spacing: 0.25em;
        text-align: center;
        font-family: monospace;
      }
      .form-error {
        font-size: 0.82rem;
        color: #ef4444;
        margin-bottom: 0.75rem;
      }
      .submit-btn {
        width: 100%;
        padding: 0.7rem;
        background: var(--lemmo-interactive-primary-background);
        color: var(--lemmo-interactive-primary-foreground);
        border: none;
        border-radius: 8px;
        font-family: var(--font-heading);
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .code-hint {
        font-size: 0.82rem;
        color: var(--dd-text-secondary);
        margin-bottom: 1.25rem;
        line-height: 1.7;
      }
      .resend-row {
        display: flex;
        justify-content: space-between;
        margin-top: 1rem;
      }
      .resend-btn, .change-email-btn {
        background: none;
        border: none;
        font-size: 0.8rem;
        color: var(--dd-accent);
        cursor: pointer;
        padding: 0.25rem;
        font-family: var(--font-body);
        transition: color 0.15s;
      }
      .resend-btn:disabled { color: var(--dd-text-muted); cursor: not-allowed; }
      .change-email-btn:hover, .resend-btn:not(:disabled):hover { color: var(--dd-accent-hover); }
    `}</style>
  );
}
