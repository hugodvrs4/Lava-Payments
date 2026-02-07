export interface InvoicePayload {
  v: number; // Protocol version
  chainId: number;
  token: string; // "USDT0"
  to: string; // Recipient address
  amount: string;
  id: string; // Random UUID
  exp: number; // Expiry timestamp
  memo?: string; // Local-only, never sent on-chain
}

export interface TransactionRecord {
  hash: string;
  recipient: string;
  amount: string;
  memo?: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  invoiceId?: string; // Link to invoice for privacy tracking
}
