import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  Check,
  FileText,
  LockKeyhole,
  Search,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";

const values = [
  { icon: LockKeyhole, title: "استقلال", text: "دانش پروژه مال کسب‌وکار است؛ نه گروگان یک تیم یا یک نفر." },
  { icon: FileText, title: "شفافیت", text: "هر تصمیم، دلیلش و مسیر رسیدن به آن در یک مرجع زنده ثبت می‌شود." },
  { icon: Sparkles, title: "سادگی", text: "یک لینک، یک نقطهٔ شروع روشن و بدون پنل پیچیده برای همهٔ تیم." },
];

const posts = [
  { tag: "شروع کار", title: "چطور یک مرجع دانش برای پروژه بسازیم؟", date: "۲۴ شهریور ۱۴۰۵", time: "۶ دقیقه" },
  { tag: "تصمیم‌گیری", title: "چرا ثبت دلیل تصمیم‌ها از خود تصمیم مهم‌تر است؟", date: "۱۸ شهریور ۱۴۰۵", time: "۴ دقیقه" },
  { tag: "هوش مصنوعی", title: "مستنداتی که مدل هوش مصنوعی هم می‌خواند", date: "۱۰ شهریور ۱۴۰۵", time: "۷ دقیقه" },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <SiteHeader />
      <main>
        <section className="hero-section">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="landing-container hero-inner">
            <div className="eyebrow"><span className="eyebrow-dot" />مرجع دانش پروژه‌های شما</div>
            <h1>یک لینک تا<br /><span>قلب پروژه.</span></h1>
            <p className="hero-copy">مستندات پروژه را زنده، قابل‌جستجو و همیشه در دسترس نگه دارید؛ برای انسان‌ها و مدل هوش مصنوعی دلخواهتان.</p>
            <div className="hero-actions">
              <Link href="/login" className="landing-button primary">وارد مستندات شو <ArrowLeft data-icon="inline-end" /></Link>
              <Link href="/docs" className="landing-button secondary">مشاهدهٔ مستندات عمومی <BookOpen data-icon="inline-start" /></Link>
            </div>
            <div className="hero-proof"><Check /> بدون پنل اضافه <span /> <Check /> بر پایهٔ Markdown <span /> <Check /> آماده برای AI</div>
          </div>
        </section>

        <section className="product-preview-section" aria-label="پیش‌نمایش محصول">
          <div className="landing-container">
            <div className="product-window">
              <div className="window-bar"><span /><span /><span /><code>docs.dotdive / architecture / decisions</code><div className="window-status"><span className="status-dot" />همگام‌سازی شده</div></div>
              <div className="window-body">
                <aside className="window-sidebar"><div className="window-project"><div className="project-mark">n</div><div><strong>nons</strong><small>پروژهٔ نمونه</small></div><span>⌄</span></div><div className="window-label">مستندات</div>{["شروع کار", "معماری سیستم", "تصمیم‌های فنی", "راهنمای استقرار"].map((item, index) => <div className={`window-nav ${index === 2 ? "selected" : ""}`} key={item}><FileText />{item}</div>)}</aside>
                <div className="window-content"><div className="window-breadcrumb">nons <span>/</span> تصمیم‌های فنی</div><h2>ثبت تصمیم‌های معماری</h2><p>چرا این مسیر را انتخاب کردیم و چه گزینه‌هایی را بررسی کردیم؟ اینجا پاسخ هر دو سؤال، کنار خود تصمیم باقی می‌ماند.</p><div className="window-callout"><BrainCircuit /><div><strong>برای انسان و ماشین</strong><span>محتوا ساختاریافته است تا مدل هوش مصنوعی شما هم بتواند از آن استفاده کند.</span></div></div><div className="fake-lines"><i /><i /><i className="short" /></div></div>
                <aside className="window-toc"><strong>در این صفحه</strong><span className="active">مسئله چه بود؟</span><span>گزینه‌های بررسی‌شده</span><span>تصمیم نهایی</span></aside>
              </div>
            </div>
          </div>
        </section>

        <section className="values-section"><div className="landing-container"><div className="section-intro"><span className="section-kicker">چرا dotdive</span><h2>دانش پروژه، مستقل از آدم‌ها</h2><p>وقتی دلیل تصمیم‌ها ثبت باشد، تیم‌ها سریع‌تر حرکت می‌کنند و کسب‌وکارها کنترل بیشتری دارند.</p></div><div className="values-grid">{values.map(({ icon: Icon, title, text }) => <article className="value-card" key={title}><div className="value-icon"><Icon /></div><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

        <section className="blog-section"><div className="landing-container"><div className="section-heading-row"><div><span className="section-kicker">از وبلاگ</span><h2>چیزهایی که یاد می‌گیریم</h2></div><Link href="/blog" className="text-link">همهٔ نوشته‌ها <ArrowLeft /></Link></div><div className="blog-grid">{posts.map((post) => <Link className="post-card" href="/blog" key={post.title}><div className="post-cover"><span>{post.tag}</span><div className="post-glyph"><Search /></div></div><div className="post-meta">{post.date}<span />{post.time} مطالعه</div><h3>{post.title}</h3><span className="read-more">خواندن نوشته <ArrowLeft /></span></Link>)}</div></div></section>
      </main>
      <footer className="landing-footer"><div className="landing-container footer-inner"><div><strong>dotdive</strong><p>دانش پروژه، همیشه در دسترس.</p></div><nav><Link href="/about">دربارهٔ ما</Link><Link href="/contact">تماس با ما</Link><Link href="/docs">مستندات</Link><Link href="/login">ورود</Link></nav><small>© ۱۴۰۵ dotdive</small></div></footer>
    </div>
  );
}

export const dynamic = "force-dynamic";

      
