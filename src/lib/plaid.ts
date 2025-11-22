export interface PlaidConfig {
  clientId?: string
  secret?: string
  environment: 'sandbox' | 'development' | 'production'
}

export interface PlaidLinkToken {
  linkToken: string
  expiration: string
}

export interface PlaidAccount {
  id: string
  name: string
  mask: string
  type: string
  subtype: string
  balances: {
    available: number | null
    current: number | null
    limit: number | null
  }
}

export interface PlaidInstitution {
  institutionId: string
  name: string
  logo?: string
}

export interface PlaidConnection {
  id: string
  accessToken: string
  itemId: string
  institution: PlaidInstitution
  accounts: PlaidAccount[]
  connectedAt: number
  lastSynced: number
  isActive: boolean
}

export interface PlaidTransaction {
  id: string
  accountId: string
  amount: number
  date: string
  name: string
  category: string[]
  pending: boolean
}

export const DEFAULT_PLAID_CONFIG: PlaidConfig = {
  environment: 'sandbox'
}

export async function createLinkToken(userId: string, config: PlaidConfig): Promise<PlaidLinkToken> {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const expiration = new Date(Date.now() + 30 * 60 * 1000).toISOString()
  return {
    linkToken: `link-sandbox-${crypto.randomUUID()}`,
    expiration
  }
}

export async function exchangePublicToken(
  publicToken: string,
  config: PlaidConfig
): Promise<{ accessToken: string; itemId: string }> {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return {
    accessToken: `access-sandbox-${crypto.randomUUID()}`,
    itemId: `item-sandbox-${crypto.randomUUID()}`
  }
}

export async function getAccounts(accessToken: string, config: PlaidConfig): Promise<PlaidAccount[]> {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const accountTypes = [
    { name: 'Business Checking', type: 'depository', subtype: 'checking' },
    { name: 'Business Savings', type: 'depository', subtype: 'savings' },
    { name: 'Business Credit Card', type: 'credit', subtype: 'credit card' }
  ]
  
  const numAccounts = Math.floor(Math.random() * 2) + 2
  return accountTypes.slice(0, numAccounts).map((accountType, index) => ({
    id: `account-${crypto.randomUUID()}`,
    name: accountType.name,
    mask: String(1000 + Math.floor(Math.random() * 9000)),
    type: accountType.type,
    subtype: accountType.subtype,
    balances: {
      available: accountType.type === 'credit' ? null : Math.floor(10000 + Math.random() * 90000),
      current: accountType.type === 'credit' ? -Math.floor(Math.random() * 5000) : Math.floor(10000 + Math.random() * 90000),
      limit: accountType.type === 'credit' ? 10000 : null
    }
  }))
}

export async function getInstitution(institutionId: string, config: PlaidConfig): Promise<PlaidInstitution> {
  const institutionMap: Record<string, PlaidInstitution> = {
    'ins_3': { institutionId: 'ins_3', name: 'Chase', logo: '🏦' },
    'ins_4': { institutionId: 'ins_4', name: 'Bank of America', logo: '🏛️' },
    'ins_5': { institutionId: 'ins_5', name: 'Wells Fargo', logo: '🏪' },
    'ins_6': { institutionId: 'ins_6', name: 'Citibank', logo: '🏢' },
    'ins_7': { institutionId: 'ins_7', name: 'Capital One', logo: '💳' },
    'ins_8': { institutionId: 'ins_8', name: 'US Bank', logo: '🏦' },
    'ins_9': { institutionId: 'ins_9', name: 'PNC Bank', logo: '🏛️' },
    'ins_10': { institutionId: 'ins_10', name: 'TD Bank', logo: '🏢' },
  }

  return institutionMap[institutionId] || { institutionId, name: 'Unknown Bank', logo: '🏦' }
}

export async function getTransactions(
  accessToken: string,
  startDate: string,
  endDate: string,
  config: PlaidConfig
): Promise<PlaidTransaction[]> {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const merchants = [
    { name: 'Amazon', category: ['Shopping', 'Online'] },
    { name: 'Starbucks', category: ['Food', 'Coffee'] },
    { name: 'Shell Gas Station', category: ['Transportation', 'Gas'] },
    { name: 'Whole Foods', category: ['Food', 'Groceries'] },
    { name: 'Netflix', category: ['Entertainment', 'Streaming'] },
    { name: 'Microsoft Azure', category: ['Business', 'Cloud Services'] },
    { name: 'Office Depot', category: ['Business', 'Supplies'] },
    { name: 'AT&T', category: ['Utilities', 'Telecom'] }
  ]
  
  const numTransactions = Math.floor(Math.random() * 6) + 5
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  return Array.from({ length: numTransactions }, (_, i) => {
    const merchant = merchants[Math.floor(Math.random() * merchants.length)]
    const txDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
    
    return {
      id: `txn-${crypto.randomUUID()}`,
      accountId: `account-${crypto.randomUUID()}`,
      amount: Math.floor(Math.random() * 500) + 10,
      date: txDate.toISOString().split('T')[0],
      name: merchant.name,
      category: merchant.category,
      pending: Math.random() < 0.2
    }
  })
}

export async function refreshConnection(connection: PlaidConnection, config: PlaidConfig): Promise<PlaidConnection> {
  const accounts = await getAccounts(connection.accessToken, config)
  
  return {
    ...connection,
    accounts,
    lastSynced: Date.now(),
    isActive: true
  }
}

export function formatPlaidBalance(balance: number | null, currency: string = 'USD'): string {
  if (balance === null) return 'N/A'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(balance)
}

export function getTotalBalance(connections: PlaidConnection[]): number {
  return connections.reduce((total, connection) => {
    const connectionTotal = connection.accounts.reduce((accTotal, account) => {
      return accTotal + (account.balances.current || 0)
    }, 0)
    return total + connectionTotal
  }, 0)
}

export function isLinkTokenExpired(expiration: string): boolean {
  return new Date(expiration) < new Date()
}

export async function removePlaidConnection(itemId: string, config: PlaidConfig): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500))
}
