import { useParams, useNavigate } from 'react-router-dom'
import { useChainId } from 'wagmi'
import { plasmaExplorerTx } from '../utils/explorer'

export function ReceiptPage() {
  const { hash } = useParams<{ hash: string }>()
  const navigate = useNavigate()
  const chainId = useChainId()

  const explorerUrl = hash ? plasmaExplorerTx(chainId, hash) : ''

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Payment Receipt</h2>
      
      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5' }}>
        <p><strong>Transaction Hash:</strong></p>
        <p style={{ wordBreak: 'break-all', marginTop: '0.5rem' }}>{hash}</p>
        
        {explorerUrl && (
          <div style={{ marginTop: '1rem' }}>
            <a 
              href={explorerUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#0066cc' }}
            >
              View on Plasmascan →
            </a>
          </div>
        )}
      </div>

      <button 
        onClick={() => navigate('/')}
        style={{ marginTop: '2rem', padding: '0.75rem 1.5rem' }}
      >
        Back to Home
      </button>
    </div>
  )
}
