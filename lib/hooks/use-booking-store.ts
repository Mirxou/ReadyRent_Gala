import { create } from 'zustand';

export type BookingStep = 1 | 2 | 3 | 4 | 5;

export interface BookingFormData {
  productId: string;
  startDate: Date | null;
  endDate: Date | null;
  hasInsurance: boolean;
  extraServices: string[];
  ownerIdentityVerified: boolean;
  renterIdentityVerified: boolean;
  totalPrice: number;
  paymentMethod?: 'cib' | 'edahabia' | 'visa' | 'bank_transfer';
  paymentDetails?: {
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
  };
  signature?: string; // Base64 signature
}

interface BookingState {
  step: BookingStep;
  isOpen: boolean;
  formData: BookingFormData;
  setStep: (step: BookingStep) => void;
  setIsOpen: (isOpen: boolean) => void;
  updateFormData: (data: Partial<BookingFormData>) => void;
  resetWizard: () => void;
  nextStep: () => void;
  prevStep: () => void;
}

const initialFormData: BookingFormData = {
  productId: '',
  startDate: null,
  endDate: null,
  hasInsurance: true,
  extraServices: [],
  ownerIdentityVerified: true, // Default to true for demo
  renterIdentityVerified: false,
  totalPrice: 0,
};

export const useBookingStore = create<BookingState>((set) => ({
  step: 1,
  isOpen: false,
  formData: initialFormData,
  setStep: (step) => set({ step }),
  setIsOpen: (isOpen) => set({ isOpen }),
  updateFormData: (data) =>
    set((state) => ({ formData: { ...state.formData, ...data } })),
  resetWizard: () => set({ step: 1, isOpen: false, formData: initialFormData }),
  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 5) as BookingStep })),
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) as BookingStep })),
}));
