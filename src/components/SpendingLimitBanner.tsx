import { useMemo, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Warning, ShieldCheck, X } from '@phosphor-icons/react'
import { 
  SpendingLimitsConfig,
  initializeSpendingLimits,
  checkAndResetLimits,
  getSpendingPercentage,
  isLimitExceeded,
  isApproachingLimit,
  formatPeriod,
  shouldResetLimit
} from '@/lib/spending-limits'

interface SpendingLimitBannerProps {
  onOpenSettings: () => void
}

export function SpendingLimitBanner({ onOpenSettings }: SpendingLimitBannerProps) {
  const [config, setConfig] = useKV<SpendingLimitsConfig>('spending-limits-config', initializeSpendingLimits())
  const [dismissed, setDismissed] = useKV<string[]>('spending-limit-dismissed-banners', [])

  useEffect(() => {
    const currentConfig = config ?? initializeSpendingLimits()
    const needsReset = currentConfig.limits.some(limit => limit.enabled && shouldResetLimit(limit))
    
    if (needsReset) {
      const resetLimits = checkAndResetLimits(currentConfig.limits)
      setConfig({
        ...currentConfig,
        limits: resetLimits
      })
    }
  }, [config, setConfig])

  const { displayLimit, isExceeded, percentage } = useMemo(() => {
    const currentConfig = config ?? initializeSpendingLimits()
    const activeLimits = currentConfig.limits.filter(l => l.enabled)
    
    const exceededLimits = activeLimits.filter(limit => isLimitExceeded(limit))
    const approachingLimits = activeLimits.filter(limit => 
      !isLimitExceeded(limit) && isApproachingLimit(limit)
    )

    const criticalLimit = exceededLimits[0]
    const warningLimit = !criticalLimit ? approachingLimits[0] : null
    const limit = criticalLimit || warningLimit

    if (!limit) {
      return { displayLimit: null, isExceeded: false, percentage: 0 }
    }

    const isDismissed = (dismissed ?? []).includes(limit.id)
    if (isDismissed) {
      return { displayLimit: null, isExceeded: false, percentage: 0 }
    }

    return {
      displayLimit: limit,
      isExceeded: isLimitExceeded(limit),
      percentage: getSpendingPercentage(limit.currentSpend, limit.amount)
    }
  }, [config, dismissed])

  if (!displayLimit) return null

  const handleDismiss = () => {
    setDismissed(current => [...(current ?? []), displayLimit.id])
  }

  return (
    <Card className={`p-4 ${isExceeded ? 'border-destructive bg-destructive/5' : 'border-yellow-500 bg-yellow-500/5'}`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg ${isExceeded ? 'bg-destructive/10' : 'bg-yellow-500/10'}`}>
          {isExceeded ? (
            <Warning size={24} weight="fill" className="text-destructive" />
          ) : (
            <ShieldCheck size={24} weight="fill" className="text-yellow-600" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">
                  {isExceeded ? 'Spending Limit Exceeded' : 'Approaching Spending Limit'}
                </h4>
                <Badge variant={isExceeded ? 'destructive' : 'outline'} className={!isExceeded ? 'border-yellow-500 text-yellow-600' : ''}>
                  {percentage}%
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {isExceeded ? (
                  <>
                    You've exceeded your {formatPeriod(displayLimit.period).toLowerCase()} spending limit of ${displayLimit.amount.toFixed(2)}
                    {displayLimit.blockOnExceed && ' - additional transactions are blocked'}
                  </>
                ) : (
                  <>
                    You've spent ${displayLimit.currentSpend.toFixed(2)} of your ${displayLimit.amount.toFixed(2)} {formatPeriod(displayLimit.period).toLowerCase()} limit
                  </>
                )}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={handleDismiss}
            >
              <X size={16} />
            </Button>
          </div>
          <Progress value={percentage} className="h-2 mb-3" />
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
            className="gap-2"
          >
            <ShieldCheck size={14} />
            Manage Limits
          </Button>
        </div>
      </div>
    </Card>
  )
}
