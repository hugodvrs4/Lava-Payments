import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { ContactService } from '../services/contactService'

/**
 * Debug component to verify contact persistence
 * Add this to your ContactsPage temporarily to debug
 */
export function ContactsDebugPanel() {
  const { address } = useAccount()
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    if (address) {
      checkPersistence()
    }
  }, [address])

  const checkPersistence = () => {
    if (!address) return

    let info = '=== CONTACTS DEBUG INFO ===\n\n'
    
    // Current user address
    info += `Current Address: ${address}\n`
    info += `Normalized: ${address.toLowerCase()}\n\n`
    
    // Storage key being used
    const storageKey = `lava_contacts_${address.toLowerCase()}`
    info += `Storage Key: ${storageKey}\n\n`
    
    // Check localStorage
    const rawData = localStorage.getItem(storageKey)
    info += `Raw localStorage data:\n${rawData || 'NULL'}\n\n`
    
    // Parsed contacts
    const contacts = ContactService.getContacts(address)
    info += `Parsed Contacts: ${contacts.length}\n`
    if (contacts.length > 0) {
      contacts.forEach((c, i) => {
        info += `  ${i + 1}. ${c.name} - ${c.address}\n`
      })
    }
    info += '\n'
    
    // All contact keys in localStorage
    info += 'All contact keys in localStorage:\n'
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('lava_contacts'))
    if (allKeys.length === 0) {
      info += '  (none)\n'
    } else {
      allKeys.forEach(key => {
        const data = localStorage.getItem(key)
        const count = data ? JSON.parse(data).length : 0
        info += `  ${key}: ${count} contacts\n`
      })
    }
    
    setDebugInfo(info)
  }

  const testSaveContact = () => {
    if (!address) return
    
    const testContact = {
      address: '0x1234567890123456789012345678901234567890',
      name: `Test Contact ${Date.now()}`
    }
    
    ContactService.saveContact(address, testContact.address, testContact.name)
    alert(`Saved test contact: ${testContact.name}`)
    checkPersistence()
  }

  const clearAllContacts = () => {
    if (!address) return
    if (confirm('Clear all contacts? This cannot be undone.')) {
      ContactService.clearAllContacts(address)
      alert('All contacts cleared')
      checkPersistence()
    }
  }

  const checkLocalStorageAvailable = () => {
    try {
      const test = 'test'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      alert('✓ localStorage is available and working')
    } catch (e) {
      alert('✗ localStorage is NOT available: ' + e)
    }
  }

  if (!address) {
    return (
      <div style={{
        padding: '1rem',
        background: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <p style={{ margin: 0, color: '#856404' }}>
          🔍 Debug Panel: Please connect wallet
        </p>
      </div>
    )
  }

  return (
    <div style={{
      padding: '1rem',
      background: '#d1ecf1',
      border: '1px solid #bee5eb',
      borderRadius: '8px',
      marginBottom: '1rem'
    }}>
      <h3 style={{ marginTop: 0, color: '#0c5460' }}>🔍 Debug Panel</h3>
      
      <pre style={{
        background: 'white',
        padding: '1rem',
        borderRadius: '4px',
        fontSize: '0.8rem',
        overflow: 'auto',
        maxHeight: '300px',
        color: '#333'
      }}>
        {debugInfo}
      </pre>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={checkPersistence}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.85rem',
            background: '#17a2b8',
            border: 'none',
            color: 'white'
          }}
        >
          🔄 Refresh Info
        </button>
        
        <button
          onClick={testSaveContact}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.85rem',
            background: '#28a745',
            border: 'none',
            color: 'white'
          }}
        >
          ➕ Test Save
        </button>
        
        <button
          onClick={() => ContactService.debugListAllContactKeys()}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.85rem',
            background: '#6c757d',
            border: 'none',
            color: 'white'
          }}
        >
          📋 Console Log All
        </button>
        
        <button
          onClick={checkLocalStorageAvailable}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.85rem',
            background: '#007bff',
            border: 'none',
            color: 'white'
          }}
        >
          ✓ Check localStorage
        </button>
        
        <button
          onClick={clearAllContacts}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.85rem',
            background: '#dc3545',
            border: 'none',
            color: 'white'
          }}
        >
          🗑️ Clear All
        </button>
      </div>

      <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', marginBottom: 0, color: '#0c5460' }}>
        💡 Tip: Open browser console (F12) for detailed logs
      </p>
    </div>
  )
}
