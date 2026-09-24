import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "كراء بلا همّ | منصة كراء المعدات بالضمان",
  description:
    "منصة جزائرية لكراء المعدات: كراء + ضمان محتجز بشفافية يُعاد بعد الإرجاع + تأمين بسيط، مع إشعارات بريدية آلية وتقييمات بعد اكتمال الحجز.",
  keywords: ["كراء", "معدات", "الجزائر", "ضمان", "escrow", "rental"],
  authors: [{ name: "كراء بلا همّ" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${cairo.className} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
