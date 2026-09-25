import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BrainCircuit, Check, Eye, Shield } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = { title: "دربارهٔ dotdive", description: "چرا dotdive ساخته شد و چه مشکلی را حل می‌کند" };

export default function AboutPage() {
  return <div className="simple-page"><SiteHeader /><main className="simple-shell"><Link href="/" className="back-link"><ArrowRight /> بازگشت به صفحهٔ اصلی</Link><span className="section-kicker">دربارهٔ dotdive</span><h1>دانش پروژه، مستقل از آدم‌ها</h1><p className="lead">هر پروژهٔ نرم‌افزاری، پشت خودش صدها تصمیم کوچک و بزرگ دارد. dotdive ساخته شد تا این دانش فقط در ذهن تیمی که پروژه را ساخته باقی نماند.</p><div className="about-grid"><article><h2>ما چه‌کار می‌کنیم</h2><p>dotdive مستندات و محتوای آموزشی هر پروژه را در یک مرجع زنده جمع می‌کند: معماری، تصمیم‌ها و دلیل آن‌ها، و راهنمای فنی. این مرجع هم برای انسان قابل‌خواندن است، هم برای مدل‌های هوش مصنوعی.</p></article><article><h2>چرا این مهم است</h2><ul><li><Check /> استقلال از تیم توسعه</li><li><Check /> تصمیم‌گیری سریع‌تر</li><li><Check /> بدون دوباره‌کاری</li><li><Check /> آماده برای هوش مصنوعی</li></ul></article></div><div className="about-pillars"><div><Shield /><strong>امن و قابل‌اعتماد</strong></div><div><Eye /><strong>شفاف و قابل‌فهم</strong></div><div><BrainCircuit /><strong>ساختاریافته برای AI</strong></div></div></main></div>;
}
      
