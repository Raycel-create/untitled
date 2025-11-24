export interface PaymentMethod {
  id: string
  type: 'card' | 'bank' | 'paypal' | 'crypto'
  isDefault: boolean
  details: {
    last4?: string
    brand?: string
    expiryMonth?: number
    expiryYear?: number
    bankName?: string
    accountLast4?: string
    email?: string
    walletAddress?: string
  }
  billingAddress?: {
    name: string
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  createdAt: number
  lastUsed?: number
}

export interface PaymentPreferences {
  autoRenew: boolean
  defaultPaymentMethodId?: string
  billingEmail: string
  receiveInvoices: boolean
  receivePaymentReminders: boolean
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD'
}

export interface PaymentHistory {
  id: string
  amount: number
  currency: string
  status: 'succeeded' | 'pending' | 'failed' | 'refunded'
  description: string
  paymentMethodId: string
  createdAt: number
  invoiceUrl?: string
  receiptUrl?: string
}

export const initializePaymentPreferences = (): PaymentPreferences => ({
  autoRenew: true,
  billingEmail: '',
  receiveInvoices: true,
  receivePaymentReminders: true,
  currency: 'USD'
})

export const SUPPORTED_CARD_BRANDS = [
  { id: 'visa', name: 'Visa' },
  { id: 'mastercard', name: 'Mastercard' },
  { id: 'amex', name: 'American Express' },
  { id: 'discover', name: 'Discover' },
  { id: 'diners', name: 'Diners Club' },
  { id: 'jcb', name: 'JCB' },
  { id: 'unionpay', name: 'UnionPay' }
]

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
]

export const formatCardNumber = (last4: string): string => {
  return `•••• •••• •••• ${last4}`
}

export const formatExpiryDate = (month: number, year: number): string => {
  return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`
}

export const isCardExpired = (month: number, year: number): boolean => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  if (year < currentYear) return true
  if (year === currentYear && month < currentMonth) return true
  return false
}

export const isCardExpiringSoon = (month: number, year: number): boolean => {
  const now = new Date()
  const expiryDate = new Date(year, month - 1)
  const threeMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 3)
  
  return expiryDate <= threeMonthsFromNow && !isCardExpired(month, year)
}

export const formatAmount = (amount: number, currency: string): string => {
  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency)
  const symbol = currencyInfo?.symbol || '$'
  return `${symbol}${(amount / 100).toFixed(2)}`
}

export const getPaymentMethodIcon = (type: PaymentMethod['type']): string => {
  const icons = {
    card: 'credit-card',
    bank: 'bank',
    paypal: 'paypal-logo',
    crypto: 'currency-btc'
  }
  return icons[type]
}

export const generateMockPaymentHistory = (count: number = 5): PaymentHistory[] => {
  const statuses: PaymentHistory['status'][] = ['succeeded', 'succeeded', 'succeeded', 'pending', 'failed']
  const descriptions = [
    'Pro Plan - Monthly Subscription',
    'Pro Plan - Annual Subscription',
    'Additional Credits Purchase',
    'Pro Plan Upgrade',
    'Platform Usage Fee'
  ]
  
  return Array.from({ length: count }, (_, i) => ({
    id: `pi_${Math.random().toString(36).substr(2, 24)}`,
    amount: Math.floor(Math.random() * 10000) + 999,
    currency: 'USD',
    status: statuses[i % statuses.length],
    description: descriptions[i % descriptions.length],
    paymentMethodId: `pm_${Math.random().toString(36).substr(2, 24)}`,
    createdAt: Date.now() - (i * 30 * 24 * 60 * 60 * 1000),
    invoiceUrl: `https://invoice.stripe.com/i/acct_test/${Math.random().toString(36).substr(2, 24)}`,
    receiptUrl: `https://receipt.stripe.com/r/acct_test/${Math.random().toString(36).substr(2, 24)}`
  }))
}
