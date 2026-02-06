export interface InvoicePayload {
  recipient: string;
  amount: string;
  memo?: string;
  timestamp: number;
}

export interface TransactionRecord {
  hash: string;
  recipient: string;
  amount: string;
  memo?: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}
