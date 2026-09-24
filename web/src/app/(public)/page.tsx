import Link from "next/link";
import {
  BookOpen,
  ShieldCheck,
  Search,
  GitBranch,
  ArrowLeft,
  Terminal,
  Layers,
  Lock,
  Workflow,
  FileText,
  Sparkles,
  ChevronLeft,
  Compass,
  Code2,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";

export default function LandingPage() {
  return (
    <div className="landing">
      <SiteHeader />
      <main>
        <HeroSection />
        <WorkspacePreview />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}

/* ── Refined Hero ───────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-badge">
          <Sparkles size={12} strokeWidth={2} className="text-amber-400" />
          <span>دانشنامه و مستندات فنی تیم‌های نرم‌افزاری</span>
        </div>

        <h1 className="hero-title">
          نقطهٔ شیرجه به پروژه‌ها
          <br />
          <span className="hero-title-accent">یکپارچه، سریع و کاملاً فارسی</span>
        </h1>

        <p className="hero-desc">
          مستندات معماری، سرویس‌ها و جریان‌های داده را بدون دیتابیس و در قالب
          فایل‌های سادهٔ Markdown در گیت‌هاب نگهداری کنید؛ با جستجوی هوشمند و
          تفکیک سطوح دسترسی.
        </p>

        <div className="hero-actions">
          <Link href="/login" className="btn-primary large">
            <span>شروع شیرجه</span>
            <ArrowLeft size={14} strokeWidth={2} />
          </Link>
          <Link href="/docs" className="btn-ghost large">
            <BookOpen size={14} strokeWidth={1.75} />
            <span>مشاهده مستندات عمومی</span>
          </Link>
        </div>

        <div className="hero-specs">
          <div className="spec-item">
            <GitBranch size={13} strokeWidth={1.75} />
            <span>فقط Markdown در گیت‌هاب</span>
          </div>
          <div className="spec-item">
            <ShieldCheck size={13} strokeWidth={1.75} />
            <span>تفکیک امنیتی Zero-Leak</span>
          </div>
          <div className="spec-item">
            <Search size={13} strokeWidth={1.75} />
            <span>جستجوی هوشمند فارسی</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Notion-Style Workspace Mockup ──────────────────────────── */
function WorkspacePreview() {
  return (
    <div className="container">
      <div className="preview-wrapper">
        <div className="preview-topbar">
          <div className="preview-controls">
            <span className="preview-dot" />
            <span className="preview-dot" />
            <span className="preview-dot" />
          </div>
          <div className="preview-breadcrumb">
            dotdive / nons / backend / auth-service.md
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Lock size={12} strokeWidth={1.75} />
            <span>خصوصی</span>
          </div>
        </div>

        <div className="preview-body">
          {/* Sidebar */}
          <div className="preview-sidebar">
            <div className="preview-nav-item">
              <Compass size={13} strokeWidth={1.75} />
              <span>پروژه nons</span>
            </div>
            <div className="preview-nav-item active">
              <Lock size={13} strokeWidth={1.75} />
              <span>سرویس احراز هویت</span>
            </div>
            <div className="preview-nav-item">
              <Workflow size={13} strokeWidth={1.75} />
              <span>چرخه سفارشات</span>
            </div>
            <div className="preview-nav-item">
              <Code2 size={13} strokeWidth={1.75} />
              <span>استاندارد خطاها</span>
            </div>
          </div>

          {/* Document Content */}
          <div className="preview-content">
            <div className="preview-content-title">
              <Lock size={16} strokeWidth={1.75} />
              <span>جریان احراز هویت و صدور نشست‌ها</span>
            </div>
            <p className="preview-content-desc">
              تمام ریشه‌های خصوصی پشت لایهٔ احراز هویت یکپارچه محافظت می‌شوند.
              نشست‌ها به صورت HttpOnly و با سکرت رمزنگاری‌شده صادر می‌گردند.
            </p>
            <div className="preview-code-box">
              <span style={{ color: "#79c0ff" }}>GET</span> /api/auth/verify?token=...<br />
              <span style={{ color: "#7ee787" }}>200 OK</span> — Cache-Control: private, no-store
            </div>
          </div>

          {/* Table of contents */}
          <div className="preview-toc">
            <div className="preview-toc-title">در این صفحه</div>
            <div className="preview-toc-item" style={{ color: "var(--dd-accent)" }}>
              • احراز هویت با گوگل
            </div>
            <div className="preview-toc-item">• کد یک‌بارمصرف (OTP)</div>
            <div className="preview-toc-item">• دفاع در عمق</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Features Section ───────────────────────────────────────── */
function FeaturesSection() {
  const features = [
    {
      icon: <GitBranch size={15} strokeWidth={1.75} />,
      title: "معماری بر پایه گیت",
      desc: "هیچ فرم، ویرایشگر آنلاین یا دیتابیسی وجود ندارد. نوشتن مستندات با commit کردن فایل‌های Markdown در ریپو انجام می‌شود.",
    },
    {
      icon: <ShieldCheck size={15} strokeWidth={1.75} />,
      title: "تفکیک امنیتی بدون نشت",
      desc: "صفحات خصوصی هرگز در خروجی‌های استاتیک یا CDN قرار نمی‌گیرند و در هر درخواست سمت سرور اعتبارسنجی می‌شوند.",
    },
    {
      icon: <Search size={15} strokeWidth={1.75} />,
      title: "موتور جستجوی اختصاصی فارسی",
      desc: "پردازش کامل نیم‌فاصله، نویسه‌های عربی (ی/ک)، ارقام و پیشوندها با فیلتر بلادرنگ سطح دسترسی کاربر.",
    },
  ];

  return (
    <section className="features">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">طراحی‌شده برای تیم‌های فنی مدرن</h2>
          <p className="section-desc">
            ترکیب سادگی Notion با امنیت و سرعت مستندات مهندسی
          </p>
        </div>

        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon-wrapper">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Minimal Footer ─────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="landing-footer">
      <div className="container">
        <span>dotdive — دانشنامه و نقطهٔ شیرجه زدن به پروژه‌ها</span>
        <div className="footer-links">
          <Link href="/docs" className="footer-link">
            مستندات
          </Link>
          <Link href="/projects" className="footer-link">
            پروژه‌ها
          </Link>
          <Link href="/login" className="footer-link">
            ورود
          </Link>
        </div>
      </div>
    </footer>
  );
}
