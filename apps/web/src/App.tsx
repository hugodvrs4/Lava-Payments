import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config'
import { WalletConnect } from './components/WalletConnect'
import { HomePage } from './pages/HomePage'
import { ReceivePage } from './pages/ReceivePage'
import { PayPage } from './pages/PayPage'
import { ReceiptPage } from './pages/ReceiptPage'
import { HistoryPage } from './pages/HistoryPage'
import { ContactsPage } from './pages/ContactsPage'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <WalletConnect />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/receive" element={<ReceivePage />} />
            <Route path="/pay" element={<PayPage />} />
            <Route path="/receipt/:hash" element={<ReceiptPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App