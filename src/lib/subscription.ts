export type SubscriptionTier = 'free' | 'pro'

export interface SubscriptionStatus {
  tier: SubscriptionTier
  generationsUsed: number
  generationsLimit: number | null
  resetDate: number
}

export const SUBSCRIPTION_LIMITS = {
  free: {
    generationsPerMonth: 10,
    maxReferenceImages: 3,
    features: {
      imageGeneration: true,
      videoGeneration: false,
      stylePresets: true,
      imageEditing: true,
      aiAssistant: true,
      prioritySupport: false,
      hdQuality: false,
      backgroundRemoval: false,
      advancedBodyEditing: false,
      proFilters: false,
    }
  },
  pro: {
    generationsPerMonth: null,
    maxReferenceImages: 5,
    features: {
      imageGeneration: true,
      videoGeneration: true,
      stylePresets: true,
      imageEditing: true,
      aiAssistant: true,
      prioritySupport: true,
      hdQuality: true,
      backgroundRemoval: true,
      advancedBodyEditing: true,
      proFilters: true,
    }
  }
}

export function getUsagePercentage(used: number, limit: number | null): number {
  if (limit === null) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}

export function canGenerate(status: SubscriptionStatus): boolean {
  if (status.tier === 'pro') return true
  return status.generationsUsed < (status.generationsLimit ?? 0)
}

export function getRemainingGenerations(status: SubscriptionStatus): number | null {
  if (status.tier === 'pro') return null
  return Math.max(0, (status.generationsLimit ?? 0) - status.generationsUsed)
}

export function shouldShowUpgradePrompt(status: SubscriptionStatus): boolean {
  if (status.tier === 'pro') return false
  const percentage = getUsagePercentage(status.generationsUsed, status.generationsLimit)
  return percentage >= 80
}

export function getResetDateString(resetDate: number): string {
  const date = new Date(resetDate)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function calculateNextResetDate(): number {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return nextMonth.getTime()
}

export function initializeSubscription(): SubscriptionStatus {
  return {
    tier: 'free',
    generationsUsed: 0,
    generationsLimit: SUBSCRIPTION_LIMITS.free.generationsPerMonth,
    resetDate: calculateNextResetDate()
  }
}

export function resetMonthlyUsage(status: SubscriptionStatus): SubscriptionStatus {
  const now = Date.now()
  if (now >= status.resetDate) {
    return {
      ...status,
      generationsUsed: 0,
      resetDate: calculateNextResetDate()
    }
  }
  return status
}
