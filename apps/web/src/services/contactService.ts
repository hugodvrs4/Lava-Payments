export interface Contact {
  address: string
  name: string
  lastUsed: number
  totalTransactions: number
  createdAt: number
}

const CONTACTS_STORAGE_KEY = 'lava_contacts'

/**
 * Normalize an Ethereum address to lowercase for consistent storage
 */
function normalizeAddress(address: string): string {
  return address.toLowerCase()
}

/**
 * Get the storage key for a user's contacts
 */
function getStorageKey(userAddress: string): string {
  return `${CONTACTS_STORAGE_KEY}_${normalizeAddress(userAddress)}`
}

export class ContactService {
  /**
   * Get all contacts for a user
   */
  static getContacts(userAddress: string): Contact[] {
    try {
      if (!userAddress) {
        console.warn('No user address provided')
        return []
      }

      const key = getStorageKey(userAddress)
      const data = localStorage.getItem(key)
      
      if (!data) {
        console.log(`No contacts found for ${normalizeAddress(userAddress)}`)
        return []
      }
      
      const contacts = JSON.parse(data)
      console.log(`Loaded ${contacts.length} contacts for ${normalizeAddress(userAddress)}`)
      return contacts
    } catch (error) {
      console.error('Error loading contacts:', error)
      return []
    }
  }

  /**
   * Get a specific contact by address
   */
  static getContact(userAddress: string, contactAddress: string): Contact | null {
    const contacts = this.getContacts(userAddress)
    return contacts.find(c => normalizeAddress(c.address) === normalizeAddress(contactAddress)) || null
  }

  /**
   * Add or update a contact
   */
  static saveContact(
    userAddress: string,
    contactAddress: string,
    name: string
  ): void {
    try {
      if (!userAddress || !contactAddress || !name) {
        console.error('Missing required parameters for saveContact')
        return
      }

      const contacts = this.getContacts(userAddress)
      const normalizedContactAddress = normalizeAddress(contactAddress)
      const existingIndex = contacts.findIndex(
        c => normalizeAddress(c.address) === normalizedContactAddress
      )

      if (existingIndex >= 0) {
        // Update existing contact
        contacts[existingIndex].name = name
        contacts[existingIndex].lastUsed = Date.now()
        contacts[existingIndex].totalTransactions += 1
        console.log(`Updated contact: ${name} (${normalizedContactAddress})`)
      } else {
        // Add new contact - store with original case but search will be case-insensitive
        contacts.push({
          address: contactAddress, // Keep original case for display
          name,
          lastUsed: Date.now(),
          totalTransactions: 1,
          createdAt: Date.now()
        })
        console.log(`Added new contact: ${name} (${normalizedContactAddress})`)
      }

      const key = getStorageKey(userAddress)
      localStorage.setItem(key, JSON.stringify(contacts))
      console.log(`Saved ${contacts.length} contacts to localStorage with key: ${key}`)
      
      // Verify save
      const verification = localStorage.getItem(key)
      if (!verification) {
        console.error('Failed to save contacts to localStorage!')
      } else {
        console.log('✓ Contacts successfully saved and verified')
      }
    } catch (error) {
      console.error('Error saving contact:', error)
    }
  }

  /**
   * Update transaction count when a payment is made
   */
  static incrementTransactionCount(userAddress: string, contactAddress: string): void {
    const contact = this.getContact(userAddress, contactAddress)
    if (contact) {
      // Re-save to increment count
      this.saveContact(userAddress, contactAddress, contact.name)
    }
  }

  /**
   * Delete a contact
   */
  static deleteContact(userAddress: string, contactAddress: string): void {
    try {
      const contacts = this.getContacts(userAddress)
      const normalizedContactAddress = normalizeAddress(contactAddress)
      const filtered = contacts.filter(
        c => normalizeAddress(c.address) !== normalizedContactAddress
      )
      
      const key = getStorageKey(userAddress)
      localStorage.setItem(key, JSON.stringify(filtered))
      console.log(`Deleted contact: ${normalizedContactAddress}`)
    } catch (error) {
      console.error('Error deleting contact:', error)
    }
  }

  /**
   * Search contacts by name or address
   */
  static searchContacts(userAddress: string, query: string): Contact[] {
    const contacts = this.getContacts(userAddress)
    const lowerQuery = query.toLowerCase()
    
    return contacts.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) ||
      normalizeAddress(c.address).includes(lowerQuery)
    )
  }

  /**
   * Get frequently used contacts (sorted by transaction count)
   */
  static getFrequentContacts(userAddress: string, limit = 5): Contact[] {
    const contacts = this.getContacts(userAddress)
    return contacts
      .sort((a, b) => b.totalTransactions - a.totalTransactions)
      .slice(0, limit)
  }

  /**
   * Get recently used contacts
   */
  static getRecentContacts(userAddress: string, limit = 5): Contact[] {
    const contacts = this.getContacts(userAddress)
    return contacts
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, limit)
  }

  /**
   * Debug: List all contact keys in localStorage
   */
  static debugListAllContactKeys(): void {
    console.log('=== All contact keys in localStorage ===')
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CONTACTS_STORAGE_KEY))
    if (keys.length === 0) {
      console.log('No contact keys found')
    } else {
      keys.forEach(key => {
        const data = localStorage.getItem(key)
        const contacts = data ? JSON.parse(data) : []
        console.log(`${key}: ${contacts.length} contacts`)
      })
    }
    console.log('=======================================')
  }

  /**
   * Clear all contacts for a user (for testing/debugging)
   */
  static clearAllContacts(userAddress: string): void {
    const key = getStorageKey(userAddress)
    localStorage.removeItem(key)
    console.log(`Cleared all contacts for ${normalizeAddress(userAddress)}`)
  }
}