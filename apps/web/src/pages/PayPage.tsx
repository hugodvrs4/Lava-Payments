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
import { Html5Qrcode } from 'html5-qrcode'

export function PayPage() {
  const { isConnected } = useAccount()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const chainId = useChainId()

  const [invoiceCode, setInvoiceCode] = useState('')
  const [invoice, setInvoice] = useState<InvoicePayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [useZeroFee, setUseZeroFee] = useState(false)

  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  const { data: hash, writeContract } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  /* ---------------- redirect after tx ---------------- */
  useEffect(() => {
    if (hash) navigate(`/receipt/${hash}`)
  }, [hash, navigate])

  /* ---------------- decode helpers ---------------- */
  const decodeAndSetInvoice = (code: string) => {
    try {
      setError(null)
      const decoded = JSON.parse(atob(code))

      if (decoded.v !== 1) return setError('Unsupported invoice version')
      if (!decoded.to || !decoded.amount || !decoded.id || !decoded.exp) {
        return setError('Invalid invoice: missing required fields')
      }
      if (decoded.exp < Date.now()) return setError('Invoice has expired')
      if (!/^0x[a-fA-F0-9]{40}$/.test(decoded.to)) {
        return setError('Invalid recipient address')
      }
      if (decoded.chainId && decoded.chainId !== 9745) {
        return setError('Invoice is for a different network')
      }

      setInvoice(decoded)
    } catch {
      setError('Invalid invoice code')
    }
  }

  const setAndDecode = (code: string) => {
    setInvoice(null)
    setInvoiceCode(code)
    decodeAndSetInvoice(code)
  }

  /* ---------------- auto decode from URL ---------------- */
  const invoiceParam = searchParams.get('invoice')

  useEffect(() => {
    if (!invoiceParam) return
    const code = decodeURIComponent(invoiceParam)
    setAndDecode(code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceParam])

  /* ---------------- QR camera scan ---------------- */
  useEffect(() => {
    if (!scanning) return

    const qr = new Html5Qrcode('qr-reader')
    setScanError(null)

    qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 260, height: 260 } },
      async (decodedText) => {
        const raw = decodedText.trim()

        // CASE 1: QR contient une URL /pay?invoice=...
        if (raw.startsWith('http://') || raw.startsWith('https://')) {
          try {
            const url = new URL(raw)
            const inv = url.searchParams.get('invoice')

            if (url.pathname === '/pay' && inv) {
              await qr.stop()
              await qr.clear()
              setScanning(false)

              const code = decodeURIComponent(inv)
              setAndDecode(code)

              // optionnel: garder l’URL dans la barre
              navigate(`/pay?invoice=${encodeURIComponent(inv)}`, { replace: true })
              return
            }
          } catch {}
        }

        // CASE 2: payload base64 direct
        await qr.stop()
        await qr.clear()
        setScanning(false)

        setAndDecode(raw)
      },
      () => {}
    ).catch((err) => {
      setScanError(String(err))
      setScanning(false)
    })

    return () => {
      qr.stop().catch(() => {})
      qr.clear().catch(() => {})
    }
  }, [scanning, navigate]) // <-- important

  /* ---------------- manual decode ---------------- */
  const handleDecodeInvoice = () => {
    setAndDecode(invoiceCode.trim())
  }

  /* ---------------- pay ---------------- */
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
          <label>
            Invoice Code:
            <textarea
              value={invoiceCode}
              onChange={(e) => setInvoiceCode(e.target.value)}
              placeholder="Paste invoice code or scan QR"
              rows={4}
              style={{ width: '100%', marginTop: '0.25rem' }}
            />
          </label>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setScanning((v) => !v)}>
              {scanning ? 'Stop Scan' : 'Scan QR'}
            </button>
            <button onClick={handleDecodeInvoice}>Decode Invoice</button>
          </div>

          {scanning && (
            <div style={{ marginTop: '1rem' }}>
              <div id="qr-reader" style={{ maxWidth: 420 }} />
              <p style={{ fontSize: '0.85rem', color: '#666' }}>
                Autorise la caméra et vise le QR
              </p>
            </div>
          )}

          {scanError && <p style={{ color: 'red' }}>{scanError}</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <h3>Invoice Details</h3>

          <p>
            <strong>To:</strong> {invoice.to}
          </p>
          <p>
            <strong>Amount:</strong> {invoice.amount} USDT0
          </p>
          <p>
            <strong>ID:</strong> {invoice.id}
          </p>
          <p>
            <strong>Expires:</strong> {new Date(invoice.exp).toLocaleString()}
          </p>

          <div style={{ marginTop: '1rem' }}>
            <label>
              <input
                type="checkbox"
                checked={useZeroFee}
                onChange={(e) => setUseZeroFee(e.target.checked)}
                disabled={!ZERO_FEE_CONFIG.enabled}
              />
              ⚡ Zero-Fee Mode
            </label>
          </div>

          <button onClick={handlePay} disabled={isConfirming}>
            {isConfirming ? 'Confirming…' : 'Pay Invoice'}
          </button>

          <button onClick={() => setInvoice(null)} style={{ marginLeft: '0.5rem' }}>
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
