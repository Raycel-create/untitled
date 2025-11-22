import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  Crown, 
  Key, 
  Bank, 
  ChartBar, 
  SignOut, 
  Plus, 
  Trash, 
  Eye, 
  EyeSlash,
  Check,
  X,
  Lightning,
  Sparkle,
  CreditCard,
  Gear,
  Wallet,
  ArrowsClockwise,
  Warning,
  ListBullets
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { User } from '@/lib/auth'
import type { APIKeys } from '@/lib/api-keys'
import { PlaidLinkButton } from '@/components/PlaidLink'
import { 
  PlaidConnection, 
  PlaidConfig, 
  DEFAULT_PLAID_CONFIG,
  createLinkToken,
  exchangePublicToken,
  getAccounts,
  getInstitution,
  getTransactions,
  formatPlaidBalance,
  getTotalBalance,
  refreshConnection,
  removePlaidConnection,
  PlaidTransaction
} from '@/lib/plaid'

interface CEODashboardProps {
  user: User
  onSignOut: () => void
}

export function CEODashboard({ user, onSignOut }: CEODashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'api-keys' | 'banking'>('overview')
  const [apiKeys, setApiKeys] = useKV<APIKeys>('ceo-api-keys', {})
  const [plaidConnections, setPlaidConnections] = useKV<PlaidConnection[]>('plaid-connections', [])
  const [plaidConfig, setPlaidConfig] = useKV<PlaidConfig>('plaid-config', DEFAULT_PLAID_CONFIG)
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [showBankDialog, setShowBankDialog] = useState(false)
  const [showPlaidConfigDialog, setShowPlaidConfigDialog] = useState(false)
  const [showTransactionsDialog, setShowTransactionsDialog] = useState(false)
  const [selectedConnection, setSelectedConnection] = useState<PlaidConnection | null>(null)
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null)
  const [isLoadingLinkToken, setIsLoadingLinkToken] = useState(false)

  const API_PROVIDERS = [
    { id: 'openai', name: 'OpenAI', description: 'GPT-4, DALL-E', icon: '🤖' },
    { id: 'anthropic', name: 'Anthropic', description: 'Claude AI', icon: '🧠' },
    { id: 'stability', name: 'Stability AI', description: 'Stable Diffusion', icon: '🎨' },
    { id: 'replicate', name: 'Replicate', description: 'Various Models', icon: '🔄' },
    { id: 'runway', name: 'RunwayML', description: 'Video Generation', icon: '🎬' },
    { id: 'elevenlabs', name: 'ElevenLabs', description: 'Voice AI', icon: '🎤' },
  ]

  useEffect(() => {
    if (showBankDialog && !linkToken && !isLoadingLinkToken) {
      handleGenerateLinkToken()
    }
  }, [showBankDialog])

  const handleGenerateLinkToken = async () => {
    setIsLoadingLinkToken(true)
    try {
      const tokenData = await createLinkToken(user.id, plaidConfig ?? DEFAULT_PLAID_CONFIG)
      setLinkToken(tokenData.linkToken)
      toast.success('Ready to connect bank')
    } catch (error) {
      toast.error('Failed to initialize bank connection')
      console.error(error)
    } finally {
      setIsLoadingLinkToken(false)
    }
  }

  const handlePlaidSuccess = async (publicToken: string, metadata: any) => {
    try {
      toast.success('Exchanging tokens...')
      
      const { accessToken, itemId } = await exchangePublicToken(publicToken, plaidConfig ?? DEFAULT_PLAID_CONFIG)
      
      const accounts = await getAccounts(accessToken, plaidConfig ?? DEFAULT_PLAID_CONFIG)
      const institution = await getInstitution(metadata.institution?.institution_id || 'ins_3', plaidConfig ?? DEFAULT_PLAID_CONFIG)

      const newConnection: PlaidConnection = {
        id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        accessToken,
        itemId,
        institution,
        accounts,
        connectedAt: Date.now(),
        lastSynced: Date.now(),
        isActive: true
      }

      setPlaidConnections(current => [...(current ?? []), newConnection])
      
      setShowBankDialog(false)
      setLinkToken(null)
      
      toast.success(`Connected to ${institution.name}!`)
    } catch (error) {
      toast.error('Failed to complete bank connection')
      console.error(error)
    }
  }

  const handlePlaidExit = (error: any, metadata: any) => {
    if (error) {
      console.error('Plaid exit error:', error)
    }
    setShowBankDialog(false)
    setLinkToken(null)
  }

  const handleRefreshConnection = async (connection: PlaidConnection) => {
    setIsRefreshing(connection.id)
    try {
      const refreshed = await refreshConnection(connection, plaidConfig ?? DEFAULT_PLAID_CONFIG)
      setPlaidConnections(current =>
        (current ?? []).map(conn => conn.id === connection.id ? refreshed : conn)
      )
      toast.success('Account balances updated')
    } catch (error) {
      toast.error('Failed to refresh account data')
      console.error(error)
    } finally {
      setIsRefreshing(null)
    }
  }

  const handleDisconnectBank = async (connection: PlaidConnection) => {
    try {
      await removePlaidConnection(connection.itemId, plaidConfig ?? DEFAULT_PLAID_CONFIG)
      setPlaidConnections(current => (current ?? []).filter(conn => conn.id !== connection.id))
      toast.success(`Disconnected from ${connection.institution.name}`)
    } catch (error) {
      toast.error('Failed to disconnect account')
      console.error(error)
    }
  }

  const handleViewTransactions = async (connection: PlaidConnection) => {
    setSelectedConnection(connection)
    setShowTransactionsDialog(true)
    
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      
      const txns = await getTransactions(
        connection.accessToken,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        plaidConfig ?? DEFAULT_PLAID_CONFIG
      )
      setTransactions(txns)
    } catch (error) {
      toast.error('Failed to load transactions')
      console.error(error)
    }
  }

  const handleAddApiKey = () => {
    if (!selectedProvider || !apiKeyInput.trim()) {
      toast.error('Please select a provider and enter an API key')
      return
    }

    setApiKeys(current => ({
      ...(current ?? {}),
      [selectedProvider]: apiKeyInput.trim()
    }))

    toast.success(`API key for ${API_PROVIDERS.find(p => p.id === selectedProvider)?.name} saved`)
    setShowKeyDialog(false)
    setSelectedProvider('')
    setApiKeyInput('')
  }

  const handleRemoveApiKey = (provider: string) => {
    setApiKeys(current => {
      const updated = { ...(current ?? {}) }
      delete updated[provider]
      return updated
    })
    toast.success('API key removed')
  }

  const toggleKeyVisibility = (provider: string) => {
    setShowKeys(current => ({
      ...current,
      [provider]: !current[provider]
    }))
  }

  const maskApiKey = (key: string, show: boolean) => {
    if (show) return key
    if (key.length <= 8) return '•'.repeat(key.length)
    return `${key.substring(0, 4)}${'•'.repeat(key.length - 8)}${key.substring(key.length - 4)}`
  }

  const totalBalance = getTotalBalance(plaidConnections ?? [])
  const connectedProviders = Object.keys(apiKeys ?? {}).length
  const connectedBanks = (plaidConnections ?? []).length
  const totalAccounts = (plaidConnections ?? []).reduce((sum, conn) => sum + conn.accounts.length, 0)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown weight="fill" size={32} className="text-accent" />
              <div>
                <h1 className="text-2xl font-bold">CEO Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {user.name}</p>
              </div>
            </div>
            <Button variant="outline" onClick={onSignOut} className="gap-2">
              <SignOut weight="bold" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-8">
            <TabsTrigger value="overview" className="gap-2">
              <ChartBar weight="fill" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="gap-2">
              <Key weight="fill" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="banking" className="gap-2">
              <Bank weight="fill" />
              Banking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-primary/30">
                <CardHeader className="pb-3">
                  <CardDescription>API Connections</CardDescription>
                  <CardTitle className="text-3xl">{connectedProviders}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Key weight="fill" size={16} />
                    <span>Active Providers</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-accent/30">
                <CardHeader className="pb-3">
                  <CardDescription>Bank Connections</CardDescription>
                  <CardTitle className="text-3xl">{connectedBanks}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bank weight="fill" size={16} />
                    <span>{totalAccounts} Account{totalAccounts !== 1 ? 's' : ''}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-secondary/30">
                <CardHeader className="pb-3">
                  <CardDescription>Total Balance</CardDescription>
                  <CardTitle className="text-3xl">{formatPlaidBalance(totalBalance)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wallet weight="fill" size={16} />
                    <span>Across All Accounts</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightning weight="fill" className="text-primary" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => {
                    setActiveTab('api-keys')
                    setShowKeyDialog(true)
                  }}
                  variant="outline"
                  className="h-auto py-4 px-6 flex flex-col items-start gap-2"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Key weight="fill" size={20} />
                    <span className="font-semibold">Add API Key</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    Connect a new AI provider
                  </p>
                </Button>

                <Button
                  onClick={() => {
                    setActiveTab('banking')
                    setShowBankDialog(true)
                  }}
                  variant="outline"
                  className="h-auto py-4 px-6 flex flex-col items-start gap-2"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Bank weight="fill" size={20} />
                    <span className="font-semibold">Connect Bank</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    Link via Plaid integration
                  </p>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 pb-3 border-b border-border">
                    <Check weight="fill" className="text-primary mt-1" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Dashboard accessed</p>
                      <p className="text-xs text-muted-foreground">Just now</p>
                    </div>
                  </div>
                  {connectedProviders > 0 && (
                    <div className="flex items-start gap-3 pb-3 border-b border-border">
                      <Key weight="fill" className="text-primary mt-1" size={20} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{connectedProviders} API provider{connectedProviders > 1 ? 's' : ''} configured</p>
                        <p className="text-xs text-muted-foreground">Connection active</p>
                      </div>
                    </div>
                  )}
                  {connectedBanks > 0 && (
                    <div className="flex items-start gap-3">
                      <Bank weight="fill" className="text-accent mt-1" size={20} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{connectedBanks} bank connection{connectedBanks > 1 ? 's' : ''} via Plaid</p>
                        <p className="text-xs text-muted-foreground">Sync active</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">API Key Management</h2>
                <p className="text-sm text-muted-foreground">Configure and manage AI provider connections</p>
              </div>
              <Button onClick={() => setShowKeyDialog(true)} className="gap-2">
                <Plus weight="bold" />
                Add API Key
              </Button>
            </div>

            {connectedProviders === 0 ? (
              <Card className="p-12 text-center">
                <Key size={48} weight="thin" className="text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No API Keys Configured</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Add your first API key to start using AI services
                </p>
                <Button onClick={() => setShowKeyDialog(true)} className="gap-2">
                  <Plus weight="bold" />
                  Add Your First Key
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {API_PROVIDERS.map((provider) => {
                  const hasKey = !!(apiKeys ?? {})[provider.id]
                  const keyValue = (apiKeys ?? {})[provider.id] || ''
                  
                  return (
                    <Card key={provider.id} className={hasKey ? 'border-primary/30' : ''}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{provider.icon}</span>
                            <div>
                              <CardTitle className="text-lg">{provider.name}</CardTitle>
                              <CardDescription>{provider.description}</CardDescription>
                            </div>
                          </div>
                          {hasKey && (
                            <Badge variant="outline" className="gap-1">
                              <Check weight="bold" size={12} />
                              Connected
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      {hasKey && (
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <code className="flex-1 text-xs bg-muted px-3 py-2 rounded font-mono">
                                {maskApiKey(keyValue, showKeys[provider.id])}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleKeyVisibility(provider.id)}
                                className="shrink-0"
                              >
                                {showKeys[provider.id] ? (
                                  <EyeSlash weight="fill" size={18} />
                                ) : (
                                  <Eye weight="fill" size={18} />
                                )}
                              </Button>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveApiKey(provider.id)}
                              className="w-full gap-2"
                            >
                              <Trash weight="bold" />
                              Remove Key
                            </Button>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="banking" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Plaid Bank Connections</h2>
                <p className="text-sm text-muted-foreground">Secure bank account integration via Plaid</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setShowPlaidConfigDialog(true)}
                  title="Plaid Settings"
                >
                  <Gear weight="fill" />
                </Button>
                <Button onClick={() => setShowBankDialog(true)} className="gap-2 bg-accent hover:bg-accent/90">
                  <Plus weight="bold" />
                  Connect Bank
                </Button>
              </div>
            </div>

            <Card className="bg-accent/10 border-accent/30">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bank weight="fill" />
                  Plaid Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This dashboard uses Plaid for secure bank connections. Environment: <Badge variant="outline">{plaidConfig?.environment || 'sandbox'}</Badge>
                </p>
              </CardContent>
            </Card>

            {connectedBanks === 0 ? (
              <Card className="p-12 text-center">
                <Bank size={48} weight="thin" className="text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Banks Connected</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Connect your first business account via Plaid
                </p>
                <Button onClick={() => setShowBankDialog(true)} className="gap-2 bg-accent hover:bg-accent/90">
                  <Plus weight="bold" />
                  Connect via Plaid
                </Button>
              </Card>
            ) : (
              <>
                <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/30">
                  <CardHeader>
                    <CardTitle className="text-3xl">{formatPlaidBalance(totalBalance)}</CardTitle>
                    <CardDescription>Total Balance Across {totalAccounts} Account{totalAccounts !== 1 ? 's' : ''}</CardDescription>
                  </CardHeader>
                </Card>

                <div className="grid grid-cols-1 gap-4">
                  {(plaidConnections ?? []).map((connection) => (
                    <Card key={connection.id} className="border-accent/20">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center text-2xl">
                              {connection.institution.logo || '🏦'}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{connection.institution.name}</CardTitle>
                              <CardDescription className="flex items-center gap-2">
                                <span>{connection.accounts.length} account{connection.accounts.length !== 1 ? 's' : ''}</span>
                                <span>•</span>
                                <span className="text-xs">Last synced: {new Date(connection.lastSynced).toLocaleTimeString()}</span>
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant="outline" className="gap-1">
                            <Check weight="bold" size={12} />
                            Connected
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            {connection.accounts.map((account) => (
                              <div key={account.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div>
                                  <p className="text-sm font-medium">{account.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {account.subtype} • •••• {account.mask}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold">{formatPlaidBalance(account.balances.current)}</p>
                                  {account.balances.available !== null && account.balances.available !== account.balances.current && (
                                    <p className="text-xs text-muted-foreground">
                                      Available: {formatPlaidBalance(account.balances.available)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRefreshConnection(connection)}
                              disabled={isRefreshing === connection.id}
                              className="flex-1 gap-2"
                            >
                              <ArrowsClockwise weight="bold" className={isRefreshing === connection.id ? 'animate-spin' : ''} />
                              {isRefreshing === connection.id ? 'Refreshing...' : 'Refresh'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewTransactions(connection)}
                              className="flex-1 gap-2"
                            >
                              <ListBullets weight="bold" />
                              Transactions
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDisconnectBank(connection)}
                              className="gap-2"
                            >
                              <X weight="bold" />
                              Disconnect
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key weight="fill" />
              Add API Key
            </DialogTitle>
            <DialogDescription>
              Configure a new AI provider connection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {API_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex items-center gap-2">
                        <span>{provider.icon}</span>
                        <span>{provider.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="sk-..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your API key is stored securely in your browser only
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowKeyDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAddApiKey} className="flex-1 gap-2">
                <Plus weight="bold" />
                Add Key
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBankDialog} onOpenChange={setShowBankDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bank weight="fill" />
              Connect Bank via Plaid
            </DialogTitle>
            <DialogDescription>
              Securely link your business account using Plaid
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-accent/10 p-4 rounded-lg border border-accent/30">
              <div className="flex items-start gap-2">
                <Bank weight="fill" className="text-accent mt-1 shrink-0" size={20} />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Plaid Secure Connection</p>
                  <p className="text-xs text-muted-foreground">
                    Your banking credentials are encrypted and never stored on our servers. Plaid uses bank-level security to protect your information.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-center py-4">
              {isLoadingLinkToken ? (
                <div className="text-center">
                  <div className="animate-spin mb-2">
                    <ArrowsClockwise size={32} weight="bold" />
                  </div>
                  <p className="text-sm text-muted-foreground">Initializing Plaid...</p>
                </div>
              ) : linkToken ? (
                <PlaidLinkButton
                  linkToken={linkToken}
                  onSuccess={handlePlaidSuccess}
                  onExit={handlePlaidExit}
                  className="gap-2 bg-accent hover:bg-accent/90 h-12 px-8"
                >
                  <Bank weight="fill" size={20} />
                  Launch Plaid Connection
                </PlaidLinkButton>
              ) : (
                <Button
                  onClick={handleGenerateLinkToken}
                  className="gap-2 bg-accent hover:bg-accent/90 h-12 px-8"
                >
                  <Bank weight="fill" size={20} />
                  Initialize Plaid
                </Button>
              )}
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Gear weight="fill" className="text-muted-foreground mt-1 shrink-0" size={16} />
                <p className="text-xs text-muted-foreground">
                  Environment: <Badge variant="outline" className="ml-1">{plaidConfig?.environment || 'sandbox'}</Badge>
                  {plaidConfig?.environment === 'sandbox' && ' • Using demo mode for testing'}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPlaidConfigDialog} onOpenChange={setShowPlaidConfigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gear weight="fill" />
              Plaid Configuration
            </DialogTitle>
            <DialogDescription>
              Configure your Plaid integration settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <Select 
                value={plaidConfig?.environment || 'sandbox'} 
                onValueChange={(value) => setPlaidConfig(current => ({ ...(current ?? DEFAULT_PLAID_CONFIG), environment: value as any }))}
              >
                <SelectTrigger id="environment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Demo)</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Sandbox mode uses test data for development
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-id">Plaid Client ID (Optional)</Label>
              <Input
                id="client-id"
                type="text"
                placeholder="Your Plaid Client ID"
                value={plaidConfig?.clientId || ''}
                onChange={(e) => setPlaidConfig(current => ({ ...(current ?? DEFAULT_PLAID_CONFIG), clientId: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret">Plaid Secret (Optional)</Label>
              <Input
                id="secret"
                type="password"
                placeholder="Your Plaid Secret"
                value={plaidConfig?.secret || ''}
                onChange={(e) => setPlaidConfig(current => ({ ...(current ?? DEFAULT_PLAID_CONFIG), secret: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                In production, manage secrets on the server side
              </p>
            </div>

            <div className="bg-accent/10 p-4 rounded-lg border border-accent/30">
              <div className="flex items-start gap-2">
                <Warning weight="fill" className="text-accent mt-1 shrink-0" size={16} />
                <p className="text-xs text-muted-foreground">
                  For demo purposes, this uses simulated Plaid integration. In production, you'll need valid Plaid credentials from plaid.com
                </p>
              </div>
            </div>

            <Button onClick={() => setShowPlaidConfigDialog(false)} className="w-full">
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTransactionsDialog} onOpenChange={setShowTransactionsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListBullets weight="fill" />
              Recent Transactions
            </DialogTitle>
            <DialogDescription>
              {selectedConnection?.institution.name} • Last 30 days
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Loading transactions...</p>
              </div>
            ) : (
              transactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{txn.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{txn.date}</span>
                      <span>•</span>
                      <span>{txn.category.join(' > ')}</span>
                      {txn.pending && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-[10px] h-4 px-1">Pending</Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-right">
                    -{formatPlaidBalance(txn.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
