# Lava Payments - ETH Oxford 2026 Submission

## What We Built

Lava Payments is a privacy-focused, mobile-first Web3 payments application for the Plasma blockchain. It enables peer-to-peer USDT0 (stablecoin) transfers with a clean, user-friendly interface—no backend, no accounts, no tracking.

## Core Features

1. **Receive Payments**: Generate payment requests with shareable invoice codes and QR codes
2. **Send Payments**: Pay by pasting invoice codes or scanning QR codes via webcam
3. **Transaction Tracking**: Real-time status updates with blockchain polling (3-second intervals)
4. **On-Chain History**: View all sent and received transactions directly from blockchain via RPC queries
5. **Contact Management**: Save and manage frequently used payment addresses locally
6. **Multi-Network Support**: Seamless switching between Plasma Mainnet and Testnet

## Privacy & Confidentiality

Our privacy approach is **transparent and realistic**:

### What We Guarantee

✅ **No backend**: All operations happen client-side  
✅ **No accounts**: No login, email, or registration  
✅ **No tracking**: No analytics, cookies, or third-party services  
✅ **On-chain only essentials**: ERC20 `transfer(to, amount)` with no metadata  

### What We're Honest About

⚠️ **Invoice memos are NOT on-chain, but ARE shareable**:
- When you create an invoice with a memo/note, it's encoded in the shareable invoice code
- The payer sees it before sending
- It's stored locally in browser history
- **It is NEVER written to the blockchain**
- But it IS present in the shared invoice link/QR code (by design, for context)

⚠️ **EVM transactions are public**:
- Transaction amounts, sender/receiver addresses, and timing are visible on-chain
- This is an inherent limitation of standard EVM blockchains
- We cannot hide this without specialized protocols (ZK-SNARKs, confidential transactions)

### Privacy Improvements

Despite EVM limitations, we encourage privacy through:
- **Fresh address usage**: Users can create new MetaMask accounts per invoice to prevent transaction linkability
- **Random invoice IDs**: UUID-based identifiers prevent pattern detection
- **Invoice expiry**: 24-hour expiration reduces linkability and prevents reuse
- **Minimal metadata**: Only essential data (address, amount) goes on-chain

## Zero-Fee Architecture

Lava Payments is **architecturally ready** for zero-fee USDT0 transfers via Plasma's paymaster system:

- **Service abstraction**: `PaymentService` handles both standard and zero-fee flows
- **UI toggle**: Users can select zero-fee mode when available
- **Transparent fees**: App clearly shows who paid fees (user vs paymaster)
- **Graceful fallback**: Falls back to standard mode if relayer unavailable

**Integration status**: Complete architecture and UI ready, awaiting Plasma relayer API access for final integration.

See `docs/ZERO_FEE_INTEGRATION.md` for technical details.

## Technical Stack

- **Frontend**: Vite + React + TypeScript
- **Blockchain**: viem v2 (lightweight EVM interactions), wagmi v2 (React hooks)
- **QR Codes**: @zxing/browser (scanning), qrcode.react (generation)
- **Routing**: React Router v6
- **Monorepo**: pnpm workspaces

## Architecture Highlights

- **No backend**: Direct RPC calls to Plasma blockchain
- **Privacy by default**: All user data (contacts, invoice notes) stored locally in browser
- **Real-time updates**: Transaction status polling with smart exponential backoff
- **On-chain history**: Direct `eth_getLogs` queries for Transfer events (no indexer needed)
- **Network flexibility**: Environment-based switching between Mainnet and Testnet

## What Makes It Unique

1. **Transparency**: We're honest about privacy limitations (EVM public nature, shareable invoice memos)
2. **Zero dependencies**: No reliance on external APIs, databases, or services
3. **Mobile-first UX**: Clean interface optimized for real-world payment scenarios
4. **Future-ready**: Zero-fee integration architecture already built
5. **Open source**: Fully documented, clean codebase structure

## Repository Structure

```
apps/web/          # Main Vite + React application
packages/shared/   # Shared types and constants (network configs, USDT0 addresses)
docs/              # Documentation (DEMO.md, ZERO_FEE_INTEGRATION.md)
```

## Try It

1. Clone: `git clone https://github.com/hugodvrs4/Lava-Payments.git`
2. Install: `pnpm install`
3. Run: `pnpm dev`
4. Connect MetaMask and start sending USDT0 on Plasma!

---

**Built with ❤️ for ETH Oxford 2026**
