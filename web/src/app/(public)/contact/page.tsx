"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSent(true); }
  return <div className="simple-page"><SiteHeader /><main className="simple-shell contact-shell"><Link href="/" className="back-link"><ArrowRight /> بازگشت به صفحهٔ اصلی</Link><span className="section-kicker">ارتباط با ما</span><h1>بیایید دربارهٔ پروژه‌تان حرف بزنیم</h1><p className="lead">سؤالی دربارهٔ پروژه‌تان دارید، یا می‌خواهید مستندات تیم‌تان را در dotdive سازمان‌دهی کنید؟</p>{sent ? <div className="success-state"><div><Check /></div><h2>پیام شما دریافت شد.</h2><p>در کوتاه‌ترین زمان پاسخ می‌دهیم.</p><Link href="/" className="landing-button secondary">بازگشت به صفحهٔ اصلی</Link></div> : <form className="contact-form" onSubmit={submit}><label>نام<input required name="name" placeholder="نام و نام خانوادگی" /></label><label>ایمیل<input required type="email" name="email" dir="ltr" placeholder="you@example.com" /></label><label>نام کسب‌وکار / پروژه <small>اختیاری</small><input name="project" placeholder="نام پروژه" /></label><label>موضوع<select name="subject" defaultValue=""><option value="" disabled>موضوع پیام را انتخاب کنید</option><option>مشاوره برای پروژهٔ جدید</option><option>پیوستن پروژهٔ موجود به dotdive</option><option>مشکل فنی</option><option>سایر</option></select></label><label>پیام<textarea required name="message" rows={5} placeholder="چطور می‌توانیم کمک کنیم؟" /></label><button className="landing-button primary" type="submit">ارسال پیام</button></form>}</main></div>;
}
      
