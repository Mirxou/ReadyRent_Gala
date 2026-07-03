import { sovereignClient } from './sovereign-client';

export interface ContractParty {
  id: string | number;
  name: string;
  role: 'renter' | 'owner';
  signed: boolean;
  signedAt?: string;
  ipAddress?: string;
}

export interface Contract {
  id: number;
  booking_id: number;
  status: 'draft' | 'signed' | 'finalized' | 'void';
  is_finalized: boolean;
  contract_hash: string;
  renter_signature?: string;
  owner_signature?: string;
  created_at: string;
  signed_at?: string;
  snapshot: any;
  parties?: ContractParty[];
  terms?: string;
}

export const contractsApi = {
  /**
   * Get contract details by ID
   */
  getById: (id: number) => 
    sovereignClient.get<Contract>(`/contracts/digital/${id}/`),

  /**
   * Get contract for a specific booking
   */
  getByBookingId: (bookingId: number) => 
    sovereignClient.get<Contract>(`/contracts/digital/?booking=${bookingId}`),

  /**
   * Generate a new contract for a booking
   */
  generate: (bookingId: number) => 
    sovereignClient.post<Contract>('/contracts/generate/', { booking_id: bookingId }),

  /**
   * Sign a contract
   */
  sign: (contractId: number, ipAddress: string) => 
    // ContractViewSet action route: /contracts/digital/<pk>/sign/
    sovereignClient.post<Contract>(`/contracts/digital/${contractId}/sign/`, { ip_address: ipAddress }),

  /**
   * Backward-compatible aliases (used by some pages).
   * Note: returns SovereignResponse<Contract> (same as getById/sign).
   */
  getContract: (id: string | number) => contractsApi.getById(Number(id)),
  signContract: (contractId: string | number, ipAddress: string) =>
    contractsApi.sign(Number(contractId), ipAddress),
};
