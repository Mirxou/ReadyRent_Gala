import { apiFetch } from './core';

export interface ContractParty {
  id: string;
  name: string;
  role: 'renter' | 'owner';
  signed: boolean;
  signedAt?: string;
  ipAddress?: string;
}

export interface Contract {
  id: string;
  booking_id: string;
  status: 'draft' | 'signed' | 'finalized' | 'expired';
  is_finalized: boolean;
  contract_hash: string;
  renter_signature?: string;
  owner_signature?: string;
  created_at: string;
  signed_at?: string;
  snapshot: unknown;
  parties?: ContractParty[];
  terms?: string;
}

export const contractsApi = {
  getById: (id: string) => apiFetch(`contracts/${id}`),
  getByBookingId: (bookingId: string) => apiFetch(`contracts?booking=${bookingId}`),
  generate: (bookingId: string) => apiFetch('contracts/generate/', { method: 'POST', body: { booking_id: bookingId } }),
  sign: (contractId: string, ipAddress: string) => apiFetch(`contracts/${contractId}/sign`, { method: 'POST', body: { ip_address: ipAddress } }),
  getContract: (id: string) => contractsApi.getById(id),
  signContract: (contractId: string, ipAddress: string) => contractsApi.sign(contractId, ipAddress),
};
