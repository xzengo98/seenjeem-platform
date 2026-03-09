import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: "SeenJeem Platform",
  description: "Arabic quiz gaming platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-slate-950 text-white antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}