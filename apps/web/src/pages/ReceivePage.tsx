import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import type { InvoicePayload } from '@lava-payment/shared'
import { ACTIVE_PLASMA_CHAIN } from '../config'
import { QRCodeCanvas } from 'qrcode.react'
import ThemeToggle from "../components/ThemeToggle"

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
      chainId: ACTIVE_PLASMA_CHAIN.id, 
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
    <div className="receive-page-wrapper">
      <ThemeToggle />
      <div className='fix' style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <h2 style={{margin:'0'}}>Receive Payment</h2>

        {!address ? (
          <p>Please connect your wallet</p>
        ) : payload ? (
          <div className='cancelright'>
            <div className='container upgrade' >
              <h3>Payment Request Created</h3>
              <div
                style={{
                  padding: '1rem',
                  background: '#2a5a4f',
                  wordBreak: 'break-all',
                  marginTop: '0.5rem',
                  borderRadius: '20px',
                }}
              >
                {payload}
              </div>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                Share this code or QR to receive payment
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

            <div className='qrcode'
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
          <div style={{ marginTop: '1rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Privacy Section */}
            <div className='hoverthink' style={{ marginRight: '0' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', width: '100%' }}>
                <input
                  type="checkbox"
                  checked={useFreshAddress}
                  onChange={handleFreshAddressToggle}
                  style={{ marginRight: '0.5rem'}}
                />
                <span className='lock' style={{ fontWeight: 'bold' }}>
                  🔒 Use a fresh receiving address (recommended for privacy)
                </span>
              </label>

              {useFreshAddress && !addressConfirmed && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#2a5a4f', borderRadius: '4px' }}>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    For better privacy, create or switch to a new MetaMask account.
                  </p>
                  <button
                    onClick={() => setAddressConfirmed(true)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#0e8b6e',
                      color: 'white',
                      fontSize: '1rem',
                      borderRadius: '4px',
                    }}
                  >
                    ✓ I switched
                  </button>
                </div>
              )}
            </div>
            
            <div className='container upgradewidth' style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
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

              <div>
                <label>
                  Memo (optional):
                  <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="Order #102"
                    style={{ display: 'block', marginTop: '0.25rem', padding: '0.5rem', width: '100%' }}
                  />
                </label>
              </div>
            </div>
            
            <button
                onClick={handleCreateInvoice}
                disabled={useFreshAddress && !addressConfirmed}
                style={{
                  marginTop: '1.5rem',
                  padding: '0.75rem 1.5rem',
                  opacity: useFreshAddress && !addressConfirmed ? 0.5 : 1,
                }}
              >
                Create Invoice
            </button>
          </div>
        )}

        <button onClick={() => navigate('/')} style={{ marginTop: '2rem', opacity: 0.8 }}>
          Back to Home
        </button>
      </div>
    </div>
  )
}