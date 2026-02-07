import type { PaymentRecord } from '@lava-payment/shared'

/**
 * Local storage service for payment history
 * Privacy-focused: data stored per network + wallet address
 * 
 * Storage key format: lava:history:<chainId>:<address>
 */
export class HistoryService {
  private static getStorageKey(chainId: number, address: string): string {
    return `lava:history:${chainId}:${address.toLowerCase()}`
  }

  /**
   * Load payment history for a specific wallet on a specific chain
   */
  static getHistory(chainId: number, address: string): PaymentRecord[] {
    try {
      const key = this.getStorageKey(chainId, address)
      const data = localStorage.getItem(key)
      if (!data) return []
      
      const records = JSON.parse(data) as PaymentRecord[]
      
      // Sort by creation date, newest first
      return records.sort((a, b) => b.createdAt - a.createdAt)
    } catch (error) {
      console.error('Failed to load history:', error)
      return []
    }
  }

  /**
   * Add a new payment record (called when transaction is submitted)
   */
  static addPayment(
    chainId: number,
    address: string,
    record: Omit<PaymentRecord, 'createdAt' | 'status'>
  ): void {
    try {
      const key = this.getStorageKey(chainId, address)
      const history = this.getHistory(chainId, address)
      
      const newRecord: PaymentRecord = {
        ...record,
        status: 'submitted',
        createdAt: Date.now(),
      }
      
      // Add to beginning of array (newest first)
      history.unshift(newRecord)
      
      localStorage.setItem(key, JSON.stringify(history))
    } catch (error) {
      console.error('Failed to save payment:', error)
    }
  }

  /**
   * Update payment status (called when transaction is confirmed/failed)
   */
  static updatePaymentStatus(
    chainId: number,
    address: string,
    txHash: string,
    status: 'confirmed' | 'failed'
  ): void {
    try {
      const key = this.getStorageKey(chainId, address)
      const history = this.getHistory(chainId, address)
      
      const record = history.find(r => r.txHash.toLowerCase() === txHash.toLowerCase())
      if (record) {
        record.status = status
        record.confirmedAt = Date.now()
        localStorage.setItem(key, JSON.stringify(history))
      }
    } catch (error) {
      console.error('Failed to update payment status:', error)
    }
  }

  /**
   * Get a specific payment by transaction hash
   */
  static getPayment(
    chainId: number,
    address: string,
    txHash: string
  ): PaymentRecord | undefined {
    const history = this.getHistory(chainId, address)
    return history.find(r => r.txHash.toLowerCase() === txHash.toLowerCase())
  }

  /**
   * Clear all history for a specific wallet on a specific chain
   */
  static clearHistory(chainId: number, address: string): void {
    try {
      const key = this.getStorageKey(chainId, address)
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  /**
   * Get all history across all networks for a wallet (optional)
   */
  static getAllHistory(address: string): { chainId: number; records: PaymentRecord[] }[] {
    const result: { chainId: number; records: PaymentRecord[] }[] = []
    
    try {
      // Check common chain IDs
      const chainIds = [9745, 9746] // Mainnet, Testnet
      
      for (const chainId of chainIds) {
        const records = this.getHistory(chainId, address)
        if (records.length > 0) {
          result.push({ chainId, records })
        }
      }
    } catch (error) {
      console.error('Failed to get all history:', error)
    }
    
    return result
  }
}
