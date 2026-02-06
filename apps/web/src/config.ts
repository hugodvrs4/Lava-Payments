import { http, createConfig } from 'wagmi'
import { PLASMA_CHAIN } from '@lava-payment/shared'
import { injected } from '@wagmi/connectors'

export const config = createConfig({
  chains: [PLASMA_CHAIN],
  connectors: [
    injected(),
  ],
  transports: {
    [PLASMA_CHAIN.id]: http(),
  },
})
