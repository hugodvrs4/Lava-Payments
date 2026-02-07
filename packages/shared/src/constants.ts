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

// TODO: Replace with actual USDT0 contract address on Plasma network
export const USDT0_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
export const USDT0_DECIMALS = 6;

// Zero-fee configuration (Plasma paymaster/relayer)
export const ZERO_FEE_CONFIG = {
  enabled: false, // Set to true when relayer integration is complete
  relayerUrl: '', // Set via environment variable VITE_PLASMA_RELAYER_URL
  // When enabled: transfers sponsored by Plasma paymaster for USDT0
  // See: Plasma "Zero-Fee USDT Transfers" documentation
} as const;
