import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: {
    default: "منصة لمّتنا ",
    template: "%s | لمّتنا",
  },
  description:
    "لمّتنا منصة عربية لألعاب الأسئلة والمسابقات الجماعية بتجربة أنيقة وسريعة ومناسبة لكافة المناسبات والتجمعات.",
  applicationName: "لمّتنا",
  keywords: [
    "لمّتنا",
    "ألعاب أسئلة",
    "مسابقات",
    "لعبة جماعية",
    "منصة مسابقات",
    "أسئلة وأجوبة",
  ],
  openGraph: {
    title: "لمّتنا",
    description:
      "منصة عربية لألعاب الأسئلة والمسابقات الجماعية بتجربة أنيقة وسريعة.",
    siteName: "لمّتنا",
    locale: "ar_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "لمّتنا",
    description:
      "منصة عربية لألعاب الأسئلة والمسابقات الجماعية بتجربة أنيقة وسريعة.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-slate-950 text-white antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}