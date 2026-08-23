'use client';

import { useState, useCallback } from 'react';
import { BookingDialog } from './_components/booking-dialog';
import { HeroSection } from './_components/hero-section';
import { ServiceCategoriesGrid } from './_components/service-categories-grid';
import { FeaturedServices } from './_components/featured-services';
import { CTASection } from './_components/cta-section';

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [bookingService, setBookingService] = useState<Record<string, unknown> | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const handleSelectCategory = useCallback((slug: string | null) => {
    setSelectedCategory(slug);
    if (slug !== null) {
      setTimeout(() => {
        document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, []);

  const handleBookService = useCallback((service: Record<string, unknown>) => {
    setBookingService(service);
    setBookingOpen(true);
  }, []);

  const handleBookingOpenChange = useCallback((open: boolean) => {
    setBookingOpen(open);
    if (!open) {
      setBookingService(null);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-sovereign-obsidian text-sovereign-white font-arabic" dir="rtl">
      <HeroSection />
      <ServiceCategoriesGrid
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />
      <FeaturedServices
        selectedCategory={selectedCategory}
        onBookService={handleBookService}
      />
      <CTASection />

      {bookingService && (
        <BookingDialog
          service={bookingService}
          open={bookingOpen}
          onOpenChange={handleBookingOpenChange}
        />
      )}
    </div>
  );
}
