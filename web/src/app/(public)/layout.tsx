import type { Metadata } from "next";
import "@/styles/landing.css";

export const metadata: Metadata = {
  title: "دات دایو — یک لینک تا قلب پروژه",
  description:
    "دانش هر پروژه، همیشه در دسترس؛ مستقل از اینکه چه کسی آن را ساخته.",
  alternates: {
    canonical: "/",
  },
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
