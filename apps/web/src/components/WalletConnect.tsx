import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div style={{ padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
        className='littlebox'>
        <p>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
        </div>
        <button onClick={() => disconnect()} style={{ marginTop: '0.5rem',padding : '10px 40px' }}>
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '1rem', borderBottom: '1px solid #ccc',display: 'flex', flexDirection: 'column', alignItems: 'center'  }}>
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
