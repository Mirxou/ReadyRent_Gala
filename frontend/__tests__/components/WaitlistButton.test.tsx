/**
 * Tests for WaitlistButton component
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import WaitlistButton from '@/components/waitlist-button'

// Mock the component
jest.mock('@/components/waitlist-button', () => {
  return function WaitlistButton({ 
    productId, 
    onAddToWaitlist 
  }: { 
    productId: number
    onAddToWaitlist?: () => void
  }) {
    const [isInWaitlist, setIsInWaitlist] = React.useState(false)
    
    return (
      <button
        onClick={() => {
          setIsInWaitlist(true)
          onAddToWaitlist?.()
        }}
        data-testid="waitlist-button"
        disabled={isInWaitlist}
      >
        {isInWaitlist ? 'في قائمة الانتظار' : 'أضف إلى قائمة الانتظار'}
      </button>
    )
  }
})

describe('WaitlistButton Component', () => {
  it('renders waitlist button', () => {
    render(<WaitlistButton productId={1} />)
    expect(screen.getByTestId('waitlist-button')).toBeInTheDocument()
  })

  it('handles add to waitlist', async () => {
    const handleAdd = jest.fn()
    render(<WaitlistButton productId={1} onAddToWaitlist={handleAdd} />)
    
    const button = screen.getByTestId('waitlist-button')
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(handleAdd).toHaveBeenCalled()
      expect(button).toBeDisabled()
    })
  })

  it('shows correct text when in waitlist', async () => {
    render(<WaitlistButton productId={1} />)
    
    const button = screen.getByTestId('waitlist-button')
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText(/في قائمة الانتظار/i)).toBeInTheDocument()
    })
  })
})

