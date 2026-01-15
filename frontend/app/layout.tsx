import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Analytics from "@/lib/analytics";
import { GrainOverlay } from "@/components/ui/grain-overlay";
import { PageTransition } from "@/components/ui/page-transition";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cairo = Cairo({ subsets: ["arabic"], variable: "--font-cairo" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"),
  title: {
    default: "ReadyRent.Gala | استئجار فساتين الحفلات",
    template: "%s | ReadyRent.Gala",
  },
  description: "منصة تأجير فساتين الحفلات الرائدة. تألقي في مناسباتك بأحدث التصاميم العالمية.",
  keywords: ["فساتين", "تأجير فساتين", "فساتين سهرة", "زفاف", "موضة", "الجزائر"],
  authors: [{ name: "ReadyRent Team" }],
  openGraph: {
    type: "website",
    locale: "ar_DZ",
    url: "/",
    siteName: "ReadyRent.Gala",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ReadyRent.Gala Preview",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Language will be set by client-side store on mount
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${cairo.className} ${inter.variable} ${cairo.variable} antialiased relative overflow-x-hidden`}
      >
        {/* Ambient Vibrant Background */}
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gala-purple/10 blur-[120px] animate-float opacity-70"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gala-pink/10 blur-[120px] animate-float [animation-delay:2s] opacity-70"></div>
        </div>

        {/* Cinematic Grain Overlay */}
        <GrainOverlay />

        <Analytics />
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
              <PageTransition>
                {children}
              </PageTransition>
            </main>
            <Footer />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
