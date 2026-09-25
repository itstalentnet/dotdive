import React from "react";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "تماس با ما",
  description:
    "راه‌های ارتباط با تیم مهندسی و پشتیبانی دات دایو؛ ارسال پیام و درخواست مشاوره مستندسازی پروژه",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "تماس با دات دایو",
    description: "راه‌های ارتباط با تیم مهندسی و پشتیبانی دات دایو",
    url: "/contact",
  },
};

const contactJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "تماس با دات دایو",
  url: "https://www.dotdive.ir/contact",
  description: "راه‌های ارتباطی، ارسال پیام و ایمیل به تیم دات دایو.",
  mainEntity: {
    "@type": "Organization",
    name: "دات دایو",
    alternateName: "DotDive",
    url: "https://www.dotdive.ir",
    contactPoint: {
      "@type": "ContactPoint",
      email: "hi@dotdive.ir",
      contactType: "customer service",
      availableLanguage: ["Persian", "English"],
    },
  },
};

export default function ContactPage() {
  return (
    <div className="public-page-wrapper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
      <SiteHeader />

      <main className="page-main">
        <div className="contact-container">
          <header className="contact-header">
            <h1 className="contact-title">تماس با دات دایو</h1>
            <p className="contact-desc">
              سؤالی دارید یا می‌خواهید مستندات پروژه‌تان را به دات دایو بیاورید؟
              برای ما بنویسید یا مستقیماً به{" "}
              <a href="mailto:hi@dotdive.ir" dir="ltr" className="hover:underline">
                hi@dotdive.ir
              </a>{" "}
              ایمیل ارسال کنید.
            </p>
          </header>

          <ContactForm />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
