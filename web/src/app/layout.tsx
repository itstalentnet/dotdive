import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | dotdive",
    default: "dotdive — دانشنامه و نقطهٔ شیرجه زدن به پروژه‌ها",
  },
  description: "دانشنامه و مستندات کاملاً فارسی با ظاهر مدرن و مینیمال",
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: "dotdive",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
