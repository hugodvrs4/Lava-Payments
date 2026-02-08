import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { ContactService, Contact } from '../services/contactService'
import ThemeToggle from '../components/ThemeToggle'

export function ContactsPage() {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newContactAddress, setNewContactAddress] = useState('')
  const [newContactName, setNewContactName] = useState('')
  const [editingContact, setEditingContact] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'frequent'>('name')

  useEffect(() => {
    if (address) {
      loadContacts()
    }
  }, [address, sortBy])

  const loadContacts = () => {
    if (!address) return

    let loadedContacts: Contact[]
    
    if (sortBy === 'recent') {
      loadedContacts = ContactService.getRecentContacts(address, 100)
    } else if (sortBy === 'frequent') {
      loadedContacts = ContactService.getFrequentContacts(address, 100)
    } else {
      loadedContacts = ContactService.getContacts(address)
      loadedContacts.sort((a, b) => a.name.localeCompare(b.name))
    }
    
    setContacts(loadedContacts)
  }

  const handleAddContact = () => {
    if (!address || !newContactAddress || !newContactName) return

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(newContactAddress)) {
      alert('Invalid Ethereum address format')
      return
    }

    ContactService.saveContact(address, newContactAddress, newContactName)
    setNewContactAddress('')
    setNewContactName('')
    setShowAddForm(false)
    loadContacts()
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact.address)
    setEditName(contact.name)
  }

  const handleSaveEdit = (contactAddress: string) => {
    if (!address || !editName) return
    
    ContactService.saveContact(address, contactAddress, editName)
    setEditingContact(null)
    setEditName('')
    loadContacts()
  }

  const handleDeleteContact = (contactAddress: string, contactName: string) => {
    if (!address) return
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer le contact "${contactName}" ?`)) {
      ContactService.deleteContact(address, contactAddress)
      loadContacts()
    }
  }

  const handlePayContact = (contactAddress: string) => {
    navigate(`/pay?recipient=${contactAddress}`)
  }

  const formatAddress = (addr: string): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString()
  }

  const filteredContacts = searchQuery
    ? contacts.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : contacts

  if (!isConnected) {
    return (
      <div className='container'>
        <h2>Mes Contacts</h2>
        <p style={{ marginTop: '1rem' }}>Veuillez connecter votre wallet pour gérer vos contacts.</p>
        <button onClick={() => navigate('/')} style={{ marginTop: '2rem' }}>
          Retour à l'accueil
        </button>
      </div>
    )
  }

  return (
    <>
      <ThemeToggle />
      <div className='container' style={{ maxWidth: '800px', height: 'auto', padding: '2rem' }}>
        <h2>Mes Contacts</h2>

        {/* Search and Sort */}
        <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Rechercher par nom ou adresse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              background: 'var(--container-gradient-start)',
              color: 'var(--text-primary)',
              marginBottom: '0.5rem'
            }}
          />

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSortBy('name')}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                background: sortBy === 'name' ? 'var(--accent-color)' : 'transparent',
                border: '1px solid var(--accent-color)',
                color: sortBy === 'name' ? 'white' : 'var(--accent-color)'
              }}
            >
              Par nom
            </button>
            <button
              onClick={() => setSortBy('recent')}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                background: sortBy === 'recent' ? 'var(--accent-color)' : 'transparent',
                border: '1px solid var(--accent-color)',
                color: sortBy === 'recent' ? 'white' : 'var(--accent-color)'
              }}
            >
              Récents
            </button>
            <button
              onClick={() => setSortBy('frequent')}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                background: sortBy === 'frequent' ? 'var(--accent-color)' : 'transparent',
                border: '1px solid var(--accent-color)',
                color: sortBy === 'frequent' ? 'white' : 'var(--accent-color)'
              }}
            >
              Fréquents
            </button>
          </div>
        </div>

        {/* Add Contact Button */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ width: '100%', marginBottom: '1rem' }}
        >
          {showAddForm ? '✕ Annuler' : '➕ Ajouter un contact'}
        </button>

        {/* Add Contact Form */}
        {showAddForm && (
          <div style={{
            padding: '1rem',
            background: 'var(--accent-color)',
            borderRadius: '12px',
            marginBottom: '1rem'
          }}>
            <h3 style={{ marginTop: 0, color: 'white' }}>Nouveau contact</h3>
            <input
              type="text"
              placeholder="Nom du contact"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginBottom: '0.5rem',
                borderRadius: '8px',
                border: '1px solid #ddd',
                background: 'white',
                color: '#333'
              }}
            />
            <input
              type="text"
              placeholder="0x..."
              value={newContactAddress}
              onChange={(e) => setNewContactAddress(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginBottom: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #ddd',
                background: 'white',
                color: '#333'
              }}
            />
            <button
              onClick={handleAddContact}
              style={{ width: '100%', background: 'white', color: 'var(--accent-color)' }}
            >
              Enregistrer
            </button>
          </div>
        )}

        {/* Contacts List */}
        {filteredContacts.length === 0 ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            background: 'var(--accent-color)',
            borderRadius: '12px',
            color: 'white'
          }}>
            <p style={{ color: 'white' }}>
              {searchQuery ? 'Aucun contact trouvé' : 'Aucun contact enregistré'}
            </p>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.5rem' }}>
              Les contacts sont stockés localement sur votre appareil
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '0.9rem' }}>
                {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredContacts.map((contact) => (
                <div
                  key={contact.address}
                  style={{
                    padding: '1rem',
                    background: 'var(--accent-color)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  {editingContact === contact.address ? (
                    <div>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          marginBottom: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #ddd',
                          background: 'white',
                          color: '#333'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleSaveEdit(contact.address)}
                          style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
                        >
                          ✓ Enregistrer
                        </button>
                        <button
                          onClick={() => {
                            setEditingContact(null)
                            setEditName('')
                          }}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            fontSize: '0.9rem',
                            background: 'transparent',
                            border: '1px solid white',
                            color: 'white'
                          }}
                        >
                          ✕ Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <div>
                          <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>
                            {contact.name}
                          </h3>
                          <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>
                            {formatAddress(contact.address)}
                          </p>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>
                          <div>{contact.totalTransactions} transaction{contact.totalTransactions !== 1 ? 's' : ''}</div>
                          <div>Dernier: {formatDate(contact.lastUsed)}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button
                          onClick={() => handlePayContact(contact.address)}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            fontSize: '0.9rem',
                            background: 'white',
                            color: 'var(--accent-color)'
                          }}
                        >
                          💸 Payer
                        </button>
                        <button
                          onClick={() => handleEditContact(contact)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.9rem',
                            background: 'transparent',
                            border: '1px solid white',
                            color: 'white'
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.address, contact.name)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.9rem',
                            background: '#f44336',
                            border: 'none',
                            color: 'white'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <button
          onClick={() => navigate('/')}
          style={{ marginTop: '2rem', width: '100%' }}
        >
          Retour à l'accueil
        </button>
      </div>
    </>
  )
}
