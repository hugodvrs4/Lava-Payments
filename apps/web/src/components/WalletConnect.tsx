import { useAccount, useConnect, useDisconnect } from 'wagmi'

const DAPP_URL = 'hugodvrs4.github.io/Lava-Payments/'
const METAMASK_DEEPLINK = `https://metamask.app.link/dapp/${DAPP_URL}`

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function hasInjectedWallet() {
  return typeof window !== 'undefined' && !!window.ethereum
}

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div style={{ padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className='littlebox'>
          <p>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
        </div>
        <button onClick={() => disconnect()} style={{ marginTop: '0.5rem', padding: '10px 40px' }}>
          Disconnect
        </button>
      </div>
    )
  }

  // Mobile without MetaMask browser → show deep link
  if (isMobile() && !hasInjectedWallet()) {
    return (
      <div style={{ padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p>Not connected</p>
        <a
          href={METAMASK_DEEPLINK}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
            textDecoration: 'none',
          }}
          className="button"
        >
          Open in MetaMask
        </a>
      </div>
    )
  }

  return (
    <div style={{ padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <p>Not connected</p>
      <button
        onClick={() => connect({ connector: connectors[0] })}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          cursor: 'pointer',
        }}
      >
        Connect MetaMask
      </button>
    </div>
  )
}
