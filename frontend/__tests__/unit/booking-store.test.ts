import { renderHook, act } from '@testing-library/react';
import { useBookingStore } from '@/lib/hooks/use-booking-store';

describe('useBookingStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useBookingStore());
    act(() => {
      result.current.resetWizard();
    });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useBookingStore());
    expect(result.current.step).toBe(1);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.formData.productId).toBe('');
    expect(result.current.formData.hasInsurance).toBe(true);
  });

  it('should open and close the wizard', () => {
    const { result } = renderHook(() => useBookingStore());
    
    act(() => {
      result.current.setIsOpen(true);
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.setIsOpen(false);
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should navigate through steps correctly', () => {
    const { result } = renderHook(() => useBookingStore());
    
    expect(result.current.step).toBe(1);

    act(() => {
      result.current.nextStep();
    });
    expect(result.current.step).toBe(2);

    act(() => {
      result.current.nextStep();
    });
    expect(result.current.step).toBe(3);

    act(() => {
      result.current.prevStep();
    });
    expect(result.current.step).toBe(2);
  });

  it('should not go beyond step 5 or before step 1', () => {
    const { result } = renderHook(() => useBookingStore());
    
    // Test upper boundary
    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.nextStep();
      });
    }
    expect(result.current.step).toBe(5);

    // Test lower boundary
    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.prevStep();
      });
    }
    expect(result.current.step).toBe(1);
  });

  it('should update form data correctly', () => {
    const { result } = renderHook(() => useBookingStore());
    
    const testDate = new Date();
    act(() => {
      result.current.updateFormData({
        productId: 'prod-123',
        startDate: testDate,
        hasInsurance: false,
      });
    });

    expect(result.current.formData.productId).toBe('prod-123');
    expect(result.current.formData.startDate).toEqual(testDate);
    expect(result.current.formData.hasInsurance).toBe(false);
  });

  it('should reset wizard state', () => {
    const { result } = renderHook(() => useBookingStore());
    
    act(() => {
      result.current.setIsOpen(true);
      result.current.nextStep();
      result.current.updateFormData({ productId: 'temp' });
    });

    act(() => {
      result.current.resetWizard();
    });

    expect(result.current.step).toBe(1);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.formData.productId).toBe('');
  });
});
