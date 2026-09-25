import type { Metadata } from "next";
import "@/styles/globals.css";

function getMetadataBase(): URL {
  const siteUrl = process.env.SITE_URL?.trim();
  if (siteUrl) {
    try {
      return new URL(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`);
    } catch {
      // ignore
    }
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    try {
      return new URL(`https://${vercelUrl}`);
    } catch {
      // ignore
    }
  }

  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  title: {
    template: "%s | دات دایو",
    default: "دات دایو — یک لینک تا قلب پروژه",
  },
  description:
    "مرجع مستندات فنی و پایگاه دانش ساختاریافته تیم‌های مهندسی؛ آماده برای کاوش هوش مصنوعی و مدل‌های زبانی مستقل از سازندگان پروژه.",
  metadataBase: getMetadataBase(),
  applicationName: "دات دایو",
  keywords: [
    "دات دایو",
    "DotDive",
    "مستندات فنی",
    "پایگاه دانش مهندسی",
    "معماری نرم افزار",
    "وایب کدینگ",
    "LLM",
    "MCP",
    "ADR",
    "سند معماری",
    "مستندسازی پروژه",
  ],
  authors: [{ name: "دات دایو", url: "https://www.dotdive.ir" }],
  creator: "دات دایو",
  publisher: "دات دایو",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: "دات دایو | DotDive",
    title: "دات دایو — یک لینک تا قلب پروژه",
    description:
      "دانش هر پروژه، همیشه در دسترس؛ مستقل از اینکه چه کسی آن را ساخته.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "دات دایو — یک لینک تا قلب پروژه",
    description:
      "مرجع مستندات و پایگاه دانش ساختاریافته پروژه‌ها، آماده برای مصرف انسان و مدل‌های هوش مصنوعی.",
  },
};

const jsonLdGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.dotdive.ir/#website",
      url: "https://www.dotdive.ir",
      name: "دات دایو",
      alternateName: ["DotDive", "dotdive"],
      description:
        "دانش هر پروژه، همیشه در دسترس؛ مستقل از اینکه چه کسی آن را ساخته.",
      inLanguage: "fa-IR",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://www.dotdive.ir/docs?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://www.dotdive.ir/#organization",
      name: "دات دایو",
      alternateName: "DotDive",
      url: "https://www.dotdive.ir",
      logo: {
        "@type": "ImageObject",
        url: "https://www.dotdive.ir/icon.svg",
        width: "512",
        height: "512",
      },
      sameAs: ["https://github.com/itstalentnet/dotdive"],
      contactPoint: {
        "@type": "ContactPoint",
        email: "hi@dotdive.ir",
        contactType: "customer service",
        availableLanguage: ["Persian", "English"],
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://www.dotdive.ir/#software",
      name: "DotDive",
      alternateName: "دات دایو",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "IRR",
      },
      description:
        "پلتفرم ساختاریافته مستندات فنی و پایگاه دانش مهندسی با پشتیبانی از اتصال به پروتکل MCP و مدل‌های هوش مصنوعی.",
    },
  ],
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
        <meta name="theme-color" content="#090a0c" />
        <link rel="author" href="https://www.dotdive.ir/about" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
