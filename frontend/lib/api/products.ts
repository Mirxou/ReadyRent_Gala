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

  /**
   * Get all categories for filter sidebar
   */
  getCategories: () => 
    sovereignClient.get<any[]>('/products/categories/'),

  /**
   * Get search suggestions based on partial input
   */
  getSuggestions: (query: string) => 
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
};
