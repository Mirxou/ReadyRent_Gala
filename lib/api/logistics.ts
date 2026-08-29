import { sovereignClient } from './sovereign-client';

export const locationsApi = {
  getMyAddresses: () => sovereignClient.get<unknown[]>('/locations/addresses/'),
  createAddress: (data: Record<string, unknown>) => sovereignClient.post<unknown>('/locations/addresses/', data),
  getDeliveryZones: (params?: Record<string, unknown>) => sovereignClient.get<unknown[]>('/locations/delivery-zones/', { params }),
  getDeliveryTracking: (id: number) => sovereignClient.get<unknown>(`/locations/delivery-requests/${id}/`),

  /** Check if same-day delivery is available for a zone (used by booking-calendar.tsx) */
  checkSameDayDelivery: (zoneId: number | string) =>
    sovereignClient.get<{ available: boolean; fee: number }>(`/locations/delivery-zones/${zoneId}/same-day/`),
};

export const logisticsApi = { // Unified Packaging + Returns
  getReturns: () => sovereignClient.get<unknown[]>('/returns/returns/my_returns/'),
  createReturn: (data: Record<string, unknown>) => sovereignClient.post<unknown>('/returns/returns/', data),
  
  getPackagingTypes: (params?: Record<string, unknown>) => sovereignClient.get<unknown[]>('/packaging/types/', { params }),
  getSuggestedPackaging: (productId: number) => 
    sovereignClient.get<unknown>('/packaging/instances/suggested_for_booking/', { 
      params: new URLSearchParams({ product_id: productId.toString() }) 
    }),
};

export const warrantiesApi = {
  getPlans: (params?: Record<string, unknown>) => sovereignClient.get<unknown[]>('/warranties/warranty-plans/', { params }),
  calculatePrice: (planId: number, rentalPrice: number) => 
    sovereignClient.get<unknown>(`/warranties/warranty-plans/${planId}/calculate_price/`, { 
      params: new URLSearchParams({ rental_price: rentalPrice.toString() }) 
    }),
  createClaim: (data: Record<string, unknown>) => sovereignClient.post<unknown>('/warranties/claims/', data),
};
