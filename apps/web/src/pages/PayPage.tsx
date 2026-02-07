import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { ZERO_FEE_CONFIG } from '@lava-payment/shared'
import type { InvoicePayload } from '@lava-payment/shared'
import { PaymentService } from '../services/paymentService'

export function PayPage() {
  const { isConnected } = useAccount()
  const navigate = useNavigate()
  const [invoiceCode, setInvoiceCode] = useState('')
  const [invoice, setInvoice] = useState<InvoicePayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [useZeroFee, setUseZeroFee] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'standard' | 'zero-fee'>('standard')

  const { data: hash, writeContract } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  // Navigate to receipt page when transaction hash is available
  useEffect(() => {
    if (hash) {
      navigate(`/receipt/${hash}`)
    }
  }, [hash, navigate])

  const handleDecodeInvoice = () => {
    try {
      setError(null)
      const decoded = JSON.parse(atob(invoiceCode))
      
      // Validate protocol version
      if (decoded.v !== 1) {
        setError('Unsupported invoice version')
        return
      }
      
      // Validate required fields
      if (!decoded.to || !decoded.amount || !decoded.id || !decoded.exp) {
        setError('Invalid invoice: missing required fields')
        return
      }
      
      // Check if invoice has expired
      if (decoded.exp < Date.now()) {
        setError('Invoice has expired')
        return
      }
      
      // Validate recipient is a valid address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(decoded.to)) {
        setError('Invalid recipient address')
        return
      }
      
      // Validate chain ID matches Plasma
      if (decoded.chainId && decoded.chainId !== 9745) {
        setError('Invoice is for a different network')
        return
      }
      
      setInvoice(decoded)
    } catch {
      setError('Invalid invoice code')
    }
  }

  const handlePay = async () => {
    if (!invoice) return

    try {
      setError(null)
      
      // Use PaymentService to handle both standard and zero-fee flows
      const result = await PaymentService.executeTransfer(
        {
          to: invoice.to,
          amount: invoice.amount,
          useZeroFee,
        },
        writeContract
      )
      
      setPaymentMethod(result.method)
      
      // If zero-fee was requested but not available, inform user
      if (useZeroFee && result.method === 'standard') {
        // User will see fee info in the UI
      }
    } catch (err) {
      setError('Payment failed: ' + (err as Error).message)
    }
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Pay Invoice</h2>
      
      {!isConnected ? (
        <p>Please connect your wallet</p>
      ) : !invoice ? (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label>
              Invoice Code:
              <textarea
                value={invoiceCode}
                onChange={(e) => setInvoiceCode(e.target.value)}
                placeholder="Paste invoice code or scan QR"
                rows={4}
                style={{ display: 'block', marginTop: '0.25rem', padding: '0.5rem', width: '100%' }}
              />
            </label>
          </div>

          {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

          <button onClick={handleDecodeInvoice} style={{ padding: '0.75rem 1.5rem' }}>
            Decode Invoice
          </button>
        </div>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <h3>Invoice Details</h3>
          <div style={{ padding: '1rem', background: '#f5f5f5', marginTop: '0.5rem' }}>
            <p><strong>To:</strong> {invoice.to}</p>
            <p><strong>Amount:</strong> {invoice.amount} USDT0</p>
            {invoice.memo && <p><strong>Note:</strong> {invoice.memo}</p>}
            <p><strong>Invoice ID:</strong> {invoice.id}</p>
            <p><strong>Expires:</strong> {new Date(invoice.exp).toLocaleString()}</p>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
            ℹ️ Only recipient address and amount are sent on-chain. Notes are local-only.
          </p>

          {/* Zero-Fee Toggle */}
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            background: ZERO_FEE_CONFIG.enabled ? '#e3f2fd' : '#fff3cd',
            borderRadius: '4px',
            border: `1px solid ${ZERO_FEE_CONFIG.enabled ? '#2196f3' : '#ffc107'}`
          }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useZeroFee}
                onChange={(e) => setUseZeroFee(e.target.checked)}
                disabled={!ZERO_FEE_CONFIG.enabled}
                style={{ marginRight: '0.75rem', marginTop: '0.25rem' }}
              />
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  ⚡ Zero-Fee Mode {!ZERO_FEE_CONFIG.enabled && '(Integration Ready)'}
                </div>
                {ZERO_FEE_CONFIG.enabled ? (
                  <div style={{ fontSize: '0.9rem' }}>
                    <p style={{ margin: '0.25rem 0' }}>
                      ✓ Gas fees paid by Plasma paymaster
                    </p>
                    <p style={{ margin: '0.25rem 0', color: '#555' }}>
                      No PLASMA tokens needed in your wallet
                    </p>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.9rem', color: '#856404' }}>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Standard mode:</strong> You pay gas fees in PLASMA tokens
                    </p>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Zero-fee mode:</strong> Ready to integrate via Plasma paymaster/relayer
                    </p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}>
                      Architecture supports sponsored transfers when relayer API is configured
                    </p>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Fee Status Display */}
          {hash && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              background: paymentMethod === 'zero-fee' ? '#e8f5e9' : '#e3f2fd',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>
              {paymentMethod === 'zero-fee' ? (
                <span>✓ Fees paid by Plasma paymaster</span>
              ) : (
                <span>Gas fees paid by you</span>
              )}
            </div>
          )}

          {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

          <button 
            onClick={handlePay}
            disabled={isConfirming}
            style={{ marginTop: '1rem', padding: '0.75rem 1.5rem' }}
          >
            {isConfirming ? 'Confirming...' : 'Pay Invoice'}
          </button>

          <button 
            onClick={() => setInvoice(null)}
            style={{ marginTop: '1rem', marginLeft: '0.5rem' }}
          >
            Back
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