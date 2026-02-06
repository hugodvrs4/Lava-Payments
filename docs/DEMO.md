# Demo Script

This script demonstrates the core functionality of Lava Payment.

## Prerequisites

1. MetaMask installed in your browser
2. Plasma network added to MetaMask
3. Some USDT0 tokens in your wallet
4. A second wallet/account for testing transfers

## Demo Flow

### 1. Connect Wallet

```
1. Open the app at http://localhost:5173
2. Click "Connect MetaMask"
3. Approve the connection in MetaMask
4. Verify your address appears in the header
```

### 2. Create Payment Request

```
1. Navigate to "Receive Payment"
2. Enter amount (e.g., "10.50")
3. Add optional memo (e.g., "Coffee payment")
4. Click "Create Invoice"
5. Copy the generated invoice code
```

### 3. Pay Invoice

```
1. Open app in a different browser/incognito (or share code with another user)
2. Connect second wallet
3. Navigate to "Pay Invoice"
4. Paste the invoice code
5. Click "Decode Invoice"
6. Review payment details
7. Click "Pay Invoice"
8. Approve transaction in MetaMask
9. Wait for confirmation
```

### 4. View Receipt

```
1. After payment confirmation, receipt page displays automatically
2. Note the transaction hash
3. Click link to view on Plasma Explorer
4. Verify transaction details on-chain
```

### 5. Check History

```
1. Navigate to "History"
2. Note: Currently shows placeholder
3. Future update will display past transactions from localStorage
```

## Testing Notes

- Use small amounts for testing
- Ensure sufficient gas (PLASMA tokens) for transactions
- Test on Plasma testnet first before mainnet
- Invoice codes are portable but include timestamp
- Invoices don't expire automatically (validate timestamp in production)

## Troubleshooting

**Wallet not connecting:**
- Ensure MetaMask is unlocked
- Check that Plasma network is configured
- Refresh the page and try again

**Transaction failing:**
- Verify sufficient USDT0 balance
- Check gas balance (PLASMA tokens)
- Confirm USDT0 token is approved for spending

**Invoice decode error:**
- Ensure complete code is copied
- Code must be valid base64-encoded JSON
- Check for extra spaces or line breaks
