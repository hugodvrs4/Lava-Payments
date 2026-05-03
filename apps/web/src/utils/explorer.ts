/**
 * Helper functions for Plasma blockchain explorer links
 */

/**
 * Get Plasmascan transaction URL
 * @param chainId - Plasma chain ID (9745 = Mainnet, 9746 = Testnet)
 * @param txHash - Transaction hash
 * @returns Plasmascan URL
 */
export function explorerTxUrl(_chainId: number, txHash: string): string {
  return `https://testnet.plasmascan.to/tx/${txHash}`
}

/**
 * Get Plasmascan address URL
 * @param chainId - Plasma chain ID (9745 = Mainnet, 9746 = Testnet)
 * @param address - Wallet address
 * @returns Plasmascan URL
 */
export function explorerAddressUrl(_chainId: number, address: string): string {
  return `https://testnet.plasmascan.to/address/${address}`
}
