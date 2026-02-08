import { useParams, useNavigate } from 'react-router-dom'
import { useChainId, useWaitForTransactionReceipt } from 'wagmi'
import { explorerTxUrl } from '../utils/explorer'
import ThemeToggle from "../components/ThemeToggle"

export function ReceiptPage() {
  const { hash } = useParams<{ hash: string }>()
  const navigate = useNavigate()
  const chainId = useChainId()

  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash: hash as `0x${string}`,
  })

  const explorerUrl = hash ? explorerTxUrl(chainId, hash) : ''

  const truncateHash = (h: string) => `${h.slice(0, 6)}…${h.slice(-4)}`

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    alert('Copied to clipboard')
  }

  return (
        <>
          <ThemeToggle />
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <div
        className='container'
      >
        <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>
          {isSuccess ? '✅' : '⏳'} Payment {isSuccess ? 'Successful' : 'Processing'}
        </h2>
        <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
          {isLoading ? 'Waiting for confirmation...' : 'Your payment has been confirmed'}
        </p>

        <div
          style={{
            marginTop: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div className="receipt-row">
            <span style={{ color: '#666', fontSize: '0.9rem' }}>Status</span>
            <span
              style={{
                fontWeight: '600',
                color: isSuccess ? '#4caf50' : '#2a5a4f',
              }}
            >
              {isLoading ? 'Pending' : 'Confirmed on Plasma'}
            </span>
          </div>

          <div className="receipt-row">
            <span style={{ color: '#666', fontSize: '0.9rem' }}>Transaction</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem',dispay: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <code style={{ fontSize: '0.9rem' }}>{hash && truncateHash(hash)}</code>
              {hash && (
                <button
                  onClick={() => copyToClipboard(hash)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.8rem',
                    background: '#2a5a4f',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Copy
                </button>
              )}
            </div>
          </div>

          {explorerUrl && (
            <div style={{ marginTop: '0.5rem' }}>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#2a5a4f',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                }}
              >
                <strong>
                View on Plasmascan →
                </strong>
              </a>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/')}
  
        >
          Back to Home
        </button>
      </div>
    </div>
    </>
  )
}