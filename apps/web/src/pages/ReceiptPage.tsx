import { useMemo, useEffect, useState } from 'react'
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'
import { useChainId, useWaitForTransactionReceipt, useBlockNumber } from 'wagmi'
import { explorerTxUrl } from '../utils/explorer'
import { PLASMA_TESTNET_CHAIN } from '@lava-payment/shared'

const PLASMA_TESTNET_CHAIN_ID = PLASMA_TESTNET_CHAIN.id // 9746
const TIMEOUT_MS = 30000 // 30 secondes avant de suggérer de vérifier manuellement
const CHECK_INTERVAL_MS = 3000 // Vérification toutes les 3 secondes

export function ReceiptPage() {
  const [searchParams] = useSearchParams()
  const { hash: hashParam } = useParams<{ hash: string }>() // Support ancien format
  const navigate = useNavigate()
  const chainId = useChainId()
  const [hasTimedOut, setHasTimedOut] = useState(false)
  const [checkCount, setCheckCount] = useState(0)

  // Support des deux formats: /receipt?tx=0x... ET /receipt/0x...
  const txHash = (searchParams.get('tx') || hashParam) as `0x${string}` | null

  // 🔍 VÉRIFICATION AUTOMATIQUE DE LA TRANSACTION
  // Ce hook interroge la blockchain toutes les 3 secondes
  const { data: receipt, isLoading, isSuccess, isError, error } = useWaitForTransactionReceipt({
    hash: txHash ?? undefined,
    chainId: PLASMA_TESTNET_CHAIN_ID,
    query: { 
      enabled: !!txHash,
      refetchInterval: CHECK_INTERVAL_MS, // ✅ Polling automatique toutes les 3s
      retry: 3,
    },
  })

  // Obtenir le block number actuel pour calculer les confirmations
  const { data: currentBlock } = useBlockNumber({
    chainId: PLASMA_TESTNET_CHAIN_ID,
    query: {
      enabled: !!receipt,
      refetchInterval: CHECK_INTERVAL_MS,
    },
  })

  // 📊 Calculer le nombre de confirmations
  const confirmations = useMemo(() => {
    if (!receipt || !currentBlock) return 0
    return Number(currentBlock - receipt.blockNumber)
  }, [receipt, currentBlock])

  // 🔄 Logs de debugging pour voir les vérifications en temps réel
  useEffect(() => {
    if (!txHash) return
    
    console.log('🔍 Vérification du statut de la transaction:', txHash)
    console.log('📊 Nombre de vérifications:', checkCount)
    
    if (isLoading) {
      console.log('⏳ Transaction toujours en attente...')
    }
    
    if (receipt) {
      console.log('✅ Reçu de transaction trouvé:', receipt)
      console.log('📊 Block Number:', receipt.blockNumber)
      console.log('📊 Confirmations:', confirmations)
      console.log('📊 Gas utilisé:', receipt.gasUsed.toString())
      console.log('📊 Status:', receipt.status)
    }
    
    if (isSuccess) {
      console.log('✅ Transaction confirmée avec succès!')
    }
    
    if (isError && error) {
      console.error('❌ Erreur lors de la vérification:', error)
    }
  }, [txHash, isLoading, isSuccess, isError, receipt, confirmations, checkCount, error])

  // ⏰ Compteur de vérifications pour UI
  useEffect(() => {
    if (!txHash || !isLoading) return
    
    const interval = setInterval(() => {
      setCheckCount(prev => prev + 1)
    }, CHECK_INTERVAL_MS)

    return () => clearInterval(interval) // ✅ Cleanup obligatoire
  }, [txHash, isLoading])

  // ⚠️ Timeout après 30s pour suggérer de vérifier sur Plasmascan
  useEffect(() => {
    if (!txHash || isSuccess || isError) return
    
    const timer = setTimeout(() => {
      setHasTimedOut(true)
      console.warn('⚠️ Le RPC prend du temps à répondre. Vérifiez manuellement sur Plasmascan.')
    }, TIMEOUT_MS)

    return () => clearTimeout(timer) // ✅ Cleanup obligatoire
  }, [txHash, isSuccess, isError])

  const status = useMemo(() => {
    if (!txHash) return 'Missing transaction hash'
    if (isError) return 'Failed'
    if (isSuccess && receipt) {
      return receipt.status === 'success' ? 'Confirmed' : 'Failed'
    }
    if (hasTimedOut) return 'Verifying'
    if (isLoading) return 'Pending'
    return 'Pending'
  }, [txHash, isLoading, isError, isSuccess, receipt, hasTimedOut])

  const explorerUrl = txHash ? explorerTxUrl(chainId, txHash) : ''

  const truncateHash = (h: string) => `${h.slice(0, 6)}…${h.slice(-4)}`

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    alert('Hash de transaction copié!')
  }

  if (!txHash) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <div
          style={{
            background: '#fff',
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
              color: 'white',
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
      {/* 📊 Barre de progression animée en haut */}
      {isLoading && !hasTimedOut && (
        <div style={{ 
          width: '100%', 
          height: '4px', 
          background: '#e0e0e0', 
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: '50%',
            height: '100%',
            background: 'linear-gradient(90deg, #14b8a6, #0891b2)',
            animation: 'slide 2s ease-in-out infinite',
          }} />
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
          background: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          padding: '2rem',
          position: 'relative',
        }}
      >
        {/* 🏷️ Badge réseau Plasma */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          padding: '0.25rem 0.75rem',
          background: '#14b8a6',
          color: 'white',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '600',
        }}>
          Plasma Testnet
        </div>

        <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>
          {isSuccess ? '✅' : isError ? '❌' : hasTimedOut ? '🔍' : '⏳'} Payment {status}
        </h2>
        <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
          {isLoading && !hasTimedOut && 'Waiting for confirmation...'}
          {hasTimedOut && !isSuccess && 'Taking longer than expected. Check Plasmascan below.'}
          {isSuccess && 'Your payment has been confirmed on Plasma blockchain'}
          {isError && 'Transaction failed or was rejected'}
        </p>

        {hasTimedOut && !isSuccess && !isError && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#856404',
            }}
          >
            ⚠️ The RPC is taking time to respond. Your transaction may already be confirmed. 
            Click "View on Plasmascan" below to verify manually.
          </div>
        )}

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
                color: isSuccess ? '#4caf50' : isError ? '#f44336' : '#ff9800',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {status === 'Confirmed' ? 'Confirmed on Plasma' : status}
              {isLoading && (
                <span style={{ 
                  display: 'inline-block', 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: '#ff9800',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}>●</span>
              )}
            </span>
          </div>

          {/* 📊 Afficher les confirmations si disponibles */}
          {confirmations > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>Confirmations</span>
              <span style={{ fontWeight: '600', color: '#4caf50' }}>
                {confirmations} block{confirmations > 1 ? 's' : ''}
              </span>
            </div>
          ) : null}

          {/* 📦 Block number si disponible */}
          {receipt?.blockNumber ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>Block</span>
              <code style={{ fontSize: '0.9rem', color: '#2a5a4f' }}>#{receipt.blockNumber.toString()}</code>
            </div>
          ) : null}

          {/* ⛽ Gas utilisé */}
          {receipt?.gasUsed ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>Gas Used</span>
              <code style={{ fontSize: '0.9rem', color: '#2a5a4f' }}>{receipt.gasUsed.toString()}</code>
            </div>
          ) : null}

          {/* Hash de transaction */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>Transaction</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <code style={{ fontSize: '0.9rem', color: '#2a5a4f' }}>{txHash && truncateHash(txHash)}</code>
              {txHash && (
                <button
                  onClick={() => copyToClipboard(txHash)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.8rem',
                    background: '#f0f0f0',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Copy
                </button>
              )}
            </div>
          </div>

          {explorerUrl && (
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
          )}
        </div>

        {/* 🔄 Indicateur de vérification en temps réel */}
        {isLoading && !hasTimedOut && (
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: '#f0f9ff',
            border: '1px solid #0891b2',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.85rem',
            color: '#0e7490',
          }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <div style={{ width: '6px', height: '6px', background: '#14b8a6', borderRadius: '50%', animation: 'bounce 1s ease-in-out infinite' }} />
              <div style={{ width: '6px', height: '6px', background: '#14b8a6', borderRadius: '50%', animation: 'bounce 1s ease-in-out infinite 0.15s' }} />
              <div style={{ width: '6px', height: '6px', background: '#14b8a6', borderRadius: '50%', animation: 'bounce 1s ease-in-out infinite 0.3s' }} />
            </div>
            <span>Checking blockchain every 3 seconds... ({checkCount} checks)</span>
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '2rem',
            padding: '0.75rem 1.5rem',
            width: '100%',
            background: '#0066cc',
            color: 'white',
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
