/**
 * Helper functions for Plasma blockchain explorer links
 */

/**
 * Get Plasmascan transaction URL for a given chain and transaction hash
 * @param chainId - Plasma chain ID (9745 = Mainnet, 9746 = Testnet)
 * @param txHash - Transaction hash
 * @returns Plasmascan URL or empty string if unsupported chain
 */
export function plasmaExplorerTx(chainId: number, txHash: string): string {
  switch (chainId) {
    case 9746: // Plasma Testnet
      return `https://testnet.plasmascan.to/tx/${txHash}`
    case 9745: // Plasma Mainnet
      return `https://plasmascan.to/tx/${txHash}`
    default:
      return ''
  }
}

/**
 * Get Plasmascan address URL for a given chain and address
 * @param chainId - Plasma chain ID (9745 = Mainnet, 9746 = Testnet)
 * @param address - Wallet address
 * @returns Plasmascan URL or empty string if unsupported chain
 */
export function plasmaExplorerAddress(chainId: number, address: string): string {
  switch (chainId) {
    case 9746: // Plasma Testnet
      return `https://testnet.plasmascan.to/address/${address}`
    case 9745: // Plasma Mainnet
      return `https://plasmascan.to/address/${address}`
    default:
      return ''
  }
}
