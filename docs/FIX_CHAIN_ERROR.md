# 🚨 Fix: ChainNotConfiguredError dans Wagmi

## 🎯 Problème

### Erreur rencontrée
```
❌ ChainNotConfiguredError: Chain not configured.
Version: @wagmi/core@2.22.1
at waitForTransactionReceipt2
```

### Pourquoi ça arrive ?

Wagmi ne connaît **que les réseaux mainstream** comme Ethereum, Polygon, Optimism, etc. Quand vous essayez d'utiliser un réseau personnalisé comme **Plasma** (chainId: 9745 ou 9746), wagmi ne sait pas où se trouve le RPC et renvoie cette erreur.

```typescript
// ❌ Code qui ne fonctionne PAS
const { data: receipt } = useWaitForTransactionReceipt({
  hash: transactionHash,
  // Wagmi ne connaît pas chainId 9746 → ChainNotConfiguredError
});
```

## ✅ Solution 1 : Configurer Wagmi (RECOMMANDÉ)

Cette solution ajoute Plasma Testnet à la configuration wagmi.

### Étape 1 : Ajouter la définition du réseau

**Fichier** : `packages/shared/src/constants.ts`

```typescript
// 🧪 Plasma Testnet (Development)
export const PLASMA_TESTNET_CHAIN = {
  id: 9746,
  name: 'Plasma Testnet',
  network: 'plasma-testnet',
  nativeCurrency: {
    name: 'Plasma',
    symbol: 'PLASMA',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.plasma.to'],
    },
    public: {
      http: ['https://rpc.testnet.plasma.to'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Plasmascan Testnet',
      url: 'https://testnet.plasmascan.to',
    },
  },
  testnet: true,
} as const;
```

### Étape 2 : Mettre à jour la config Wagmi

**Fichier** : `apps/web/src/config.ts`

```typescript
import { http, createConfig } from 'wagmi'
import { PLASMA_CHAIN, PLASMA_TESTNET_CHAIN } from '@lava-payment/shared'
import { injected } from '@wagmi/connectors'

export const config = createConfig({
  chains: [
    PLASMA_TESTNET_CHAIN, // 🧪 Testnet en premier pour dev
    PLASMA_CHAIN,         // 🌐 Mainnet
  ],
  connectors: [
    injected(),
  ],
  transports: {
    [PLASMA_TESTNET_CHAIN.id]: http('https://rpc.testnet.plasma.to'), // ← IMPORTANT
    [PLASMA_CHAIN.id]: http('https://rpc.plasma.to'),
  },
})
```

### Étape 3 : Utiliser le chainId dans votre composant

**Fichier** : `apps/web/src/pages/ReceiptPage.tsx`

```typescript
import { PLASMA_TESTNET_CHAIN } from '@lava-payment/shared'

const { data: receipt } = useWaitForTransactionReceipt({
  hash: txHash,
  chainId: PLASMA_TESTNET_CHAIN.id, // ✅ Spécifier explicitement le chainId
  query: { 
    enabled: !!txHash,
    refetchInterval: 3000,
  },
})
```

### ✅ Résultat attendu

Après ces modifications, l'erreur **ChainNotConfiguredError** disparaît et vous verrez dans la console :

```
🔍 Vérification du statut de la transaction: 0x7d9d...
⏳ Transaction toujours en attente...
✅ Reçu de transaction trouvé: { blockNumber: 12345, ... }
✅ Transaction confirmée avec succès!
```

---

## ✅ Solution 2 : Utiliser ethers.js (ALTERNATIVE)

Si vous voulez **éviter complètement Wagmi** pour la vérification de transactions, utilisez ethers.js directement.

### Avantages
- ✅ Pas de configuration réseau nécessaire
- ✅ Fonctionne immédiatement avec n'importe quel RPC
- ✅ Plus simple pour un seul réseau custom
- ✅ Pas de dépendance à wagmi

### Inconvénients
- ❌ Perd les avantages de wagmi (cache, retry automatique, etc.)
- ❌ Plus de code à écrire manuellement
- ❌ Moins intégré avec l'écosystème React

### Code

**Fichier créé** : `apps/web/src/pages/ReceiptPageEthers.tsx`

```typescript
import { useEffect, useState } from 'react'
import { JsonRpcProvider } from 'ethers'

const PLASMA_TESTNET_RPC = 'https://rpc.testnet.plasma.to'

export function ReceiptPageEthers() {
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'failed'>('pending')
  
  useEffect(() => {
    let intervalId: NodeJS.Timeout
    let isCancelled = false

    const checkTransactionStatus = async () => {
      if (isCancelled) return

      try {
        // ✅ Utilisation d'ethers.js directement (PAS Wagmi)
        const provider = new JsonRpcProvider(PLASMA_TESTNET_RPC)
        const receipt = await provider.getTransactionReceipt(transactionHash)

        if (receipt) {
          if (receipt.status === 1) {
            setStatus('confirmed')
            clearInterval(intervalId)
          } else {
            setStatus('failed')
            clearInterval(intervalId)
          }
        }
      } catch (err) {
        console.error('Erreur:', err)
      }
    }

    checkTransactionStatus()
    intervalId = setInterval(checkTransactionStatus, 3000)

    return () => {
      isCancelled = true
      clearInterval(intervalId)
    }
  }, [transactionHash])
  
  // ... reste du composant
}
```

**Utilisation** :
```typescript
// Dans App.tsx ou Router
import { ReceiptPageEthers } from './pages/ReceiptPageEthers'

<Route path="/receipt-ethers" element={<ReceiptPageEthers />} />
```

---

## 🔍 Diagnostic de l'erreur

### Extraits des logs d'erreur

```
ChainNotConfiguredError: Chain not configured.
Version: @wagmi/core@2.22.1

Details
chain 9746
  
This could be due to a number of reasons, such as:
- The chain does not have an RPC URL configured.
- There was an issue resolving the configuration.
```

### Où se trouve le problème ?

Le problème vient de `useWaitForTransactionReceipt` qui essaie de trouver le RPC pour chainId 9746 dans la config wagmi, mais ne le trouve pas car ce réseau n'a jamais été ajouté à `createConfig`.

---

## 📝 Code avant/après

### ❌ Code AVANT (ne fonctionne pas)

```typescript
// config.ts
export const config = createConfig({
  chains: [PLASMA_CHAIN], // Seulement chainId 9745
  transports: {
    [PLASMA_CHAIN.id]: http(),
  },
})

// ReceiptPage.tsx
const { data: receipt } = useWaitForTransactionReceipt({
  hash: txHash,
  chainId: 9746, // ❌ Erreur : chainId 9746 pas dans config
})
```

### ✅ Code APRÈS (fonctionne)

```typescript
// config.ts
export const config = createConfig({
  chains: [PLASMA_TESTNET_CHAIN, PLASMA_CHAIN], // ✅ Les 2 réseaux
  transports: {
    [PLASMA_TESTNET_CHAIN.id]: http('https://rpc.testnet.plasma.to'), // ✅ RPC explicite
    [PLASMA_CHAIN.id]: http('https://rpc.plasma.to'),
  },
})

// ReceiptPage.tsx
import { PLASMA_TESTNET_CHAIN } from '@lava-payment/shared'

const { data: receipt } = useWaitForTransactionReceipt({
  hash: txHash,
  chainId: PLASMA_TESTNET_CHAIN.id, // ✅ Utilise la constante
  query: { 
    enabled: !!txHash,
    refetchInterval: 3000,
  },
})
```

---

## 🛠️ Modifications étape par étape

### Checklist

- [ ] 1. Ajouter `PLASMA_TESTNET_CHAIN` dans `packages/shared/src/constants.ts`
- [ ] 2. Importer dans `apps/web/src/config.ts`
- [ ] 3. Ajouter à `chains: [PLASMA_TESTNET_CHAIN, PLASMA_CHAIN]`
- [ ] 4. Ajouter le transport avec RPC explicite
- [ ] 5. Importer `PLASMA_TESTNET_CHAIN` dans `ReceiptPage.tsx`
- [ ] 6. Utiliser `chainId: PLASMA_TESTNET_CHAIN.id`
- [ ] 7. Redémarrer le dev server (`pnpm dev`)
- [ ] 8. Tester une transaction

### Commandes

```bash
# Redémarrer le dev server
pnpm dev

# Vérifier que le build fonctionne
pnpm build
```

---

## ✅ Résultat attendu

### Console logs après correction

```
🔍 Vérification du statut de la transaction: 0x7d9d28e17bef...
📊 Nombre de vérifications: 0
⏳ Transaction toujours en attente...

🔍 Vérification du statut de la transaction: 0x7d9d28e17bef...
📊 Nombre de vérifications: 1
⏳ Transaction toujours en attente...

✅ Reçu de transaction trouvé: {
  blockNumber: 12345n,
  status: 'success',
  gasUsed: 65000n,
  ...
}
📊 Block Number: 12345
📊 Confirmations: 3
📊 Gas utilisé: 65000
📊 Status: success
✅ Transaction confirmée avec succès!
```

### Confirmation visuelle

- ✅ L'erreur "ChainNotConfiguredError" a disparu
- ✅ Le status passe de "Pending" à "Confirmed"
- ✅ Les confirmations s'affichent
- ✅ Le lien Plasmascan fonctionne

---

## 🆘 Dépannage

### Erreur persiste après les modifications

1. **Vider le cache** :
```bash
rm -rf apps/web/node_modules/.vite
rm -rf node_modules/.vite
pnpm install
```

2. **Vérifier les imports** :
```typescript
// Doit être importé de @lava-payment/shared
import { PLASMA_TESTNET_CHAIN } from '@lava-payment/shared'
```

3. **Hard refresh du navigateur** :
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### Le RPC ne répond pas

Vérifier que le RPC fonctionne :
```bash
curl https://rpc.testnet.plasma.to \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

Réponse attendue :
```json
{"jsonrpc":"2.0","id":1,"result":"0x3039"} 
```

---

## 📚 Ressources

- **Wagmi Custom Chains** : https://wagmi.sh/react/chains#custom-chains
- **Viem defineChain** : https://viem.sh/docs/clients/chains#custom-chains
- **ethers.js JsonRpcProvider** : https://docs.ethers.org/v6/api/providers/jsonrpc/

---

## 🎯 Quelle solution choisir ?

| Critère | Solution 1 (Wagmi) | Solution 2 (ethers.js) |
|---------|-------------------|----------------------|
| **Setup** | Une fois, puis réutilisable | À chaque composant |
| **Performance** | Cache + retry auto | Manuel |
| **Maintenance** | Centralisée | Dispersée |
| **Flexibilité** | Écosystème React | Total contrôle |
| **Recommandation** | ✅ **Production** | ⚠️ Prototypage rapide |

**Verdict** : Utilisez **Solution 1 (Wagmi)** pour un projet production. Utilisez **Solution 2 (ethers.js)** uniquement pour tester rapidement ou si vous avez un seul composant isolé.
