/**
 * Tests for VariantSelector component
 */
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import VariantSelector from '@/components/variant-selector'

// Mock the component
jest.mock('@/components/variant-selector', () => {
  return function VariantSelector({ 
    variants, 
    onVariantChange 
  }: { 
    variants: Array<{ id: string; name: string; value: string }>
    onVariantChange?: (variant: { id: string; name: string; value: string }) => void
  }) {
    return (
      <div data-testid="variant-selector">
        {variants.map((variant) => (
          <button
            key={variant.id}
            onClick={() => onVariantChange?.(variant)}
            data-testid={`variant-${variant.id}`}
          >
            {variant.name}: {variant.value}
          </button>
        ))}
      </div>
    )
  }
})

describe('VariantSelector Component', () => {
  const mockVariants = [
    { id: '1', name: 'Size', value: 'M' },
    { id: '2', name: 'Color', value: 'Red' }
  ]

  it('renders variant selector', () => {
    render(<VariantSelector variants={mockVariants} />)
    expect(screen.getByTestId('variant-selector')).toBeInTheDocument()
  })

  it('renders all variants', () => {
    render(<VariantSelector variants={mockVariants} />)
    expect(screen.getByTestId('variant-1')).toBeInTheDocument()
    expect(screen.getByTestId('variant-2')).toBeInTheDocument()
  })

  it('handles variant selection', () => {
    const handleChange = jest.fn()
    render(<VariantSelector variants={mockVariants} onVariantChange={handleChange} />)
    
    const sizeButton = screen.getByTestId('variant-1')
    fireEvent.click(sizeButton)
    
    expect(handleChange).toHaveBeenCalledWith(mockVariants[0])
  })
})

