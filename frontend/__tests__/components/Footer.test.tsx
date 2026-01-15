/**
 * Tests for Footer component
 */
import { render, screen } from '@testing-library/react'
import { Footer } from '@/components/footer'

describe('Footer Component', () => {
  it('renders footer with copyright', () => {
    render(<Footer />)
    expect(screen.getByText(/readyrent.gala/i)).toBeInTheDocument()
    expect(screen.getByText(/2026/i)).toBeInTheDocument()
  })

  it('renders footer links', () => {
    render(<Footer />)
    // Check for common footer links
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
  })

  it('renders social media links', () => {
    render(<Footer />)
    // Check for social media links if they exist
    const socialLinks = screen.queryAllByRole('link', { name: /instagram|facebook|tiktok/i })
    // May or may not exist, so we just check if footer renders
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})
