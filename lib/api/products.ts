import { sovereignClient } from './sovereign-client';

/**
 * Advanced Product Search & Filters API - Sovereign Unified
 */

export interface SearchFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  location?: string;
  availability?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popularity';
}

export interface Product {
  id: number;
  name: string;
  name_ar: string;
  slug: string;
  description: string;
  price_per_day: number;
  owner_id: number;
  images: { id: number; url: string; is_main: boolean }[];
  primary_image?: string;
  category_name: string;
  location_name: string;
  is_available: boolean;
  rating?: number;
  is_verified?: boolean;
  trust_score?: number;
  category?: {
    name_ar: string;
  };
}

export const productsApi = {
  /**
   * Get all products with optional filters (used by /products page)
   */
  getAll: (params?: Record<string, unknown>) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', String(params.search));
    if (params?.category) q.append('category', String(params.category));
    if (params?.price_min != null) q.append('min_price', String(params.price_min));
    if (params?.price_max != null) q.append('max_price', String(params.price_max));
    if (params?.location) q.append('location', String(params.location));
    if (params?.availability) q.append('availability', String(params.availability));
    if (params?.sort) q.append('ordering', String(params.sort));
    if (params?.page) q.append('page', String(params.page));
    const qs = q.toString();
    return sovereignClient.get<Product[]>(`/products/${qs ? `?${qs}` : ''}`);
  },

  /**
   * Search and filter products with advanced parameters
   */
  search: (query: string, filters: SearchFilters, page = 1) => {
    const params = new URLSearchParams({
      search: query,
      page: page.toString(),
    });
    
    if (filters.category) params.append('category', filters.category);
    if (filters.priceMin) params.append('min_price', filters.priceMin.toString());
    if (filters.priceMax) params.append('max_price', filters.priceMax.toString());
    if (filters.location) params.append('location', filters.location);
    if (filters.availability) params.append('availability', filters.availability);
    if (filters.sortBy) params.append('ordering', filters.sortBy);

    return sovereignClient.get<Product[]>(`/products/?${params.toString()}`);
  },

  /**
   * Get product by ID or Slug
   */
  getDetail: (idOrSlug: string) => 
    sovereignClient.get<Product>(`/products/${idOrSlug}/`),

  getBySlug: (slug: string) => 
    sovereignClient.get<Product>(`/products/${slug}/`),

  getById: (id: number | string) => 
    sovereignClient.get<Product>(`/products/${id}/`),

  /**
   * Get all categories for filter sidebar
   */
  getCategories: () => 
    sovereignClient.get<unknown[]>('/products/categories/'),

  /**
   * Get search suggestions based on partial input
   */
  getSuggestions: (query: string) => 
    sovereignClient.get<string[]>(`/products/search-suggestions/?q=${encodeURIComponent(query)}`),

  /** Alias used by product-filters.tsx */
  getSearchSuggestions: (query: string) => 
    sovereignClient.get<string[]>(`/products/search-suggestions/?q=${encodeURIComponent(query)}`),

  /**
   * Get product recommendations
   */
  getRecommendations: (productId: number) => 
    sovereignClient.get<Product[]>(`/products/${productId}/recommendations/`),

  /**
   * Wishlist
   */
  getWishlist: () => sovereignClient.get<Product[]>('/products/wishlist/'),
  
  addToWishlist: (productId: number) => 
    sovereignClient.post<void>('/products/wishlist/', { product_id: productId }),
  
  removeFromWishlist: (id: number) => 
    sovereignClient.delete<void>(`/products/wishlist/${id}/`),

  /** Check if a product is in the user's wishlist (used by product-card.tsx) */
  checkWishlist: (productId: number) => 
    sovereignClient.get<{ in_wishlist: boolean }>(`/products/wishlist/check/?product_id=${productId}`),

  /** Toggle wishlist status — add if not in, remove if in (used by product-card.tsx) */
  toggleWishlist: (productId: number) => 
    sovereignClient.post<{ in_wishlist: boolean }>('/products/wishlist/toggle/', { product_id: productId }),

  /** Get accessories that match a product (used by accessory-suggestions.tsx) */
  getMatchingAccessories: (productId: number, limit = 4) => 
    sovereignClient.get<Product[]>(`/products/${productId}/accessories/?limit=${limit}`),

  /** Get product metadata — categories, price ranges, locations (used by product-filters.tsx) */
  getMetadata: () => 
    sovereignClient.get<{ categories: unknown[]; price_range: { min: number; max: number }; locations: string[] }>('/products/metadata/'),
};
