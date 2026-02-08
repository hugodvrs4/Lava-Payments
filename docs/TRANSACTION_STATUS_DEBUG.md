# 🔍 Guide de Debugging - ReceiptPage Transaction Status

## ✅ CE QUI FONCTIONNE

Votre `ReceiptPage.tsx` utilise **wagmi v2** qui fait EXACTEMENT ce que vous voulez :

- ✅ **Vérification automatique toutes les 3 secondes** via `useWaitForTransactionReceipt`
- ✅ **Polling automatique** avec `refetchInterval: 3000`
- ✅ **Logs console** à chaque vérification
- ✅ **Cleanup automatique** des intervals/timers
- ✅ **Calcul des confirmations** en temps réel
- ✅ **UI qui se met à jour** dès que le status change

## 🔄 COMMENT ÇA FONCTIONNE

### Hook `useWaitForTransactionReceipt`

```typescript
const { data: receipt, isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
  hash: txHash,
  chainId: 9746, // Plasma Testnet
  query: { 
    enabled: !!txHash,
    refetchInterval: 3000,  // ✅ Vérifie toutes les 3 secondes
    retry: 3,               // ✅ 3 tentatives en cas d'échec
  },
})
```

**Ce hook fait automatiquement** :
1. Appelle `provider.getTransactionReceipt(txHash)` toutes les 3s
2. Met à jour `isLoading`, `isSuccess`, `isError` selon la réponse
3. Calcule `receipt.status` (success/reverted)
4. S'arrête dès que la transaction est confirmée ou échoue
5. Nettoie les timers automatiquement au unmount

### Logs Console Attendus

Quand vous faites une transaction, vous devriez voir dans la console :

```
🔍 Vérification du statut de la transaction: 0x7d9d...d441
📊 Nombre de vérifications: 0
⏳ Transaction toujours en attente...

🔍 Vérification du statut de la transaction: 0x7d9d...d441
📊 Nombre de vérifications: 1
⏳ Transaction toujours en attente...

✅ Reçu de transaction trouvé: { blockNumber: 12345, ... }
📊 Block Number: 12345
📊 Confirmations: 3
📊 Gas utilisé: 65000
📊 Status: success
✅ Transaction confirmée avec succès!
```

## ⚠️ PROBLÈMES COURANTS

### 1. Status reste sur "Pending" indéfiniment

**Causes possibles** :
- ❌ Le RPC Plasma est lent ou ne répond pas
- ❌ La transaction n'a pas été minée (gas trop bas, nonce incorrect)
- ❌ Mauvais chainId (écoute sur Ethereum au lieu de Plasma)

**Solutions** :
1. Vérifier la transaction sur Plasmascan : https://testnet.plasmascan.to/tx/0x...
2. Vérifier que MetaMask est bien sur "Plasma Testnet"
3. Attendre 30 secondes → le composant affiche un avertissement
4. Essayer de forcer un refetch (F5 sur la page)

### 2. Erreur "Uncaught (in promise)"

**Cause** : Le RPC Plasma ne répond pas assez vite ou est offline

**Solution** : 
- Le composant a un timeout de 30s puis suggère de vérifier manuellement
- Vérifier sur Plasmascan si la transaction existe
- Peut-être essayer avec un autre RPC (voir config/constants.ts)

### 3. Transaction confirmée sur Plasmascan mais status reste "Pending"

**Causes** :
- Le RPC cache est désynchronisé
- Le provider wagmi n'utilise pas le bon endpoint

**Solution** :
```typescript
// Vérifier le RPC dans packages/shared/src/constants.ts
export const PLASMA_CHAIN = {
  id: 9746,
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.plasma.to'], // ← Vérifier cette URL
    },
  },
}
```

## 🧪 TESTS À FAIRE

### Test 1 : Transaction Normale
1. Aller sur `/pay`
2. Scanner un QR code ou coller une invoice
3. Confirmer dans MetaMask
4. Observer la console → devrait voir les logs toutes les 3s
5. Attendre ~5-10 secondes → status devrait passer à "Confirmed"

### Test 2 : Transaction Rejetée
1. Aller sur `/pay`
2. Démarrer une transaction
3. **Rejeter dans MetaMask**
4. Status devrait immédiatement passer à "Failed"

### Test 3 : Timeout RPC
1. Couper internet pendant 35 secondes après une transaction
2. Le composant devrait afficher l'avertissement jaune
3. Status devrait passer à "Verifying"
4. Rallumer internet → devrait se récupérer

## 🛠️ CHECKLIST DE DÉPANNAGE

Avant de debugger, vérifier :

- [ ] MetaMask est sur **Plasma Testnet** (chainId 9746)
- [ ] Le hash de transaction est valide (commence par 0x, 66 caractères)
- [ ] La console affiche les logs `🔍 Vérification...`
- [ ] Le compteur de vérifications augmente (X checks)
- [ ] La transaction existe sur https://testnet.plasmascan.to
- [ ] Le RPC Plasma répond : `curl https://rpc.testnet.plasma.to -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`

## 📊 COMPRENDRE LES STATES

Le composant utilise ces states React :

```typescript
const [hasTimedOut, setHasTimedOut] = useState(false)  // True après 30s
const [checkCount, setCheckCount] = useState(0)        // Nombre de vérifications

// De useWaitForTransactionReceipt :
isLoading   // True tant que la tx n'est pas minée
isSuccess   // True si receipt.status === 'success'
isError     // True si erreur réseau ou tx failed
receipt     // Contient blockNumber, gasUsed, status, etc.
```

**Flow des states** :
```
Initial     → isLoading=true, isSuccess=false, isError=false
Pending     → isLoading=true (hook poll toutes les 3s)
Confirmed   → isLoading=false, isSuccess=true, receipt={...}
Failed      → isLoading=false, isError=true OU isSuccess=true + receipt.status='reverted'
```

## 🎯 POINTS CLÉS DU CODE

### ✅ Cleanup automatique
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setCheckCount(prev => prev + 1)
  }, 3000)
  
  return () => clearInterval(interval)  // ← OBLIGATOIRE pour éviter memory leaks
}, [txHash, isLoading])
```

### ✅ Dépendances correctes
```typescript
useEffect(() => {
  // Code ici...
}, [txHash, isLoading, isSuccess, ...])  // ← Toutes les variables utilisées
```

### ✅ Vérification conditionnelle
```typescript
const { data: receipt } = useWaitForTransactionReceipt({
  hash: txHash ?? undefined,
  query: { 
    enabled: !!txHash,  // ← Ne lance la query que si txHash existe
  },
})
```

## 🚀 PROCHAINES AMÉLIORATIONS

### 1. Utiliser WebSocket au lieu de polling HTTP
```typescript
// Dans config.ts
import { webSocket } from 'wagmi'

export const config = createConfig({
  chains: [PLASMA_CHAIN],
  transports: {
    [PLASMA_CHAIN.id]: webSocket('wss://rpc.testnet.plasma.to'),
  },
})
```
**Avantage** : Mises à jour instantanées au lieu de 3 secondes

### 2. Notification toast au lieu d'alert
```typescript
import { toast } from 'react-hot-toast'

const copyToClipboard = async (text: string) => {
  await navigator.clipboard.writeText(text)
  toast.success('Hash copié!')  // Plus élégant qu'alert()
}
```

### 3. Support multi-réseau
```typescript
// Ajouter Ethereum, Polygon, etc.
const NETWORKS = {
  9746: { name: 'Plasma Testnet', explorer: 'https://testnet.plasmascan.to' },
  1: { name: 'Ethereum', explorer: 'https://etherscan.io' },
  137: { name: 'Polygon', explorer: 'https://polygonscan.com' },
}

const networkInfo = NETWORKS[chainId]
```

## 📚 RESSOURCES

- **wagmi docs** : https://wagmi.sh/react/hooks/useWaitForTransactionReceipt
- **Plasma RPC** : https://rpc.testnet.plasma.to
- **Plasmascan** : https://testnet.plasmascan.to
- **Viem (sous wagmi)** : https://viem.sh/docs/actions/public/getTransactionReceipt

## 🆘 SI RIEN NE FONCTIONNE

1. **Vérifier manuellement le RPC** :
```bash
curl https://rpc.testnet.plasma.to \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_getTransactionReceipt",
    "params":["0xVOTRE_TX_HASH"],
    "id":1
  }'
```

2. **Logs wagmi internes** :
```typescript
// Activer les logs wagmi dans main.tsx
import { createConfig } from 'wagmi'

createConfig({
  // ...
  logger: { 
    debug: (...args) => console.log('[wagmi]', ...args),
  }
})
```

3. **Hard refresh** :
- Vider le cache : Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
- Vider localStorage : DevTools → Application → Clear storage

4. **Tester avec une vraie tx confirmée** :
```
https://localhost:5173/receipt?tx=0x7d9d28e17bef4940f8e79c7ea52363383a301c40b24d654373a0670c4bfba383
```
Vérifier d'abord sur Plasmascan que cette tx existe et est confirmée.
