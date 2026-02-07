import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'

export function HomePage() {
  const { isConnected } = useAccount()

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Lava Payments</h1>
      <p style={{ marginTop: '0.5rem', color: '#666' }}>
        Web3 payments on Plasma blockchain
      </p>

      {!isConnected && (
        <p style={{ marginTop: '1rem', padding: '1rem', background: '#fff3cd', borderRadius: '4px' }}>
          Connect your wallet to get started
        </p>
      )}

      <nav style={{ marginTop: '2rem' }}>
        <ul style={{ listStyle: 'none' }}>
          <li style={{ marginBottom: '1rem' }}>
            <Link 
              to="/receive" 
              style={{ 
                display: 'block',
                padding: '1rem',
                background: '#f5f5f5',
                textDecoration: 'none',
                color: 'inherit',
                borderRadius: '4px'
              }}
            >
              <strong>Receive Payment</strong>
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                Create an invoice or QR code
              </p>
            </Link>
          </li>
          
          <li style={{ marginBottom: '1rem' }}>
            <Link 
              to="/pay"
              style={{ 
                display: 'block',
                padding: '1rem',
                background: '#f5f5f5',
                textDecoration: 'none',
                color: 'inherit',
                borderRadius: '4px'
              }}
            >
              <strong>Pay Invoice</strong>
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                Paste or scan a payment request
              </p>
            </Link>
          </li>
          
          <li style={{ marginBottom: '1rem' }}>
            <Link 
              to="/history"
              style={{ 
                display: 'block',
                padding: '1rem',
                background: '#f5f5f5',
                textDecoration: 'none',
                color: 'inherit',
                borderRadius: '4px'
              }}
            >
              <strong>History</strong>
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                View past transactions
              </p>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}
