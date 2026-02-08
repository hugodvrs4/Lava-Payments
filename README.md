# Lava Payments

A clean, mobile-first Web3 payments application for the Plasma blockchain. Send and receive USDT0 stablecoin payments with a simple, **privacy-focused** interface.

## What It Does

Lava Payments enables peer-to-peer USDT0 (stablecoin) payments on the Plasma blockchain:

- **Receive**: Generate payment requests with shareable invoice codes and QR codes
- **Pay**: Send USDT0 by pasting invoice codes or scanning QR codes via webcam
- **Track**: View real-time transaction status with blockchain polling (3-second updates)
- **History**: See all on-chain transactions (sent & received) directly from blockchain
- **Contacts**: Save and manage frequently used payment addresses
- **Multi-Network**: Support for both Plasma Mainnet and Testnet with environment-based switching
- **Privacy**: Fresh address support, local contacts storage, no tracking
- **Zero-Fee Ready**: Architecture supports Plasma paymaster for sponsored transactions

All powered by MetaMask wallet connection and direct blockchain interactions—**no backend, no accounts, no tracking**.

## Privacy & Confidentiality

### Privacy by Design

Lava Payments is built with privacy as a core principle:

✅ **No Accounts**: No login, email, or registration required  
✅ **No Backend**: All operations happen client-side in your browser  
✅ **No Tracking**: No analytics, cookies, or third-party services  
✅ **No Server Storage**: All data stays on your device  
✅ **On-Chain History**: Transaction history fetched directly from blockchain via RPC  
✅ **Local Contacts**: Saved addresses stored in browser localStorage only  
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

### Invoice Memos: Not On-Chain, But Shareable

When you add a memo/note to an invoice:
- It's included in the shareable invoice code/QR (by design, for context)
- It's displayed to the payer before they send
- It's stored in your local browser history
- **It is NEVER written to the blockchain**

The blockchain only sees: `transfer(toAddress, amount)` — nothing else.

**Transparency**: While memos don't go on-chain, they ARE present in the shared invoice link/code. This is intentional—it provides payment context to the payer without bloating blockchain data.

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
- **viem v2**: Lightweight EVM interactions and blockchain queries
- **wagmi v2**: React hooks for Ethereum wallets (useAccount, useChainId, useWriteContract, etc.)
- **React Router v6**: Client-side routing
- **@zxing/browser**: QR code scanning via webcam
- **qrcode.react**: QR code generation for invoices
- **ethers.js v6**: Alternative RPC provider (fallback option)

## Repository Structure

```
lava-payment/
├── apps/
│   └── web/              # React web application
│       ├── src/
│       │   ├── components/  # WalletConnect, ThemeToggle, ContactsDebugPanel
│       │   ├── pages/       # HomePage, ReceivePage, PayPage, ReceiptPage, 
│       │   │                # HistoryPage, ContactsPage
│       │   ├── services/    # PaymentService, ContactService, HistoryService
│       │   ├── utils/       # explorer.ts (Plasmascan URLs)
│       │   ├── config.ts    # wagmi + viem configuration (Mainnet + Testnet)
│       │   ├── vite-env.d.ts # TypeScript declarations for Vite env vars
│       │   └── main.tsx     # Entry point
│       ├── .env.local       # Network configuration (VITE_USE_TESTNET)
│       ├── .env.example     # Environment variables template
│       └── package.json
├── packages/
│   └── shared/           # Shared types and constants
│       ├── src/
│       │   ├── constants.ts # PLASMA_CHAIN, PLASMA_TESTNET_CHAIN, USDT0 addresses
│       │   ├── types.ts     # InvoicePayload, PaymentRecord, Contact
│       │   └── index.ts
│       └── package.json
├── docs/                 # Comprehensive documentation
│   ├── DEMO.md          # Demo script for presentations
│   ├── FIX_CHAIN_ERROR.md      # ChainNotConfiguredError troubleshooting
│   ├── NETWORK_CONFIG.md       # Testnet/Mainnet switching guide
│   ├── TRANSACTION_STATUS_DEBUG.md # Receipt page debugging
│   └── ZERO_FEE_INTEGRATION.md # Paymaster integration guide
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
git clone https://github.com/hugodvrs4/Lava-Payments.git
cd Lava-Payments

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

**Plasma Mainnet (Production)**:
- **Chain ID**: 9745
- **Network Name**: Plasma Mainnet Beta
- **RPC URL**: https://rpc.plasma.to
- **Block Explorer**: https://plasmascan.to
- **Currency**: XPL (Plasma)
- **USDT0 Contract**: `0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb`

**Plasma Testnet (Development)**:
- **Chain ID**: 9746
- **Network Name**: Plasma Testnet
- **RPC URL**: https://testnet-rpc.plasma.to
- **Block Explorer**: https://testnet.plasmascan.to
- **Currency**: XPL (Plasma)
- **USDT0 Contract**: `0x502012b361AebCE43b26Ec812B74D9a51dB4D412`

The app automatically configures MetaMask to use the correct Plasma network based on the `VITE_USE_TESTNET` environment variable.

### Network Switching

To switch between Mainnet and Testnet:

1. Edit `apps/web/.env.local`:
   ```bash
   # For Testnet (development)
   VITE_USE_TESTNET=true
   
   # For Mainnet (production)
   VITE_USE_TESTNET=false
   ```

2. Restart the dev server: `pnpm dev`

The app uses `ACTIVE_PLASMA_CHAIN` which automatically selects the network based on this setting.

See `docs/NETWORK_CONFIG.md` for detailed configuration guide.

### USDT0 Token

- **Symbol**: USDT0
- **Decimals**: 6
- **Type**: ERC20 Stablecoin
- **Addresses**: Network-specific (see above)

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
6. **Share the invoice**:
   - Copy the invoice code (base64-encoded JSON)
   - Share the QR code (scan with camera)
   - Copy the payment link URL

**Privacy Tip**: Using a fresh address for each invoice prevents others from linking your payments together.

### 3. Pay an Invoice

1. Navigate to "Pay Invoice"
2. **Enter invoice** by:
   - Pasting the invoice code
   - Scanning QR code via webcam (click "Scan QR")
   - Selecting from saved contacts (click "From Contacts")
3. Click "Decode Invoice" to preview details
4. Review recipient, amount, memo, and network
5. **Optional**: Save recipient as contact for future payments
6. Click "Pay Invoice"
7. Approve the transaction in MetaMask
8. Redirected to Receipt page with live status tracking

### 4. View Transaction Receipt

After payment, the Receipt page shows:
- **Real-time status updates** (polling every 3 seconds)
- Transaction hash with Plasmascan link
- Block number and confirmations
- Gas used and transaction details
- Animated progress bar while pending
- Automatic detection when transaction is confirmed

### 5. View History

Navigate to "History" to see:
- **All on-chain transactions** (sent & received) from the blockchain
- Last 5,000 blocks queried via RPC
- Color-coded: Green for received, Orange for sent
- Transaction amounts, addresses, and block numbers
- Direct links to Plasmascan and Receipt page
- Automatically filtered by connected wallet address

**Note**: History is fetched directly from blockchain Transfer events, not from localStorage.

### 6. Manage Contacts

Navigate to "Contacts" to:
- **Add new contacts** with name and address
- View all saved contacts with search and sort
- Edit contact names
- Delete contacts
- **Quick pay**: Select contact when creating payments
- Contacts stored locally in browser localStorage per wallet address

**Privacy**: Contacts are wallet-specific and never leave your browser.

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

- `packages/shared/src/constants.ts`: Plasma Mainnet + Testnet chain configs, USDT0 addresses, network mapping
- `packages/shared/src/types.ts`: TypeScript interfaces (InvoicePayload, PaymentRecord, Contact)
- `apps/web/src/config.ts`: wagmi + viem configuration with ACTIVE_PLASMA_CHAIN selector
- `apps/web/src/pages/`: All page components (HomePage, ReceivePage, PayPage, ReceiptPage, HistoryPage, ContactsPage)
- `apps/web/src/services/paymentService.ts`: Payment execution with standard/zero-fee abstraction
- `apps/web/src/services/contactService.ts`: Contact management with localStorage persistence
- `apps/web/src/services/historyService.ts`: Transaction history utilities (legacy, now using on-chain queries)
- `apps/web/src/vite-env.d.ts`: TypeScript declarations for Vite environment variables
- `apps/web/.env.local`: Local environment configuration (VITE_USE_TESTNET)

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

- ✅ ~~QR code generation and scanning~~ (Completed)
- ✅ ~~Enhanced transaction history with blockchain queries~~ (Completed)
- ✅ ~~Contact management system~~ (Completed)
- ✅ ~~Multi-network support (Testnet + Mainnet)~~ (Completed)
- ✅ ~~Real-time transaction status tracking~~ (Completed)
- Multiple invoice templates
- Multi-token support (other ERC20s beyond USDT0)
- Transaction notifications (browser notifications API)
- Export history (CSV/JSON)
- Optional invoice password protection (off-chain encryption)
- Batch payments (pay multiple invoices at once)
- Recurring payment support
- Integration with Plasma paymaster for zero-fee transfers

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