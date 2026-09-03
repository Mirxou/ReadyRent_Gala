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
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  description: string;
  price_per_day: number;
  owner_id: string;
  images: { id: string; url: string; is_main: boolean }[];
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
    if (params?.limit) q.append('limit', String(params.limit));
    const qs = q.toString();
    return sovereignClient.get<Product[]>(`/products${qs ? `?${qs}` : ''}`);
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

    return sovereignClient.get<Product[]>(`/products?${params.toString()}`);
  },

  /**
   * Get product by ID or Slug
   */
  getDetail: (idOrSlug: string) =>
    sovereignClient.get<Product>(`/products/${idOrSlug}`),

  getBySlug: (slug: string) =>
    sovereignClient.get<Product>(`/products/${slug}`),

  getById: (id: string) =>
    sovereignClient.get<Product>(`/products/${id}`),

  /**
   * Get all categories for filter sidebar
   */
  getCategories: () =>
    sovereignClient.get<unknown[]>('/products/categories'),

  /**
   * Get search suggestions based on partial input
   */
  getSuggestions: (query: string) =>
    sovereignClient.get<string[]>(`/products/search-suggestions?q=${encodeURIComponent(query)}`),

  /** Alias used by product-filters.tsx */
  getSearchSuggestions: (query: string) =>
    sovereignClient.get<string[]>(`/products/search-suggestions?q=${encodeURIComponent(query)}`),

  /**
   * Get product recommendations
   */
  getRecommendations: (productId: string) =>
    sovereignClient.get<Product[]>(`/products/${productId}/recommendations`),

  /**
   * Wishlist
   */
  getWishlist: () => sovereignClient.get<Product[]>('/products/wishlist'),

  addToWishlist: (productId: string) =>
    sovereignClient.post<void>('/products/wishlist', { product_id: productId }),

  removeFromWishlist: (id: string) =>
    sovereignClient.delete<void>(`/products/wishlist/${id}`),

  // TODO: route not yet implemented — /products/wishlist/check
  /** Check if a product is in the user's wishlist (used by product-card.tsx) */
  checkWishlist: (productId: string) =>
    sovereignClient.get<{ in_wishlist: boolean }>(`/products/wishlist?product_id=${productId}`),

  // TODO: route not yet implemented — /products/wishlist/toggle
  /** Toggle wishlist status — add if not in, remove if in (used by product-card.tsx) */
  toggleWishlist: (productId: string) =>
    sovereignClient.post<{ in_wishlist: boolean }>('/products/wishlist', { product_id: productId }),

  // TODO: route not yet implemented — /products/[id]/accessories
  /** Get accessories that match a product (used by accessory-suggestions.tsx) */
  getMatchingAccessories: (productId: string, limit = 4) =>
    sovereignClient.get<Product[]>(`/products?limit=${limit}`),

  // TODO: route not yet implemented — /products/metadata
  /** Get product metadata — categories, price ranges, locations (used by product-filters.tsx) */
  getMetadata: () =>
    sovereignClient.get<{ categories: unknown[]; price_range: { min: number; max: number }; locations: string[] }>('/products/categories'),
};
