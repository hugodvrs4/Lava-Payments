# 🔧 Configuration Plasma Network (Testnet vs Mainnet)

## 🎯 Problème résolu

Avant, l'application était hardcodée sur **Plasma Mainnet (chainId 9745)**, ce qui causait des erreurs lors des tests sur **Plasma Testnet (chainId 9746)**.

Message d'erreur typique :
```
Please switch to Plasma network to continue
Your wallet is on chain 9746, invoice requires chain 9745.
```

## ✅ Solution

L'application utilise maintenant une variable d'environnement pour basculer facilement entre Testnet et Mainnet.

## 📝 Comment basculer entre Testnet et Mainnet

### Option 1 : Via .env.local (RECOMMANDÉ)

**Fichier** : `apps/web/.env.local`

```bash
# Pour Testnet (développement)
VITE_USE_TESTNET=true

# Pour Mainnet (production)
VITE_USE_TESTNET=false
```

### Option 2 : Modifier directement config.ts

**Fichier** : `apps/web/src/config.ts`

```typescript
// Ligne 8
const USE_TESTNET = true  // ← Changer ici
```

## 🚀 Utilisation

### 1. Configuration Testnet (par défaut)

```bash
# apps/web/.env.local
VITE_USE_TESTNET=true
```

Résultat :
- **Réseau actif** : Plasma Testnet (chainId 9746)
- **RPC** : https://rpc.testnet.plasma.to
- **Explorer** : https://testnet.plasmascan.to
- **USDT Address** : 0x502012b361AebCE43b26Ec812B74D9a51dB4D412

### 2. Configuration Mainnet (production)

```bash
# apps/web/.env.local
VITE_USE_TESTNET=false
```

Résultat :
- **Réseau actif** : Plasma Mainnet (chainId 9745)
- **RPC** : https://rpc.plasma.to
- **Explorer** : https://explorer.plasma.to
- **USDT Address** : 0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb

## 🔍 Ce qui a changé

### Fichiers modifiés

1. **`packages/shared/src/constants.ts`**
   - Ajout de `PLASMA_TESTNET_CHAIN` (chainId 9746)

2. **`apps/web/src/config.ts`**
   - Export de `ACTIVE_PLASMA_CHAIN` (déterminé par `VITE_USE_TESTNET`)
   - Configuration wagmi avec les 2 réseaux

3. **`apps/web/src/pages/PayPage.tsx`**
   - Utilise `ACTIVE_PLASMA_CHAIN` au lieu de `PLASMA_CHAIN`
   - Accepte les invoices du réseau actif
   - Message d'erreur plus clair

4. **`apps/web/src/pages/ReceivePage.tsx`**
   - Génère des invoices pour le réseau actif

5. **`apps/web/src/pages/ReceiptPage.tsx`**
   - Utilise `PLASMA_TESTNET_CHAIN.id` pour la vérification

### Fichiers créés

1. **`apps/web/.env.local`** - Configuration locale
2. **`apps/web/.env.example`** - Documentation
3. **`apps/web/src/vite-env.d.ts`** - Types TypeScript pour Vite

## 🧪 Tests

### Test sur Testnet

```bash
# 1. Configurer .env.local
echo "VITE_USE_TESTNET=true" > apps/web/.env.local

# 2. Redémarrer le dev server
pnpm dev

# 3. Dans MetaMask, ajouter Plasma Testnet :
# - Network Name: Plasma Testnet
# - RPC URL: https://rpc.testnet.plasma.to
# - Chain ID: 9746
# - Currency Symbol: PLASMA
# - Explorer: https://testnet.plasmascan.to

# 4. Tester :
# - Aller sur /receive
# - Créer une invoice
# - Scanner le QR code sur /pay
# - Confirmer le paiement
```

### Test sur Mainnet

```bash
# 1. Configurer .env.local
echo "VITE_USE_TESTNET=false" > apps/web/.env.local

# 2. Redémarrer le dev server
pnpm dev

# 3. Dans MetaMask, basculer sur Plasma Mainnet (chainId 9745)

# 4. Tester le flux complet
```

## 📊 Console Logs

Au démarrage, vous verrez :

```
🌐 Active Plasma Network: Plasma Testnet (chainId: 9746)
```

ou

```
🌐 Active Plasma Network: Plasma (chainId: 9745)
```

## ⚠️ Important

- **Redémarrer le dev server** après modification de `.env.local`
- **Ne jamais commiter `.env.local`** (déjà dans .gitignore)
- **Vérifier MetaMask** : le réseau affiché doit correspondre à la config

## 🔗 Réseaux

| Nom | Chain ID | RPC | Explorer | USDT Address |
|-----|----------|-----|----------|--------------|
| Plasma Testnet | 9746 | https://rpc.testnet.plasma.to | https://testnet.plasmascan.to | 0x5020...4412 |
| Plasma Mainnet | 9745 | https://rpc.plasma.to | https://explorer.plasma.to | 0xB8CE...5ebb |

## 🆘 Dépannage

### Erreur "Invoice is for chain X, but you're on chain Y"

**Cause** : L'invoice a été générée sur un réseau différent

**Solution** :
1. Vérifier `.env.local` → `VITE_USE_TESTNET`
2. Redémarrer le dev server : `pnpm dev`
3. Régénérer l'invoice sur `/receive`

### Erreur "Please switch to Plasma Testnet manually"

**Cause** : MetaMask est sur un autre réseau

**Solution** :
1. Ouvrir MetaMask
2. Cliquer sur le réseau actuel
3. Sélectionner "Plasma Testnet" (ou l'ajouter manuellement)

### L'invoice ne scan pas

**Cause** : Caméra bloquée ou QR code invalide

**Solution** :
1. Autoriser l'accès caméra dans le navigateur
2. Vérifier que l'invoice n'a pas expiré (24h)
3. Essayer de coller le code manuellement

## 📚 Référence Code

### Générer une invoice (ReceivePage)

```typescript
const invoice: InvoicePayload = {
  v: 1,
  chainId: ACTIVE_PLASMA_CHAIN.id, // ✅ Réseau actif
  token: 'USDT0',
  to: address,
  amount,
  id: `INV-${generateUUID()}`,
  exp: Date.now() + 24 * 60 * 60 * 1000,
}
```

### Payer une invoice (PayPage)

```typescript
await PaymentService.executeTransfer({
  to: invoice.to,
  amount: invoice.amount,
  useZeroFee,
  chainId: ACTIVE_PLASMA_CHAIN.id, // ✅ Réseau actif
}, writeContractAsync)
```

### Vérifier une transaction (ReceiptPage)

```typescript
const { data: receipt } = useWaitForTransactionReceipt({
  hash: txHash,
  chainId: PLASMA_TESTNET_CHAIN.id, // ✅ Testnet par défaut
  query: { refetchInterval: 3000 }
})
```

---

**Résumé** : Modifier `VITE_USE_TESTNET` dans `.env.local` pour basculer entre Testnet (dev) et Mainnet (prod). Redémarrer le serveur après modification.
