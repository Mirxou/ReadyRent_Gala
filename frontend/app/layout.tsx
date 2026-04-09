import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Analytics from "@/lib/analytics";
import { GrainOverlay } from "@/components/ui/grain-overlay";
import { PageTransition } from "@/components/ui/page-transition";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"),
  title: {
    default: "STANDARD.Rent | معيار السيادة والفخامة",
    template: "%s | STANDARD.Rent",
  },
  description: "المنصة السيادية الأولى لتداول الأصول الفاخرة في الجزائر. نظام بيئي ذكي مدعوم ببروتوكولات الثقة والشفافية الراديكالية.",
  keywords: ["سيادة", "فخامة", "تداول أصول", "الجزائر", "ثقة رقمية", "مبني على الحقائق"],
  authors: [{ name: "STANDARD Sovereign Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "STANDARD Sovereign",
  },
  openGraph: {
    type: "website",
    locale: "ar_DZ",
    url: "/",
    siteName: "STANDARD.Rent",
    images: [
      {
        url: "/images/manifesto/frame1.png",
        width: 1200,
        height: 630,
        alt: "STANDARD.Rent Sovereign Manifesto",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#b89f67",
  width: "device-width",
  initialScale: 1,
  // ♿ ACCESSIBILITY: Removed maximumScale: 1 to allow user zooming (Audit L8)
};

import { SovereignProvider } from "@/contexts/SovereignContext";
import { SystemHaltBanner } from "@/shared/components/sovereign/system-halt-banner";
import { SovereignConcierge } from "@/shared/components/sovereign/sovereign-concierge";

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
        className="antialiased relative overflow-x-hidden bg-sovereign-obsidian text-sovereign-white"
      >
        {/* Ambient Masterpiece Background (No Purple/Blue) */}
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-sovereign-obsidian">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sovereign-gold/5 blur-[160px] animate-pulse opacity-40"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-sovereign-gold/3 blur-[140px] animate-pulse [animation-delay:2s] opacity-30"></div>
        </div>

        {/* Cinematic Grain Overlay */}
        <GrainOverlay />

        <Analytics />
        <SovereignProvider>
          <SystemHaltBanner />
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
            <SovereignConcierge />
          </Providers>
        </SovereignProvider>
      </body>
    </html>
  );
}
