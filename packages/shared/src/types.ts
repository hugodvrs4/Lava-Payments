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

export interface PaymentRecord {
  txHash: string;
  status: 'submitted' | 'confirmed' | 'failed';
  createdAt: number; // When transaction was submitted
  confirmedAt?: number; // When transaction was confirmed/failed
  from: string;
  to: string;
  amount: string;
  token: string;
  chainId: number;
  invoiceId?: string;
  note?: string; // Local-only memo
  expiresAt?: number;
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
