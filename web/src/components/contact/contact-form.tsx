"use client";

import React, { useState } from "react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setStatus("submitting");
    setTimeout(() => {
      setStatus("sent");
    }, 450);
  };

  if (status === "sent") {
    return (
      <div className="contact-success" role="status" aria-live="polite">
        <h2 className="contact-success-title">پیام شما دریافت شد</h2>
        <p className="contact-success-desc">
          با تشکر از پیام شما؛ در کوتاه‌ترین زمان پاسخ خواهیم داد.
        </p>
        <button
          type="button"
          className="btn-minimal"
          onClick={() => {
            setStatus("idle");
            setName("");
            setEmail("");
            setMessage("");
          }}
          style={{ marginTop: "1.25rem", height: "34px", fontSize: "0.8rem" }}
        >
          ارسال پیام جدید
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="contact-form" noValidate>
      <div className="contact-field">
        <label htmlFor="contact-name" className="contact-label">
          نام و نام خانوادگی
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="contact-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="نام شما"
        />
      </div>

      <div className="contact-field">
        <label htmlFor="contact-email" className="contact-label">
          ایمیل
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          className="contact-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
        />
      </div>

      <div className="contact-field">
        <label htmlFor="contact-message" className="contact-label">
          پیام
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          className="contact-textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="پیام یا توضیحات پروژه..."
        />
      </div>

      <button
        type="submit"
        className="btn-minimal"
        disabled={status === "submitting"}
        style={{ width: "100%", marginTop: "0.25rem" }}
      >
        {status === "submitting" ? "در حال ارسال..." : "ارسال پیام"}
      </button>
    </form>
  );
}
