import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Crown, Lightning, Check, Sparkle, VideoCamera, Image as ImageIcon, ChatCircleDots } from '@phosphor-icons/react'
import type { SubscriptionStatus } from '@/lib/subscription'
import { getUsagePercentage, getRemainingGenerations } from '@/lib/subscription'

interface SubscriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpgrade: () => void
  subscriptionStatus: SubscriptionStatus
  reason?: 'limit_reached' | 'video_locked' | 'upgrade_prompt'
}

const PRO_FEATURES = [
  { icon: Sparkle, text: 'Unlimited image generations' },
  { icon: VideoCamera, text: 'Unlimited video generations' },
  { icon: ImageIcon, text: 'Up to 5 reference images' },
  { icon: Lightning, text: 'HD quality outputs' },
  { icon: ChatCircleDots, text: 'Priority AI assistant' },
  { icon: Crown, text: 'Early access to new features' },
]

export function SubscriptionModal({ 
  open, 
  onOpenChange, 
  onUpgrade, 
  subscriptionStatus,
  reason = 'upgrade_prompt'
}: SubscriptionModalProps) {
  const remaining = getRemainingGenerations(subscriptionStatus)
  const usagePercent = getUsagePercentage(
    subscriptionStatus.generationsUsed, 
    subscriptionStatus.generationsLimit
  )

  const getTitle = () => {
    switch (reason) {
      case 'limit_reached':
        return 'Generation Limit Reached'
      case 'video_locked':
        return 'Upgrade to Create Videos'
      default:
        return 'Upgrade to Pro'
    }
  }

  const getDescription = () => {
    switch (reason) {
      case 'limit_reached':
        return `You've used all ${subscriptionStatus.generationsLimit} free generations this month. Upgrade to Pro for unlimited access!`
      case 'video_locked':
        return 'Video generation is a Pro feature. Upgrade now to create unlimited videos alongside your images.'
      default:
        return 'You\'re doing great! Unlock unlimited creations and premium features with Pro.'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-lg">
              <Crown weight="fill" className="text-white" size={24} />
            </div>
            <DialogTitle>{getTitle()}</DialogTitle>
          </div>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {reason === 'limit_reached' && (
            <Card className="p-4 bg-muted/50 border-destructive/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Free Tier Usage</span>
                <span className="text-sm font-bold text-destructive">{usagePercent}%</span>
              </div>
              <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-destructive h-full rounded-full transition-all"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {subscriptionStatus.generationsUsed} of {subscriptionStatus.generationsLimit} generations used
              </p>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 border-2">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-1">Free</h3>
                <div className="text-3xl font-bold mb-1">$0</div>
                <p className="text-sm text-muted-foreground">Forever free</p>
              </div>
              <Separator className="my-4" />
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2 text-sm">
                  <Check weight="bold" className="text-muted-foreground mt-0.5 flex-shrink-0" size={16} />
                  <span>10 generations per month</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check weight="bold" className="text-muted-foreground mt-0.5 flex-shrink-0" size={16} />
                  <span>Image generation only</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check weight="bold" className="text-muted-foreground mt-0.5 flex-shrink-0" size={16} />
                  <span>Up to 3 reference images</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check weight="bold" className="text-muted-foreground mt-0.5 flex-shrink-0" size={16} />
                  <span>Standard quality</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check weight="bold" className="text-muted-foreground mt-0.5 flex-shrink-0" size={16} />
                  <span>AI assistant access</span>
                </li>
              </ul>
            </Card>

            <Card className="p-4 border-2 border-primary relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-br from-primary to-accent text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                POPULAR
              </div>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">Pro</h3>
                  <Crown weight="fill" className="text-primary" size={20} />
                </div>
                <div className="text-3xl font-bold mb-1">$19</div>
                <p className="text-sm text-muted-foreground">Per month</p>
              </div>
              <Separator className="my-4" />
              <ul className="space-y-2.5">
                {PRO_FEATURES.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check weight="bold" className="text-primary mt-0.5 flex-shrink-0" size={16} />
                    <span className="font-medium">{feature.text}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Maybe Later
            </Button>
            <Button
              className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              onClick={onUpgrade}
            >
              <Crown weight="fill" />
              Upgrade to Pro
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Cancel anytime. No questions asked. 30-day money-back guarantee.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
