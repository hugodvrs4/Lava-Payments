# Lava Payment Documentation

## Overview

Lava Payment is a Web3 payments application built for the Plasma blockchain. It enables peer-to-peer USDT0 stablecoin payments using a simple mobile-first interface.

## Architecture

### Monorepo Structure

```
lava-payment/
├── apps/
│   └── web/          # React frontend application
├── packages/
│   └── shared/       # Shared types and constants
└── docs/            # Documentation
```

### Technology Stack

- **pnpm workspaces**: Monorepo management
- **Vite**: Build tool and dev server
- **React + TypeScript**: UI framework
- **viem**: Ethereum library for EVM interactions
- **wagmi**: React hooks for Ethereum
- **React Router**: Client-side routing

## Key Features

### 1. Wallet Connection
- MetaMask integration via wagmi
- Automatic Plasma network configuration

### 2. Receive Payments
- Generate payment requests with amount and optional memo
- Invoice encoded as base64 string for sharing
- QR code support (future enhancement)

### 3. Pay Invoices
- Paste or scan invoice codes
- Preview payment details before confirming
- Direct USDT0 ERC20 transfers

### 4. Transaction Receipts
- View transaction hash
- Direct link to Plasma block explorer

### 5. History (Placeholder)
- Local transaction storage planned for future updates

## Plasma Blockchain

- **Chain ID**: 9745
- **RPC URL**: https://rpc.plasma.to
- **Block Explorer**: https://explorer.plasma.to

## USDT0 Token

- **Address**: `0x0000000000000000000000000000000000000000`
- **Decimals**: 6
- **Symbol**: USDT0

## Development

See the main README.md for setup and running instructions.
