export interface Contact {
  address: string
  name: string
  lastUsed: number
  totalTransactions: number
  createdAt: number
}

const CONTACTS_STORAGE_KEY = 'lava_contacts'

export class ContactService {
  /**
   * Get all contacts for a user
   */
  static getContacts(userAddress: string): Contact[] {
    try {
      const key = `${CONTACTS_STORAGE_KEY}_${userAddress.toLowerCase()}`
      const data = localStorage.getItem(key)
      if (!data) return []
      return JSON.parse(data)
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
    return contacts.find(c => c.address.toLowerCase() === contactAddress.toLowerCase()) || null
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
      const contacts = this.getContacts(userAddress)
      const existingIndex = contacts.findIndex(
        c => c.address.toLowerCase() === contactAddress.toLowerCase()
      )

      if (existingIndex >= 0) {
        // Update existing contact
        contacts[existingIndex].name = name
        contacts[existingIndex].lastUsed = Date.now()
        contacts[existingIndex].totalTransactions += 1
      } else {
        // Add new contact
        contacts.push({
          address: contactAddress,
          name,
          lastUsed: Date.now(),
          totalTransactions: 1,
          createdAt: Date.now()
        })
      }

      const key = `${CONTACTS_STORAGE_KEY}_${userAddress.toLowerCase()}`
      localStorage.setItem(key, JSON.stringify(contacts))
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
      this.saveContact(userAddress, contactAddress, contact.name)
    }
  }

  /**
   * Delete a contact
   */
  static deleteContact(userAddress: string, contactAddress: string): void {
    try {
      const contacts = this.getContacts(userAddress)
      const filtered = contacts.filter(
        c => c.address.toLowerCase() !== contactAddress.toLowerCase()
      )
      
      const key = `${CONTACTS_STORAGE_KEY}_${userAddress.toLowerCase()}`
      localStorage.setItem(key, JSON.stringify(filtered))
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
      c.address.toLowerCase().includes(lowerQuery)
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
}
