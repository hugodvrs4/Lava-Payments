import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import type { InvoicePayload } from '@lava-payment/shared'
import { PLASMA_CHAIN } from '@lava-payment/shared'
import { QRCodeCanvas } from 'qrcode.react'

// Simple UUID v4 generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function ReceivePage() {
  const { address } = useAccount()
  const navigate = useNavigate()

  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [payload, setPayload] = useState<string | null>(null)
  const [useFreshAddress, setUseFreshAddress] = useState(false)
  const [addressConfirmed, setAddressConfirmed] = useState(false)

  const baseUrl = import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin

  const paymentUrl = payload
    ? `${baseUrl}/pay?invoice=${encodeURIComponent(payload)}`
    : ''

  const handleCreateInvoice = () => {
    if (!address || !amount) return

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount greater than 0')
      return
    }

    const invoice: InvoicePayload = {
      v: 1,
      chainId: PLASMA_CHAIN.id,
      token: 'USDT0',
      to: address,
      amount,
      id: `INV-${generateUUID()}`,
      exp: Date.now() + 24 * 60 * 60 * 1000,
      memo: memo || undefined,
    }

    const encoded = btoa(JSON.stringify(invoice))
    setPayload(encoded)
  }

  const handleFreshAddressToggle = () => {
    setUseFreshAddress(!useFreshAddress)
    setAddressConfirmed(false)
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Receive Payment</h2>

      {!address ? (
        <p>Please connect your wallet</p>
      ) : payload ? (
        <div
          style={{
            marginTop: '1rem',
            display: 'grid',
            gridTemplateColumns: '1fr 360px',
            gap: '1rem',
            alignItems: 'start',
          }}
        >
          {/* LEFT */}
          <div>
            <h3>Payment Request Created</h3>

            <div
              style={{
                padding: '1rem',
                background: '#f5f5f5',
                wordBreak: 'break-all',
                marginTop: '0.5rem',
              }}
            >
              {payload}
            </div>

            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
              Share this code or QR to receive payment
            </p>

            <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.5rem' }}>
              ℹ️ Note: Memos are stored locally only, never written on-chain
            </p>

            <button
              onClick={() => {
                setPayload(null)
                setAddressConfirmed(false)
              }}
              style={{ marginTop: '1rem' }}
            >
              Create New Invoice
            </button>
          </div>

          {/* RIGHT (QR + Copy only) */}
          <div
            style={{
              padding: '1rem',
              background: '#fff',
              border: '1px solid #eee',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <QRCodeCanvas value={paymentUrl} size={240} includeMargin />

            <button
              onClick={async () => {
                await navigator.clipboard.writeText(paymentUrl)
                alert('Payment link copied')
              }}
              style={{ width: '100%', padding: '0.75rem 1rem' }}
            >
              Copy Link
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          {/* Privacy: Fresh Address Toggle */}
          <div
            style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              background: '#e8f5e9',
              borderRadius: '4px',
              border: '1px solid #4caf50',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useFreshAddress}
                onChange={handleFreshAddressToggle}
                style={{ marginRight: '0.5rem' }}
              />
              <span style={{ fontWeight: 'bold' }}>
                🔒 Use a fresh receiving address (recommended for privacy)
              </span>
            </label>

            {useFreshAddress && !addressConfirmed && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fff', borderRadius: '4px' }}>
                <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  For better privacy, create or switch to a new MetaMask account for this invoice.
                </p>
                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.75rem' }}>
                  This prevents linking this payment to your other transactions.
                </p>
                <button
                  onClick={() => setAddressConfirmed(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  ✓ I switched / using fresh address
                </button>
              </div>
            )}

            {useFreshAddress && addressConfirmed && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#2e7d32' }}>
                ✓ Using address: {address.slice(0, 10)}...{address.slice(-8)}
              </p>
            )}
          </div>

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
              Memo (optional, local-only):
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Order #102 (generic recommended)"
                style={{ display: 'block', marginTop: '0.25rem', padding: '0.5rem', width: '100%' }}
              />
              <small style={{ color: '#666', fontSize: '0.85rem' }}>
                Note: Memos are never sent on-chain, stored locally only
              </small>
            </label>
          </div>

          <button
            onClick={handleCreateInvoice}
            disabled={useFreshAddress && !addressConfirmed}
            style={{
              padding: '0.75rem 1.5rem',
              opacity: useFreshAddress && !addressConfirmed ? 0.5 : 1,
              cursor: useFreshAddress && !addressConfirmed ? 'not-allowed' : 'pointer',
            }}
          >
            Create Invoice
          </button>
        </div>
      )}

      <button onClick={() => navigate('/')} style={{ marginTop: '2rem' }}>
        Back to Home
      </button>
    </div>
  )
}
