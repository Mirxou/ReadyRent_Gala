'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { vendorsApi } from '@/lib/api';
import { VendorCard } from '@/components/vendors/vendor-card';
import { Store, Search } from 'lucide-react';
import { useState } from 'react';
import { ParticleField } from '@/components/ui/particle-field';
import { motion } from 'framer-motion';

interface Vendor {
  id: number;
  business_name_ar: string;
  description_ar: string;
  logo: string;
  rating: number;
  total_products: number;
  total_sales: number;
  city: string;
  is_verified: boolean;
}

export default function VendorsPage() {
  const [search, setSearch] = useState('');

  const { data: vendors, isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => vendorsApi.getAll().then((res) => res.data),
  });

  const filteredVendors = vendors?.results?.filter((vendor: any) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        vendor.name?.toLowerCase().includes(searchLower) ||
        vendor.business_name_ar?.toLowerCase().includes(searchLower) ||
        vendor.description?.toLowerCase().includes(searchLower) ||
        vendor.description_ar?.toLowerCase().includes(searchLower) ||
        vendor.location?.toLowerCase().includes(searchLower) ||
        vendor.city?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || vendors?.results || vendors || [];

  return (
    <div className="relative min-h-screen">
      <ParticleField />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gala-purple/20 mb-6">
            <Store className="h-10 w-10 text-gala-purple" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gala-purple via-gala-pink to-gala-gold bg-clip-text text-transparent">
            الموردون والمصممون
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            اكتشف مصممينا وموردينا المميزين
          </p>
        </motion.div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث في الموردين..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">جاري تحميل الموردين...</p>
          </div>
        ) : filteredVendors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVendors.map((vendor: any, index: number) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <VendorCard vendor={vendor} />
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">لا يوجد موردون</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


