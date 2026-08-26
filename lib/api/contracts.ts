/* eslint-disable @typescript-eslint/no-explicit-any */

async function apiFetch(
  path: string,
  options: { method?: string; body?: any; params?: Record<string, any> } = {},
): Promise<{ data: any; status: number }> {
  let url = `/api/${path.replace(/^\/+/, '')}`;
  if (options.params) {
    const qs = new URLSearchParams();
    Object.entries(options.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) qs.append(k, String(v));
    });
    const qStr = qs.toString();
    if (qStr) url += (url.includes('?') ? '&' : '?') + qStr;
  }
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  });
  if (res.status === 204) return { data: { success: true }, status: 204 };
  const json = await res.json();
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return { data: json.data, status: res.status };
  }
  return { data: json, status: res.status };
}

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
  getById: (id: number) => apiFetch(`contracts/${id}`),
  getByBookingId: (bookingId: number) => apiFetch(`contracts?booking=${bookingId}`),
  generate: (bookingId: number) => apiFetch('contracts/generate/', { method: 'POST', body: { booking_id: bookingId } }),
  sign: (contractId: number, ipAddress: string) => apiFetch(`contracts/${contractId}/sign`, { method: 'POST', body: { ip_address: ipAddress } }),
  getContract: (id: string | number) => contractsApi.getById(Number(id)),
  signContract: (contractId: string | number, ipAddress: string) => contractsApi.sign(Number(contractId), ipAddress),
};