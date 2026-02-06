# Lava Payment

A clean, mobile-first Web3 payments application for the Plasma blockchain. Send and receive USDT0 stablecoin payments with a simple, hackathon-ready interface.

## What It Does

Lava Payment enables peer-to-peer USDT0 (stablecoin) payments on the Plasma blockchain:

- **Receive**: Generate payment requests with QR codes or shareable invoice codes
- **Pay**: Send USDT0 by pasting or scanning invoice codes
- **Track**: View transaction receipts with direct links to the Plasma block explorer
- **History**: Local transaction storage (coming soon)

All powered by MetaMask wallet connection and direct blockchain interactions—no backend required.

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
2. Enter the amount in USDT0
3. Add an optional memo
4. Click "Create Invoice"
5. Share the generated code or QR (QR coming soon)

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

- No private keys are stored or transmitted
- All transactions require MetaMask approval
- Invoice codes are base64-encoded JSON (not encrypted)
- Always verify recipient address before paying

## Future Enhancements

- QR code generation and scanning
- Local transaction history with localStorage
- Invoice expiration timestamps
- Multi-token support
- Transaction notifications
- Mobile app (React Native)

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