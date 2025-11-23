export const STRIPE_LIVE_CONFIG = {
  secretKey: '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',
  publishableKey: 'pk_live_51SKFp5AMnqPgToIMbXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  mode: 'live' as const
}

export const STRIPE_PRICE_IDS = {
  pro_monthly: 'price_1XXXXXXXXXXXXXXXXX',
  pro_yearly: 'price_1XXXXXXXXXXXXXXXXX'
}

export function initializeStripeConfig() {
  if (typeof window === 'undefined') return

  const config = {
    publishableKey: STRIPE_LIVE_CONFIG.publishableKey,
    mode: STRIPE_LIVE_CONFIG.mode
  }

  localStorage.setItem('stripe-config', JSON.stringify(config))
  
  return config
}

export function hasStripeConfig(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const stored = localStorage.getItem('stripe-config')
    return !!stored
  } catch {
    return false
  }
}
