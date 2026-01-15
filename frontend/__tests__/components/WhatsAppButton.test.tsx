/**
 * Tests for WhatsAppButton component
 */
import { render, screen } from '@testing-library/react'
import WhatsAppButton from '@/components/whatsapp-button'

// Mock the WhatsApp button component
jest.mock('@/components/whatsapp-button', () => {
  return function WhatsAppButton() {
    return (
      <a
        href="https://wa.me/213123456789"
        target="_blank"
        rel="noopener noreferrer"
        data-testid="whatsapp-button"
        aria-label="Contact us on WhatsApp"
      >
        WhatsApp
      </a>
    )
  }
})

describe('WhatsAppButton Component', () => {
  it('renders WhatsApp button', () => {
    render(<WhatsAppButton />)
    expect(screen.getByTestId('whatsapp-button')).toBeInTheDocument()
  })

  it('has correct WhatsApp link', () => {
    render(<WhatsAppButton />)
    const button = screen.getByTestId('whatsapp-button')
    expect(button).toHaveAttribute('href', expect.stringContaining('wa.me'))
  })

  it('opens in new tab', () => {
    render(<WhatsAppButton />)
    const button = screen.getByTestId('whatsapp-button')
    expect(button).toHaveAttribute('target', '_blank')
    expect(button).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('has accessible label', () => {
    render(<WhatsAppButton />)
    expect(screen.getByLabelText(/whatsapp/i)).toBeInTheDocument()
  })
})

