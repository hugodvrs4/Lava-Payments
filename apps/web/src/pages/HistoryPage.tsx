import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useChainId } from 'wagmi'
import { HistoryService } from '../services/historyService'
import { PLASMA_NETWORKS } from '@lava-payment/shared'
import type { PaymentRecord } from '@lava-payment/shared'
import { explorerTxUrl } from '../utils/explorer'

export function HistoryPage() {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [history, setHistory] = useState<PaymentRecord[]>([])
  const [showAllNetworks, setShowAllNetworks] = useState(false)

  useEffect(() => {
    if (address) {
      if (showAllNetworks) {
        // Load history from all networks
        const allHistory = HistoryService.getAllHistory(address)
        const combined = allHistory.flatMap(h => h.records)
        setHistory(combined.sort((a, b) => b.createdAt - a.createdAt))
      } else {
        // Load history for current network only
        setHistory(HistoryService.getHistory(chainId, address))
      }
    }
  }, [address, chainId, showAllNetworks])

  const handleClearHistory = () => {
    if (!address) return
    
    if (confirm('Are you sure you want to clear your transaction history? This cannot be undone.')) {
      if (showAllNetworks) {
        // Clear all networks
        HistoryService.clearHistory(9745, address)
        HistoryService.clearHistory(9746, address)
      } else {
        HistoryService.clearHistory(chainId, address)
      }
      setHistory([])
    }
  }

  const getNetworkName = (chainId: number): string => {
    return PLASMA_NETWORKS[chainId as keyof typeof PLASMA_NETWORKS]?.name || `Chain ${chainId}`
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString()
  }

  const formatAddress = (addr: string): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed': return '#4caf50'
      case 'submitted': return '#ff9800'
      case 'failed': return '#f44336'
      default: return '#666'
    }
  }

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'confirmed': return '✓'
      case 'submitted': return '⏳'
      case 'failed': return '✗'
      default: return '?'
    }
  }

  if (!isConnected) {
    return (
      <div className='container'>
        <h2>Transaction History</h2>
        <p style={{ marginTop: '1rem' }}>Please connect your wallet to view history.</p>
        <button onClick={() => navigate('/')} style={{ marginTop: '2rem' }}>
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <div className='container'>
      <h2>Transaction History</h2>
      
      <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', color: '#2a5a4f' }}>
          <input
            type="checkbox"
            checked={showAllNetworks}
            onChange={(e) => setShowAllNetworks(e.target.checked)}
            style={{ marginRight: '0.5rem' }}
          />
          Show transactions from all networks
        </label>
      </div>

      {history.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', background: '#2a5a4f', borderRadius: '4px' }}>
          <p style={{ color: '#fff' }}>No transactions yet</p>
          <p style={{ fontSize: '0.9rem', color: '#fff', marginTop: '0.5rem' }}>
            Your payment history is stored locally and private
          </p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.9rem', color: '#fff' }}>
              {history.length} transaction{history.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.map((record) => (
              <div
                key={record.txHash}
                style={{
                  padding: '1rem',
                  background: '#2a5a4f',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: getStatusColor(record.status),
                    fontSize: '0.9rem'
                  }}>
                    {getStatusIcon(record.status)} {record.status.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#fff' }}>
                    {getNetworkName(record.chainId)}
                  </span>
                </div>

                <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  <strong>Amount:</strong> {record.amount} {record.token}
                </div>

                <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  <strong>To:</strong> {formatAddress(record.to)}
                </div>

                {record.note && (
                  <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem', color: '#fff' }}>
                    <strong>Note:</strong> {record.note}
                  </div>
                )}

                <div style={{ fontSize: '0.85rem', color: '#fff', marginTop: '0.5rem' }}>
                  {formatDate(record.createdAt)}
                </div>

                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                  <a
                    href={explorerTxUrl(record.chainId, record.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.85rem',
                      color: '#2a5a4f',
                      textDecoration: 'none',
                    }}
                  >
                    View on Plasmascan →
                  </a>
                  <button
                    onClick={() => navigate(`/receipt/${record.txHash}`)}
                    style={{
                      fontSize: '0.85rem',
                      padding: '0.25rem 0.5rem',
                      background: 'transparent',
                      border: '1px solid #2a5a4f',
                      color: '#ffffff',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                  >
                    View Receipt
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleClearHistory}
            style={{
              marginTop: '1.5rem',
              padding: '0.5rem 1rem',
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Clear History
          </button>
        </>
      )}

      <button
        onClick={() => navigate('/')}
        style={{ marginTop: '2rem', padding: '0.75rem 1.5rem' }}
      >
        Back to Home
      </button>
    </div>
  )
}
