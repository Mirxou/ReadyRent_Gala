import { sovereignClient } from './sovereign-client';

export const locationsApi = {
  getMyAddresses: () => sovereignClient.get<any[]>('/locations/addresses/'),
  createAddress: (data: any) => sovereignClient.post<any>('/locations/addresses/', data),
  getDeliveryZones: (params?: any) => sovereignClient.get<any[]>('/locations/delivery-zones/', { params }),
  getDeliveryTracking: (id: number) => sovereignClient.get<any>(`/locations/delivery-requests/${id}/`),
};

export const logisticsApi = { // Unified Packaging + Returns
  getReturns: () => sovereignClient.get<any[]>('/returns/returns/my_returns/'),
  createReturn: (data: any) => sovereignClient.post<any>('/returns/returns/', data),
  
  getPackagingTypes: (params?: any) => sovereignClient.get<any[]>('/packaging/types/', { params }),
  getSuggestedPackaging: (productId: number) => 
    sovereignClient.get<any>('/packaging/instances/suggested_for_booking/', { 
      params: new URLSearchParams({ product_id: productId.toString() }) 
    }),
};

export const warrantiesApi = {
  getPlans: (params?: any) => sovereignClient.get<any[]>('/warranties/warranty-plans/', { params }),
  calculatePrice: (planId: number, rentalPrice: number) => 
    sovereignClient.get<any>(`/warranties/warranty-plans/${planId}/calculate_price/`, { 
      params: new URLSearchParams({ rental_price: rentalPrice.toString() }) 
    }),
  createClaim: (data: any) => sovereignClient.post<any>('/warranties/claims/', data),
};
