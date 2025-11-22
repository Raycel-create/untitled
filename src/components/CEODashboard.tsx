import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Wallet
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { User } from '@/lib/auth'
import type { APIKeys } from '@/lib/api-keys'
import type { BankAccount } from '@/lib/bank'
import { SUPPORTED_BANKS, createMockBankAccount, formatCurrency, formatAccountNumber } from '@/lib/bank'

interface CEODashboardProps {
  user: User
  onSignOut: () => void
}

export function CEODashboard({ user, onSignOut }: CEODashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'api-keys' | 'banking'>('overview')
  const [apiKeys, setApiKeys] = useKV<APIKeys>('ceo-api-keys', {})
  const [bankAccounts, setBankAccounts] = useKV<BankAccount[]>('ceo-bank-accounts', [])
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [showBankDialog, setShowBankDialog] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [selectedBank, setSelectedBank] = useState<string>('')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})

  const API_PROVIDERS = [
    { id: 'openai', name: 'OpenAI', description: 'GPT-4, DALL-E', icon: '🤖' },
    { id: 'anthropic', name: 'Anthropic', description: 'Claude AI', icon: '🧠' },
    { id: 'stability', name: 'Stability AI', description: 'Stable Diffusion', icon: '🎨' },
    { id: 'replicate', name: 'Replicate', description: 'Various Models', icon: '🔄' },
    { id: 'runway', name: 'RunwayML', description: 'Video Generation', icon: '🎬' },
    { id: 'elevenlabs', name: 'ElevenLabs', description: 'Voice AI', icon: '🎤' },
  ]

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

  const handleConnectBank = () => {
    if (!selectedBank) {
      toast.error('Please select a bank')
      return
    }

    const newAccount = createMockBankAccount(selectedBank)
    setBankAccounts(current => [...(current ?? []), newAccount])
    
    toast.success(`Connected to ${SUPPORTED_BANKS.find(b => b.id === selectedBank)?.name}`)
    setShowBankDialog(false)
    setSelectedBank('')
  }

  const handleDisconnectBank = (accountId: string) => {
    setBankAccounts(current => (current ?? []).filter(acc => acc.id !== accountId))
    toast.success('Bank account disconnected')
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

  const totalBalance = (bankAccounts ?? []).reduce((sum, acc) => sum + acc.balance, 0)
  const connectedProviders = Object.keys(apiKeys ?? {}).length
  const connectedBanks = (bankAccounts ?? []).length

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
                  <CardDescription>Connected Banks</CardDescription>
                  <CardTitle className="text-3xl">{connectedBanks}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bank weight="fill" size={16} />
                    <span>Active Accounts</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-secondary/30">
                <CardHeader className="pb-3">
                  <CardDescription>Total Balance</CardDescription>
                  <CardTitle className="text-3xl">{formatCurrency(totalBalance)}</CardTitle>
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
                    Link a business account
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
                        <p className="text-sm font-medium">{connectedBanks} bank account{connectedBanks > 1 ? 's' : ''} connected</p>
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
                <h2 className="text-2xl font-bold">Bank Connections</h2>
                <p className="text-sm text-muted-foreground">Manage your connected business accounts</p>
              </div>
              <Button onClick={() => setShowBankDialog(true)} className="gap-2 bg-accent hover:bg-accent/90">
                <Plus weight="bold" />
                Connect Bank
              </Button>
            </div>

            {connectedBanks === 0 ? (
              <Card className="p-12 text-center">
                <Bank size={48} weight="thin" className="text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Banks Connected</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Connect your first business account to get started
                </p>
                <Button onClick={() => setShowBankDialog(true)} className="gap-2 bg-accent hover:bg-accent/90">
                  <Plus weight="bold" />
                  Connect Your First Bank
                </Button>
              </Card>
            ) : (
              <>
                <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/30">
                  <CardHeader>
                    <CardTitle className="text-3xl">{formatCurrency(totalBalance)}</CardTitle>
                    <CardDescription>Total Balance Across All Accounts</CardDescription>
                  </CardHeader>
                </Card>

                <div className="grid grid-cols-1 gap-4">
                  {(bankAccounts ?? []).map((account) => (
                    <Card key={account.id} className="border-accent/20">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center text-2xl">
                              {SUPPORTED_BANKS.find(b => b.name === account.bankName)?.logo || '🏦'}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{account.bankName}</CardTitle>
                              <CardDescription className="flex items-center gap-2">
                                <span className="capitalize">{account.accountType}</span>
                                <span>•</span>
                                <span>{formatAccountNumber(account.accountNumber)}</span>
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
                          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div>
                              <p className="text-sm text-muted-foreground">Available Balance</p>
                              <p className="text-2xl font-bold">{formatCurrency(account.balance)}</p>
                            </div>
                            <Wallet weight="fill" size={32} className="text-accent" />
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Last synced: {new Date(account.lastSynced!).toLocaleString()}</span>
                            <span>Connected: {new Date(account.connectedAt!).toLocaleDateString()}</span>
                          </div>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDisconnectBank(account.id)}
                            className="w-full gap-2"
                          >
                            <X weight="bold" />
                            Disconnect Account
                          </Button>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bank weight="fill" />
              Connect Bank Account
            </DialogTitle>
            <DialogDescription>
              Link a business account for financial management
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bank">Bank</Label>
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger id="bank">
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_BANKS.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      <div className="flex items-center gap-2">
                        <span>{bank.logo}</span>
                        <span>{bank.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Gear weight="fill" className="text-primary mt-1 shrink-0" size={16} />
                <p className="text-xs text-muted-foreground">
                  This is a demo connection. In production, this would open a secure Plaid or similar integration flow.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowBankDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleConnectBank} className="flex-1 gap-2 bg-accent hover:bg-accent/90">
                <Plus weight="bold" />
                Connect
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
