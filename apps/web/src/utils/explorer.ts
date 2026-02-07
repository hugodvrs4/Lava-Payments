/**
 * Helper functions for Plasma blockchain explorer links
 */

/**
 * Get Plasmascan transaction URL
 * @param chainId - Plasma chain ID (9745 = Mainnet, 9746 = Testnet)
 * @param txHash - Transaction hash
 * @returns Plasmascan URL
 */
export function explorerTxUrl(chainId: number, txHash: string): string {
  return `https://plasmascan.to/tx/${txHash}`
}

/**
 * Get Plasmascan address URL
 * @param chainId - Plasma chain ID (9745 = Mainnet, 9746 = Testnet)
 * @param address - Wallet address
 * @returns Plasmascan URL
 */
export function explorerAddressUrl(chainId: number, address: string): string {
  return `https://plasmascan.to/address/${address}`
}
