'use client';

import { useMemo, useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

const libraries: ("places")[] = ["places"];

interface MapLocationProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onLocationSelect?: (lat: number, lng: number, address: string, placeId?: string) => void;
  readonly?: boolean;
  height?: string;
}

export function MapLocation({
  initialLat,
  initialLng,
  initialAddress,
  onLocationSelect,
  readonly = false,
  height = '400px',
}: MapLocationProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(
    initialLat && initialLng
      ? { lat: initialLat, lng: initialLng, address: initialAddress || '' }
      : null
  );
  const [searchAddress, setSearchAddress] = useState(initialAddress || '');

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const center = useMemo(() => {
    if (selectedLocation) {
      return { lat: selectedLocation.lat, lng: selectedLocation.lng };
    }
    // Default to Constantine, Algeria
    return { lat: 36.365, lng: 6.6147 };
  }, [selectedLocation]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    setAutocomplete(autocomplete);
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || place.name || '';
        const placeId = place.place_id;

        setSelectedLocation({ lat, lng, address });
        setSearchAddress(address);
        
        if (onLocationSelect) {
          onLocationSelect(lat, lng, address, placeId);
        }

        // Center map on selected location
        if (map) {
          map.setCenter({ lat, lng });
          map.setZoom(15);
        }
      }
    }
  }, [autocomplete, map, onLocationSelect]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (readonly || !e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    // Reverse geocode to get address
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const address = results[0].formatted_address;
        setSelectedLocation({ lat, lng, address });
        setSearchAddress(address);
        
        if (onLocationSelect) {
          onLocationSelect(lat, lng, address, results[0].place_id);
        }
      }
    });
  }, [readonly, onLocationSelect]);

  if (!isLoaded) {
    return (
      <Card>
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
          <MapPin className="h-5 w-5" />
          الموقع على الخريطة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!readonly && (
          <div className="space-y-2">
            <label className="text-sm font-medium">البحث عن عنوان</label>
            <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
              <Input
                placeholder="ابحث عن عنوان..."
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                className="w-full"
              />
            </Autocomplete>
          </div>
        )}

        <div style={{ height, width: '100%' }}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={center}
            zoom={selectedLocation ? 15 : 12}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onClick={handleMapClick}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
            }}
          >
            {selectedLocation && (
              <Marker
                position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                title={selectedLocation.address}
              />
            )}
          </GoogleMap>
        </div>

        {selectedLocation && (
          <div className="text-sm text-muted-foreground">
            <p><strong>العنوان:</strong> {selectedLocation.address}</p>
            <p><strong>الإحداثيات:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

