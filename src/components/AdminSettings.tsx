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
import { Lock, Eye, EyeSlash, ShieldCheck, Warning, Check, Plugs, Link, ShoppingCart } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { initializeAdminCredentials, updateAdminCredentials, type StoredAdminCredentials } from '@/lib/admin-auth'
import { setStripeAPIEndpoint } from '@/lib/stripe-api'
import { StripePriceSetup } from '@/components/StripePriceSetup'
import { StripePricingTest } from '@/components/StripePricingTest'
import { StripePricingQuickStart } from '@/components/StripePricingQuickStart'

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

  const currentCredentials = storedCredentials || initializeAdminCredentials()

  useEffect(() => {
    async function loadApiEndpoint() {
      const endpoint = await window.spark.kv.get<string>('stripe-api-endpoint')
      if (endpoint) {
        setApiEndpoint(endpoint)
      }
    }
    loadApiEndpoint()
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

        <Tabs defaultValue="credentials" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
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
