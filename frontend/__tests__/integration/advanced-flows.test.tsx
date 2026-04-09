/**
 * Advanced Frontend Integration Tests
 * Tests for complex user flows and edge cases
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Advanced Frontend Integration Tests', () => {
  
  describe('Complete Booking Flow', () => {
    test('user can complete full booking process', async () => {
      // 1. Search for products
      render(<ProductListPage />);
      const searchInput = screen.getByPlaceholderText(/search/i);
      await userEvent.type(searchInput, 'evening gown');
      
      // Wait for search results
      await waitFor(() => {
        expect(screen.getByText(/beautiful evening gown/i)).toBeInTheDocument();
      });
      
      // 2. Click on product
      const productCard = screen.getByTestId('product-card-1');
      fireEvent.click(productCard);
      
      // 3. View product details
      expect(screen.getByText(/elegant evening dress/i)).toBeInTheDocument();
      
      // 4. Select dates
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      
      await userEvent.type(startDateInput, '2026-04-15');
      await userEvent.type(endDateInput, '2026-04-17');
      
      // 5. Add to cart
      const addToCartBtn = screen.getByRole('button', { name: /add to cart/i });
      fireEvent.click(addToCartBtn);
      
      // Verify added to cart
      await waitFor(() => {
        expect(screen.getByText(/added to cart/i)).toBeInTheDocument();
      });
      
      // 6. Go to cart
      const cartBtn = screen.getByRole('link', { name: /cart/i });
      fireEvent.click(cartBtn);
      
      // 7. Proceed to checkout
      const checkoutBtn = screen.getByRole('button', { name: /proceed to checkout/i });
      fireEvent.click(checkoutBtn);
      
      // 8. Enter delivery address
      const addressInput = screen.getByLabelText(/street address/i);
      await userEvent.type(addressInput, '123 Main St, Casablanca');
      
      // 9. Select payment method
      const bankCardOption = screen.getByLabelText(/bank card/i);
      fireEvent.click(bankCardOption);
      
      // 10. Complete payment
      const payBtn = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(payBtn);
      
      // Verify booking created
      await waitFor(() => {
        expect(screen.getByText(/booking confirmed/i)).toBeInTheDocument();
      });
    });

    test('handles unavailable dates gracefully', async () => {
      render(<ProductDetailPage productId={1} />);
      
      // Select dates that are unavailable
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      
      await userEvent.type(startDateInput, '2026-04-10');
      await userEvent.type(endDateInput, '2026-04-12');
      
      // Trigger availability check
      const checkAvailabilityBtn = screen.getByRole('button', { name: /check availability/i });
      fireEvent.click(checkAvailabilityBtn);
      
      // Should show unavailable message
      await waitFor(() => {
        expect(screen.getByText(/not available for these dates/i)).toBeInTheDocument();
      });
      
      // Add to cart button should be disabled
      const addToCartBtn = screen.getByRole('button', { name: /add to cart/i });
      expect(addToCartBtn).toBeDisabled();
    });

    test('calculates costs correctly during booking', async () => {
      render(<BookingCalculator productPrice={500} />);
      
      // Select 3 days
      const startDate = screen.getByLabelText(/start date/i);
      const endDate = screen.getByLabelText(/end date/i);
      
      await userEvent.type(startDate, '2026-04-15');
      await userEvent.type(endDate, '2026-04-18');
      
      // Check total calculation
      await waitFor(() => {
        expect(screen.getByText(/total: 1,500 mad/i)).toBeInTheDocument();
      });
      
      // Add discount if available
      const discountCode = screen.getByLabelText(/discount code/i);
      await userEvent.type(discountCode, 'SUMMER10');
      
      const applyBtn = screen.getByRole('button', { name: /apply/i });
      fireEvent.click(applyBtn);
      
      // Should show updated total with discount
      await waitFor(() => {
        expect(screen.getByText(/total: 1,350 mad/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dispute Resolution Flow', () => {
    test('user can raise and track dispute', async () => {
      render(<BookingDetailPage bookingId={1} />);
      
      // Click on disputes button
      const disputeBtn = screen.getByRole('button', { name: /raise dispute/i });
      fireEvent.click(disputeBtn);
      
      // Fill dispute form
      const reasonSelect = screen.getByLabelText(/reason/i);
      fireEvent.change(reasonSelect, { target: { value: 'damaged_item' } });
      
      const descriptionInput = screen.getByLabelText(/description/i);
      await userEvent.type(descriptionInput, 'Item arrived damaged');
      
      // Submit dispute
      const submitBtn = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitBtn);
      
      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/dispute created/i)).toBeInTheDocument();
      });
      
      // Should show dispute details
      expect(screen.getByText(/status: open/i)).toBeInTheDocument();
    });

    test('can add evidence to dispute', async () => {
      render(<DisputeDetailPage disputeId={1} />);
      
      // Upload image evidence
      const fileInput = screen.getByLabelText(/upload evidence/i);
      const file = new File(['dummy content'], 'evidence.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      // Should show preview
      await waitFor(() => {
        expect(screen.getByAltText(/evidence preview/i)).toBeInTheDocument();
      });
      
      // Add description
      const descInput = screen.getByLabelText(/describe the issue/i);
      await userEvent.type(descInput, 'This shows the damage');
      
      // Submit evidence
      const submitBtn = screen.getByRole('button', { name: /submit evidence/i });
      fireEvent.click(submitBtn);
      
      // Should confirm upload
      await waitFor(() => {
        expect(screen.getByText(/evidence submitted/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter', () => {
    test('advanced filtering works correctly', async () => {
      render(<ProductListPage />);
      
      // Open filters
      const filterBtn = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(filterBtn);
      
      // Set price range
      const minPrice = screen.getByLabelText(/min price/i);
      const maxPrice = screen.getByLabelText(/max price/i);
      
      await userEvent.clear(minPrice);
      await userEvent.type(minPrice, '200');
      await userEvent.clear(maxPrice);
      await userEvent.type(maxPrice, '800');
      
      // Select category
      const categoryCheck = screen.getByLabelText(/evening gowns/i);
      fireEvent.click(categoryCheck);
      
      // Select size
      const sizeSelect = screen.getByLabelText(/size/i);
      fireEvent.change(sizeSelect, { target: { value: 'M' } });
      
      // Apply filters
      const applyBtn = screen.getByRole('button', { name: /apply filters/i });
      fireEvent.click(applyBtn);
      
      // Should update results
      await waitFor(() => {
        expect(screen.getByText(/showing 5 results/i)).toBeInTheDocument();
      });
    });

    test('search with autocomplete', async () => {
      render(<ProductListPage />);
      
      const searchInput = screen.getByPlaceholderText(/search/i);
      
      // Type and wait for suggestions
      await userEvent.type(searchInput, 'eve');
      
      await waitFor(() => {
        expect(screen.getByText(/evening gown/i)).toBeInTheDocument();
        expect(screen.getByText(/event dress/i)).toBeInTheDocument();
      });
      
      // Select suggestion
      const suggestion = screen.getByText(/evening gown/i);
      fireEvent.click(suggestion);
      
      // Should filter results
      expect(searchInput.value).toBe('evening gown');
    });
  });

  describe('Payment Processing', () => {
    test('bank card payment flow', async () => {
      render(<PaymentForm bookingId={1} amount={1000} />);
      
      // Select bank card
      const bankCardOption = screen.getByLabelText(/bank card/i);
      fireEvent.click(bankCardOption);
      
      // Fill card details
      const cardNumber = screen.getByLabelText(/card number/i);
      const expiry = screen.getByLabelText(/expiry/i);
      const cvv = screen.getByLabelText(/cvv/i);
      
      await userEvent.type(cardNumber, '4532015112830366');
      await userEvent.type(expiry, '12/25');
      await userEvent.type(cvv, '123');
      
      // Submit payment
      const payBtn = screen.getByRole('button', { name: /pay/i });
      fireEvent.click(payBtn);
      
      // Should show processing
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
      
      // Should show success after processing
      await waitFor(() => {
        expect(screen.getByText(/payment successful/i)).toBeInTheDocument();
      });
    });

    test('baridimob payment flow', async () => {
      render(<PaymentForm bookingId={1} amount={1000} />);
      
      // Select BaridiMob
      const baridimobOption = screen.getByLabelText(/baridimob/i);
      fireEvent.click(baridimobOption);
      
      // Enter phone
      const phoneInput = screen.getByLabelText(/phone/i);
      await userEvent.type(phoneInput, '+212612345678');
      
      // Confirm
      const confirmBtn = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmBtn);
      
      // Should show payment instructions
      await waitFor(() => {
        expect(screen.getByText(/follow sms instructions/i)).toBeInTheDocument();
      });
    });

    test('handles payment error', async () => {
      render(<PaymentForm bookingId={1} amount={1000} />);
      
      // Enter invalid card
      const cardNumber = screen.getByLabelText(/card number/i);
      await userEvent.type(cardNumber, '1234567890123456');
      
      const expiry = screen.getByLabelText(/expiry/i);
      await userEvent.type(expiry, '12/25');
      
      const cvv = screen.getByLabelText(/cvv/i);
      await userEvent.type(cvv, '123');
      
      const payBtn = screen.getByRole('button', { name: /pay/i });
      fireEvent.click(payBtn);
      
      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/invalid card number/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Profile and Preferences', () => {
    test('user can update profile', async () => {
      render(<UserProfilePage />);
      
      // Edit profile
      const editBtn = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editBtn);
      
      // Update information
      const phoneInput = screen.getByDisplayValue(/\+212/i);
      await userEvent.clear(phoneInput);
      await userEvent.type(phoneInput, '+212612345678');
      
      const bioInput = screen.getByLabelText(/bio/i);
      await userEvent.type(bioInput, 'I love elegant dresses');
      
      // Save changes
      const saveBtn = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveBtn);
      
      // Should show success
      await waitFor(() => {
        expect(screen.getByText(/profile updated/i)).toBeInTheDocument();
      });
    });

    test('user can set rental preferences', async () => {
      render(<PreferencesPage />);
      
      // Set maximum price
      const maxPriceInput = screen.getByLabelText(/max price/i);
      await userEvent.clear(maxPriceInput);
      await userEvent.type(maxPriceInput, '1000');
      
      // Set preferred categories
      const categoriesCheckbox = screen.getAllByRole('checkbox');
      fireEvent.click(categoriesCheckbox[0]);
      
      // Enable notifications
      const notificationToggle = screen.getByRole('checkbox', { name: /notifications/i });
      if (!notificationToggle.checked) {
        fireEvent.click(notificationToggle);
      }
      
      // Save preferences
      const saveBtn = screen.getByRole('button', { name: /save preferences/i });
      fireEvent.click(saveBtn);
      
      // Should confirm
      await waitFor(() => {
        expect(screen.getByText(/preferences saved/i)).toBeInTheDocument();
      });
    });
  });
});
