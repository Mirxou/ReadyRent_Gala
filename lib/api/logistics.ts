import { sovereignClient } from './sovereign-client';

// TODO: routes not yet implemented — /locations/addresses, /locations/delivery-zones
export const locationsApi = {
  getMyAddresses: () => sovereignClient.get<unknown[]>('/locations/addresses/'),
  createAddress: (data: Record<string, unknown>) => sovereignClient.post<unknown>('/locations/addresses/', data),
  getDeliveryZones: (params?: Record<string, unknown>) => sovereignClient.get<unknown[]>('/locations/delivery-zones/', { params }),
  getDeliveryTracking: (id: string) => sovereignClient.get<unknown>(`/locations/delivery-requests/${id}/`),

  /** Check if same-day delivery is available for a zone (used by booking-calendar.tsx) */
  checkSameDayDelivery: (zoneId: string) =>
    sovereignClient.get<{ available: boolean; fee: number }>(`/locations/delivery-zones/${zoneId}/same-day/`),
};

export const logisticsApi = { // Unified Packaging + Returns
  getReturns: () => sovereignClient.get<unknown[]>('/returns/'),
  createReturn: (data: Record<string, unknown>) => sovereignClient.post<unknown>('/returns/create/', data),

  getPackagingTypes: (params?: Record<string, unknown>) => sovereignClient.get<unknown[]>('/packaging/types/', { params }),
  getSuggestedPackaging: (productId: string) =>
    sovereignClient.get<unknown>('/packaging/instances/suggested_for_booking/', {
      params: { product_id: productId },
    }),
};

// TODO: routes not yet implemented — /warranties/*
export const warrantiesApi = {
  getPlans: (params?: Record<string, unknown>) => sovereignClient.get<unknown[]>('/warranties/warranty-plans/', { params }),
  calculatePrice: (planId: string, rentalPrice: number) =>
    sovereignClient.get<unknown>(`/warranties/warranty-plans/${planId}/calculate_price/`, {
      params: { rental_price: rentalPrice },
    }),
  createClaim: (data: Record<string, unknown>) => sovereignClient.post<unknown>('/warranties/claims/', data),
};
