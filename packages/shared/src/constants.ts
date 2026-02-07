export const PLASMA_CHAIN = {
  id: 9745,
  name: 'Plasma',
  network: 'plasma',
  nativeCurrency: {
    name: 'Plasma',
    symbol: 'PLASMA',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.plasma.to'],
    },
    public: {
      http: ['https://rpc.plasma.to'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Plasma Explorer',
      url: 'https://explorer.plasma.to',
    },
  },
} as const;

// Network-specific USDT0 addresses - SINGLE SOURCE OF TRUTH
export const PLASMA_NETWORKS = {
  9745: {
    name: "Plasma Mainnet",
    usdt: "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb",
  },
  9746: {
    name: "Plasma Testnet",
    usdt: "0x502012b361AebCE43b26Ec812B74D9a51dB4D412",
  },
} as const;

export const USDT0_DECIMALS = 6;

// Zero-fee configuration (Plasma paymaster/relayer)
export const ZERO_FEE_CONFIG = {
  enabled: false, // Set to true when relayer integration is complete
  relayerUrl: '', // Set via environment variable VITE_PLASMA_RELAYER_URL
  // When enabled: transfers sponsored by Plasma paymaster for USDT0
  // See: Plasma "Zero-Fee USDT Transfers" documentation
} as const;
