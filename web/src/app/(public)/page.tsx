import Link from "next/link";
import { LogoIcon } from "@/components/ui/logo";

export default function LandingPage() {
  return (
    <div className="landing">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}

/* ── Header ──────────────────────────────────────────────────── */
function Header() {
  return (
    <header className="landing-header">
      <nav className="container">
        <Link href="/" className="logo-link" aria-label="صفحهٔ اصلی dotdive">
          <LogoIcon />
          <span className="logo-text">dotdive</span>
        </Link>
        <div className="header-actions">
          <Link href="/docs" className="nav-link">مستندات</Link>
          <Link href="/blog" className="nav-link">وبلاگ</Link>
          <Link href="/login" className="btn-primary touch-target">ورود</Link>
        </div>
      </nav>
    </header>
  );
}

/* ── Hero ─────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-badge">
          <span>🌊</span>
          <span>دانشنامهٔ تیم‌های فنی</span>
        </div>

        <h1 className="hero-title">
          نقطهٔ شیرجه‌زدن
          <br />
          <span className="hero-title-accent">به پروژه‌ها</span>
        </h1>

        <p className="hero-desc">
          مستندات فارسی تیم‌های مهندسی با ظاهری مینیمال و مدرن.
          <br />
          محتوا در Markdown، نگهداری در گیت‌هاب، دسترسی ایمن.
        </p>

        <div className="hero-actions">
          <Link href="/login" className="btn-primary large touch-target">
            شروع شیرجه
          </Link>
          <Link href="/docs" className="btn-ghost large touch-target">
            مستندات عمومی
          </Link>
        </div>

        {/* Feature pills */}
        <div className="hero-pills">
          {["فقط Markdown", "RTL درجه‌یک", "جستجوی فارسی", "دسترسی امن"].map(
            (pill) => (
              <span key={pill} className="pill">
                {pill}
              </span>
            )
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Features ─────────────────────────────────────────────────── */
function FeaturesSection() {
  const features = [
    {
      icon: "📁",
      title: "محتوا در گیت‌هاب",
      desc: "فایل Markdown بگذارید و deploy کنید. هیچ پنل مدیریتی، هیچ دیتابیسی.",
    },
    {
      icon: "🔒",
      title: "دسترسی ایمن",
      desc: "ریشه‌های خصوصی فقط برای ایمیل‌های مجاز. ورود با گوگل یا کد یک‌بارمصرف.",
    },
    {
      icon: "🔍",
      title: "جستجوی فارسی",
      desc: "جستجوی هوشمند با پشتیبانی کامل از نیم‌فاصله، ی/ک عربی و ارقام.",
    },
  ];

  return (
    <section className="features">
      <div className="container">
        <h2 className="section-title">چرا dotdive؟</h2>
        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Footer ───────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="landing-footer">
      <div className="container">
        <p className="footer-text">
          ساخته‌شده با ❤ — dotdive
        </p>
      </div>
    </footer>
  );
}
