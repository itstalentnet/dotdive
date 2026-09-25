"use client";

import React, { useState } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function ContactPage() {
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

  return (
    <div className="public-page-wrapper">
      <SiteHeader />

      <main className="page-main">
        <div className="contact-container">
          <header className="contact-header">
            <h1 className="contact-title">تماس با دات دایو</h1>
            <p className="contact-desc">
              سؤالی دارید یا می‌خواهید مستندات پروژه‌تان را به دات دایو بیاورید؟
              برای ما بنویسید یا مستقیماً به{" "}
              <a href="mailto:hi@dotdive.dev" dir="ltr">
                hi@dotdive.dev
              </a>{" "}
              ایمیل ارسال کنید.
            </p>
          </header>

          {status === "sent" ? (
            <div className="contact-success">
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
          ) : (
            <form onSubmit={handleSubmit} className="contact-form" noValidate>
              <div className="contact-field">
                <label htmlFor="contact-name" className="contact-label">
                  نام
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
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
                  type="email"
                  required
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
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
