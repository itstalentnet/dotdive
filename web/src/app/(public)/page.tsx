import Link from "next/link";
import { ArrowLeft, BookOpen, Check, FileText, LockKeyhole, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";

const principles = [
  { icon: LockKeyhole, title: "مالکیت واقعی", text: "دانش پروژه کنار تیم شما می‌ماند؛ روشن، قابل انتقال و بدون وابستگی." },
  { icon: FileText, title: "ساختارمند", text: "هر تصمیم و راهنما در یک مرجع کوتاه، مرتب و قابل جستجو ثبت می‌شود." },
  { icon: Sparkles, title: "آماده برای AI", text: "محتوا برای خواندن انسان و استفاده از مدل‌های هوش مصنوعی آماده است." },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <SiteHeader />
      <main>
        <section className="hero-section">
          <div className="hero-orbit orbit-one" aria-hidden="true" />
          <div className="hero-orbit orbit-two" aria-hidden="true" />
          <div className="landing-container hero-inner">
            <div className="eyebrow"><span className="eyebrow-dot" />مرجع دانش پروژه</div>
            <h1>هر پروژه،<br /><span>یک نقطهٔ روشن.</span></h1>
            <p className="hero-copy">مستندات پروژه را زنده، مرتب و همیشه در دسترس نگه دارید؛ برای تیم، محصول و مدل هوش مصنوعی شما.</p>
            <div className="hero-actions">
              <Link href="/login" className="landing-button primary">شروع کنید <ArrowLeft data-icon="inline-end" /></Link>
              <Link href="/docs" className="landing-button secondary">مشاهدهٔ مستندات <BookOpen data-icon="inline-start" /></Link>
            </div>
            <div className="hero-proof"><Check /> بدون پنل اضافه <span /> <Check /> بر پایهٔ Markdown <span /> <Check /> آماده برای AI</div>
          </div>
        </section>

        <section className="product-preview-section" aria-label="پیش‌نمایش مستندات">
          <div className="landing-container">
            <div className="product-window">
              <div className="window-bar"><span /><span /><span /><code>docs.dotdive / decisions</code><div className="window-status"><span className="status-dot" />همگام‌سازی شده</div></div>
              <div className="window-body">
                <aside className="window-sidebar"><div className="window-project"><div className="project-mark">d</div><div><strong>dotdive</strong><small>پروژهٔ نمونه</small></div><span>⌄</span></div><div className="window-label">مستندات</div>{["شروع کار", "معماری سیستم", "تصمیم‌های فنی", "راهنمای استقرار"].map((item, index) => <div className={`window-nav ${index === 2 ? "selected" : ""}`} key={item}><FileText />{item}</div>)}</aside>
                <div className="window-content"><div className="window-breadcrumb">dotdive <span>/</span> تصمیم‌های فنی</div><h2>ثبت تصمیم‌های معماری</h2><p>دلیل تصمیم‌ها را کنار خود تصمیم نگه دارید تا تیم همیشه بداند چه چیزی، چرا و چگونه انتخاب شده است.</p><div className="window-callout"><Sparkles /><div><strong>یک مرجع برای همه</strong><span>ساختاری ساده برای انسان‌ها و مدل‌های هوش مصنوعی.</span></div></div><div className="fake-lines"><i /><i /><i className="short" /></div></div>
                <aside className="window-toc"><strong>در این صفحه</strong><span className="active">مسئله چه بود؟</span><span>گزینه‌های بررسی‌شده</span><span>تصمیم نهایی</span></aside>
              </div>
            </div>
          </div>
        </section>

        <section className="values-section"><div className="landing-container"><div className="section-intro"><span className="section-kicker">چرا dotdive</span><h2>کمتر جستجو کنید، بیشتر بسازید.</h2><p>یک فضای آرام و قابل اعتماد برای دانشی که نباید با تغییر آدم‌ها از بین برود.</p></div><div className="values-grid">{principles.map(({ icon: Icon, title, text }) => <article className="value-card" key={title}><div className="value-icon"><Icon /></div><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
      </main>
      <footer className="landing-footer"><div className="landing-container footer-inner"><div><strong>dotdive</strong><p>دانش پروژه، همیشه در دسترس.</p></div><nav><Link href="/about">دربارهٔ ما</Link><Link href="/contact">تماس با ما</Link><Link href="/docs">مستندات</Link><Link href="/login">ورود</Link></nav><small>© ۱۴۰۵ dotdive</small></div></footer>
    </div>
  );
}

export const dynamic = "force-dynamic";

       
