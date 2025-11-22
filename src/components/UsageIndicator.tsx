import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Crown, Lightning } from '@phosphor-icons/react'
import type { SubscriptionStatus } from '@/lib/subscription'
import { getUsagePercentage, getRemainingGenerations, getResetDateString } from '@/lib/subscription'

interface UsageIndicatorProps {
  subscriptionStatus: SubscriptionStatus
  onUpgradeClick: () => void
}

export function UsageIndicator({ subscriptionStatus, onUpgradeClick }: UsageIndicatorProps) {
  if (subscriptionStatus.tier === 'pro') {
    return (
      <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown weight="fill" className="text-primary" size={20} />
            <div>
              <p className="text-sm font-semibold">Pro Member</p>
              <p className="text-xs text-muted-foreground">Unlimited generations</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-primary to-accent text-white">
            Active
          </Badge>
        </div>
      </Card>
    )
  }

  const remaining = getRemainingGenerations(subscriptionStatus)
  const usagePercent = getUsagePercentage(
    subscriptionStatus.generationsUsed,
    subscriptionStatus.generationsLimit
  )

  const isWarning = usagePercent >= 80
  const isError = usagePercent >= 100

  return (
    <Card className={`p-4 ${isError ? 'border-destructive/50 bg-destructive/5' : isWarning ? 'border-primary/50 bg-primary/5' : ''}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Free Tier Usage</p>
            <p className="text-xs text-muted-foreground">
              {remaining} of {subscriptionStatus.generationsLimit} remaining
            </p>
          </div>
          <Badge variant={isError ? "destructive" : isWarning ? "default" : "outline"}>
            {usagePercent}%
          </Badge>
        </div>

        <Progress 
          value={usagePercent} 
          className="h-2"
        />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Resets {getResetDateString(subscriptionStatus.resetDate)}</span>
          {isWarning && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5 text-primary hover:text-primary"
              onClick={onUpgradeClick}
            >
              <Lightning weight="fill" size={14} />
              Upgrade
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
