import { useNavigate } from 'react-router-dom'

export function HistoryPage() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Transaction History</h2>
      
      <p style={{ marginTop: '1rem', color: '#666' }}>
        No transaction history available yet.
      </p>
      <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
        Transaction history will be stored locally in a future update.
      </p>

      <button 
        onClick={() => navigate('/')}
        style={{ marginTop: '2rem', padding: '0.75rem 1.5rem' }}
      >
        Back to Home
      </button>
    </div>
  )
}
