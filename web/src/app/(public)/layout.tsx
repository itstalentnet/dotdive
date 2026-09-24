import type { Metadata } from "next";
import "@/styles/landing.css";

export const metadata: Metadata = {
  title: "dotdive — نقطهٔ شیرجه‌زدن به پروژه‌ها",
  description: "مستندات فارسی تیم‌های مهندسی با ظاهر مدرن و مینیمال",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
