/** Design: Arabic-first application shell for the Quiet Connection Lab dashboard. */
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "وصلة | إدارة أحداث واتساب",
  description: "لوحة عربية لربط واتساب وإدارة قواعد الأحداث.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl" className="h-full"><body className="min-h-full">{children}</body></html>;
}
