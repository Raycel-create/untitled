import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Lock, Eye, EyeSlash, ShieldCheck, Warning, Check, Plugs, Link, ShoppingCart, CreditCard, Lightning, Wallet, Bank } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { initializeAdminCredentials, updateAdminCredentials, type StoredAdminCredentials } from '@/lib/admin-auth'
import { setStripeAPIEndpoint } from '@/lib/stripe-api'
import { StripePriceSetup } from '@/components/StripePriceSetup'
import { StripePricingTest } from '@/components/StripePricingTest'
import { StripePricingQuickStart } from '@/components/StripePricingQuickStart'
import { getStoredStripeConfig, saveStripeConfig, type StripeConfig } from '@/lib/stripe'
import { needsPublishableKey, STRIPE_LIVE_CONFIG } from '@/lib/stripe-config-init'
import { 
  getPaymentGatewayConfig, 
  savePaymentGatewayConfig, 
  testStripeConnection,
  testPayPalConnection,
  testSquareConnection,
  testPlaidConnection,
  testAuthorizeNetConnection,
  testBraintreeConnection,
  getActiveGateways,
  type PaymentGatewayConfig,
  type StripeGatewayConfig,
  type PayPalGatewayConfig,
  type SquareGatewayConfig,
  type PlaidGatewayConfig,
  type AuthorizeNetConfig,
  type BraintreeConfig
} from '@/lib/payment-gateways'

interface AdminSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminSettings({ open, onOpenChange }: AdminSettingsProps) {
  const [storedCredentials, setStoredCredentials] = useKV<StoredAdminCredentials>(
    'admin-credentials',
    initializeAdminCredentials()
  )

  const [currentPassword, setCurrentPassword] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  const [apiEndpoint, setApiEndpoint] = useState('')
  const [isTestingEndpoint, setIsTestingEndpoint] = useState(false)
  const [endpointStatus, setEndpointStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [activeTab, setActiveTab] = useState('credentials')
  
  const [stripePublishableKey, setStripePublishableKey] = useState('')
  const [stripeSecretKey, setStripeSecretKey] = useState('')
  const [showStripePublishable, setShowStripePublishable] = useState(false)
  const [showStripeSecret, setShowStripeSecret] = useState(false)
  const [isSavingStripe, setIsSavingStripe] = useState(false)
  
  const [paymentGateways, setPaymentGateways] = useState<PaymentGatewayConfig>({})
  const [isSavingGateways, setIsSavingGateways] = useState(false)
  const [testingGateway, setTestingGateway] = useState<string | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  
  const stripeConfig = getStoredStripeConfig()
  const needsPublishableKeySetup = needsPublishableKey()
  const hasStripeConfigured = !!stripeConfig?.publishableKey

  const currentCredentials = storedCredentials || initializeAdminCredentials()

  useEffect(() => {
    async function loadApiEndpoint() {
      const endpoint = await window.spark.kv.get<string>('stripe-api-endpoint')
      if (endpoint) {
        setApiEndpoint(endpoint)
      }
    }
    loadApiEndpoint()
    
    const config = getStoredStripeConfig()
    if (config) {
      setStripePublishableKey(config.publishableKey || '')
      setStripeSecretKey(config.secretKey || STRIPE_LIVE_CONFIG.secretKey || '')
    } else {
      setStripeSecretKey(STRIPE_LIVE_CONFIG.secretKey || '')
    }
    
    async function loadPaymentGateways() {
      const gateways = await getPaymentGatewayConfig()
      setPaymentGateways(gateways)
    }
    loadPaymentGateways()
  }, [])

  const resetForm = () => {
    setCurrentPassword('')
    setNewUsername('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setEndpointStatus('idle')
  }

  const handleTestEndpoint = async () => {
    if (!apiEndpoint) {
      toast.error('Please enter an API endpoint')
      return
    }

    setIsTestingEndpoint(true)
    setEndpointStatus('idle')

    try {
      const response = await fetch(`${apiEndpoint}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        setEndpointStatus('success')
        toast.success('API endpoint is reachable')
      } else {
        throw new Error('Endpoint returned error')
      }
    } catch (error) {
      setEndpointStatus('error')
      toast.error('Failed to connect to API endpoint', {
        description: 'Check the URL and try again'
      })
    } finally {
      setIsTestingEndpoint(false)
    }
  }

  const handleSaveApiEndpoint = async () => {
    if (!apiEndpoint) {
      toast.error('Please enter an API endpoint')
      return
    }

    try {
      await setStripeAPIEndpoint(apiEndpoint)
      toast.success('API endpoint saved successfully', {
        description: 'Real payment processing is now enabled'
      })
    } catch (error) {
      toast.error('Failed to save API endpoint')
    }
  }

  const handleClearApiEndpoint = async () => {
    setApiEndpoint('')
    await window.spark.kv.delete('stripe-api-endpoint')
    setEndpointStatus('idle')
    toast.success('API endpoint cleared', {
      description: 'Back to demo mode'
    })
  }

  const handleSaveStripeKeys = async () => {
    if (!stripePublishableKey || !stripePublishableKey.startsWith('pk_')) {
      toast.error('Invalid publishable key', {
        description: 'Publishable key must start with pk_'
      })
      return
    }

    if (!stripeSecretKey || !stripeSecretKey.startsWith('sk_')) {
      toast.error('Invalid secret key', {
        description: 'Secret key must start with sk_'
      })
      return
    }

    setIsSavingStripe(true)

    try {
      const config: StripeConfig = {
        publishableKey: stripePublishableKey,
        secretKey: stripeSecretKey
      }

      saveStripeConfig(config)

      toast.success('Stripe keys saved successfully', {
        description: 'You can now accept payments'
      })
    } catch (error) {
      toast.error('Failed to save Stripe keys')
      console.error(error)
    } finally {
      setIsSavingStripe(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const validateInputs = (): { valid: boolean; error?: string } => {
    if (!currentPassword) {
      return { valid: false, error: 'Current password is required' }
    }

    if (currentPassword !== currentCredentials.password) {
      return { valid: false, error: 'Current password is incorrect' }
    }

    if (!newUsername || !newPassword) {
      return { valid: false, error: 'New username and password are required' }
    }

    if (newUsername.length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters' }
    }

    if (newPassword.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' }
    }

    if (newPassword !== confirmPassword) {
      return { valid: false, error: 'Passwords do not match' }
    }

    if (newUsername === currentCredentials.username && newPassword === currentCredentials.password) {
      return { valid: false, error: 'New credentials must be different from current credentials' }
    }

    return { valid: true }
  }

  const handleUpdateCredentials = async () => {
    const validation = validateInputs()
    
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    setIsVerifying(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      const updated = updateAdminCredentials(newUsername, newPassword)
      setStoredCredentials(updated)

      toast.success('Admin credentials updated successfully', {
        description: 'Please use the new credentials for future CEO Dashboard access'
      })

      resetForm()
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to update credentials')
      console.error(error)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResetToDefault = () => {
    if (!currentPassword) {
      toast.error('Enter current password to reset')
      return
    }

    if (currentPassword !== currentCredentials.password) {
      toast.error('Current password is incorrect')
      return
    }

    const defaultCredentials = initializeAdminCredentials()
    setStoredCredentials(defaultCredentials)
    
    toast.success('Credentials reset to default', {
      description: 'Username: adminadmin'
    })

    resetForm()
  }

  const isUsingDefaultCredentials = 
    currentCredentials.username === 'adminadmin' && 
    currentCredentials.password === '19780111'

  const handleTestGateway = async (gatewayType: string) => {
    setTestingGateway(gatewayType)
    
    try {
      let success = false
      
      switch (gatewayType) {
        case 'stripe':
          if (paymentGateways.stripe) {
            success = await testStripeConnection(paymentGateways.stripe)
          }
          break
        case 'paypal':
          if (paymentGateways.paypal) {
            success = await testPayPalConnection(paymentGateways.paypal)
          }
          break
        case 'square':
          if (paymentGateways.square) {
            success = await testSquareConnection(paymentGateways.square)
          }
          break
        case 'plaid':
          if (paymentGateways.plaid) {
            success = await testPlaidConnection(paymentGateways.plaid)
          }
          break
        case 'authorize':
          if (paymentGateways.authorize) {
            success = await testAuthorizeNetConnection(paymentGateways.authorize)
          }
          break
        case 'braintree':
          if (paymentGateways.braintree) {
            success = await testBraintreeConnection(paymentGateways.braintree)
          }
          break
      }
      
      if (success) {
        setPaymentGateways(prev => ({
          ...prev,
          [gatewayType]: {
            ...prev[gatewayType as keyof PaymentGatewayConfig],
            status: 'active',
            lastTested: Date.now()
          }
        }))
        toast.success(`${gatewayType.charAt(0).toUpperCase() + gatewayType.slice(1)} connection successful`)
      } else {
        setPaymentGateways(prev => ({
          ...prev,
          [gatewayType]: {
            ...prev[gatewayType as keyof PaymentGatewayConfig],
            status: 'error',
            lastTested: Date.now()
          }
        }))
        toast.error(`${gatewayType.charAt(0).toUpperCase() + gatewayType.slice(1)} connection failed`)
      }
    } catch (error) {
      toast.error('Connection test failed')
    } finally {
      setTestingGateway(null)
    }
  }

  const handleSaveGateways = async () => {
    setIsSavingGateways(true)
    
    try {
      await savePaymentGatewayConfig(paymentGateways)
      toast.success('Payment gateway settings saved', {
        description: `${getActiveGateways(paymentGateways).length} gateways configured`
      })
    } catch (error) {
      toast.error('Failed to save payment gateway settings')
    } finally {
      setIsSavingGateways(false)
    }
  }

  const toggleShowSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck weight="fill" className="text-primary" />
            Admin Settings
          </DialogTitle>
          <DialogDescription>
            Configure system settings and credentials
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="quickstart" className="gap-2">
              <Lightning size={16} />
              Quick Start
            </TabsTrigger>
            <TabsTrigger value="stripe" className="gap-2 relative">
              <CreditCard size={16} />
              Stripe Setup
              {(needsPublishableKeySetup || !hasStripeConfigured) && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="gateways" className="gap-2">
              <Wallet size={16} />
              Gateways
            </TabsTrigger>
            <TabsTrigger value="credentials" className="gap-2">
              <Lock size={16} />
              Credentials
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2">
              <ShoppingCart size={16} />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="test" className="gap-2">
              <ShieldCheck size={16} />
              Test
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Plugs size={16} />
              API
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quickstart" className="space-y-6 py-4">
            <StripePricingQuickStart
              onOpenStripeConfig={() => setActiveTab('stripe')}
              onOpenPricing={() => setActiveTab('pricing')}
              onOpenTesting={() => setActiveTab('test')}
            />
          </TabsContent>

          <TabsContent value="stripe" className="space-y-6 py-4">
            {needsPublishableKeySetup && (
              <Alert className="border-accent bg-accent/10">
                <Lightning weight="fill" className="h-4 w-4 text-accent" />
                <AlertDescription className="text-sm">
                  Your Stripe secret key is configured! Add your publishable key to start accepting payments.
                </AlertDescription>
              </Alert>
            )}
            
            {!hasStripeConfigured && !needsPublishableKeySetup && (
              <Alert className="border-primary bg-primary/10">
                <Lightning weight="fill" className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  Complete your Stripe setup to enable Pro subscriptions and payment processing.
                </AlertDescription>
              </Alert>
            )}

            <Card className="p-4 bg-muted/50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Stripe Status</Label>
                  <Badge variant={hasStripeConfigured ? "default" : "secondary"} className="gap-1">
                    {hasStripeConfigured ? (
                      <>
                        <Check weight="bold" size={12} />
                        Configured
                      </>
                    ) : needsPublishableKeySetup ? (
                      <>
                        <Warning weight="fill" size={12} />
                        Needs Publishable Key
                      </>
                    ) : (
                      <>
                        <Warning weight="fill" size={12} />
                        Not Configured
                      </>
                    )}
                  </Badge>
                </div>
                {stripeConfig?.publishableKey && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Publishable Key</Label>
                    <span className="text-xs text-muted-foreground font-mono">
                      {stripeConfig.publishableKey.substring(0, 15)}...
                    </span>
                  </div>
                )}
                {stripeConfig?.secretKey && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Secret Key</Label>
                    <span className="text-xs text-muted-foreground font-mono">
                      {stripeConfig.secretKey.substring(0, 15)}...
                    </span>
                  </div>
                )}
              </div>
            </Card>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stripe-secret-key">
                  Stripe Secret Key <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="stripe-secret-key"
                    type={showStripeSecret ? 'text' : 'password'}
                    value={stripeSecretKey}
                    onChange={(e) => setStripeSecretKey(e.target.value)}
                    placeholder="sk_live_... or sk_test_..."
                    className="pr-10 font-mono text-sm"
                    disabled={isSavingStripe}
                  />
                  <button
                    type="button"
                    onClick={() => setShowStripeSecret(!showStripeSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showStripeSecret ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get this from your Stripe Dashboard → Developers → API Keys
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stripe-publishable-key">
                  Stripe Publishable Key <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="stripe-publishable-key"
                    type={showStripePublishable ? 'text' : 'password'}
                    value={stripePublishableKey}
                    onChange={(e) => setStripePublishableKey(e.target.value)}
                    placeholder="pk_live_... or pk_test_..."
                    className="pr-10 font-mono text-sm"
                    disabled={isSavingStripe}
                  />
                  <button
                    type="button"
                    onClick={() => setShowStripePublishable(!showStripePublishable)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showStripePublishable ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get this from your Stripe Dashboard → Developers → API Keys
                </p>
              </div>

              <Button
                onClick={handleSaveStripeKeys}
                disabled={isSavingStripe || !stripePublishableKey || !stripeSecretKey}
                className="w-full gap-2"
                size="lg"
              >
                {isSavingStripe ? (
                  <>
                    <div className="animate-spin">⟳</div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check weight="bold" />
                    Save Stripe Keys
                  </>
                )}
              </Button>
            </div>

            <Card className="p-4 bg-blue-500/10 border-blue-500/20">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Lightning weight="bold" size={16} className="text-blue-600" />
                  What You Need
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>Stripe Secret Key (sk_live_... or sk_test_...)</li>
                  <li>Stripe Publishable Key (pk_live_... or pk_test_...)</li>
                  <li>Create pricing plans in your Stripe Dashboard</li>
                  <li>Configure webhook endpoint for subscription updates</li>
                </ul>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="gateways" className="space-y-6 py-4">
            <Alert>
              <Wallet weight="fill" className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Configure multiple payment gateways to accept payments through different providers. All credentials are stored securely.
              </AlertDescription>
            </Alert>

            <Card className="p-4 bg-muted/50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Active Gateways</Label>
                  <Badge variant="default" className="gap-1">
                    {getActiveGateways(paymentGateways).length} Configured
                  </Badge>
                </div>
                {getActiveGateways(paymentGateways).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {getActiveGateways(paymentGateways).map(gateway => (
                      <Badge key={gateway} variant="outline" className="gap-1">
                        <Check weight="bold" size={12} />
                        {gateway}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="p-6 border-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <CreditCard weight="fill" size={24} className="text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Stripe</h4>
                        <p className="text-xs text-muted-foreground">Credit cards, ACH, and more</p>
                      </div>
                    </div>
                    <Switch
                      checked={paymentGateways.stripe?.enabled || false}
                      onCheckedChange={(checked) => {
                        setPaymentGateways(prev => ({
                          ...prev,
                          stripe: {
                            ...prev.stripe,
                            enabled: checked,
                            publishableKey: prev.stripe?.publishableKey || '',
                            secretKey: prev.stripe?.secretKey || '',
                            environment: prev.stripe?.environment || 'test',
                            status: prev.stripe?.status || 'inactive'
                          } as StripeGatewayConfig
                        }))
                      }}
                    />
                  </div>
                  
                  {paymentGateways.stripe?.enabled && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Environment</Label>
                          <Select
                            value={paymentGateways.stripe.environment}
                            onValueChange={(value: 'test' | 'live') => {
                              setPaymentGateways(prev => ({
                                ...prev,
                                stripe: { ...prev.stripe!, environment: value }
                              }))
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="test">Test</SelectItem>
                              <SelectItem value="live">Live</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Status</Label>
                          <Badge variant={paymentGateways.stripe.status === 'active' ? 'default' : 'secondary'} className="w-full justify-center">
                            {paymentGateways.stripe.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Publishable Key</Label>
                        <div className="relative">
                          <Input
                            type={showSecrets['stripe-pub'] ? 'text' : 'password'}
                            value={paymentGateways.stripe.publishableKey}
                            onChange={(e) => {
                              setPaymentGateways(prev => ({
                                ...prev,
                                stripe: { ...prev.stripe!, publishableKey: e.target.value }
                              }))
                            }}
                            placeholder="pk_test_..."
                            className="pr-10 font-mono text-xs h-9"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowSecret('stripe-pub')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showSecrets['stripe-pub'] ? <EyeSlash size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Secret Key</Label>
                        <div className="relative">
                          <Input
                            type={showSecrets['stripe-sec'] ? 'text' : 'password'}
                            value={paymentGateways.stripe.secretKey}
                            onChange={(e) => {
                              setPaymentGateways(prev => ({
                                ...prev,
                                stripe: { ...prev.stripe!, secretKey: e.target.value }
                              }))
                            }}
                            placeholder="sk_test_..."
                            className="pr-10 font-mono text-xs h-9"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowSecret('stripe-sec')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showSecrets['stripe-sec'] ? <EyeSlash size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Webhook Secret (Optional)</Label>
                        <div className="relative">
                          <Input
                            type={showSecrets['stripe-webhook'] ? 'text' : 'password'}
                            value={paymentGateways.stripe.webhookSecret || ''}
                            onChange={(e) => {
                              setPaymentGateways(prev => ({
                                ...prev,
                                stripe: { ...prev.stripe!, webhookSecret: e.target.value }
                              }))
                            }}
                            placeholder="whsec_..."
                            className="pr-10 font-mono text-xs h-9"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowSecret('stripe-webhook')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showSecrets['stripe-webhook'] ? <EyeSlash size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestGateway('stripe')}
                        disabled={testingGateway === 'stripe'}
                        className="w-full"
                      >
                        {testingGateway === 'stripe' ? 'Testing...' : 'Test Connection'}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Wallet weight="fill" size={24} className="text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">PayPal</h4>
                        <p className="text-xs text-muted-foreground">PayPal checkout and subscriptions</p>
                      </div>
                    </div>
                    <Switch
                      checked={paymentGateways.paypal?.enabled || false}
                      onCheckedChange={(checked) => {
                        setPaymentGateways(prev => ({
                          ...prev,
                          paypal: {
                            ...prev.paypal,
                            enabled: checked,
                            clientId: prev.paypal?.clientId || '',
                            clientSecret: prev.paypal?.clientSecret || '',
                            environment: prev.paypal?.environment || 'sandbox',
                            status: prev.paypal?.status || 'inactive'
                          } as PayPalGatewayConfig
                        }))
                      }}
                    />
                  </div>
                  
                  {paymentGateways.paypal?.enabled && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Environment</Label>
                          <Select
                            value={paymentGateways.paypal.environment}
                            onValueChange={(value: 'sandbox' | 'live') => {
                              setPaymentGateways(prev => ({
                                ...prev,
                                paypal: { ...prev.paypal!, environment: value }
                              }))
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sandbox">Sandbox</SelectItem>
                              <SelectItem value="live">Live</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Status</Label>
                          <Badge variant={paymentGateways.paypal.status === 'active' ? 'default' : 'secondary'} className="w-full justify-center">
                            {paymentGateways.paypal.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Client ID</Label>
                        <div className="relative">
                          <Input
                            type={showSecrets['paypal-client'] ? 'text' : 'password'}
                            value={paymentGateways.paypal.clientId}
                            onChange={(e) => {
                              setPaymentGateways(prev => ({
                                ...prev,
                                paypal: { ...prev.paypal!, clientId: e.target.value }
                              }))
                            }}
                            placeholder="Enter PayPal Client ID"
                            className="pr-10 font-mono text-xs h-9"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowSecret('paypal-client')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showSecrets['paypal-client'] ? <EyeSlash size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Client Secret</Label>
                        <div className="relative">
                          <Input
                            type={showSecrets['paypal-secret'] ? 'text' : 'password'}
                            value={paymentGateways.paypal.clientSecret}
                            onChange={(e) => {
                              setPaymentGateways(prev => ({
                                ...prev,
                                paypal: { ...prev.paypal!, clientSecret: e.target.value }
                              }))
                            }}
                            placeholder="Enter PayPal Client Secret"
                            className="pr-10 font-mono text-xs h-9"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowSecret('paypal-secret')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showSecrets['paypal-secret'] ? <EyeSlash size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestGateway('paypal')}
                        disabled={testingGateway === 'paypal'}
                        className="w-full"
                      >
                        {testingGateway === 'paypal' ? 'Testing...' : 'Test Connection'}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <CreditCard weight="fill" size={24} className="text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Square</h4>
                        <p className="text-xs text-muted-foreground">Square payments and POS</p>
                      </div>
                    </div>
                    <Switch
                      checked={paymentGateways.square?.enabled || false}
                      onCheckedChange={(checked) => {
                        setPaymentGateways(prev => ({
                          ...prev,
                          square: {
                            ...prev.square,
                            enabled: checked,
                            applicationId: prev.square?.applicationId || '',
                            accessToken: prev.square?.accessToken || '',
                            environment: prev.square?.environment || 'sandbox',
                            status: prev.square?.status || 'inactive'
                          } as SquareGatewayConfig
                        }))
                      }}
                    />
                  </div>
                  
                  {paymentGateways.square?.enabled && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Environment</Label>
                          <Select
                            value={paymentGateways.square.environment}
                            onValueChange={(value: 'sandbox' | 'production') => {
                              setPaymentGateways(prev => ({
                                ...prev,
                                square: { ...prev.square!, environment: value }
                              }))
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sandbox">Sandbox</SelectItem>
                              <SelectItem value="production">Production</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Status</Label>
                          <Badge variant={paymentGateways.square.status === 'active' ? 'default' : 'secondary'} className="w-full justify-center">
                            {paymentGateways.square.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Application ID</Label>
                        <Input
                          value={paymentGateways.square.applicationId}
                          onChange={(e) => {
                            setPaymentGateways(prev => ({
                              ...prev,
                              square: { ...prev.square!, applicationId: e.target.value }
                            }))
                          }}
                          placeholder="Enter Square Application ID"
                          className="font-mono text-xs h-9"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Access Token</Label>
                        <div className="relative">
                          <Input
                            type={showSecrets['square-token'] ? 'text' : 'password'}
                            value={paymentGateways.square.accessToken}
                            onChange={(e) => {
                              setPaymentGateways(prev => ({
                                ...prev,
                                square: { ...prev.square!, accessToken: e.target.value }
                              }))
                            }}
                            placeholder="Enter Square Access Token"
                            className="pr-10 font-mono text-xs h-9"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowSecret('square-token')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showSecrets['square-token'] ? <EyeSlash size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestGateway('square')}
                        disabled={testingGateway === 'square'}
                        className="w-full"
                      >
                        {testingGateway === 'square' ? 'Testing...' : 'Test Connection'}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Bank weight="fill" size={24} className="text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Plaid</h4>
                        <p className="text-xs text-muted-foreground">Bank account connections</p>
                      </div>
                    </div>
                    <Switch
                      checked={paymentGateways.plaid?.enabled || false}
                      onCheckedChange={(checked) => {
                        setPaymentGateways(prev => ({
                          ...prev,
                          plaid: {
                            ...prev.plaid,
                            enabled: checked,
                            clientId: prev.plaid?.clientId || '',
                            secret: prev.plaid?.secret || '',
                            environment: prev.plaid?.environment || 'sandbox',
                            status: prev.plaid?.status || 'inactive'
                          } as PlaidGatewayConfig
                        }))
                      }}
                    />
                  </div>
                  
                  {paymentGateways.plaid?.enabled && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Environment</Label>
                          <Select
                            value={paymentGateways.plaid.environment}
                            onValueChange={(value: 'sandbox' | 'development' | 'production') => {
                              setPaymentGateways(prev => ({
                                ...prev,
                                plaid: { ...prev.plaid!, environment: value }
                              }))
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sandbox">Sandbox</SelectItem>
                              <SelectItem value="development">Development</SelectItem>
                              <SelectItem value="production">Production</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Status</Label>
                          <Badge variant={paymentGateways.plaid.status === 'active' ? 'default' : 'secondary'} className="w-full justify-center">
                            {paymentGateways.plaid.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Client ID</Label>
                        <Input
                          value={paymentGateways.plaid.clientId}
                          onChange={(e) => {
                            setPaymentGateways(prev => ({
                              ...prev,
                              plaid: { ...prev.plaid!, clientId: e.target.value }
                            }))
                          }}
                          placeholder="Enter Plaid Client ID"
                          className="font-mono text-xs h-9"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Secret</Label>
                        <div className="relative">
                          <Input
                            type={showSecrets['plaid-secret'] ? 'text' : 'password'}
                            value={paymentGateways.plaid.secret}
                            onChange={(e) => {
                              setPaymentGateways(prev => ({
                                ...prev,
                                plaid: { ...prev.plaid!, secret: e.target.value }
                              }))
                            }}
                            placeholder="Enter Plaid Secret"
                            className="pr-10 font-mono text-xs h-9"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowSecret('plaid-secret')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showSecrets['plaid-secret'] ? <EyeSlash size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestGateway('plaid')}
                        disabled={testingGateway === 'plaid'}
                        className="w-full"
                      >
                        {testingGateway === 'plaid' ? 'Testing...' : 'Test Connection'}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setPaymentGateways({})}
                  className="flex-1"
                >
                  Reset All
                </Button>
                <Button
                  onClick={handleSaveGateways}
                  disabled={isSavingGateways}
                  className="flex-1 gap-2"
                >
                  {isSavingGateways ? (
                    <>
                      <div className="animate-spin">⟳</div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check weight="bold" />
                      Save Gateways
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="credentials" className="space-y-6 py-4">
            {isUsingDefaultCredentials && (
              <Alert className="border-accent bg-accent/10">
                <Warning weight="fill" className="h-4 w-4 text-accent" />
                <AlertDescription className="text-sm">
                  You are using default credentials. For security, please update to custom credentials.
                </AlertDescription>
              </Alert>
            )}

            <Card className="p-4 bg-muted/50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Current Username</Label>
                  <Badge variant="outline" className="font-mono text-xs">
                    {currentCredentials.username}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <span className="text-xs text-muted-foreground">
                    {currentCredentials.updatedAt 
                      ? new Date(currentCredentials.updatedAt).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Security Status</Label>
                  <Badge 
                    variant={isUsingDefaultCredentials ? "destructive" : "default"}
                    className="gap-1"
                  >
                    {isUsingDefaultCredentials ? (
                      <>
                        <Warning weight="fill" size={12} />
                        Default
                      </>
                    ) : (
                      <>
                        <Check weight="bold" size={12} />
                        Custom
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">
                  Current Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="pr-10"
                    disabled={isVerifying}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="space-y-2">
                <Label htmlFor="new-username">
                  New Username <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="new-username"
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter new username (min 3 characters)"
                  disabled={isVerifying}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">
                  New Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                    className="pr-10"
                    disabled={isVerifying}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  Confirm New Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pr-10"
                    disabled={isVerifying}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <Alert>
              <Lock weight="fill" className="h-4 w-4" />
              <AlertDescription className="text-sm">
                MFA will remain enabled. You'll need to verify with a 6-digit code after login.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleResetToDefault}
                disabled={isVerifying || !currentPassword || isUsingDefaultCredentials}
                className="flex-1"
              >
                Reset to Default
              </Button>
              <Button
                onClick={handleUpdateCredentials}
                disabled={isVerifying}
                className="flex-1 gap-2"
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin">⟳</div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Check weight="bold" />
                    Update Credentials
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6 py-4">
            <StripePriceSetup />
          </TabsContent>

          <TabsContent value="test" className="space-y-6 py-4">
            <StripePricingTest />
          </TabsContent>

          <TabsContent value="api" className="space-y-6 py-4">
            <Alert>
              <Plugs weight="fill" className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Configure your server-side API endpoint for real Stripe payment processing. See STRIPE_SERVER_SETUP.md for implementation guide.
              </AlertDescription>
            </Alert>

            <Card className="p-4 bg-muted/50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Current Status</Label>
                  <Badge variant={apiEndpoint ? "default" : "secondary"} className="gap-1">
                    {apiEndpoint ? (
                      <>
                        <Check weight="bold" size={12} />
                        API Configured
                      </>
                    ) : (
                      <>
                        <Warning weight="fill" size={12} />
                        Demo Mode
                      </>
                    )}
                  </Badge>
                </div>
                {apiEndpoint && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Endpoint URL</Label>
                    <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                      {apiEndpoint}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-endpoint">
                  API Endpoint URL
                </Label>
                <div className="relative">
                  <Input
                    id="api-endpoint"
                    type="url"
                    value={apiEndpoint}
                    onChange={(e) => {
                      setApiEndpoint(e.target.value)
                      setEndpointStatus('idle')
                    }}
                    placeholder="https://your-api.com/api"
                    className="pl-9"
                  />
                  <Link 
                    weight="bold" 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
                    size={16} 
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the base URL of your payment processing server
                </p>
              </div>

              {endpointStatus !== 'idle' && (
                <Alert variant={endpointStatus === 'success' ? 'default' : 'destructive'}>
                  {endpointStatus === 'success' ? (
                    <>
                      <Check weight="bold" className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        API endpoint is reachable and responding
                      </AlertDescription>
                    </>
                  ) : (
                    <>
                      <Warning weight="fill" className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Unable to connect to API endpoint. Check the URL and server status.
                      </AlertDescription>
                    </>
                  )}
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleTestEndpoint}
                  disabled={!apiEndpoint || isTestingEndpoint}
                  className="flex-1 gap-2"
                >
                  {isTestingEndpoint ? (
                    <>
                      <div className="animate-spin">⟳</div>
                      Testing...
                    </>
                  ) : (
                    <>
                      <Plugs weight="bold" />
                      Test Connection
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSaveApiEndpoint}
                  disabled={!apiEndpoint}
                  className="flex-1 gap-2"
                >
                  <Check weight="bold" />
                  Save Endpoint
                </Button>
              </div>

              {apiEndpoint && (
                <Button
                  variant="outline"
                  onClick={handleClearApiEndpoint}
                  className="w-full"
                >
                  Clear & Use Demo Mode
                </Button>
              )}
            </div>

            <Card className="p-4 bg-blue-500/10 border-blue-500/20">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Link weight="bold" size={16} className="text-blue-600" />
                  Server Setup Required
                </h4>
                <p className="text-xs text-muted-foreground">
                  To process real payments, you need to set up a backend server. See <span className="font-mono text-blue-600">STRIPE_SERVER_SETUP.md</span> for complete implementation guide including:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>Node.js/Express server setup</li>
                  <li>Stripe checkout session creation</li>
                  <li>Webhook event handling</li>
                  <li>Database integration</li>
                  <li>Security best practices</li>
                </ul>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
