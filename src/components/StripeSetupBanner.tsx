import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CreditCard, X, Check, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { saveStripeConfig } from '@/lib/stripe'

interface StripeSetupBannerProps {
  onConfigured: () => void
  onDismiss: () => void
}

export function StripeSetupBanner({ onConfigured, onDismiss }: StripeSetupBannerProps) {
  const [publishableKey, setPublishableKey] = useState('')
  const [isConfiguring, setIsConfiguring] = useState(false)

  const secretKey = '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'

  const handleQuickSetup = () => {
    if (!publishableKey.trim()) {
      toast.error('Please enter your Stripe publishable key')
      return
    }

    if (!publishableKey.startsWith('pk_live_') && !publishableKey.startsWith('pk_test_')) {
      toast.error('Invalid key format. Must start with pk_live_ or pk_test_')
      return
    }

    saveStripeConfig({
      publishableKey: publishableKey.trim(),
      secretKey: secretKey
    })

    toast.success('Stripe configured successfully!', {
      description: 'You can now accept payments'
    })

    onConfigured()
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
      <div className="flex items-start gap-3">
        <div className="bg-purple-500 p-2 rounded-lg flex-shrink-0 mt-1">
          <CreditCard weight="fill" className="text-white" size={20} />
        </div>
        
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
              Complete Stripe Setup
              <Warning weight="fill" className="text-yellow-500" size={16} />
            </h3>
            <p className="text-xs text-muted-foreground">
              Your secret key is ready. Now add your publishable key to enable payments.
            </p>
          </div>

          {!isConfiguring ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setIsConfiguring(true)}
                className="gap-2"
              >
                <Check weight="bold" size={14} />
                Complete Setup
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onDismiss}
              >
                Later
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-card/50 rounded-lg p-3 space-y-2">
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p className="font-medium text-foreground">Get your publishable key:</p>
                  <ol className="list-decimal list-inside space-y-0.5 ml-2">
                    <li>Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">dashboard.stripe.com/apikeys</a></li>
                    <li>Find "Publishable key" (starts with pk_live_)</li>
                    <li>Click "Reveal live key token" and copy it</li>
                  </ol>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="pk_live_..."
                  value={publishableKey}
                  onChange={(e) => setPublishableKey(e.target.value)}
                  className="flex-1 text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleQuickSetup}
                  disabled={!publishableKey.trim()}
                  className="gap-2"
                >
                  <Check weight="bold" size={14} />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsConfiguring(false)}
                >
                  Cancel
                </Button>
              </div>

              <div className="bg-muted/50 rounded p-2">
                <p className="text-xs text-muted-foreground">
                  ✓ Secret key configured (hidden for security)
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  sk_live_51SKFp5AMn...{secretKey.slice(-6)}
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          <X size={18} />
        </button>
      </div>
    </Card>
  )
}
