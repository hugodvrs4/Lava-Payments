import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { parseUnits } from 'viem'
import { USDT0_ADDRESS, USDT0_DECIMALS } from '@lava-payment/shared'
import type { InvoicePayload } from '@lava-payment/shared'

const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

export function PayPage() {
  const { isConnected } = useAccount()
  const navigate = useNavigate()
  const [invoiceCode, setInvoiceCode] = useState('')
  const [invoice, setInvoice] = useState<InvoicePayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: hash, writeContract } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const handleDecodeInvoice = () => {
    try {
      setError(null)
      const decoded = JSON.parse(atob(invoiceCode))
      setInvoice(decoded)
    } catch {
      setError('Invalid invoice code')
    }
  }

  const handlePay = async () => {
    if (!invoice) return

    try {
      const amountInUnits = parseUnits(invoice.amount, USDT0_DECIMALS)
      
      writeContract({
        address: USDT0_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [invoice.recipient as `0x${string}`, amountInUnits],
      })
    } catch (err) {
      setError('Payment failed: ' + (err as Error).message)
    }
  }

  if (hash) {
    navigate(`/receipt/${hash}`)
    return null
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
            <p><strong>To:</strong> {invoice.recipient}</p>
            <p><strong>Amount:</strong> {invoice.amount} USDT0</p>
            {invoice.memo && <p><strong>Memo:</strong> {invoice.memo}</p>}
            <p><strong>Created:</strong> {new Date(invoice.timestamp).toLocaleString()}</p>
          </div>

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
