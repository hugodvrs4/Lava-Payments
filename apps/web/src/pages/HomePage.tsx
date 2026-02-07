import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import ThemeToggle from "../components/ThemeToggle"

export function HomePage() {
  const { isConnected } = useAccount()

  return (
    <>
      <ThemeToggle />
      <div className="container">
        <img src="/src/img/logo.png" alt="Lava Payments Logo" style={{ width: '100px', marginBottom: '1rem' }} />
        <h1>Lava Payments</h1>
        <p style={{ margin: '0', color: '#666' }}>
          Web3 payments on Plasma blockchain
        </p>

        {!isConnected && (
          <p style={{ color: '#2a5a4f'}}>
            Connect your wallet to get started
          </p>
        )}

        <nav style={{ marginTop: '2rem' }}>
          <ul style={{ listStyle: 'none', marginLeft: 0 }}>
            <li style={{ marginBottom: '1rem' }}>
              <Link 
                to="/receive" 
                className="hoverthink"
              >
                <strong>Receive Payment</strong>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '0.25rem' }}>
                  Create an invoice or QR code
                </p>
              </Link>
            </li>
            
            <li style={{ marginBottom: '1rem' }}>
              <Link 
                to="/pay"
                className="hoverthink"
              >
                <strong>Pay Invoice</strong>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '0.25rem' }}>
                  Paste or scan a payment request
                </p>
              </Link>
            </li>
            
            <li style={{ marginBottom: '1rem' }}>
              <Link 
                to="/history"
                className="hoverthink"
              >
                <strong>History</strong>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '0.25rem' }}>
                  View past transactions (stored locally)
                </p>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  )
}