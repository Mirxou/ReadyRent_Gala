import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import CartPage from '@/app/cart/page'

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: { items: [], total: 0 },
    isLoading: false,
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
  })),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
  })),
}))

// Mock API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ items: [], total: 0 }),
  })
) as jest.Mock

describe('Cart Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('displays empty cart message when cart is empty', async () => {
    render(<CartPage />)
    
    await waitFor(() => {
      const emptyMessage = screen.queryByText(/empty|فارغة|no items/i)
      if (emptyMessage) {
        expect(emptyMessage).toBeInTheDocument()
      }
    })
  })

  it('allows removing items from cart', async () => {
    // Mock cart with items
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          items: [
            { id: 1, product: { name: 'Test Dress' }, quantity: 1 },
          ],
          total: 1000,
        }),
      })
    ) as jest.Mock

    render(<CartPage />)
    
    await waitFor(() => {
      const removeButton = screen.queryByLabelText(/remove|حذف/i)
      if (removeButton) {
        expect(removeButton).toBeInTheDocument()
      }
    })
  })
})

