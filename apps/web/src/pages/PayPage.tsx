import { useState, useEffect } from 'react'
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from 'wagmi'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ZERO_FEE_CONFIG } from '@lava-payment/shared'
import type { InvoicePayload } from '@lava-payment/shared'
import { PaymentService } from '../services/paymentService'

export function PayPage() {
  const { isConnected } = useAccount()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const chainId = useChainId()

  const [invoiceCode, setInvoiceCode] = useState('')
  const [invoice, setInvoice] = useState<InvoicePayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [useZeroFee, setUseZeroFee] = useState(false)

  const { data: hash, writeContract } = useWriteContract()
  const { isLoading: isConfirming } =
    useWaitForTransactionReceipt({ hash })

  /* --------------------------------------------------
   * Auto-redirect to receipt after tx
   * -------------------------------------------------- */
  useEffect(() => {
    if (hash) {
      navigate(`/receipt/${hash}`)
    }
  }, [hash, navigate])

  /* --------------------------------------------------
   * Auto-decode invoice from QR (?invoice=...)
   * -------------------------------------------------- */
  useEffect(() => {
    const fromUrl = searchParams.get('invoice')
    if (!fromUrl) return

    const code = decodeURIComponent(fromUrl)
    setInvoiceCode(code)

    try {
      setError(null)
      const decoded = JSON.parse(atob(code))

      if (decoded.v !== 1) {
        setError('Unsupported invoice version')
        return
      }

      if (!decoded.to || !decoded.amount || !decoded.id || !decoded.exp) {
        setError('Invalid invoice: missing required fields')
        return
      }

      if (decoded.exp < Date.now()) {
        setError('Invoice has expired')
        return
      }

      if (!/^0x[a-fA-F0-9]{40}$/.test(decoded.to)) {
        setError('Invalid recipient address')
        return
      }

      if (decoded.chainId && decoded.chainId !== 9745) {
        setError('Invoice is for a different network')
        return
      }

      setInvoice(decoded)
    } catch {
      setError('Invalid invoice code')
    }
  }, [searchParams])

  /* --------------------------------------------------
   * Manual decode (textarea)
   * -------------------------------------------------- */
  const handleDecodeInvoice = () => {
    try {
      setError(null)
      const decoded = JSON.parse(atob(invoiceCode))

      if (decoded.v !== 1) {
        setError('Unsupported invoice version')
        return
      }

      if (!decoded.to || !decoded.amount || !decoded.id || !decoded.exp) {
        setError('Invalid invoice: missing required fields')
        return
      }

      if (decoded.exp < Date.now()) {
        setError('Invoice has expired')
        return
      }

      if (!/^0x[a-fA-F0-9]{40}$/.test(decoded.to)) {
        setError('Invalid recipient address')
        return
      }

      if (decoded.chainId && decoded.chainId !== 9745) {
        setError('Invoice is for a different network')
        return
      }

      setInvoice(decoded)
    } catch {
      setError('Invalid invoice code')
    }
  }

  /* --------------------------------------------------
   * Pay invoice
   * -------------------------------------------------- */
  const handlePay = async () => {
    if (!invoice) return

    try {
      setError(null)

      await PaymentService.executeTransfer(
        {
          to: invoice.to,
          amount: invoice.amount,
          useZeroFee,
          chainId,
        },
        writeContract
      )
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
                style={{
                  display: 'block',
                  marginTop: '0.25rem',
                  padding: '0.5rem',
                  width: '100%',
                }}
              />
            </label>
          </div>

          {error && (
            <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>
          )}

          <button
            onClick={handleDecodeInvoice}
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Decode Invoice
          </button>
        </div>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <h3>Invoice Details</h3>

          <div
            style={{
              padding: '1rem',
              background: '#f5f5f5',
              marginTop: '0.5rem',
            }}
          >
            <p>
              <strong>To:</strong> {invoice.to}
            </p>
            <p>
              <strong>Amount:</strong> {invoice.amount} USDT0
            </p>
            {invoice.memo && (
              <p>
                <strong>Note:</strong> {invoice.memo}
              </p>
            )}
            <p>
              <strong>Invoice ID:</strong> {invoice.id}
            </p>
            <p>
              <strong>Expires:</strong>{' '}
              {new Date(invoice.exp).toLocaleString()}
            </p>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
            ℹ️ Only recipient address and amount are sent on-chain. Notes are
            local-only.
          </p>

          {/* Zero-Fee Toggle */}
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: ZERO_FEE_CONFIG.enabled
                ? '#e3f2fd'
                : '#fff3cd',
              borderRadius: '4px',
              border: `1px solid ${
                ZERO_FEE_CONFIG.enabled ? '#2196f3' : '#ffc107'
              }`,
            }}
          >
            <label style={{ display: 'flex', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useZeroFee}
                onChange={(e) => setUseZeroFee(e.target.checked)}
                disabled={!ZERO_FEE_CONFIG.enabled}
                style={{ marginRight: '0.75rem' }}
              />
              <div>
                <strong>⚡ Zero-Fee Mode</strong>
                {!ZERO_FEE_CONFIG.enabled && ' (Integration Ready)'}
              </div>
            </label>
          </div>

          {error && (
            <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>
          )}

          <button
            onClick={handlePay}
            disabled={isConfirming}
            style={{ marginTop: '1rem', padding: '0.75rem 1.5rem' }}
          >
            {isConfirming ? 'Confirming…' : 'Pay Invoice'}
          </button>

          <button
            onClick={() => setInvoice(null)}
            style={{ marginTop: '1rem', marginLeft: '0.5rem' }}
          >
            Back
          </button>
        </div>
      )}

      <button onClick={() => navigate('/')} style={{ marginTop: '2rem' }}>
        Back to Home
      </button>
    </div>
  )
}
