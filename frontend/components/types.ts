// TypeScript types for API responses

export interface User {
  id: number;
  email: string;
  username: string;
  role: 'customer' | 'admin' | 'staff';
  phone?: string;
  is_verified: boolean;
}

export interface Category {
  id: number;
  name: string;
  name_ar: string;
  slug: string;
  description?: string;
  image?: string;
  is_active: boolean;
}

export interface ProductImage {
  id: number;
  image: string;
  alt_text?: string;
  is_primary: boolean;
  order: number;
}

export interface Product {
  id: number;
  name: string;
  name_ar: string;
  slug: string;
  description: string;
  description_ar?: string;
  category: Category;
  price_per_day: number;
  size: string;
  color: string;
  color_hex?: string;
  status: 'available' | 'rented' | 'maintenance' | 'unavailable';
  is_featured: boolean;
  rating: number;
  total_rentals: number;
  images?: ProductImage[];
  primary_image?: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: number;
  user: number;
  product: number;
  start_date: string;
  end_date: string;
  total_days: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'in_use' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: number;
  product: Product;
  start_date: string;
  end_date: string;
  quantity: number;
}

