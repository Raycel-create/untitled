export const STRIPE_LIVE_CONFIG = {
  secretKey: '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',
  publishableKey: '',
  mode: 'live' as const
}

export const STRIPE_PRICE_IDS = {
  pro_monthly: 'price_1XXXXXXXXXXXXXXXXX',
  pro_yearly: 'price_1XXXXXXXXXXXXXXXXX'
}

export function initializeStripeConfig() {
  if (typeof window === 'undefined') return

  const existingConfig = localStorage.getItem('stripe-config')
  if (existingConfig) {
    try {
      return JSON.parse(existingConfig)
    } catch {
      return null
    }
  }

  if (STRIPE_LIVE_CONFIG.secretKey && !STRIPE_LIVE_CONFIG.publishableKey) {
    const config = {
      secretKey: STRIPE_LIVE_CONFIG.secretKey,
      needsPublishableKey: true,
      mode: STRIPE_LIVE_CONFIG.mode
    }
    
    localStorage.setItem('stripe-config', JSON.stringify(config))
    return config
  }

  if (STRIPE_LIVE_CONFIG.publishableKey) {
    const config = {
      publishableKey: STRIPE_LIVE_CONFIG.publishableKey,
      secretKey: STRIPE_LIVE_CONFIG.secretKey,
      mode: STRIPE_LIVE_CONFIG.mode
    }

    localStorage.setItem('stripe-config', JSON.stringify(config))
    return config
  }
  
  return null
}

export function hasStripeConfig(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const stored = localStorage.getItem('stripe-config')
    if (!stored) return false
    
    const config = JSON.parse(stored)
    return !!config.publishableKey
  } catch {
    return false
  }
}

export function hasStripeSecretKey(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const stored = localStorage.getItem('stripe-config')
    if (!stored) return !!STRIPE_LIVE_CONFIG.secretKey
    
    const config = JSON.parse(stored)
    return !!config.secretKey || !!STRIPE_LIVE_CONFIG.secretKey
  } catch {
    return !!STRIPE_LIVE_CONFIG.secretKey
  }
}

export function needsPublishableKey(): boolean {
  if (typeof window === 'undefined') return false
  
  return hasStripeSecretKey() && !hasStripeConfig()
}
