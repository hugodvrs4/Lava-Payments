import { useEffect, useRef, useState } from 'react'
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from 'wagmi'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ZERO_FEE_CONFIG } from '@lava-payment/shared'
import type { InvoicePayload } from '@lava-payment/shared'
import { PaymentService } from '../services/paymentService'
import { BrowserQRCodeReader } from '@zxing/browser'
import { ContactService, Contact } from '../services/contactService'
import ThemeToggle from '../components/ThemeToggle'

/** Official Plasma network params */
const PLASMA_NETWORKS: Record<
  number,
  {
    chainId: number
    chainName: string
    nativeCurrency: { name: string; symbol: string; decimals: number }
    rpcUrls: string[]
    blockExplorerUrls: string[]
    displayName: string
  }
> = {
  9745: {
    chainId: 9745,
    chainName: 'Plasma Mainnet Beta',
    displayName: 'Plasma network',
    nativeCurrency: { name: 'XPL', symbol: 'XPL', decimals: 18 },
    rpcUrls: ['https://rpc.plasma.to'],
    blockExplorerUrls: ['https://plasmascan.to'],
  },
  9746: {
    chainId: 9746,
    chainName: 'Plasma Testnet',
    displayName: 'Plasma Testnet',
    nativeCurrency: { name: 'XPL', symbol: 'XPL', decimals: 18 },
    rpcUrls: ['https://testnet-rpc.plasma.to'],
    blockExplorerUrls: ['https://testnet.plasmascan.to'],
  },
}

function getPlasmaNetwork(chainId?: number) {
  if (!chainId) return null
  return PLASMA_NETWORKS[chainId] ?? null
}

function isChainNotAddedError(err: any) {
  if (err?.code === 4902) return true
  const msg = String(err?.message || '').toLowerCase()
  return (
    msg.includes('unrecognized chain') ||
    msg.includes('unknown chain') ||
    msg.includes('chain is not added') ||
    msg.includes('4902')
  )
}

export function PayPage() {
  const { address, isConnected } = useAccount()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const chainId = useChainId()

  const [invoiceCode, setInvoiceCode] = useState('')
  const [invoice, setInvoice] = useState<InvoicePayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [useZeroFee, setUseZeroFee] = useState(false)

  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [networkError, setNetworkError] = useState<string | null>(null)

  // Contact management states
  const [contacts, setContacts] = useState<Contact[]>([])
  const [showContacts, setShowContacts] = useState(false)
  const [saveAsContact, setSaveAsContact] = useState(false)
  const [contactName, setContactName] = useState('')

  const { data: hash, writeContract } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const { switchChainAsync, isPending: isSwitching } = useSwitchChain()

  // ZXing refs
  const readerRef = useRef<BrowserQRCodeReader | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  /* ---------------- Load contacts ---------------- */
  useEffect(() => {
    if (address) {
      setContacts(ContactService.getContacts(address))
    }
  }, [address])

  /* ---------------- Check for recipient in URL ---------------- */
  const recipientParam = searchParams.get('recipient')
  useEffect(() => {
    if (recipientParam && !invoice) {
      // Pre-fill recipient from URL (from contacts page)
      setShowContacts(false)
    }
  }, [recipientParam])

  /* ---------------- redirect after tx ---------------- */
  useEffect(() => {
    if (hash && invoice && address) {
      // Save/update contact after successful payment
      if (saveAsContact && contactName) {
        ContactService.saveContact(address, invoice.to, contactName)
      } else {
        // Just increment count if already a contact
        const existing = ContactService.getContact(address, invoice.to)
        if (existing) {
          ContactService.incrementTransactionCount(address, invoice.to)
        }
      }
      
      navigate(`/receipt/${hash}`)
    }
  }, [hash, navigate, invoice, address, saveAsContact, contactName])

  /* ---------------- decode helpers ---------------- */
  const decodeAndSetInvoice = (code: string) => {
    try {
      setError(null)
      setNetworkError(null)

      const decoded = JSON.parse(atob(code)) as InvoicePayload & { v?: number }

      if ((decoded as any).v !== 1) return setError('Unsupported invoice version')
      if (!decoded.to || !decoded.amount || !decoded.id || !decoded.exp) {
        return setError('Invalid invoice: missing required fields')
      }
      if (decoded.exp < Date.now()) return setError('Invoice has expired')
      if (!/^0x[a-fA-F0-9]{40}$/.test(decoded.to)) {
        return setError('Invalid recipient address')
      }

      if (decoded.chainId && typeof decoded.chainId !== 'number') {
        return setError('Invalid invoice: chainId')
      }

      setInvoice(decoded)
      
      // Check if recipient is already a contact
      if (address) {
        const existingContact = ContactService.getContact(address, decoded.to)
        if (existingContact) {
          setContactName(existingContact.name)
          setSaveAsContact(false) // Already saved
        }
      }
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
        await reader.decodeFromVideoDevice(null, videoEl, async (result) => {
          if (stopped) return
          if (!result) return

          const raw = result.getText().trim()

          stopped = true
          try {
            reader.reset()
          } catch {}

          setScanning(false)

          // CASE 1: QR contains a URL /pay?invoice=...
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
              // invalid URL -> fallback
            }
          }

          // CASE 2: base64 payload direct
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

  /* ---------------- Contact selection ---------------- */
  const handleSelectContact = (contact: Contact) => {
    // Create an invoice for this contact
    const tempInvoice: InvoicePayload = {
      v: 1,
      chainId: 9745,
      token: 'USDT0',
      to: contact.address,
      amount: '0', // User will need to enter amount
      id: `TEMP-${Date.now()}`,
      exp: Date.now() + 24 * 60 * 60 * 1000,
    }
    
    setInvoice(tempInvoice)
    setShowContacts(false)
    setContactName(contact.name)
    setSaveAsContact(false) // Already a contact
  }

  /* ---------------- network helpers ---------------- */
  const invoiceChainId = invoice?.chainId ?? (invoice ? 9745 : undefined)
  const plasmaMeta = getPlasmaNetwork(invoiceChainId ?? undefined)
  const wrongNetwork = !!invoiceChainId && chainId !== invoiceChainId

  const bannerTitle =
    invoiceChainId === 9745
      ? 'Please switch to Plasma network to continue'
      : invoiceChainId === 9746
        ? 'Please switch to Plasma Testnet to continue'
        : 'Please switch network to continue'

  const handleSwitchToInvoiceChain = async () => {
    if (!invoiceChainId) return
    setNetworkError(null)

    try {
      await switchChainAsync({ chainId: invoiceChainId })
      return
    } catch (e: any) {
      if (isChainNotAddedError(e) && plasmaMeta) {
        try {
          const eth = (window as any).ethereum
          if (!eth?.request) {
            setNetworkError('Wallet provider not found.')
            return
          }

          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x' + plasmaMeta.chainId.toString(16),
                chainName: plasmaMeta.chainName,
                nativeCurrency: plasmaMeta.nativeCurrency,
                rpcUrls: plasmaMeta.rpcUrls,
                blockExplorerUrls: plasmaMeta.blockExplorerUrls,
              },
            ],
          })

          await switchChainAsync({ chainId: invoiceChainId })
          return
        } catch (addErr: any) {
          setNetworkError(addErr?.message || 'Failed to add/switch network.')
          return
        }
      }

      setNetworkError(e?.message || 'Failed to switch network.')
    }
  }

  /* ---------------- pay ---------------- */
  const handlePay = async () => {
    if (!invoice) return

    const targetChainId = invoice.chainId ?? 9745

    if (targetChainId !== 9745 && targetChainId !== 9746) {
      setError('Invalid invoice: only Plasma networks (9745, 9746) are supported')
      return
    }

    if (chainId !== targetChainId) {
      setNetworkError(
        `Please switch to ${PLASMA_NETWORKS[targetChainId]?.displayName || 'Plasma network'} to continue`
      )
      return
    }

    try {
      setError(null)
      setNetworkError(null)

      await PaymentService.executeTransfer(
        {
          to: invoice.to,
          amount: invoice.amount,
          useZeroFee,
          chainId: targetChainId,
        },
        writeContract
      )
    } catch (err) {
      setError('Payment failed: ' + (err as Error).message)
    }
  }

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <>
      <ThemeToggle />
      <div className="container">
        <h2>Pay Invoice</h2>

        {!isConnected ? (
          <p>Please connect your wallet</p>
        ) : showContacts ? (
          /* Contact Selection View */
          <div style={{ marginTop: '1rem' }}>
            <h3>Select a contact</h3>
            
            {contacts.length === 0 ? (
              <div style={{ padding: '1.5rem', background: 'var(--accent-color)', borderRadius: '12px', textAlign: 'center' }}>
                <p style={{ color: 'white' }}>No contacts yet</p>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.5rem' }}>
                  Add contacts from the Contacts page
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                {contacts.map(contact => (
                  <div
                    key={contact.address}
                    onClick={() => handleSelectContact(contact)}
                    style={{
                      padding: '1rem',
                      background: 'var(--accent-color)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{ fontWeight: 'bold', color: 'white', marginBottom: '0.25rem' }}>
                      {contact.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>
                      {formatAddress(contact.address)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
                      {contact.totalTransactions} transaction{contact.totalTransactions !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowContacts(false)}
              style={{ marginTop: '1rem', width: '100%' }}
            >
              Back
            </button>
          </div>
        ) : !invoice ? (
          /* Invoice Input View */
          <div style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <button
                onClick={() => setShowContacts(true)}
                style={{ width: '100%', marginBottom: '0.5rem' }}
              >
                👥 Choose from contacts
              </button>
              <button
                onClick={() => navigate('/contacts')}
                style={{ width: '100%', background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)' }}
              >
                ⚙️ Manage contacts
              </button>
            </div>

            <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid rgba(255,255,255,0.2)' }} />

            <label>
              Invoice Code:
              <textarea
                value={invoiceCode}
                onChange={(e) => setInvoiceCode(e.target.value)}
                placeholder="Paste invoice code or scan QR"
                rows={4}
                style={{
                  width: '100%',
                  marginTop: '0.25rem',
                  background: 'linear-gradient(135deg, #1e1e1e, #292929)',
                  color: '#fff',
                }}
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
          /* Invoice Details View */
          <div style={{ marginTop: '1rem' }}>
            <h3>Invoice Details</h3>

            {wrongNetwork && (
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                  {bannerTitle}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.85, marginBottom: '0.75rem' }}>
                  Your wallet is on chain {chainId}, invoice requires chain {invoiceChainId}.
                </div>

                <button
                  onClick={handleSwitchToInvoiceChain}
                  disabled={isSwitching}
                  style={{
                    padding: '0.6rem 0.9rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.14)',
                    background: 'rgba(255, 106, 61, 0.25)',
                    cursor: isSwitching ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {isSwitching ? 'Switching…' : 'Switch network'}
                </button>

                {networkError && (
                  <p style={{ color: '#ffb4a2', marginTop: '0.75rem', marginBottom: 0 }}>
                    {networkError}
                  </p>
                )}
              </div>
            )}

            <p>
              <strong>To:</strong> 
              <div style={{ wordBreak: 'break-all', fontSize: '0.9rem' }}>
                {invoice.to}
              </div>
              {contactName && (
                <div style={{ fontSize: '0.9rem', color: 'var(--accent-color)', marginTop: '0.25rem' }}>
                  💾 {contactName}
                </div>
              )}
            </p>
            <p>
              <strong>Amount:</strong> {invoice.amount} USDT0
            </p>
            <p>
              <strong>ID:</strong> <div style={{ wordBreak: 'break-all', fontSize: '0.9rem' }}>{invoice.id}</div>
            </p>
            <p>
              <strong>Expires:</strong> {new Date(invoice.exp).toLocaleString()}
            </p>

            <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
              <strong>Network:</strong>{' '}
              {PLASMA_NETWORKS[invoiceChainId ?? 9745]?.displayName || `Chain ${invoiceChainId}`}
            </p>

            {/* Save as contact option (only if not already a contact) */}
            {address && !ContactService.getContact(address, invoice.to) && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(42, 90, 79, 0.3)',
                borderRadius: '8px',
              }}>
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={saveAsContact}
                    onChange={(e) => setSaveAsContact(e.target.checked)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  💾 Save as contact
                </label>
                
                {saveAsContact && (
                  <input
                    type="text"
                    placeholder="Contact name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      background: 'white',
                      color: '#333'
                    }}
                  />
                )}
              </div>
            )}

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

            <button onClick={handlePay} disabled={isConfirming || wrongNetwork}>
              {wrongNetwork ? 'Switch network to pay' : isConfirming ? 'Confirming…' : 'Pay Invoice'}
            </button>

            <button onClick={() => setInvoice(null)} style={{ marginLeft: '0.5rem' }}>
              Back
            </button>

            {error && <p style={{ color: 'red', marginTop: '0.75rem' }}>{error}</p>}
          </div>
        )}

        <button onClick={() => navigate('/')} style={{ marginTop: '2rem' }}>
          Back to Home
        </button>
      </div>
    </>
  )
}