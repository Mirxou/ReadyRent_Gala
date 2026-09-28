/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react';
import { ProductCard } from '../product/product-card';

// green-sweep: fixture completed to satisfy the Product interface
// (required fields the card type demands; assertions unchanged).
const mockProduct = {
  id: 'test-dress-1',
  name: 'Test Dress',
  name_ar: 'فستان تجريبي',
  slug: 'test-dress',
  description: 'وصف تجريبي',
  price_per_day: 1000,
  owner_id: 'user-1',
  category_name: 'فساتين',
  location_name: 'الجزائر',
  is_available: true,
  category: {
    name_ar: 'فساتين',
  },
  primary_image: '/test-image.jpg',
  images: [],
  rating: 4.5,
  is_featured: false,
};

describe('ProductCard', () => {
  it('renders product name correctly', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('فستان تجريبي')).toBeInTheDocument();
  });

  it('renders product price correctly', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('1000 دج/يوم')).toBeInTheDocument();
  });

  it('renders category if provided', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('فساتين')).toBeInTheDocument();
  });

  it('renders featured badge when product is featured', () => {
    const featuredProduct = { ...mockProduct, is_featured: true };
    render(<ProductCard product={featuredProduct} />);
    expect(screen.getByText('مميز')).toBeInTheDocument();
  });
});

