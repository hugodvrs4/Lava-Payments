/**
 * ReceiptPage - Version avec ethers.js (sans Wagmi)
 * 
 * ⚠️ Cette version N'UTILISE PAS Wagmi pour éviter les erreurs "ChainNotConfiguredError"
 * Elle interroge directement le RPC Plasma avec ethers.js
 * 
 * Utilisation : /receipt?tx=0x...&wallet=0x...
 */

import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { JsonRpcProvider, TransactionReceipt } from 'ethers'

const PLASMA_TESTNET_RPC = 'https://testnet-rpc.plasma.to'
const PLASMA_TESTNET_EXPLORER = 'https://testnet.plasmascan.to'
const CHECK_INTERVAL_MS = 3000 // Vérification toutes les 3 secondes
const WARNING_TIMEOUT_MS = 30000 // Avertissement après 30 secondes
const MAX_TIMEOUT_MS = 300000 // Timeout après 5 minutes

type TxStatus = 'pending' | 'confirmed' | 'failed'

export function ReceiptPageEthers() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Récupération des paramètres URL
  const transactionHash = searchParams.get('tx') || ''
  const walletAddress = searchParams.get('wallet') || ''

  // États React
  const [status, setStatus] = useState<TxStatus>('pending')
  const [confirmations, setConfirmations] = useState(0)
  const [blockNumber, setBlockNumber] = useState<number | null>(null)
  const [gasUsed, setGasUsed] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checkCount, setCheckCount] = useState(0)
  const [hasTimedOut, setHasTimedOut] = useState(false)

  // 🔍 VÉRIFICATION AUTOMATIQUE DE LA TRANSACTION
  useEffect(() => {
    if (!transactionHash) return

    let intervalId: ReturnType<typeof setInterval>
    let warningTimeoutId: ReturnType<typeof setTimeout>
    let maxTimeoutId: ReturnType<typeof setTimeout>
    let isCancelled = false

    const checkTransactionStatus = async () => {
      if (isCancelled) return

      setCheckCount((prev) => prev + 1)
      console.log('🔍 Vérification du statut de la transaction:', transactionHash)
      console.log('📊 Nombre de vérifications:', checkCount)

      try {
        // ✅ Utilisation d'ethers.js directement (PAS Wagmi)
        const provider = new JsonRpcProvider(PLASMA_TESTNET_RPC)
        const receipt: TransactionReceipt | null = await provider.getTransactionReceipt(transactionHash)

        if (receipt) {
          console.log('✅ Reçu de transaction trouvé:', receipt)

          // Calculer les confirmations
          const currentBlock = await provider.getBlockNumber()
          const txConfirmations = currentBlock - receipt.blockNumber

          console.log('📊 Block Number:', receipt.blockNumber)
          console.log('📊 Confirmations:', txConfirmations)
          console.log('📊 Gas utilisé:', receipt.gasUsed.toString())
          console.log('📊 Status:', receipt.status)

          if (!isCancelled) {
            setConfirmations(txConfirmations)
            setBlockNumber(receipt.blockNumber)
            setGasUsed(receipt.gasUsed.toString())

            if (receipt.status === 1) {
              console.log('✅ Transaction confirmée avec succès!')
              setStatus('confirmed')
              clearInterval(intervalId)
            } else {
              console.log('❌ Transaction échouée (status 0)')
              setStatus('failed')
              clearInterval(intervalId)
            }
          }
        } else {
          console.log('⏳ Transaction toujours en attente...')
          if (!isCancelled) {
            setStatus('pending')
          }
        }
      } catch (err: any) {
        console.error('❌ Erreur lors de la vérification:', err)
        if (!isCancelled) {
          setError(err.message || 'Erreur de connexion au réseau Plasma')
        }
      }
    }

    // Vérification immédiate
    checkTransactionStatus()

    // ⏰ Polling toutes les 3 secondes
    intervalId = setInterval(checkTransactionStatus, CHECK_INTERVAL_MS)

    // ⚠️ Avertissement après 30 secondes
    warningTimeoutId = setTimeout(() => {
      if (!isCancelled && status === 'pending') {
        console.warn('⚠️ Le RPC prend du temps à répondre. Vérifiez manuellement sur Plasmascan.')
        setHasTimedOut(true)
      }
    }, WARNING_TIMEOUT_MS)

    // 🛑 Timeout après 5 minutes
    maxTimeoutId = setTimeout(() => {
      if (!isCancelled && status === 'pending') {
        console.error('🛑 Timeout : La vérification prend trop de temps.')
        clearInterval(intervalId)
        setError('La vérification prend trop de temps. Vérifiez manuellement sur Plasmascan.')
      }
    }, MAX_TIMEOUT_MS)

    // 🧹 Cleanup obligatoire
    return () => {
      isCancelled = true
      clearInterval(intervalId)
      clearTimeout(warningTimeoutId)
      clearTimeout(maxTimeoutId)
    }
  }, [transactionHash]) // ⚠️ checkCount ne doit PAS être dans les deps pour éviter re-render infini

  const truncateHash = (hash: string) => `${hash.slice(0, 6)}…${hash.slice(-4)}`
  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transactionHash)
    alert('Hash de transaction copié dans le presse-papier!')
  }

  const explorerUrl = `${PLASMA_TESTNET_EXPLORER}/tx/${transactionHash}`

  if (!transactionHash) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <div
          style={{
            background: '#2a5a4f',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h2>❌ No Transaction Found</h2>
          <p style={{ color: '#666', marginTop: '1rem' }}>
            Please return to Pay and try again.
          </p>
          <button
            onClick={() => navigate('/pay')}
            style={{
              marginTop: '2rem',
              padding: '0.75rem 1.5rem',
              background: '#0066cc',
              color: '#2a5a4f',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Go to Pay
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      {/* 📊 Barre de progression animée */}
      {status === 'pending' && !hasTimedOut && (
        <div
          style={{
            width: '100%',
            height: '4px',
            background: '#2a5a4f',
            borderRadius: '2px',
            overflow: 'hidden',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              width: '50%',
              height: '100%',
              background: 'linear-gradient(90deg, #14b8a6, #0891b2)',
              animation: 'slide 2s ease-in-out infinite',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(200%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      <div
        style={{
          background: '#2a5a4f',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          padding: '2rem',
          position: 'relative',
        }}
      >
        {/* 🏷️ Badge Network + Wallet */}
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              padding: '0.25rem 0.75rem',
              background: '#14b8a6',
              color: '#2a5a4f',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '600',
            }}
          >
            Plasma Testnet
          </div>
          {walletAddress && (
            <div
              style={{
                padding: '0.25rem 0.75rem',
                background: '#2a5a4f',
                color: '#333',
                borderRadius: '12px',
                fontSize: '0.7rem',
              }}
            >
              {truncateAddress(walletAddress)}
            </div>
          )}
        </div>

        {/* Titre avec icône selon status */}
        <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>
          {status === 'confirmed' && '✅'}
          {status === 'failed' && '❌'}
          {status === 'pending' && (hasTimedOut ? '🔍' : '⏳')} Payment{' '}
          {status === 'confirmed' ? 'Confirmed' : status === 'failed' ? 'Failed' : hasTimedOut ? 'Verifying' : 'Pending'}
        </h2>

        <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
          {status === 'pending' &&
            !hasTimedOut &&
            'Waiting for confirmation on Plasma blockchain...'}
          {hasTimedOut && status === 'pending' && 'Taking longer than expected. Check Plasmascan below.'}
          {status === 'confirmed' && 'Your payment has been confirmed on Plasma blockchain'}
          {status === 'failed' && 'Transaction failed or was rejected'}
        </p>

        {/* ⚠️ Avertissement timeout */}
        {hasTimedOut && status === 'pending' && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: '#2a5a4fd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#856404',
            }}
          >
            ⚠️ The RPC is taking time to respond. Your transaction may already be confirmed. Click
            "View on Plasmascan" below to verify manually.
          </div>
        )}

        {/* ❌ Affichage erreur */}
        {error && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: '#2a5a4f',
              border: '1px solid #fcc',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#c33',
            }}
          >
            ❌ {error}
          </div>
        )}

        {/* Infos de la transaction */}
        <div
          style={{
            marginTop: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* Status avec point animé */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>Status</span>
            <span
              style={{
                fontWeight: '600',
                color:
                  status === 'confirmed' ? '#4caf50' : status === 'failed' ? '#f44336' : '#ff9800',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {status === 'confirmed' ? 'Confirmed on Plasma' : status === 'failed' ? 'Failed' : hasTimedOut ? 'Verifying' : 'Pending'}
              {status === 'pending' && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ff9800',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                >
                  ●
                </span>
              )}
            </span>
          </div>

          {/* Confirmations */}
          {confirmations > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>Confirmations</span>
              <span style={{ fontWeight: '600', color: '#4caf50' }}>
                {confirmations} block{confirmations > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Block Number */}
          {blockNumber !== null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#2a5a4f', fontSize: '0.9rem' }}>Block</span>
              <code style={{ fontSize: '0.9rem' }}>#{blockNumber}</code>
            </div>
          )}

          {/* Gas Used */}
          {gasUsed && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#2a5a4f', fontSize: '0.9rem' }}>Gas Used</span>
              <code style={{ fontSize: '0.9rem' }}>{gasUsed}</code>
            </div>
          )}

          {/* Transaction Hash */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#2a5a4f', fontSize: '0.9rem' }}>Transaction</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <code style={{ fontSize: '0.9rem' }}>{truncateHash(transactionHash)}</code>
              <button
                onClick={copyToClipboard}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.8rem',
                  background: '#2a5a4f',
                  border: '1px solid #2a695a',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Copy
              </button>
            </div>
          </div>

          {/* Lien Plasmascan */}
          <div style={{ marginTop: '0.5rem' }}>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#0066cc',
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}
            >
              View on Plasmascan →
            </a>
          </div>
        </div>

        {/* 🔄 Indicateur de vérification en temps réel */}
        {status === 'pending' && !hasTimedOut && (
          <div
            style={{
              marginTop: '2rem',
              padding: '1rem',
              background: '#2a5a4f',
              border: '1px solid #0891b2',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.85rem',
              color: '#0e7490',
            }}
          >
            <div style={{ display: 'flex', gap: '4px' }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  background: '#14b8a6',
                  borderRadius: '50%',
                  animation: 'bounce 1s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  background: '#14b8a6',
                  borderRadius: '50%',
                  animation: 'bounce 1s ease-in-out infinite 0.15s',
                }}
              />
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  background: '#14b8a6',
                  borderRadius: '50%',
                  animation: 'bounce 1s ease-in-out infinite 0.3s',
                }}
              />
            </div>
            <span>
              Checking Plasma blockchain every 3 seconds... ({checkCount} checks)
            </span>
          </div>
        )}

        {/* Bouton retour */}
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '2rem',
            padding: '0.75rem 1.5rem',
            width: '100%',
            background: '#0066cc',
            color: '#2a5a4f',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}
