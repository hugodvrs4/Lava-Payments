import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useChainId } from 'wagmi'
import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem'
import { PLASMA_NETWORKS, PLASMA_CHAIN, PLASMA_TESTNET_CHAIN } from '@lava-payment/shared'
import { explorerTxUrl } from '../utils/explorer'
import ThemeToggle from "../components/ThemeToggle"

interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  blockNumber: bigint
  timestamp?: number
  type: 'sent' | 'received'
}

export function HistoryPage() {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (address) {
      loadTransactions()
    }
  }, [address, chainId])

  const loadTransactions = async () => {
    if (!address) return
    
    setLoading(true)
    setError(null)

    try {
      const rpcUrl = chainId === PLASMA_TESTNET_CHAIN.id 
        ? 'https://testnet-rpc.plasma.to'
        : 'https://rpc.plasma.to'

      const client = createPublicClient({
        chain: chainId === PLASMA_TESTNET_CHAIN.id ? PLASMA_TESTNET_CHAIN : PLASMA_CHAIN,
        transport: http(rpcUrl),
      })

      const usdtAddress = PLASMA_NETWORKS[chainId as keyof typeof PLASMA_NETWORKS]?.usdt

      if (!usdtAddress) {
        throw new Error(`USDT address not found for chain ${chainId}`)
      }

      // Récupérer les événements Transfer (limité à 5000 blocs pour éviter erreur 413)
      const currentBlock = await client.getBlockNumber()
      const fromBlock = currentBlock > 5000n ? currentBlock - 5000n : 0n

      // Transactions reçues
      const receivedLogs = await client.getLogs({
        address: usdtAddress as `0x${string}`,
        event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
        args: {
          to: address as `0x${string}`,
        },
        fromBlock,
        toBlock: 'latest',
      })

      // Transactions envoyées
      const sentLogs = await client.getLogs({
        address: usdtAddress as `0x${string}`,
        event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
        args: {
          from: address as `0x${string}`,
        },
        fromBlock,
        toBlock: 'latest',
      })

      const allTxs: Transaction[] = []

      // Parser les transactions reçues
      for (const log of receivedLogs) {
        allTxs.push({
          hash: log.transactionHash!,
          from: log.args.from!,
          to: log.args.to!,
          value: formatUnits(log.args.value!, 6), // USDT0 a 6 decimals
          blockNumber: log.blockNumber!,
          type: 'received',
        })
      }

      // Parser les transactions envoyées
      for (const log of sentLogs) {
        allTxs.push({
          hash: log.transactionHash!,
          from: log.args.from!,
          to: log.args.to!,
          value: formatUnits(log.args.value!, 6),
          blockNumber: log.blockNumber!,
          type: 'sent',
        })
      }

      // Trier par bloc (plus récent d'abord)
      allTxs.sort((a, b) => Number(b.blockNumber - a.blockNumber))

      // Dédupliquer par hash
      const uniqueTxs = Array.from(
        new Map(allTxs.map(tx => [tx.hash, tx])).values()
      )

      setTransactions(uniqueTxs)
    } catch (err) {
      console.error('Failed to load transactions:', err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const getNetworkName = (chainId: number): string => {
    return PLASMA_NETWORKS[chainId as keyof typeof PLASMA_NETWORKS]?.name || `Chain ${chainId}`
  }

  const formatAddress = (addr: string): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (!isConnected) {
    return (
      <div className='container'>
        <h2>Transaction History</h2>
        <p style={{ marginTop: '1rem' }}>Please connect your wallet to view history.</p>
        <button onClick={() => navigate('/')} style={{ marginTop: '2rem' }}>
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <>
      <ThemeToggle />
      <div className='container'>
        <h2>Transaction History</h2>
        
        <div style={{ marginTop: '1rem', marginBottom: '1rem', fontSize: '0.9rem', color: '#fff' }}>
          <p>Network: {getNetworkName(chainId)}</p>
          <p>Showing last 5,000 blocks</p>
        </div>

        {loading && (
          <div style={{ padding: '2rem', textAlign: 'center', background: '#2a5a4f', borderRadius: '4px' }}>
            <p style={{ color: '#fff' }}>Loading transactions from blockchain...</p>
          </div>
        )}

        {error && (
          <div style={{ padding: '1rem', background: '#f44336', color: 'white', borderRadius: '4px', marginBottom: '1rem' }}>
            Error: {error}
          </div>
        )}

        {!loading && transactions.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', background: '#2a5a4f', borderRadius: '4px' }}>
            <p style={{ color: '#fff' }}>No transactions yet</p>
            <p style={{ fontSize: '0.9rem', color: '#fff', marginTop: '0.5rem' }}>
              Your on-chain transaction history will appear here
            </p>
          </div>
        )}

        {!loading && transactions.length > 0 && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: '#fff' }}>
                {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {transactions.map((tx) => (
                <div
                  key={tx.hash}
                  style={{
                    padding: '1rem',
                    background: '#2a5a4f',
                    border: `2px solid ${tx.type === 'received' ? '#4caf50' : '#ff9800'}`,
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span
                      style={{
                        fontWeight: 'bold',
                        color: tx.type === 'received' ? '#4caf50' : '#ff9800',
                        fontSize: '0.9rem',
                      }}
                    >
                      {tx.type === 'received' ? '↓ RECEIVED' : '↑ SENT'}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#fff' }}>
                      Block #{tx.blockNumber.toString()}
                    </span>
                  </div>

                  <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 'bold', color: '#fff' }}>
                    {tx.value} USDT0
                  </div>

                  <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem', color: '#fff' }}>
                    <strong>From:</strong> {formatAddress(tx.from)}
                  </div>

                  <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: '#fff' }}>
                    <strong>To:</strong> {formatAddress(tx.to)}
                  </div>

                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <a
                      href={explorerTxUrl(chainId, tx.hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.85rem',
                        color: '#ffffff',
                        textDecoration: 'underline',
                      }}
                    >
                      View on Plasmascan →
                    </a>
                    <button
                      onClick={() => navigate(`/receipt?tx=${tx.hash}`)}
                      style={{
                        fontSize: '0.85rem',
                        padding: '0.25rem 0.5rem',
                        background: 'transparent',
                        border: '1px solid #ffffff',
                        color: '#ffffff',
                        borderRadius: '3px',
                        cursor: 'pointer',
                      }}
                    >
                      View Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <button
          onClick={() => navigate('/')}
          style={{ marginTop: '2rem', padding: '0.75rem 1.5rem' }}
        >
          Back to Home
        </button>
      </div>
    </>
  )
}
