import { http, createConfig } from 'wagmi'
import { PLASMA_CHAIN, PLASMA_TESTNET_CHAIN } from '@lava-payment/shared'
import { injected } from '@wagmi/connectors'

// 🔧 Configuration : Choisir entre Testnet et Mainnet
// Basé sur la variable d'environnement VITE_USE_TESTNET
// Pour basculer : modifier .env.local ou apps/web/.env.local
const USE_TESTNET = import.meta.env.VITE_USE_TESTNET === 'true'

export const ACTIVE_PLASMA_CHAIN = USE_TESTNET ? PLASMA_TESTNET_CHAIN : PLASMA_CHAIN

console.log(`🌐 Active Plasma Network: ${ACTIVE_PLASMA_CHAIN.name} (chainId: ${ACTIVE_PLASMA_CHAIN.id})`)

export const config = createConfig({
  chains: [
    PLASMA_TESTNET_CHAIN, // 🧪 Testnet
    PLASMA_CHAIN,         // 🌐 Mainnet
  ],
  connectors: [
    injected(),
  ],
  transports: {
    [PLASMA_TESTNET_CHAIN.id]: http('https://testnet-rpc.plasma.to'),
    [PLASMA_CHAIN.id]: http('https://rpc.plasma.to'),
  },
})
