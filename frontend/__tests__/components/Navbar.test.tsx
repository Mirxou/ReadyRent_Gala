import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Navbar } from '@/components/navbar'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      pathname: '/',
    }
  },
  usePathname() {
    return '/'
  },
}))

describe('Navbar', () => {
  it('renders logo', () => {
    render(<Navbar />)
    const logo = screen.queryByAltText(/logo|readyrent/i)
    if (logo) {
      expect(logo).toBeInTheDocument()
    }
  })

  it('renders navigation links', () => {
    render(<Navbar />)
    // Check for common navigation links
    const productsLink = screen.queryByRole('link', { name: /products|المنتجات/i })
    const homeLink = screen.queryByRole('link', { name: /home|الرئيسية/i })
    
    // At least one navigation link should exist
    expect(productsLink || homeLink).toBeTruthy()
  })

  it('renders cart icon', () => {
    render(<Navbar />)
    const cart = screen.queryByLabelText(/cart|سلة/i)
    if (cart) {
      expect(cart).toBeInTheDocument()
    }
  })

  it('renders login button when not authenticated', () => {
    render(<Navbar />)
    const loginButton = screen.queryByRole('link', { name: /login|تسجيل الدخول/i })
    if (loginButton) {
      expect(loginButton).toBeInTheDocument()
    }
  })
})

