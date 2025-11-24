export type AlertFrequency = 'once' | 'daily' | 'weekly' | 'always'
export type AlertChannel = 'email' | 'push' | 'both'
export type LimitPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface SpendingAlert {
  id: string
  name: string
  threshold: number
  percentage?: number
  frequency: AlertFrequency
  channels: AlertChannel[]
  enabled: boolean
  lastTriggered?: number
  triggerCount: number
}

export interface SpendingLimit {
  id: string
  amount: number
  period: LimitPeriod
  currentSpend: number
  startDate: number
  resetDate: number
  enabled: boolean
  blockOnExceed: boolean
  alerts: SpendingAlert[]
}

export interface SpendingHistory {
  id: string
  date: number
  amount: number
  description: string
  category: 'subscription' | 'generation' | 'addon' | 'overage'
  status: 'completed' | 'pending' | 'failed'
}

export interface SpendingLimitsConfig {
  limits: SpendingLimit[]
  globalAlerts: SpendingAlert[]
  history: SpendingHistory[]
  totalSpendThisMonth: number
  totalSpendThisYear: number
  notificationsEnabled: boolean
}

export function initializeSpendingLimits(): SpendingLimitsConfig {
  return {
    limits: [],
    globalAlerts: [],
    history: [],
    totalSpendThisMonth: 0,
    totalSpendThisYear: 0,
    notificationsEnabled: true
  }
}

export function calculatePeriodDates(period: LimitPeriod): { start: number; reset: number } {
  const now = new Date()
  let start: Date
  let reset: Date

  switch (period) {
    case 'daily':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      reset = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      break
    case 'weekly':
      const dayOfWeek = now.getDay()
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
      reset = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
      break
    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      reset = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      break
    case 'yearly':
      start = new Date(now.getFullYear(), 0, 1)
      reset = new Date(now.getFullYear() + 1, 0, 1)
      break
  }

  return {
    start: start.getTime(),
    reset: reset.getTime()
  }
}

export function createSpendingLimit(
  amount: number,
  period: LimitPeriod,
  blockOnExceed: boolean = true
): SpendingLimit {
  const dates = calculatePeriodDates(period)
  
  return {
    id: `limit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    amount,
    period,
    currentSpend: 0,
    startDate: dates.start,
    resetDate: dates.reset,
    enabled: true,
    blockOnExceed,
    alerts: []
  }
}

export function createSpendingAlert(
  name: string,
  threshold: number,
  percentage?: number
): SpendingAlert {
  return {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    threshold,
    percentage,
    frequency: 'once',
    channels: ['email'],
    enabled: true,
    triggerCount: 0
  }
}

export function shouldResetLimit(limit: SpendingLimit): boolean {
  return Date.now() >= limit.resetDate
}

export function resetSpendingLimit(limit: SpendingLimit): SpendingLimit {
  const dates = calculatePeriodDates(limit.period)
  return {
    ...limit,
    currentSpend: 0,
    startDate: dates.start,
    resetDate: dates.reset,
    alerts: limit.alerts.map(alert => ({
      ...alert,
      lastTriggered: undefined,
      triggerCount: 0
    }))
  }
}

export function checkAndResetLimits(limits: SpendingLimit[]): SpendingLimit[] {
  return limits.map(limit => 
    shouldResetLimit(limit) ? resetSpendingLimit(limit) : limit
  )
}

export function getSpendingPercentage(currentSpend: number, limit: number): number {
  if (limit === 0) return 0
  return Math.min(100, Math.round((currentSpend / limit) * 100))
}

export function isLimitExceeded(limit: SpendingLimit): boolean {
  return limit.currentSpend >= limit.amount
}

export function isApproachingLimit(limit: SpendingLimit, threshold: number = 80): boolean {
  const percentage = getSpendingPercentage(limit.currentSpend, limit.amount)
  return percentage >= threshold && percentage < 100
}

export function canSpend(limits: SpendingLimit[], amount: number): { allowed: boolean; reason?: string } {
  const activeLimits = limits.filter(l => l.enabled)
  
  for (const limit of activeLimits) {
    if (limit.blockOnExceed && limit.currentSpend + amount > limit.amount) {
      return {
        allowed: false,
        reason: `This transaction would exceed your ${limit.period} spending limit of $${limit.amount.toFixed(2)}`
      }
    }
  }
  
  return { allowed: true }
}

export function shouldTriggerAlert(
  alert: SpendingAlert,
  currentSpend: number,
  limitAmount?: number
): boolean {
  if (!alert.enabled) return false
  
  let thresholdMet = false
  
  if (alert.percentage !== undefined && limitAmount !== undefined) {
    const percentage = getSpendingPercentage(currentSpend, limitAmount)
    thresholdMet = percentage >= alert.percentage
  } else {
    thresholdMet = currentSpend >= alert.threshold
  }
  
  if (!thresholdMet) return false
  
  if (!alert.lastTriggered) return true
  
  const now = Date.now()
  const timeSinceLastTrigger = now - alert.lastTriggered
  
  switch (alert.frequency) {
    case 'once':
      return false
    case 'daily':
      return timeSinceLastTrigger >= 24 * 60 * 60 * 1000
    case 'weekly':
      return timeSinceLastTrigger >= 7 * 24 * 60 * 60 * 1000
    case 'always':
      return true
    default:
      return false
  }
}

export function addSpendingTransaction(
  config: SpendingLimitsConfig,
  amount: number,
  description: string,
  category: SpendingHistory['category']
): { config: SpendingLimitsConfig; triggeredAlerts: SpendingAlert[] } {
  const transaction: SpendingHistory = {
    id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: Date.now(),
    amount,
    description,
    category,
    status: 'completed'
  }
  
  const updatedLimits = config.limits.map(limit => {
    if (!limit.enabled) return limit
    
    const newSpend = limit.currentSpend + amount
    const triggeredLimitAlerts = limit.alerts.filter(alert =>
      shouldTriggerAlert(alert, newSpend, limit.amount)
    )
    
    return {
      ...limit,
      currentSpend: newSpend,
      alerts: limit.alerts.map(alert => {
        if (triggeredLimitAlerts.includes(alert)) {
          return {
            ...alert,
            lastTriggered: Date.now(),
            triggerCount: alert.triggerCount + 1
          }
        }
        return alert
      })
    }
  })
  
  const triggeredGlobalAlerts = config.globalAlerts.filter(alert =>
    shouldTriggerAlert(alert, config.totalSpendThisMonth + amount)
  )
  
  const updatedGlobalAlerts = config.globalAlerts.map(alert => {
    if (triggeredGlobalAlerts.includes(alert)) {
      return {
        ...alert,
        lastTriggered: Date.now(),
        triggerCount: alert.triggerCount + 1
      }
    }
    return alert
  })
  
  const allTriggeredAlerts = [
    ...updatedLimits.flatMap(l => l.alerts.filter(a => a.lastTriggered === Date.now())),
    ...triggeredGlobalAlerts
  ]
  
  return {
    config: {
      ...config,
      limits: updatedLimits,
      globalAlerts: updatedGlobalAlerts,
      history: [transaction, ...config.history],
      totalSpendThisMonth: config.totalSpendThisMonth + amount,
      totalSpendThisYear: config.totalSpendThisYear + amount
    },
    triggeredAlerts: allTriggeredAlerts
  }
}

export function formatPeriod(period: LimitPeriod): string {
  return period.charAt(0).toUpperCase() + period.slice(1)
}

export function getPeriodDaysRemaining(resetDate: number): number {
  const now = Date.now()
  const diff = resetDate - now
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)))
}

export function generateMockSpendingHistory(): SpendingHistory[] {
  const now = Date.now()
  const history: SpendingHistory[] = []
  
  const entries = [
    { days: 2, amount: 29.99, description: 'Pro Subscription - Monthly', category: 'subscription' as const },
    { days: 5, amount: 2.50, description: 'Video Generation (x5)', category: 'generation' as const },
    { days: 8, amount: 1.20, description: 'Image Generation (x12)', category: 'generation' as const },
    { days: 12, amount: 5.00, description: 'HD Upscaling Addon', category: 'addon' as const },
    { days: 15, amount: 0.80, description: 'Image Generation (x8)', category: 'generation' as const },
    { days: 20, amount: 3.00, description: 'Video Generation (x6)', category: 'generation' as const },
    { days: 25, amount: 1.50, description: 'Background Removal (x15)', category: 'addon' as const },
  ]
  
  entries.forEach((entry, index) => {
    history.push({
      id: `history-${index}`,
      date: now - (entry.days * 24 * 60 * 60 * 1000),
      amount: entry.amount,
      description: entry.description,
      category: entry.category,
      status: 'completed'
    })
  })
  
  return history
}
