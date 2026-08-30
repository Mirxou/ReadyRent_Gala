import { sovereignClient } from './sovereign-client';

export interface ContractParty {
  id: string;
  name: string;
  role: 'renter' | 'vendor';
  signed: boolean;
  signedAt?: string;
  ipAddress?: string;
}

export interface Contract {
  id: string;
  booking_id: string;
  status: string;
  is_finalized: boolean;
  contract_hash: string | null;
  terms: string | null;
  parties: ContractParty[];
  renter_signature: string | null;
  signed_at: string | null;
  snapshot: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  booking?: {
    id: string;
    product_name: string | null;
    product_image: string | null;
    start_date: string | null;
    end_date: string | null;
    total_price: number;
  };
}

export const contractsApi = {
  listContracts: () =>
    sovereignClient.get<Contract[]>('/contracts/'),

  getContract: (id: string) =>
    sovereignClient.get<Contract>(`/contracts/${id}/`),

  generateContract: (bookingId: string) =>
    sovereignClient.post<Contract>('/contracts/generate/', { booking_id: bookingId }),

  signContract: (id: string) =>
    sovereignClient.post<Contract>(`/contracts/${id}/sign/`),
};
