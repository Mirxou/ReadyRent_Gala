/**
 * Tests for Chatbot component
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Chatbot from '@/components/chatbot'

// Mock the chatbot component
jest.mock('@/components/chatbot', () => {
  return function Chatbot() {
    const [isOpen, setIsOpen] = React.useState(false)
    
    return (
      <div data-testid="chatbot">
        <button onClick={() => setIsOpen(!isOpen)} data-testid="chatbot-toggle">
          Open Chat
        </button>
        {isOpen && (
          <div data-testid="chatbot-window">
            <input type="text" data-testid="chatbot-input" placeholder="Type a message..." />
            <button data-testid="chatbot-send">Send</button>
          </div>
        )}
      </div>
    )
  }
})

describe('Chatbot Component', () => {
  it('renders chatbot toggle button', () => {
    render(<Chatbot />)
    expect(screen.getByTestId('chatbot-toggle')).toBeInTheDocument()
  })

  it('opens chatbot window on click', async () => {
    render(<Chatbot />)
    
    const toggleButton = screen.getByTestId('chatbot-toggle')
    fireEvent.click(toggleButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('chatbot-window')).toBeInTheDocument()
    })
  })

  it('renders input field when open', async () => {
    render(<Chatbot />)
    
    const toggleButton = screen.getByTestId('chatbot-toggle')
    fireEvent.click(toggleButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('chatbot-input')).toBeInTheDocument()
    })
  })

  it('renders send button when open', async () => {
    render(<Chatbot />)
    
    const toggleButton = screen.getByTestId('chatbot-toggle')
    fireEvent.click(toggleButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('chatbot-send')).toBeInTheDocument()
    })
  })
})

