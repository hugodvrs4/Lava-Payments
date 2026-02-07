import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <p>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
        <button onClick={() => disconnect()} style={{ marginTop: '0.5rem' }}>
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
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
