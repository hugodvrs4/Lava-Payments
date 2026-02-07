import { useParams, useNavigate } from 'react-router-dom'
import { useChainId, useWaitForTransactionReceipt } from 'wagmi'
import { explorerTxUrl } from '../utils/explorer'

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
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <div
        style={{
          background: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          padding: '2rem',
        }}
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
                color: isSuccess ? '#4caf50' : '#ff9800',
              }}
            >
              {isLoading ? 'Pending' : 'Confirmed on Plasma'}
            </span>
          </div>

          <div className="receipt-row">
            <span style={{ color: '#666', fontSize: '0.9rem' }}>Transaction</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <code style={{ fontSize: '0.9rem' }}>{hash && truncateHash(hash)}</code>
              {hash && (
                <button
                  onClick={() => copyToClipboard(hash)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.8rem',
                    background: '#f0f0f0',
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
                  color: '#0066cc',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                }}
              >
                View on Plasmascan →
              </a>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '2rem',
            padding: '0.75rem 1.5rem',
            width: '100%',
            background: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}
