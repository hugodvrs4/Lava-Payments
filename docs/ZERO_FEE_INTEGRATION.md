# Zero-Fee Integration Guide

## Overview

Lava Payments is architected to support **zero-fee USDT0 transfers** via the Plasma blockchain's paymaster/relayer system. This allows users to send USDT0 without needing PLASMA tokens for gas fees.

## Current Status

✅ **Architecture Ready**: Code structure supports both standard and zero-fee flows  
✅ **UI Complete**: Toggle and fee status indicators implemented  
✅ **Service Abstraction**: `PaymentService` handles routing between modes  
⏳ **Integration Pending**: Requires Plasma relayer API access and configuration  

## How It Works

### Standard Mode (Current)
```
User → MetaMask → ERC20.transfer() → Blockchain
      (pays gas in PLASMA tokens)
```

### Zero-Fee Mode (Ready to Integrate)
```
User → Sign Request → Relayer API → Paymaster → Blockchain
                                   (pays gas)
```

## Integration Steps

### 1. Obtain Relayer Access

Contact Plasma team for:
- Relayer API endpoint URL
- API key (if required)
- Rate limits and eligibility criteria
- Documentation for request format

### 2. Configure Environment

Add to `.env` (or deployment environment):

```bash
VITE_PLASMA_RELAYER_URL=https://relayer.plasma.to/api/v1
VITE_PLASMA_RELAYER_KEY=your_api_key_here  # if needed
```

### 3. Enable Zero-Fee Config

In `packages/shared/src/constants.ts`:

```typescript
export const ZERO_FEE_CONFIG = {
  enabled: true,  // ← Change to true
  relayerUrl: process.env.VITE_PLASMA_RELAYER_URL || '',
  apiKey: process.env.VITE_PLASMA_RELAYER_KEY || '',
} as const;
```

### 4. Implement Relayer Integration

Update `apps/web/src/services/paymentService.ts` → `executeZeroFeeTransfer()`:

```typescript
private static async executeZeroFeeTransfer(
  to: string,
  amount: bigint
): Promise<{ method: 'zero-fee'; feesPaidBy: 'paymaster' }> {
  // 1. Prepare transfer data
  const transferData = {
    to,
    amount: amount.toString(),
    token: USDT0_ADDRESS,
    chainId: PLASMA_CHAIN.id,
  }

  // 2. Get user signature (gasless)
  const signature = await this.signTransferRequest(transferData)

  // 3. Send to relayer
  const response = await fetch(`${ZERO_FEE_CONFIG.relayerUrl}/transfer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': ZERO_FEE_CONFIG.apiKey,
    },
    body: JSON.stringify({
      ...transferData,
      signature,
    }),
  })

  if (!response.ok) {
    throw new Error('Relayer rejected request')
  }

  const { hash } = await response.json()

  return {
    method: 'zero-fee',
    feesPaidBy: 'paymaster',
  }
}

private static async signTransferRequest(data: any): Promise<string> {
  // Use wagmi/viem to get signature from MetaMask
  // This is NOT a transaction, just a signature for the relayer
  // Implementation depends on Plasma's required signature format
}
```

### 5. Update Receipt Page

Ensure `ReceiptPage.tsx` shows fee payment method correctly when zero-fee is used.

### 6. Testing

Test checklist:
- [ ] Standard transfer still works (fallback)
- [ ] Zero-fee toggle appears and is enabled
- [ ] User can complete transfer without PLASMA tokens
- [ ] Receipt shows "Fees paid by Plasma paymaster"
- [ ] Error handling for relayer failures
- [ ] Rate limit handling (fallback to standard if quota exceeded)

## API Contract (Expected)

Based on typical paymaster implementations:

### Request
```json
POST /transfer
{
  "to": "0x...",
  "amount": "1000000",  // in token units
  "token": "0x...",
  "chainId": 9745,
  "signature": "0x...",
  "from": "0x..."  // derived from signature
}
```

### Response (Success)
```json
{
  "hash": "0x...",
  "status": "submitted"
}
```

### Response (Error)
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

## Error Handling

The app gracefully falls back to standard mode if:
- Relayer is unavailable
- User is rate-limited
- Signature is rejected
- Network errors occur

Users are always informed which mode was used and who paid fees.

## Security Considerations

✅ **Private keys never leave MetaMask** - only signatures are sent  
✅ **Signatures are specific** to transfer amount, recipient, and nonce  
✅ **Relayer cannot steal funds** - signatures are validated on-chain  
✅ **Rate limits prevent abuse** of sponsored transactions  

## Architecture Benefits

This implementation allows:
- **Seamless UX**: One codebase, two modes
- **No breaking changes**: Standard mode always works
- **Progressive enhancement**: Enable zero-fee when ready
- **Transparent fees**: User always knows who pays

## References

- Plasma Zero-Fee USD₮ Transfers Documentation
- EIP-4337: Account Abstraction via Entry Point
- Plasma Paymaster Contract Specification

## Support

For integration assistance:
1. Check Plasma documentation
2. Contact Plasma team for relayer access
3. Test on Plasma testnet first
4. Monitor relayer availability and quota

---

**Status**: Ready for integration when Plasma relayer API is available.
