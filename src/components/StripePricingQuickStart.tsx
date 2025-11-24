import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Check, 
  ArrowRight, 
  ShoppingCart, 
  Key, 
  TestTube,
  Rocket,
  NumberCircleOne,
  NumberCircleTwo,
  NumberCircleThree,
  NumberCircleFour
} from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { getStoredStripeConfig } from '@/lib/stripe'

interface StripePriceConfig {
  monthlyPriceId: string
  yearlyPriceId: string
}

interface QuickStartProps {
  onOpenStripeConfig: () => void
  onOpenPricing: () => void
  onOpenTesting: () => void
}

export function StripePricingQuickStart({ 
  onOpenStripeConfig, 
  onOpenPricing, 
  onOpenTesting 
}: QuickStartProps) {
  const [priceConfig] = useKV<StripePriceConfig>('stripe-price-config', {
    monthlyPriceId: '',
    yearlyPriceId: ''
  })
  
  const stripeConfig = getStoredStripeConfig()
  const hasStripeKey = !!stripeConfig?.publishableKey
  const hasPriceIds = !!(priceConfig?.monthlyPriceId && priceConfig?.yearlyPriceId)
  const hasSecretKey = !!stripeConfig?.secretKey

  const steps = [
    {
      number: 1,
      title: 'Configure Stripe Keys',
      description: 'Add your Stripe publishable key',
      completed: hasStripeKey && hasSecretKey,
      action: onOpenStripeConfig,
      icon: Key,
    },
    {
      number: 2,
      title: 'Create Stripe Products',
      description: 'Set up pricing in Stripe Dashboard',
      completed: false,
      action: () => window.open('https://dashboard.stripe.com/products', '_blank'),
      icon: ShoppingCart,
    },
    {
      number: 3,
      title: 'Configure Price IDs',
      description: 'Add your price IDs to the app',
      completed: hasPriceIds,
      action: onOpenPricing,
      icon: NumberCircleThree,
    },
    {
      number: 4,
      title: 'Test Integration',
      description: 'Verify everything works',
      completed: false,
      action: onOpenTesting,
      icon: TestTube,
    },
  ]

  const completedSteps = steps.filter(s => s.completed).length
  const progress = (completedSteps / steps.length) * 100

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Stripe Pricing Setup</h3>
          <Badge variant={completedSteps === steps.length ? "default" : "secondary"}>
            {completedSteps}/{steps.length} Complete
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Follow these steps to set up custom pricing with real Stripe products
        </p>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <Card
              key={step.number}
              className={`p-4 transition-all ${
                step.completed
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  step.completed 
                    ? 'bg-green-500 text-white' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step.completed ? (
                    <Check weight="bold" size={20} />
                  ) : (
                    <span className="font-bold">{step.number}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{step.title}</h4>
                    {step.completed && (
                      <Badge className="h-5 text-[10px] bg-green-500">
                        Complete
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {step.description}
                  </p>

                  <Button
                    variant={step.completed ? "outline" : "default"}
                    size="sm"
                    onClick={step.action}
                    className="gap-2"
                  >
                    {step.completed ? (
                      <>
                        <Check weight="bold" size={14} />
                        Review
                      </>
                    ) : (
                      <>
                        <ArrowRight weight="bold" size={14} />
                        {step.number === 2 ? 'Open Dashboard' : 'Start'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {completedSteps === steps.length && (
        <Card className="mt-4 p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-500/30">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-2 rounded-full">
              <Rocket weight="fill" className="text-white" size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">Ready to Launch! 🎉</h4>
              <p className="text-xs text-muted-foreground">
                Your Stripe pricing is configured and tested. You can now accept real payments!
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="mt-6 pt-6 border-t border-border">
        <details className="cursor-pointer">
          <summary className="text-sm font-medium mb-2">📖 Need detailed instructions?</summary>
          <div className="mt-3 space-y-2 text-xs text-muted-foreground">
            <p>For complete step-by-step guide with screenshots:</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/STRIPE_PRICING_TEST_GUIDE.md', '_blank')}
                className="text-xs h-7"
              >
                📄 View Full Guide
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://dashboard.stripe.com/test/products', '_blank')}
                className="text-xs h-7"
              >
                🔗 Stripe Dashboard
              </Button>
            </div>
          </div>
        </details>
      </div>
    </Card>
  )
}
