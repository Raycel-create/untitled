import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, Check, ArrowRight, Copy, Crown, Lightning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useKV } from '@github/spark/hooks'

interface StripePriceConfig {
  monthlyPriceId: string
  yearlyPriceId: string
}

export function StripePriceSetup() {
  const [priceConfig, setPriceConfig] = useKV<StripePriceConfig>('stripe-price-config', {
    monthlyPriceId: '',
    yearlyPriceId: ''
  })
  const [monthlyId, setMonthlyId] = useState(priceConfig?.monthlyPriceId || '')
  const [yearlyId, setYearlyId] = useState(priceConfig?.yearlyPriceId || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    if (!monthlyId.startsWith('price_') || !yearlyId.startsWith('price_')) {
      toast.error('Invalid Price IDs', {
        description: 'Price IDs must start with "price_"'
      })
      return
    }

    setIsSaving(true)
    setPriceConfig({
      monthlyPriceId: monthlyId,
      yearlyPriceId: yearlyId
    })

    setTimeout(() => {
      setIsSaving(false)
      toast.success('Price IDs saved!', {
        description: 'Your pricing configuration is updated'
      })
    }, 500)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="bg-gradient-to-br from-primary to-accent p-3 rounded-lg flex-shrink-0">
            <ShoppingCart weight="fill" className="text-white" size={24} />
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                Create Custom Pricing Plans
                <Badge variant="outline" className="text-xs">Step 1</Badge>
              </h3>
              <p className="text-sm text-muted-foreground">
                Set up your subscription products in Stripe Dashboard before accepting payments
              </p>
            </div>

            <div className="space-y-3">
              <div className="bg-card rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
                    1
                  </div>
                  <p className="text-sm font-medium">Access Stripe Dashboard</p>
                </div>
                <p className="text-xs text-muted-foreground ml-8">
                  Go to <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">dashboard.stripe.com/products</a> (make sure you're in Live Mode)
                </p>
              </div>

              <div className="bg-card rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
                    2
                  </div>
                  <p className="text-sm font-medium">Create Product</p>
                </div>
                <div className="ml-8 space-y-2">
                  <p className="text-xs text-muted-foreground">Click "+ Add product" and fill in:</p>
                  <div className="bg-muted/50 rounded p-3 space-y-1">
                    <p className="text-xs"><span className="font-medium">Name:</span> AI Creator Studio Pro</p>
                    <p className="text-xs"><span className="font-medium">Description:</span> Unlimited AI image & video generation</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
                    3
                  </div>
                  <p className="text-sm font-medium">Add Pricing Tiers</p>
                </div>
                <div className="ml-8 space-y-3">
                  <div className="bg-muted/50 rounded p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Crown weight="fill" className="text-primary" size={14} />
                      <p className="text-xs font-semibold">Monthly Plan</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Price:</span>
                        <p className="font-medium">$19.00 USD</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Billing:</span>
                        <p className="font-medium">Monthly</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-accent/10 rounded p-3 space-y-2 border border-accent/20">
                    <div className="flex items-center gap-2">
                      <Lightning weight="fill" className="text-accent" size={14} />
                      <p className="text-xs font-semibold">Yearly Plan - Save 21%</p>
                      <Badge className="text-[10px] h-4 px-1 bg-accent">Best Value</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Price:</span>
                        <p className="font-medium">$180.00 USD/year</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Effective:</span>
                        <p className="font-medium">$15/month</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
                    4
                  </div>
                  <p className="text-sm font-medium">Copy Price IDs</p>
                </div>
                <p className="text-xs text-muted-foreground ml-8">
                  After creating each price, copy the Price ID (starts with <code className="bg-muted px-1 rounded text-primary">price_</code>)
                </p>
              </div>
            </div>

            <Button
              onClick={() => window.open('https://dashboard.stripe.com/products', '_blank')}
              className="w-full gap-2"
              size="lg"
            >
              <ShoppingCart weight="fill" size={18} />
              Open Stripe Dashboard
              <ArrowRight weight="bold" size={18} />
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
              Configure Price IDs
              <Badge variant="outline" className="text-xs">Step 2</Badge>
            </h3>
            <p className="text-sm text-muted-foreground">
              Paste the Price IDs from your Stripe products here
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Crown weight="fill" className="text-primary" size={14} />
                Monthly Plan Price ID
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="price_1234567890abcdefg"
                  value={monthlyId}
                  onChange={(e) => setMonthlyId(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(monthlyId)}
                  disabled={!monthlyId}
                >
                  <Copy size={16} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                From your $19/month subscription price
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lightning weight="fill" className="text-accent" size={14} />
                Yearly Plan Price ID
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="price_0987654321zyxwvut"
                  value={yearlyId}
                  onChange={(e) => setYearlyId(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(yearlyId)}
                  disabled={!yearlyId}
                >
                  <Copy size={16} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                From your $180/year subscription price
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving || !monthlyId || !yearlyId}
            className="w-full gap-2"
            size="lg"
          >
            {isSaving ? (
              <>
                <div className="animate-spin">⟳</div>
                Saving...
              </>
            ) : (
              <>
                <Check weight="bold" size={18} />
                Save Price Configuration
              </>
            )}
          </Button>

          {priceConfig?.monthlyPriceId && priceConfig?.yearlyPriceId && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Check weight="fill" className="text-primary mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Price IDs Configured!</p>
                  <p className="text-xs text-muted-foreground">
                    Your custom pricing is ready. Users can now subscribe to Pro plans.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4 bg-muted/30">
        <details className="cursor-pointer">
          <summary className="text-sm font-medium">📖 Need detailed instructions?</summary>
          <div className="mt-3 space-y-2 text-xs text-muted-foreground">
            <p>For a complete step-by-step guide with screenshots and troubleshooting, see:</p>
            <a 
              href="https://github.com/yourusername/ai-creator-studio/blob/main/STRIPE_PRICING_SETUP.md" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              📄 STRIPE_PRICING_SETUP.md
            </a>
          </div>
        </details>
      </Card>
    </div>
  )
}
