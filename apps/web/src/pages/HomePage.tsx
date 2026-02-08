import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import ThemeToggle from "../components/ThemeToggle"

export function HomePage() {
  const { isConnected } = useAccount()

  return (
    <>
      <ThemeToggle />
      <div className="container">
        <img src="/src/img/logo.png" alt="Lava Payments Logo" style={{ width: '100px', marginBottom: '5px' }} />
        <h1>Lava Payments</h1>
        <p style={{ margin: '0', color: '#666' }}>
          Web3 payments on Plasma blockchain
        </p>

        {!isConnected && (
          <p style={{ color: '#2a5a4f'}}>
            Connect your wallet to get started
          </p>
        )}

        <nav style={{ marginTop: '5px' }}>
          <ul style={{ listStyle: 'none', marginLeft: 0,marginBottom:'0'}}>
            <li style={{ marginBottom: '10px' }}>
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
            
            <li style={{ marginBottom: '10px' }}>
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
            
            <li style={{ marginBottom: '10px' }}>
              <Link 
                to="/contacts"
                className="hoverthink"
              >
                <strong>Contacts</strong>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '0.25rem' }}>
                  Manage your saved recipients
                </p>
              </Link>
            </li>
            
            <li style={{ marginBottom: '10px' }}>
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