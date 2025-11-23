import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { CreditCard, Eye, EyeSlash, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { saveStripeConfig, clearStripeConfig, getStoredStripeConfig } from '@/lib/stripe'

interface StripeConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfigured: () => void
}

export function StripeConfigDialog({ open, onOpenChange, onConfigured }: StripeConfigDialogProps) {
  const [publishableKey, setPublishableKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  
  const existingConfig = getStoredStripeConfig()
  const hasSecretKey = existingConfig?.secretKey && existingConfig.secretKey.length > 0

  const handleSave = () => {
    if (!publishableKey.trim()) {
      toast.error('Please enter your Stripe publishable key')
      return
    }

    if (!publishableKey.startsWith('pk_')) {
      toast.error('Invalid Stripe key format. It should start with pk_')
      return
    }

    saveStripeConfig({ 
      publishableKey: publishableKey.trim(),
      webhookSecret: webhookSecret.trim() || undefined
    })
    toast.success('Stripe configuration saved!')
    onConfigured()
    onOpenChange(false)
    setPublishableKey('')
    setWebhookSecret('')
  }

  const handleRemove = () => {
    clearStripeConfig()
    toast.success('Stripe configuration removed')
    onConfigured()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-primary p-2 rounded-lg">
              <CreditCard weight="fill" className="text-primary-foreground" size={24} />
            </div>
            <DialogTitle>Configure Stripe</DialogTitle>
          </div>
          <DialogDescription>
            Connect your Stripe account to enable subscription payments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {hasSecretKey && (
            <Card className="p-4 bg-green-500/10 border-green-500/20 mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 p-2 rounded-lg">
                  <Check weight="bold" className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-medium text-sm">Secret Key Configured</p>
                  <p className="text-xs text-muted-foreground">
                    Backend key ready: sk_live_51SKFp5...{existingConfig?.secretKey?.slice(-6)}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {existingConfig ? (
            <Card className="p-4 bg-muted/50 border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Check weight="bold" className="text-primary" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Stripe Connected</p>
                    <p className="text-xs text-muted-foreground">
                      Key: {existingConfig.publishableKey.slice(0, 12)}...
                    </p>
                    {existingConfig.webhookSecret && (
                      <p className="text-xs text-muted-foreground">
                        Webhook: {existingConfig.webhookSecret.slice(0, 12)}...
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                >
                  Remove
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="p-4 bg-purple-500/10 border-purple-500/20">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <CreditCard weight="fill" size={16} />
                  {hasSecretKey ? 'Complete Setup' : 'Getting Your Stripe Key'}
                </h3>
                <ol className="text-sm space-y-1.5 text-muted-foreground">
                  <li>1. Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">dashboard.stripe.com/apikeys</a></li>
                  <li>2. Make sure you're in {hasSecretKey ? 'LIVE mode' : 'the correct mode'} (toggle top-right)</li>
                  <li>3. Find "Publishable key" (starts with pk_live_ or pk_test_)</li>
                  <li>4. Click "Reveal live key token" and copy it</li>
                  <li>5. Paste it below</li>
                </ol>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="stripe-key">Stripe Publishable Key</Label>
                <div className="relative">
                  <Input
                    id="stripe-key"
                    type={showKey ? 'text' : 'password'}
                    placeholder="pk_test_..."
                    value={publishableKey}
                    onChange={(e) => setPublishableKey(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showKey ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your publishable key is safe to use in client-side code
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-secret">Webhook Signing Secret (Optional)</Label>
                <div className="relative">
                  <Input
                    id="webhook-secret"
                    type={showSecret ? 'text' : 'password'}
                    placeholder="whsec_..."
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showSecret ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Used to verify webhook events from Stripe. Find this in your webhook settings.
                </p>
              </div>
            </div>
          )}

          <Card className="p-4 bg-muted/30">
            <h3 className="font-semibold text-sm mb-2">Webhook Setup</h3>
            <p className="text-sm text-muted-foreground mb-3">
              To receive real-time payment updates, configure webhooks in your Stripe Dashboard:
            </p>
            <ol className="text-xs text-muted-foreground space-y-1">
              <li>1. Go to Developers → Webhooks in Stripe Dashboard</li>
              <li>2. Add endpoint: https://your-domain.com/api/webhooks/stripe</li>
              <li>3. Select events: checkout.session.completed, customer.subscription.*</li>
              <li>4. Copy the webhook signing secret and paste above</li>
            </ol>
          </Card>

          <Card className="p-4 bg-muted/30">
            <h3 className="font-semibold text-sm mb-2">Demo Mode</h3>
            <p className="text-sm text-muted-foreground mb-3">
              This integration uses Stripe's test mode. Use test card: 4242 4242 4242 4242 with any future expiry and CVC.
            </p>
            <p className="text-xs text-muted-foreground">
              For production, you'll need to set up webhooks and server-side payment processing.
            </p>
          </Card>

          {!existingConfig && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleSave}
                disabled={!publishableKey.trim()}
              >
                <Check weight="bold" />
                Save Configuration
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
