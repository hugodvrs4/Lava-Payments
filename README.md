# Lava Payments

A clean, mobile-first Web3 payments application for the Plasma blockchain. Send and receive USDT0 stablecoin payments with a simple, **privacy-focused** interface.

## What It Does

Lava Payments enables peer-to-peer USDT0 (stablecoin) payments on the Plasma blockchain:

- **Receive**: Generate payment requests with shareable invoice codes
- **Pay**: Send USDT0 by pasting invoice codes
- **Track**: View transaction receipts with direct links to the Plasma block explorer
- **Privacy**: Local-only history, fresh address support, no tracking
- **Zero-Fee Ready**: Architecture supports Plasma paymaster for sponsored transactions

All powered by MetaMask wallet connection and direct blockchain interactions—**no backend, no accounts, no tracking**.

## Privacy & Confidentiality

### Privacy by Design

Lava Payments is built with privacy as a core principle:

✅ **No Accounts**: No login, email, or registration required  
✅ **No Backend**: All operations happen client-side in your browser  
✅ **No Tracking**: No analytics, cookies, or third-party services  
✅ **No Server Storage**: All data stays on your device  
✅ **Local History**: Transaction history stored only in your browser's localStorage  
✅ **No On-Chain Metadata**: Notes/memos are never written to the blockchain

### On-Chain Confidentiality

**Important**: On-chain transfers are public by nature on EVM blockchains like Plasma.

We improve confidentiality through:

- **Fresh Address Support**: Encourages using a new MetaMask account per invoice to prevent transaction linkability
- **Minimal On-Chain Data**: ERC20 `transfer()` only sends recipient address and amount—no memos, no metadata
- **Random Invoice IDs**: UUID-based invoice identifiers prevent pattern detection
- **Invoice Expiry**: 24-hour expiration prevents invoice reuse and reduces linkability
- **Local-Only Metadata**: Notes, memos, and invoice details never touch the blockchain

**What we cannot do**: We cannot hide transaction amounts, sender/receiver addresses, or timing on-chain without specialized protocols (ZK, confidential transactions). This is an inherent limitation of standard EVM transactions.

### Notes Are Never On-Chain

When you add a memo/note to an invoice:
- It's included in the shareable invoice code
- It's displayed to the payer before they send
- It's stored in your local browser history
- **It is NEVER sent on-chain**

The blockchain only sees: `transfer(toAddress, amount)` — nothing else.

## Zero-Fee Transfers

### Plasma Paymaster Support

Lava Payments is **architecturally ready** to support zero-fee USDT0 transfers via Plasma's paymaster/relayer system.

**Current Mode**: Standard ERC20 transfers (user pays gas in PLASMA tokens)  
**Zero-Fee Mode**: Ready to integrate when Plasma relayer API is configured

#### How It Works

**Standard Transfer** (Current):
```
User → MetaMask → ERC20.transfer() → Plasma Blockchain
      (user pays gas fees in PLASMA)
```

**Zero-Fee Transfer** (Integration Ready):
```
User → Sign Request → Relayer API → Paymaster → Plasma Blockchain
                                   (paymaster pays gas)
      User needs NO PLASMA tokens ✓
```

#### Key Features

✅ **Service Abstraction**: `PaymentService` handles both standard and zero-fee flows  
✅ **UI Toggle**: Users can select zero-fee mode when available  
✅ **Transparent Fees**: App clearly shows who paid fees (user vs paymaster)  
✅ **Graceful Fallback**: Falls back to standard if relayer unavailable  
✅ **No Breaking Changes**: Standard mode always works  

#### Integration Status

- [x] Architecture and service layer complete
- [x] UI toggle and fee status indicators
- [x] Configuration structure ready
- [ ] Plasma relayer API integration (requires API access)
- [ ] Testing on Plasma network

**See**: `docs/ZERO_FEE_INTEGRATION.md` for complete integration guide.

#### Benefits

When zero-fee mode is enabled:
- Users don't need PLASMA tokens for gas
- No transaction fees for USDT0 transfers
- Better UX for onboarding (no need to acquire gas tokens)
- Sponsored by Plasma paymaster system

## Tech Stack

- **pnpm workspaces**: Monorepo management
- **Vite + React + TypeScript**: Fast, modern web app
- **viem**: Lightweight EVM interactions
- **wagmi**: React hooks for Ethereum wallets
- **React Router**: Client-side routing

## Repository Structure

```
lava-payment/
├── apps/
│   └── web/              # React web application
│       ├── src/
│       │   ├── components/  # WalletConnect
│       │   ├── pages/       # Receive, Pay, Receipt, History
│       │   ├── config.ts    # wagmi configuration
│       │   └── main.tsx     # Entry point
│       └── package.json
├── packages/
│   └── shared/           # Shared types and constants
│       ├── src/
│       │   ├── constants.ts # Plasma chain + USDT0 config
│       │   ├── types.ts     # TypeScript interfaces
│       │   └── index.ts
│       └── package.json
├── docs/                 # Documentation and demo script
├── pnpm-workspace.yaml
└── package.json
```

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- MetaMask browser extension

### Installation

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Clone the repository
git clone https://github.com/hugodvrs4/Lava-Payment.git
cd Lava-Payment

# Install dependencies
pnpm install
```

### Running Locally

```bash
# Start development server
pnpm dev

# The app will open at http://localhost:5173
```

### Build for Production

```bash
# Build all packages
pnpm build

# Preview production build
cd apps/web
pnpm preview
```

## Plasma Blockchain

### Network Configuration

- **Chain ID**: 9745
- **Network Name**: Plasma
- **RPC URL**: https://rpc.plasma.to
- **Block Explorer**: https://explorer.plasma.to
- **Currency**: PLASMA

The app automatically configures MetaMask to use the Plasma network when you connect your wallet.

### USDT0 Token

- **Contract Address**: `0x0000000000000000000000000000000000000000`
- **Symbol**: USDT0
- **Decimals**: 6
- **Type**: ERC20 Stablecoin

USDT0 is a stablecoin deployed on Plasma. The app uses standard ERC20 `transfer()` calls to send payments.

## How to Use

### 1. Connect Your Wallet

1. Open the app
2. Click "Connect MetaMask"
3. Approve the connection
4. MetaMask will prompt you to add/switch to the Plasma network

### 2. Receive Payment

1. Navigate to "Receive Payment"
2. **Optional**: Enable "Use a fresh receiving address" for better privacy
   - If enabled, create/switch to a new MetaMask account
   - Click "I switched / using fresh address" to confirm
3. Enter the amount in USDT0
4. Add an optional memo (local-only, never sent on-chain)
5. Click "Create Invoice"
6. Share the generated invoice code

**Privacy Tip**: Using a fresh address for each invoice prevents others from linking your payments together.

### 3. Pay an Invoice

1. Navigate to "Pay Invoice"
2. Paste the invoice code (or scan QR in future)
3. Click "Decode Invoice" to preview details
4. Review recipient, amount, and memo
5. Click "Pay Invoice"
6. Approve the transaction in MetaMask
7. View receipt with transaction hash and explorer link

### 4. View History

Transaction history will be stored locally in localStorage (feature planned).

## Development

### Project Commands

```bash
# Run dev server
pnpm dev

# Build all packages
pnpm build

# Clean build artifacts
pnpm clean
```

### Package Structure

- **apps/web**: Main React application
- **packages/shared**: Shared TypeScript types and constants

### Key Files

- `packages/shared/src/constants.ts`: Plasma chain configuration and USDT0 address
- `packages/shared/src/types.ts`: TypeScript interfaces for invoices and transactions
- `apps/web/src/config.ts`: wagmi configuration for wallet connections
- `apps/web/src/pages/`: All page components (Receive, Pay, Receipt, History, Home)

## Security Notes

- **No private keys are stored or transmitted**
- **All transactions require MetaMask approval**
- **Invoice codes are base64-encoded JSON (not encrypted)**
- **Always verify recipient address before paying**
- **No backend or server-side processing**
- **All data stays local in your browser**

## Privacy Best Practices

For maximum privacy when using Lava Payments:

1. **Use Fresh Addresses**: Create a new MetaMask account for sensitive payments
2. **Generic Memos**: Use non-identifying notes like "Order #102" instead of personal info
3. **Share Securely**: Send invoice codes via encrypted channels (Signal, etc.)
4. **Clear History**: Invoices expire after 24 hours; clear old invoices from localStorage if needed
5. **Separate Wallets**: Consider using different wallets for different transaction types

## Future Enhancements

- QR code generation and scanning
- Enhanced local transaction history with search/filter
- Multiple invoice templates
- Multi-token support (other ERC20s)
- Transaction notifications
- Export history (CSV/JSON)
- Optional invoice password protection (off-chain)

## License

MIT

## Contributing

This is a hackathon project. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues or questions, please open a GitHub issue.