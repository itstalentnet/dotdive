import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";

export default function LandingPage() {
  return (
    <div className="landing">
      <SiteHeader />
      <main className="landing-main">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-glow" aria-hidden="true" />
          <div className="landing-container hero-inner">
            <div className="eyebrow"><span className="eyebrow-dot" />مرجع هوشمند پروژه</div>
            <h1 id="hero-title">دانش پروژه،<br /><span>همیشه نزدیک.</span></h1>
            <p className="hero-copy">سؤال بپرسید، تصمیم‌ها را پیدا کنید و با یک مرجع روشن سریع‌تر بسازید.</p>

            <form className="ai-prompt" onSubmit={(event) => event.preventDefault()}>
              <div className="prompt-topline"><Sparkles aria-hidden="true" />از پروژه‌تان بپرسید</div>
              <textarea aria-label="سؤال خود را درباره پروژه بنویسید" placeholder="مثلاً: چرا این معماری را انتخاب کردیم؟" rows={3} />
              <div className="prompt-footer">
                <span>پاسخ‌ها بر پایه مستندات پروژه هستند</span>
                <button type="submit" aria-label="ارسال سؤال"><ArrowUpLeft data-icon="inline-start" /></button>
              </div>
            </form>

            <div className="hero-links">
              <Link href="/login" className="landing-button primary">شروع کنید <ArrowLeft data-icon="inline-end" /></Link>
              <Link href="/docs" className="text-link">مرور مستندات</Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="landing-footer"><div className="landing-container footer-inner"><div><strong>dotdive</strong><p>دانش پروژه، همیشه در دسترس.</p></div><nav aria-label="لینک‌های فوتر"><Link href="/about">درباره ما</Link><Link href="/contact">تماس با ما</Link><Link href="/docs">مستندات</Link><Link href="/login">ورود</Link></nav><small>© ۱۴۰۵ dotdive</small></div></footer>
    </div>
  );
}

export const dynamic = "force-dynamic";
