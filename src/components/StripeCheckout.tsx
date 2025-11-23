import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Crown, Check, Lock, Lightning, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { getStoredStripeConfig } from '@/lib/stripe'
import { 
  createCheckoutSession, 
  completeCheckoutSession, 
  validateStripeKey,
  type StripeConfig 
} from '@/lib/stripe-api'

interface StripeCheckoutProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userEmail: string
  userId: string
  onSuccess: () => void
  onConfigureStripe: () => void
}

const DEFAULT_STRIPE_PRICE_IDS = {
  pro_monthly: 'price_pro_monthly_v2',
  pro_yearly: 'price_pro_yearly_v2',
}

export function StripeCheckout({ open, onOpenChange, userEmail, userId, onSuccess, onConfigureStripe }: StripeCheckoutProps) {
  const [selectedPlan, setSelectedPlan] = useState('monthly')
  const [isProcessing, setIsProcessing] = useState(false)
  const [apiEndpoint, setApiEndpoint] = useState<string | null>(null)
  const [priceConfig, setPriceConfig] = useState<{monthlyPriceId: string, yearlyPriceId: string} | null>(null)

  const stripeConfig = getStoredStripeConfig()

  useEffect(() => {
    async function loadConfig() {
      const endpoint = await window.spark.kv.get<string>('stripe-api-endpoint')
      setApiEndpoint(endpoint || null)
      
      const config = await window.spark.kv.get<{monthlyPriceId: string, yearlyPriceId: string}>('stripe-price-config')
      setPriceConfig(config || null)
    }
    loadConfig()
  }, [])

  const PRICING_PLANS = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: 19,
      period: 'month',
      priceId: priceConfig?.monthlyPriceId || DEFAULT_STRIPE_PRICE_IDS.pro_monthly,
      badge: null,
      savings: null,
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: 15,
      period: 'month',
      totalPrice: 180,
      priceId: priceConfig?.yearlyPriceId || DEFAULT_STRIPE_PRICE_IDS.pro_yearly,
      badge: 'SAVE 21%',
      savings: 48,
    },
  ]

  const handleCheckout = async () => {
    if (!stripeConfig) {
      toast.error('Stripe not configured')
      onConfigureStripe()
      return
    }

    const validation = validateStripeKey(stripeConfig.publishableKey)
    if (!validation.valid) {
      toast.error('Invalid Stripe publishable key')
      onConfigureStripe()
      return
    }

    const plan = PRICING_PLANS.find(p => p.id === selectedPlan)
    if (!plan) return

    setIsProcessing(true)

    try {
      const config: StripeConfig = {
        publishableKey: stripeConfig.publishableKey,
        mode: validation.mode || 'test'
      }

      const successUrl = `${window.location.origin}${window.location.pathname}#checkout-success`
      const cancelUrl = `${window.location.origin}${window.location.pathname}#checkout-cancel`

      const session = await createCheckoutSession(config, {
        priceId: plan.priceId,
        userId: userId,
        userEmail: userEmail,
        successUrl: successUrl,
        cancelUrl: cancelUrl,
        mode: 'subscription',
        metadata: {
          plan: plan.id,
          tier: 'pro'
        }
      })

      if (!session) {
        throw new Error('Failed to create checkout session')
      }

      if (!apiEndpoint) {
        toast.info('Demo Mode: Simulating checkout flow', {
          description: 'Configure API endpoint for real payments'
        })
        
        setTimeout(async () => {
          const simulateSuccess = window.confirm(
            '🧪 Demo Mode Active\n\n' +
            'No server API configured. Simulate successful payment?\n\n' +
            'To enable real payments:\n' +
            '1. Set up the backend server (see STRIPE_SERVER_SETUP.md)\n' +
            '2. Configure API endpoint in Admin Settings\n\n' +
            'Simulate payment now?'
          )
          
          if (simulateSuccess) {
            const subscription = await completeCheckoutSession(session.id, userId)
            if (subscription) {
              onSuccess()
              toast.success('Payment successful! Welcome to Pro! 🎉', {
                description: 'Your subscription is now active'
              })
            } else {
              toast.error('Failed to complete checkout')
            }
          } else {
            toast.info('Checkout canceled')
          }
          
          setIsProcessing(false)
        }, 1500)
      } else {
        toast.success('Redirecting to Stripe Checkout...', {
          description: 'You will be redirected to secure payment'
        })
        
        setTimeout(() => {
          window.location.href = session.url
        }, 1000)
      }

    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Failed to start checkout', {
        description: error instanceof Error ? error.message : 'Please try again'
      })
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-lg">
              <Crown weight="fill" className="text-white" size={24} />
            </div>
            <DialogTitle>Upgrade to Pro</DialogTitle>
          </div>
          <DialogDescription>
            Choose your billing cycle and unlock unlimited creative power
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {!stripeConfig && (
            <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
              <div className="flex items-center gap-3">
                <Warning weight="fill" className="text-yellow-600" size={20} />
                <div className="flex-1">
                  <p className="font-medium text-sm">Stripe Not Configured</p>
                  <p className="text-xs text-muted-foreground">
                    Configure Stripe to enable payments
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false)
                    onConfigureStripe()
                  }}
                >
                  Configure
                </Button>
              </div>
            </Card>
          )}

          {stripeConfig && !apiEndpoint && (
            <Card className="p-4 bg-blue-500/10 border-blue-500/20">
              <div className="flex items-center gap-3">
                <Lightning weight="fill" className="text-blue-600" size={20} />
                <div className="flex-1">
                  <p className="font-medium text-sm">Demo Mode Active</p>
                  <p className="text-xs text-muted-foreground">
                    Configure API endpoint in Admin Settings for real payments
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRICING_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`p-6 cursor-pointer transition-all relative ${
                  selectedPlan === plan.id
                    ? 'border-2 border-primary bg-primary/5'
                    : 'border-2 hover:border-primary/50'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.badge && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-accent text-white">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground text-sm">/{plan.period}</span>
                    </div>
                    {plan.totalPrice && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ${plan.totalPrice}/year • Save ${plan.savings}
                      </p>
                    )}
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedPlan === plan.id
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {selectedPlan === plan.id && (
                      <Check weight="bold" className="text-white" size={12} />
                    )}
                  </div>
                </div>

                {plan.id === 'yearly' && (
                  <div className="bg-accent/10 rounded-lg p-3 mb-4">
                    <p className="text-xs font-medium text-accent flex items-center gap-1">
                      <Lightning weight="fill" size={14} />
                      Best value - 2 months free!
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <Card className="p-4 bg-muted/30">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Crown weight="fill" className="text-primary" size={16} />
              What's included:
            </h3>
            <ul className="space-y-2">
              {[
                'Unlimited image generations',
                'Unlimited video generations',
                'HD quality outputs',
                'Up to 5 reference images',
                'Priority AI assistant',
                'Early access to new features',
                'Priority support',
                'Cancel anytime'
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check weight="bold" className="text-primary mt-0.5 flex-shrink-0" size={16} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </Card>

          <div className="space-y-3">
            <Button
              className="w-full gap-2 h-12 text-base"
              onClick={handleCheckout}
              disabled={isProcessing || !stripeConfig}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin">⟳</div>
                  Processing...
                </>
              ) : (
                <>
                  <Lock weight="bold" />
                  Secure Checkout with Stripe
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Lock size={12} />
                <span>Secure payment</span>
              </div>
              <span>•</span>
              <span>Cancel anytime</span>
              <span>•</span>
              <span>30-day money back</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="text-xs text-muted-foreground">Powered by</span>
            <CreditCard weight="fill" className="text-primary" size={16} />
            <span className="text-xs font-semibold">Stripe</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
