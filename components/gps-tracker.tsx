'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation } from 'lucide-react';

interface GPSTrackerProps {
  deliveryId: number;
  currentLat?: number;
  currentLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  status?: string;
  trackingHistory?: Array<{ latitude: number; longitude: number; timestamp: string }>;
}

export function GPSTracker({
  deliveryId,
  currentLat,
  currentLng,
  destinationLat,
  destinationLng,
  status,
  trackingHistory = [],
}: GPSTrackerProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'قيد الانتظار', variant: 'outline' },
      assigned: { label: 'تم التعيين', variant: 'default' },
      in_transit: { label: 'قيد النقل', variant: 'default' },
      delivered: { label: 'تم التسليم', variant: 'secondary' },
      cancelled: { label: 'ملغي', variant: 'destructive' },
    };
    
    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const center = useMemo(() => {
    if (currentLat && currentLng) {
      return { lat: currentLat, lng: currentLng };
    }
    if (destinationLat && destinationLng) {
      return { lat: destinationLat, lng: destinationLng };
    }
    // Default to Constantine, Algeria
    return { lat: 36.365, lng: 6.6147 };
  }, [currentLat, currentLng, destinationLat, destinationLng]);

  const path = useMemo(() => {
    const points: Array<{ lat: number; lng: number }> = [];
    
    // Add tracking history points
    if (trackingHistory && trackingHistory.length > 0) {
      trackingHistory.forEach((point) => {
        points.push({ lat: Number(point.latitude), lng: Number(point.longitude) });
      });
    }
    
    // Add current position
    if (currentLat && currentLng) {
      points.push({ lat: currentLat, lng: currentLng });
    }
    
    return points;
  }, [trackingHistory, currentLat, currentLng]);

  if (!currentLat || !currentLng) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            تتبع التسليم
            {status && getStatusBadge(status)}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">لم يتم بدء التتبع بعد</p>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            تتبع التسليم
            {status && getStatusBadge(status)}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">جاري تحميل الخريطة...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          تتبع التسليم
          {status && getStatusBadge(status)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">خط العرض</p>
              <p className="font-semibold">{currentLat.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">خط الطول</p>
              <p className="font-semibold">{currentLng.toFixed(6)}</p>
            </div>
          </div>

          <div style={{ height: '400px', width: '100%' }}>
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={center}
              zoom={15}
              options={{
                disableDefaultUI: false,
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
              }}
            >
              {/* Current position marker */}
              {currentLat && currentLng && (
                <Marker
                  position={{ lat: currentLat, lng: currentLng }}
                  title="الموقع الحالي"
                  icon={{
                    url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                  }}
                />
              )}

              {/* Destination marker */}
              {destinationLat && destinationLng && (
                <Marker
                  position={{ lat: destinationLat, lng: destinationLng }}
                  title="الوجهة"
                  icon={{
                    url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                  }}
                />
              )}

              {/* Tracking path */}
              {path.length > 1 && (
                <Polyline
                  path={path}
                  options={{
                    strokeColor: '#3b82f6',
                    strokeOpacity: 0.8,
                    strokeWeight: 3,
                  }}
                />
              )}
            </GoogleMap>
          </div>

          {destinationLat && destinationLng && (
            <div className="text-xs text-muted-foreground">
              <p>الوجهة: {destinationLat.toFixed(6)}, {destinationLng.toFixed(6)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
