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
