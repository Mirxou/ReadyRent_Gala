'use client'
import { formatNumber } from '@/lib/utils';;

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Package, TrendingUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Vendor {
  id: number;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  logo?: string;
  rating?: number;
  products_count?: number;
  location?: string;
  is_verified?: boolean;
  total_sales?: number;
  website?: string;
}

interface VendorCardProps {
  vendor: Vendor;
}

export function VendorCard({ vendor }: VendorCardProps) {
  const displayName = vendor.name_ar || vendor.name;
  const displayDescription = vendor.description_ar || vendor.description;

  return (
    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
      <Link href={`/vendors/${vendor.id}`}>
        <CardHeader>
          <div className="flex items-start gap-4">
            {vendor.logo && (
              <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={vendor.logo}
                  alt={displayName}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="group-hover:text-sovereign-gold transition-colors">
                  {displayName}
                </CardTitle>
                {vendor.is_verified && (
                  <Badge variant="default" className="bg-green-500">
                    موثق
                  </Badge>
                )}
              </div>
              {vendor.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{vendor.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {displayDescription && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {displayDescription}
            </p>
          )}
          
          <div className="flex items-center justify-between text-sm">
            {vendor.location && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{vendor.location}</span>
              </div>
            )}
            
            {vendor.products_count !== undefined && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>{vendor.products_count} منتج</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            {vendor.total_sales !== undefined && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">
                  {formatNumber(vendor.total_sales)} مبيع
                </span>
              </div>
            )}

            {vendor.website && (
              <div
                className="flex items-center gap-1 text-sovereign-gold hover:underline text-sm font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4" />
                <span>زيارة الموقع</span>
              </div>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}