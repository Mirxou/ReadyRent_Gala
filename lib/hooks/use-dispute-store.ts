import { create } from 'zustand';

interface DisputeFormData {
  bookingId?: string;
  title: string;
  reason: string;
  description: string;
  disputeType: string;
  evidence: { id: string; url: string; type: string }[];
  isAdmissible: boolean;
}

interface DisputeStore {
  step: number;
  isOpen: boolean;
  formData: DisputeFormData;
  
  // Actions
  setIsOpen: (open: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  setFormData: (data: Partial<DisputeFormData>) => void;
  resetWizard: () => void;
}

const initialData: DisputeFormData = {
  bookingId: undefined,
  title: '',
  reason: '',
  description: '',
  disputeType: '',
  evidence: [],
  isAdmissible: false,
};

export const useDisputeStore = create<DisputeStore>((set) => ({
  step: 1,
  isOpen: false,
  formData: initialData,

  setIsOpen: (open: boolean) => set({ isOpen: open }),
  
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  
  prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),
  
  setFormData: (data) => set((state) => ({ 
    formData: { ...state.formData, ...data } 
  })),
  
  resetWizard: () => set({ step: 1, formData: initialData }),
}));
