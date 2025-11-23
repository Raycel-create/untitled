export const STRIPE_LIVE_CONFIG = {
  secretKey: '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',
  publishableKey: '',
  mode: 'live' as const
}

export const STRIPE_PRICE_IDS = {
  pro_monthly: 'price_1SKFp5AMnqPgToIMdBH5z3xNm',
  pro_yearly: 'price_1SKFp5AMnqPgToIMxYz9K4Lp'
}

export function initializeStripeConfig() {
  if (typeof window === 'undefined') return

  const existingConfig = localStorage.getItem('stripe-config')
  
  if (STRIPE_LIVE_CONFIG.secretKey) {
    if (existingConfig) {
      try {
        const parsed = JSON.parse(existingConfig)
        
        if (!parsed.secretKey) {
          parsed.secretKey = STRIPE_LIVE_CONFIG.secretKey
          localStorage.setItem('stripe-config', JSON.stringify(parsed))
        }
        
        return parsed
      } catch {
        const config = {
          secretKey: STRIPE_LIVE_CONFIG.secretKey,
          needsPublishableKey: true,
          mode: STRIPE_LIVE_CONFIG.mode
        }
        
        localStorage.setItem('stripe-config', JSON.stringify(config))
        return config
      }
    } else {
      const config = {
        secretKey: STRIPE_LIVE_CONFIG.secretKey,
        publishableKey: STRIPE_LIVE_CONFIG.publishableKey || '',
        needsPublishableKey: !STRIPE_LIVE_CONFIG.publishableKey,
        mode: STRIPE_LIVE_CONFIG.mode
      }
      
      localStorage.setItem('stripe-config', JSON.stringify(config))
      return config
    }
  }

  if (existingConfig) {
    try {
      return JSON.parse(existingConfig)
    } catch {
      return null
    }
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
