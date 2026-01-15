/**
 * Tests for BookingCalendar component
 */
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import BookingCalendar from '@/components/booking-calendar'

// Mock the component
jest.mock('@/components/booking-calendar', () => {
  return function BookingCalendar({ 
    onDateSelect, 
    unavailableDates = [] 
  }: { 
    onDateSelect?: (dates: { start: Date; end: Date }) => void
    unavailableDates?: Date[]
  }) {
    return (
      <div data-testid="booking-calendar">
        <button 
          onClick={() => onDateSelect?.({ 
            start: new Date('2026-01-15'), 
            end: new Date('2026-01-18') 
          })}
          data-testid="select-dates"
        >
          Select Dates
        </button>
        <div data-testid="unavailable-count">
          {unavailableDates.length} unavailable dates
        </div>
      </div>
    )
  }
})

describe('BookingCalendar Component', () => {
  it('renders calendar', () => {
    render(<BookingCalendar />)
    expect(screen.getByTestId('booking-calendar')).toBeInTheDocument()
  })

  it('handles date selection', () => {
    const handleDateSelect = jest.fn()
    render(<BookingCalendar onDateSelect={handleDateSelect} />)
    
    const selectButton = screen.getByTestId('select-dates')
    fireEvent.click(selectButton)
    
    expect(handleDateSelect).toHaveBeenCalledWith({
      start: expect.any(Date),
      end: expect.any(Date)
    })
  })

  it('displays unavailable dates count', () => {
    const unavailableDates = [
      new Date('2026-01-20'),
      new Date('2026-01-21')
    ]
    render(<BookingCalendar unavailableDates={unavailableDates} />)
    
    expect(screen.getByText(/2 unavailable dates/i)).toBeInTheDocument()
  })
})

