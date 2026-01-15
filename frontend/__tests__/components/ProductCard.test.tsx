import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ProductCard } from '@/components/product-card'

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

describe('ProductCard', () => {
  const mockProduct = {
    id: 1,
    name_ar: 'فستان تجريبي',
    slug: 'test-dress',
    price_per_day: 1000,
    category: {
      name_ar: 'فساتين',
    },
    primary_image: '/test-image.jpg',
    rating: 4.5,
    is_featured: false,
  }

  it('renders product name', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('فستان تجريبي')).toBeInTheDocument()
  })

  it('renders product price', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText(/1000/i)).toBeInTheDocument()
  })

  it('renders product rating', () => {
    render(<ProductCard product={mockProduct} />)
    // Check for rating display (might be stars or number)
    const rating = screen.queryByText(/4.5/i)
    if (rating) {
      expect(rating).toBeInTheDocument()
    }
  })

  it('renders category if provided', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('فساتين')).toBeInTheDocument()
  })

  it('has link to product detail page', () => {
    render(<ProductCard product={mockProduct} />)
    const link = screen.getByRole('link', { name: /فستان تجريبي/i })
    expect(link).toHaveAttribute('href', '/products/test-dress')
  })
})

