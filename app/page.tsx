// ═══════════════════════════════════════════════════════════════════
// Homepage — Server Component (SSR)
// All data is fetched server-side via direct DB queries.
// Client sub-components handle only animations/interactivity.
// ═══════════════════════════════════════════════════════════════════

import { Suspense } from 'react';
import { FeaturedProducts } from '@/components/product/featured-products';
import { getHomepageData } from '@/lib/homepage-data';
import { HeroEcosystem } from './_components/hero-ecosystem';
import { ArtisansGrid } from './_components/artisans-grid';
import { CustomerReviews } from './_components/customer-reviews';
import { StatisticsBar } from './_components/statistics-bar';
import { CTASection } from './_components/cta-section';
import { DignifiedLoader } from '@/shared/components/sovereign/dignified-loader';

export const dynamic = 'force-dynamic'; // Always fetch fresh data

export default async function HomePage() {
  const data = await getHomepageData();

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-sovereign-obsidian text-sovereign-white font-arabic" dir="rtl">
      <HeroEcosystem />

      {data.products.length > 0 && (
        <Suspense fallback={
          <div className="flex justify-center items-center py-20">
            <DignifiedLoader label="جاري تحميل المنتجات..." />
          </div>
        }>
          <FeaturedProducts products={data.products} />
        </Suspense>
      )}

      {data.artisans.length > 0 && (
        <ArtisansGrid artisans={data.artisans} />
      )}

      {data.reviews.length > 0 && (
        <CustomerReviews reviews={data.reviews} />
      )}

      <StatisticsBar stats={data.stats} />

      <CTASection />
    </div>
  );
}