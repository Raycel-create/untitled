export interface BankAccount {
  id: string
  bankName: string
  accountNumber: string
  accountType: 'checking' | 'savings' | 'business'
  balance: number
  currency: string
  isConnected: boolean
  connectedAt?: number
  lastSynced?: number
}

export interface PlaidConnection {
  accessToken: string
  itemId: string
  institutionName: string
  connectedAt: number
}

export const SUPPORTED_BANKS = [
  { id: 'chase', name: 'Chase Bank', logo: '🏦' },
  { id: 'bofa', name: 'Bank of America', logo: '🏛️' },
  { id: 'wells-fargo', name: 'Wells Fargo', logo: '🏪' },
  { id: 'citi', name: 'Citibank', logo: '🏢' },
  { id: 'capital-one', name: 'Capital One', logo: '💳' },
  { id: 'us-bank', name: 'US Bank', logo: '🏦' },
  { id: 'pnc', name: 'PNC Bank', logo: '🏛️' },
  { id: 'td-bank', name: 'TD Bank', logo: '🏢' },
]

export const createMockBankAccount = (bankId: string): BankAccount => {
  const bank = SUPPORTED_BANKS.find(b => b.id === bankId)
  return {
    id: `account-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    bankName: bank?.name || 'Unknown Bank',
    accountNumber: `****${Math.floor(1000 + Math.random() * 9000)}`,
    accountType: 'business',
    balance: Math.floor(10000 + Math.random() * 90000),
    currency: 'USD',
    isConnected: true,
    connectedAt: Date.now(),
    lastSynced: Date.now()
  }
}

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

export const formatAccountNumber = (accountNumber: string): string => {
  return accountNumber
}
