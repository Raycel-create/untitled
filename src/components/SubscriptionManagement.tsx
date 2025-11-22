import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Crown, CreditCard, Warning, Check, ArrowRight, Calendar } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { SubscriptionStatus, getUsagePercentage, getRemainingGenerations, getResetDateString } from '@/lib/subscription'
import { getStoredStripeConfig, getSubscriptionStatus, cancelSubscription, formatSubscriptionStatus, formatDate, isSubscriptionActive } from '@/lib/stripe'

interface SubscriptionManagementProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscriptionStatus: SubscriptionStatus
  userId: string
  onCanceled: () => void
}

export function SubscriptionManagement({ 
  open, 
  onOpenChange, 
  subscriptionStatus, 
  userId,
  onCanceled 
}: SubscriptionManagementProps) {
  const [stripeSubscription, setStripeSubscription] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)

  const stripeConfig = getStoredStripeConfig()
  const isPro = subscriptionStatus.tier === 'pro'
  const usagePercent = getUsagePercentage(subscriptionStatus.generationsUsed, subscriptionStatus.generationsLimit)
  const remaining = getRemainingGenerations(subscriptionStatus)

  useEffect(() => {
    if (open && isPro && stripeConfig && subscriptionStatus.stripeCustomerId) {
      loadSubscription()
    }
  }, [open, isPro, stripeConfig, subscriptionStatus.stripeCustomerId])

  const loadSubscription = async () => {
    if (!stripeConfig || !subscriptionStatus.stripeCustomerId) return
    
    setIsLoading(true)
    try {
      const subscription = await getSubscriptionStatus(
        subscriptionStatus.stripeCustomerId,
        stripeConfig.publishableKey
      )
      setStripeSubscription(subscription)
    } catch (error) {
      console.error('Failed to load subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.'
    )

    if (!confirmed) return

    setIsCanceling(true)
    try {
      const canceled = cancelSubscription(userId)
      
      if (canceled) {
        toast.success('Subscription canceled. You have access until ' + formatDate(canceled.currentPeriodEnd))
        setStripeSubscription(canceled)
        onCanceled()
      } else {
        throw new Error('Failed to cancel')
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
      toast.error('Failed to cancel subscription. Please try again.')
    } finally {
      setIsCanceling(false)
    }
  }

  const handleManageBilling = async () => {
    toast.info('Opening Stripe billing portal...')
    
    setTimeout(() => {
      toast.success('In production, this would redirect to Stripe\'s customer portal')
    }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 rounded-lg ${isPro ? 'bg-gradient-to-br from-primary to-accent' : 'bg-muted'}`}>
              {isPro ? (
                <Crown weight="fill" className="text-white" size={24} />
              ) : (
                <CreditCard weight="fill" className="text-muted-foreground" size={24} />
              )}
            </div>
            <DialogTitle>Subscription Management</DialogTitle>
          </div>
          <DialogDescription>
            {isPro ? 'Manage your Pro subscription' : 'View your free tier usage'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <Card className={`p-6 ${isPro ? 'border-primary/20 bg-primary/5' : 'bg-muted/30'}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold">
                    {isPro ? 'Pro Plan' : 'Free Plan'}
                  </h3>
                  {isPro && (
                    <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                      <Crown weight="fill" size={12} className="mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                {isPro ? (
                  <p className="text-2xl font-bold">$19<span className="text-base font-normal text-muted-foreground">/month</span></p>
                ) : (
                  <p className="text-2xl font-bold">$0<span className="text-base font-normal text-muted-foreground">/forever</span></p>
                )}
              </div>
            </div>

            {isPro && stripeSubscription && (
              <div className="space-y-3 mt-4">
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Status</p>
                    <p className="font-medium">{formatSubscriptionStatus(stripeSubscription.status)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Billing Cycle</p>
                    <p className="font-medium">Monthly</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground mb-1">
                      {stripeSubscription.cancelAtPeriodEnd ? 'Access Until' : 'Next Billing Date'}
                    </p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar size={16} />
                      {formatDate(stripeSubscription.currentPeriodEnd)}
                    </p>
                  </div>
                </div>
                {stripeSubscription.cancelAtPeriodEnd && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-2">
                    <Warning weight="fill" className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
                    <div className="text-sm">
                      <p className="font-medium">Subscription Ending</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Your subscription will not renew. You'll revert to the free tier after {formatDate(stripeSubscription.currentPeriodEnd)}.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="p-6 bg-muted/30">
            <h3 className="font-semibold mb-4">Usage This Month</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Generations</span>
                  {isPro ? (
                    <Badge variant="outline" className="text-xs">
                      Unlimited
                    </Badge>
                  ) : (
                    <span className="text-sm font-medium">
                      {subscriptionStatus.generationsUsed} / {subscriptionStatus.generationsLimit}
                    </span>
                  )}
                </div>
                {!isPro && (
                  <>
                    <Progress value={usagePercent} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {remaining} generations remaining • Resets {getResetDateString(subscriptionStatus.resetDate)}
                    </p>
                  </>
                )}
              </div>
            </div>
          </Card>

          {isPro ? (
            <Card className="p-6 bg-muted/30">
              <h3 className="font-semibold mb-3">Pro Features</h3>
              <ul className="space-y-2">
                {[
                  'Unlimited image generations',
                  'Unlimited video generations',
                  'HD quality outputs',
                  'Up to 5 reference images',
                  'Priority AI assistant',
                  'Early access to new features',
                  'Priority support'
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check weight="bold" className="text-primary mt-0.5 flex-shrink-0" size={16} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : (
            <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-lg">
                  <Crown weight="fill" className="text-white" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Upgrade to Pro</h3>
                  <p className="text-sm text-muted-foreground">
                    Unlock unlimited generations and premium features
                  </p>
                </div>
              </div>
              <Button className="w-full gap-2" onClick={() => {
                onOpenChange(false)
              }}>
                <Crown weight="fill" />
                View Pro Plans
                <ArrowRight weight="bold" />
              </Button>
            </Card>
          )}

          {isPro && stripeSubscription && (
            <div className="space-y-3">
              <Separator />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleManageBilling}
                >
                  <CreditCard weight="bold" />
                  Manage Billing
                </Button>
                {!stripeSubscription.cancelAtPeriodEnd && (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleCancelSubscription}
                    disabled={isCanceling}
                  >
                    {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
                  </Button>
                )}
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Changes take effect at the end of your billing period
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
