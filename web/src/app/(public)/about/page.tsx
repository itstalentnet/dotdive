import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = {
  title: "دربارهٔ دات دایو",
  description: "چرا دات دایو ساخته شد و چه مشکلی را حل می‌کند",
};

export default function AboutPage() {
  return (
    <div className="public-page-wrapper">
      <SiteHeader />

      <main className="page-main">
        <article className="about-container">
          <header className="about-header">
            <h1 className="about-title">دربارهٔ دات دایو</h1>
            <p className="about-intro">
              چرا دات دایو ساخته شد و چه مشکلی را حل می‌کند.
            </p>
          </header>

          <div className="about-content">
            <section>
              <h2>ماجرا از کجا شروع شد</h2>
              <p>
                هر پروژهٔ نرم‌افزاری، پشت خودش صدها تصمیم کوچک و بزرگ دارد: چرا این
                معماری، چرا این کتابخانه، چرا این مسیر و نه مسیر دیگر. این دانش
                معمولاً فقط در ذهن تیمی می‌ماند که پروژه را ساخته است. وقتی آن تیم
                در دسترس نباشد یا تغییر کند، تصمیم‌گیری متوقف می‌شود.
              </p>
              <p>
                با ظهور «وایب کدینگ» و شتاب فزاینده در ساخت نرم‌افزار، پروژه‌ها
                سریع‌تر از همیشه ساخته می‌شوند، ولی مستندسازی و انتقال دانش عقب
                می‌ماند. دات دایو برای حل همین شکاف بنیادین ساخته شد.
              </p>
            </section>

            <blockquote className="about-quote">
              <p>
                «دانش هر پروژه، همیشه در دسترس؛ مستقل از اینکه چه کسی آن را ساخته.»
              </p>
            </blockquote>

            <section>
              <h2>ما چه‌کار می‌کنیم</h2>
              <p>
                دات دایو مستندات و دانش هر پروژه را در یک مرجع زنده جمع می‌کند:
                معماری، تصمیم‌ها و دلیل آن‌ها، و راهنماهای فنی. این مرجع هم برای
                انسان ساختاریافته است و هم با یک لینک، مستقیم به MCP یا مدل هوش
                مصنوعی دلخواه کسب‌وکار متصل می‌شود تا بدون واسطه به سوالات پاسخ دهد.
              </p>
            </section>

            <section>
              <h2>چرا این مهم است</h2>
              <p>
                <strong>استقلال از تیم توسعه:</strong> دانش پروژه مال کسب‌وکار
                است، نه گروگان یک تیم یا یک فرد.
              </p>
              <p>
                <strong>بدون دوباره‌کاری:</strong> آنچه قبلاً تصمیم‌گیری و ساخته
                شده، دوباره از صفر اختراع نمی‌شود.
              </p>
              <p>
                <strong>تصمیم سریع‌تر:</strong> به دلیل و چرایی تصمیم‌های گذشته
                دسترسی دارید، نه فقط نتیجهٔ نهایی.
              </p>
              <p>
                <strong>آماده برای هوش مصنوعی:</strong> داده‌ها ساختاریافته‌اند تا
                مدل محبوب شما مستقیماً از آن پاسخ دهد.
              </p>
            </section>

            <div style={{ paddingTop: "1.5rem" }}>
              <Link href="/docs" className="btn-minimal">
                <span>مشاهده مستندات</span>
                <ArrowLeft size={14} strokeWidth={2} />
              </Link>
            </div>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
