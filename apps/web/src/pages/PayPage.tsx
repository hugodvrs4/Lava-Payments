import { useEffect, useRef, useState } from 'react'
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
import { BrowserQRCodeReader } from '@zxing/browser'

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

  // ZXing refs
  const readerRef = useRef<BrowserQRCodeReader | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

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

  /* ---------------- QR camera scan (ZXing) ---------------- */
  useEffect(() => {
    if (!scanning) return

    setScanError(null)

    if (!readerRef.current) readerRef.current = new BrowserQRCodeReader()
    const reader = readerRef.current

    const videoEl = videoRef.current
    if (!videoEl) {
      setScanError('Camera view not ready')
      setScanning(false)
      return
    }

    let stopped = false

    ;(async () => {
      try {
        // decodeFromVideoDevice(null, videoEl, cb) -> utilise caméra par défaut
        await reader.decodeFromVideoDevice(null, videoEl, async (result, err) => {
          if (stopped) return
          if (!result) return

          const raw = result.getText().trim()

          // stop scanning ASAP to avoid multiple triggers
          stopped = true
          try {
            reader.reset()
          } catch {}

          setScanning(false)

          // CASE 1: QR contient une URL /pay?invoice=...
          if (raw.startsWith('http://') || raw.startsWith('https://')) {
            try {
              const url = new URL(raw)
              const inv = url.searchParams.get('invoice')

              if (url.pathname === '/pay' && inv) {
                const code = decodeURIComponent(inv)
                setAndDecode(code)

                navigate(`/pay?invoice=${encodeURIComponent(inv)}`, { replace: true })
                return
              }
            } catch {
              // si URL invalide -> on tombera en CASE 2
            }
          }

          // CASE 2: payload base64 direct
          setAndDecode(raw)
        })
      } catch (e) {
        setScanError((e as Error).message || String(e))
        setScanning(false)
      }
    })()

    return () => {
      stopped = true
      try {
        reader.reset()
      } catch {}
    }
  }, [scanning, navigate])

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
    <div className='container'>
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
              style={{ width: '100%', marginTop: '0.25rem',background:'linear-gradient(135deg, #1e1e1e, #292929)',color:'#fff' }}
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
              {/* garde ton id pour le style si besoin */}
              <div id="qr-reader" style={{ maxWidth: 420 }}>
                <video
                  ref={videoRef}
                  style={{ width: '100%', borderRadius: 12 }}
                  muted
                  playsInline
                />
              </div>
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

