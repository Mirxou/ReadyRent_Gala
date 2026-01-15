import { productsApi, bookingsApi } from '@/lib/api'

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}))

describe('API Client', () => {
  it('should have productsApi methods', () => {
    expect(productsApi).toBeDefined()
    expect(typeof productsApi.getAll).toBe('function')
  })

  it('should have bookingsApi methods', () => {
    expect(bookingsApi).toBeDefined()
    expect(typeof bookingsApi.getCart).toBe('function')
  })
})

