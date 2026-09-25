import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | دات دایو",
    default: "دات دایو — یک لینک تا قلب پروژه",
  },
  description: "دانش هر پروژه، همیشه در دسترس؛ مستقل از اینکه چه کسی آن را ساخته.",
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.svg",
  },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: "دات دایو",
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
