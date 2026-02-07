import { parseUnits } from 'viem'
import { PLASMA_NETWORKS, USDT0_DECIMALS, ZERO_FEE_CONFIG } from '@lava-payment/shared'

export interface PaymentParams {
  to: string
  amount: string
  useZeroFee: boolean
  chainId: number
}

export interface PaymentResult {
  hash: string
  method: 'standard' | 'zero-fee'
  feesPaidBy: 'user' | 'paymaster'
}

const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

/**
 * Payment service that abstracts standard vs zero-fee transfers
 * 
 * Standard mode: Direct ERC20 transfer via MetaMask (user pays gas)
 * Zero-fee mode: Sponsored transfer via Plasma paymaster/relayer (no user gas needed)
 */
export class PaymentService {
  /**
   * Execute a USDT0 transfer using the appropriate method
   */
  static async executeTransfer(
    params: PaymentParams,
    writeContract: any // wagmi's writeContract function
  ): Promise<{ method: 'standard' | 'zero-fee'; feesPaidBy: 'user' | 'paymaster' }> {
    const amountInUnits = parseUnits(params.amount, USDT0_DECIMALS)

    // Get USDT address for the current chain - NO FALLBACK
    const usdtAddress = PLASMA_NETWORKS[params.chainId as keyof typeof PLASMA_NETWORKS]?.usdt
    
    if (!usdtAddress) {
      throw new Error(`Unsupported network: ${params.chainId}. Please connect to Plasma Mainnet (9745) or Testnet (9746)`)
    }

    // Log for verification (remove in production)
    console.log('USDT address used:', usdtAddress)
    console.log('Network:', PLASMA_NETWORKS[params.chainId as keyof typeof PLASMA_NETWORKS]?.name)

    // If zero-fee is requested and enabled, use paymaster flow
    if (params.useZeroFee && ZERO_FEE_CONFIG.enabled) {
      return this.executeZeroFeeTransfer(params.to, amountInUnits)
    }

    // Standard ERC20 transfer - address is the USDT CONTRACT, not the recipient
    writeContract({
      address: usdtAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [params.to as `0x${string}`, amountInUnits],
    })

    return {
      method: 'standard',
      feesPaidBy: 'user',
    }
  }

  /**
   * Execute zero-fee transfer via Plasma relayer/paymaster
   * 
   * Architecture ready for integration:
   * 1. Sign transfer request with user's wallet
   * 2. Send to relayer API endpoint
   * 3. Relayer sponsors gas and submits transaction
   * 4. Return transaction hash
   * 
   * @see Plasma "Zero-Fee USDT Transfers" documentation
   */
  private static async executeZeroFeeTransfer(
    _to: string,
    _amount: bigint
  ): Promise<{ method: 'zero-fee'; feesPaidBy: 'paymaster' }> {
    if (!ZERO_FEE_CONFIG.relayerUrl) {
      throw new Error('Relayer URL not configured')
    }

    // TODO: Implement when relayer API is available
    // Expected flow:
    // 1. Prepare transfer data: { to: _to, amount: _amount.toString(), ... }
    // 2. Sign with MetaMask (signature only, no transaction)
    // 3. POST to relayer: { to, amount, signature, ... }
    // 4. Relayer validates and submits with paymaster
    // 5. Return { hash, method: 'zero-fee' }

    throw new Error('Zero-fee integration pending - relayer API integration required')
  }

  /**
   * Check if zero-fee mode is available
   */
  static isZeroFeeAvailable(): boolean {
    return ZERO_FEE_CONFIG.enabled && !!ZERO_FEE_CONFIG.relayerUrl
  }

  /**
   * Get ABI for standard transfers (exported for direct use if needed)
   */
  static getERC20ABI() {
    return ERC20_ABI
  }
}
