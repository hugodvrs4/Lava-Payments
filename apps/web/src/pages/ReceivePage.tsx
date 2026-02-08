import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import type { InvoicePayload } from '@lava-payment/shared'
import { ACTIVE_PLASMA_CHAIN } from '../config'
import { QRCodeCanvas } from 'qrcode.react'
import ThemeToggle from "../components/ThemeToggle"

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

  return (
    <div className="receive-page-wrapper">
      <ThemeToggle />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '800px' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Receive Payment</h2>

        {!address ? (
          <p>Please connect your wallet</p>
        ) : payload ? (
          <div className='cancelright'>
            <div className='container upgrade'>
              <h3>Payment Request Created</h3>
              <div style={{
                padding: '1rem',
                background: '#2a5a4f',
                wordBreak: 'break-all',
                marginTop: '0.5rem',
                borderRadius: '12px',
                color: 'white'
              }}>
                {payload}
              </div>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                Share this code or QR to receive payment
              </p>
              <button
                onClick={() => {
                  setPayload(null)
                  setAddressConfirmed(false)
                }}
                style={{ marginTop: '1rem', fontSize: '1rem' }}
              >
                Create New Invoice
              </button>
            </div>

            <div className='qrcode' style={{
                padding: '1.5rem',
                background: '#fff',
                borderRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                alignItems: 'center',
                boxShadow: '0px 4px 15px rgba(0,0,0,0.1)'
              }}>
              <QRCodeCanvas value={paymentUrl} size={200} includeMargin />
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(paymentUrl)
                  alert('Payment link copied')
                }}
                style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
              >
                Copy Link
              </button>
            </div>
          </div>
        ) : (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div className='hoverthink' style={{ marginRight: '0', width: '100%' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={useFreshAddress}
                  onChange={() => {
                    setUseFreshAddress(!useFreshAddress)
                    setAddressConfirmed(false)
                  }}
                  style={{ marginRight: '0.75rem', width: '20px', height: '20px' }}
                />
                <span style={{ fontWeight: 'bold' }}>🔒 Use fresh address (privacy)</span>
              </label>

              {useFreshAddress && !addressConfirmed && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'white', marginBottom: '10px' }}>
                    Switch to a new MetaMask account for better privacy.
                  </p>
                  <button onClick={() => setAddressConfirmed(true)} style={{ fontSize: '0.9rem', padding: '5px 15px' }}>
                    ✓ I switched
                  </button>
                </div>
              )}
            </div>
            
            <div className='container upgradewidth' style={{ height: 'auto' }}>
              <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Amount (USDT0):</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  style={{ padding: '0.75rem', width: '100%', borderRadius: '8px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Memo (optional):</label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Order #102"
                  style={{ padding: '0.75rem', width: '100%', borderRadius: '8px', border: '1px solid #ccc' }}
                />
              </div>
            </div>
            
            <button
                onClick={handleCreateInvoice}
                disabled={useFreshAddress && !addressConfirmed}
                style={{
                  width: '100%',
                  marginTop: '1rem',
                  opacity: useFreshAddress && !addressConfirmed ? 0.5 : 1,
                }}
              >
                Create Invoice
            </button>
          </div>
        )}

        <button onClick={() => navigate('/')} style={{ marginTop: '2rem', background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', fontSize: '1rem' }}>
          Back to Home
        </button>
      </div>
    </div>
  )
}