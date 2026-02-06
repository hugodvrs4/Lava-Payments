import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import type { InvoicePayload } from '@lava-payment/shared'

export function ReceivePage() {
  const { address } = useAccount()
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [payload, setPayload] = useState<string | null>(null)

  const handleCreateInvoice = () => {
    if (!address || !amount) return

    const invoice: InvoicePayload = {
      recipient: address,
      amount,
      memo: memo || undefined,
      timestamp: Date.now(),
    }

    const encoded = btoa(JSON.stringify(invoice))
    setPayload(encoded)
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Receive Payment</h2>
      
      {!address ? (
        <p>Please connect your wallet</p>
      ) : payload ? (
        <div style={{ marginTop: '1rem' }}>
          <h3>Payment Request Created</h3>
          <div style={{ 
            padding: '1rem', 
            background: '#f5f5f5', 
            wordBreak: 'break-all',
            marginTop: '0.5rem'
          }}>
            {payload}
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
            Share this code or QR to receive payment
          </p>
          <button 
            onClick={() => setPayload(null)}
            style={{ marginTop: '1rem' }}
          >
            Create New Invoice
          </button>
        </div>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label>
              Amount (USDT0):
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                style={{ display: 'block', marginTop: '0.25rem', padding: '0.5rem', width: '100%' }}
              />
            </label>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label>
              Memo (optional):
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Payment for..."
                style={{ display: 'block', marginTop: '0.25rem', padding: '0.5rem', width: '100%' }}
              />
            </label>
          </div>

          <button onClick={handleCreateInvoice} style={{ padding: '0.75rem 1.5rem' }}>
            Create Invoice
          </button>
        </div>
      )}

      <button 
        onClick={() => navigate('/')}
        style={{ marginTop: '2rem' }}
      >
        Back to Home
      </button>
    </div>
  )
}
