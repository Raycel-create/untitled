import { loadStripe, Stripe } from '@stripe/stripe-js'

export interface StripeConfig {
  publishableKey: string
  mode: 'test' | 'live'
}

export interface CheckoutSession {
  id: string
  url: string
  status: 'open' | 'complete' | 'expired'
  customerId?: string
  subscriptionId?: string
}

export interface SubscriptionData {
  id: string
  customerId: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid'
  currentPeriodStart: number
  currentPeriodEnd: number
  cancelAtPeriodEnd: boolean
  priceId: string
  quantity: number
  metadata?: Record<string, string>
}

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  clientSecret: string
}

let stripeInstance: Stripe | null = null

export async function initializeStripeSDK(publishableKey: string): Promise<Stripe | null> {
  if (stripeInstance) {
    return stripeInstance
  }

  try {
    stripeInstance = await loadStripe(publishableKey)
    return stripeInstance
  } catch (error) {
    console.error('Failed to initialize Stripe:', error)
    return null
  }
}

export function resetStripeSDK() {
  stripeInstance = null
}

export async function createCheckoutSession(
  config: StripeConfig,
  params: {
    priceId: string
    userId: string
    userEmail: string
    successUrl: string
    cancelUrl: string
    mode?: 'payment' | 'subscription' | 'setup'
    metadata?: Record<string, string>
  }
): Promise<CheckoutSession | null> {
  try {
    const apiEndpoint = await getStripeAPIEndpoint()
    
    if (!apiEndpoint) {
      console.error('Stripe API endpoint not configured')
      return simulateCheckoutSession(params)
    }

    const response = await fetch(`${apiEndpoint}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publishableKey: config.publishableKey,
        priceId: params.priceId,
        userId: params.userId,
        userEmail: params.userEmail,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        mode: params.mode || 'subscription',
        metadata: {
          ...params.metadata,
          userId: params.userId,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.session
  } catch (error) {
    console.error('Failed to create checkout session:', error)
    return simulateCheckoutSession(params)
  }
}

function simulateCheckoutSession(params: {
  priceId: string
  userId: string
  userEmail: string
  successUrl: string
  cancelUrl: string
}): CheckoutSession {
  const sessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  
  const session: CheckoutSession = {
    id: sessionId,
    url: `${window.location.origin}/#stripe-checkout?session_id=${sessionId}`,
    status: 'open'
  }

  const sessionData = {
    ...session,
    priceId: params.priceId,
    userId: params.userId,
    userEmail: params.userEmail,
    successUrl: params.successUrl,
    cancelUrl: params.cancelUrl,
    createdAt: Date.now()
  }

  localStorage.setItem(`stripe-checkout-session-${sessionId}`, JSON.stringify(sessionData))
  
  return session
}

export async function retrieveCheckoutSession(
  sessionId: string,
  config: StripeConfig
): Promise<CheckoutSession | null> {
  try {
    const apiEndpoint = await getStripeAPIEndpoint()
    
    if (!apiEndpoint) {
      return retrieveLocalCheckoutSession(sessionId)
    }

    const response = await fetch(`${apiEndpoint}/retrieve-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publishableKey: config.publishableKey,
        sessionId
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.session
  } catch (error) {
    console.error('Failed to retrieve checkout session:', error)
    return retrieveLocalCheckoutSession(sessionId)
  }
}

function retrieveLocalCheckoutSession(sessionId: string): CheckoutSession | null {
  try {
    const sessionData = localStorage.getItem(`stripe-checkout-session-${sessionId}`)
    if (!sessionData) {
      return null
    }
    
    const session = JSON.parse(sessionData)
    return {
      id: session.id,
      url: session.url,
      status: session.status,
      customerId: session.customerId,
      subscriptionId: session.subscriptionId
    }
  } catch (error) {
    console.error('Failed to retrieve local session:', error)
    return null
  }
}

export async function completeCheckoutSession(
  sessionId: string,
  userId: string
): Promise<SubscriptionData | null> {
  try {
    const sessionData = localStorage.getItem(`stripe-checkout-session-${sessionId}`)
    if (!sessionData) {
      return null
    }

    const session = JSON.parse(sessionData)
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    const customerId = `cus_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    const subscription: SubscriptionData = {
      id: subscriptionId,
      customerId: customerId,
      status: 'active',
      currentPeriodStart: Date.now(),
      currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
      cancelAtPeriodEnd: false,
      priceId: session.priceId,
      quantity: 1,
      metadata: {
        userId: userId,
        createdVia: 'checkout'
      }
    }

    await window.spark.kv.set(`stripe-subscription-${userId}`, subscription)
    
    session.status = 'complete'
    session.subscriptionId = subscriptionId
    session.customerId = customerId
    localStorage.setItem(`stripe-checkout-session-${sessionId}`, JSON.stringify(session))

    return subscription
  } catch (error) {
    console.error('Failed to complete checkout session:', error)
    return null
  }
}

export async function retrieveSubscription(
  userId: string,
  config: StripeConfig
): Promise<SubscriptionData | null> {
  try {
    const subscription = await window.spark.kv.get<SubscriptionData>(`stripe-subscription-${userId}`)
    
    if (!subscription) {
      return null
    }

    if (Date.now() > subscription.currentPeriodEnd && subscription.status === 'active') {
      subscription.status = 'past_due'
      await window.spark.kv.set(`stripe-subscription-${userId}`, subscription)
    }

    return subscription
  } catch (error) {
    console.error('Failed to retrieve subscription:', error)
    return null
  }
}

export async function cancelSubscription(
  userId: string,
  subscriptionId: string,
  config: StripeConfig,
  immediately: boolean = false
): Promise<SubscriptionData | null> {
  try {
    const apiEndpoint = await getStripeAPIEndpoint()
    
    if (!apiEndpoint) {
      return cancelLocalSubscription(userId, immediately)
    }

    const response = await fetch(`${apiEndpoint}/cancel-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publishableKey: config.publishableKey,
        subscriptionId,
        immediately
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const data = await response.json()
    await window.spark.kv.set(`stripe-subscription-${userId}`, data.subscription)
    
    return data.subscription
  } catch (error) {
    console.error('Failed to cancel subscription:', error)
    return cancelLocalSubscription(userId, immediately)
  }
}

async function cancelLocalSubscription(
  userId: string,
  immediately: boolean
): Promise<SubscriptionData | null> {
  try {
    const subscription = await window.spark.kv.get<SubscriptionData>(`stripe-subscription-${userId}`)
    
    if (!subscription) {
      return null
    }

    if (immediately) {
      subscription.status = 'canceled'
      subscription.currentPeriodEnd = Date.now()
    } else {
      subscription.cancelAtPeriodEnd = true
    }

    await window.spark.kv.set(`stripe-subscription-${userId}`, subscription)
    
    return subscription
  } catch (error) {
    console.error('Failed to cancel local subscription:', error)
    return null
  }
}

export async function reactivateSubscription(
  userId: string,
  subscriptionId: string,
  config: StripeConfig
): Promise<SubscriptionData | null> {
  try {
    const subscription = await window.spark.kv.get<SubscriptionData>(`stripe-subscription-${userId}`)
    
    if (!subscription) {
      return null
    }

    subscription.cancelAtPeriodEnd = false
    if (subscription.status === 'canceled' && Date.now() < subscription.currentPeriodEnd) {
      subscription.status = 'active'
    }

    await window.spark.kv.set(`stripe-subscription-${userId}`, subscription)
    
    return subscription
  } catch (error) {
    console.error('Failed to reactivate subscription:', error)
    return null
  }
}

export async function createCustomerPortalSession(
  customerId: string,
  config: StripeConfig,
  returnUrl: string
): Promise<string | null> {
  try {
    const apiEndpoint = await getStripeAPIEndpoint()
    
    if (!apiEndpoint) {
      return `https://billing.stripe.com/p/login/test_${Date.now()}`
    }

    const response = await fetch(`${apiEndpoint}/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publishableKey: config.publishableKey,
        customerId,
        returnUrl
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.url
  } catch (error) {
    console.error('Failed to create portal session:', error)
    return `https://billing.stripe.com/p/login/test_${Date.now()}`
  }
}

async function getStripeAPIEndpoint(): Promise<string | null> {
  try {
    const endpoint = await window.spark.kv.get<string>('stripe-api-endpoint')
    return endpoint || null
  } catch {
    return null
  }
}

export async function setStripeAPIEndpoint(endpoint: string): Promise<void> {
  try {
    await window.spark.kv.set('stripe-api-endpoint', endpoint)
  } catch (error) {
    console.error('Failed to set API endpoint:', error)
  }
}

export function validateStripeKey(key: string): { valid: boolean; mode: 'test' | 'live' | null } {
  if (!key || typeof key !== 'string') {
    return { valid: false, mode: null }
  }

  if (key.startsWith('pk_test_')) {
    return { valid: true, mode: 'test' }
  }

  if (key.startsWith('pk_live_')) {
    return { valid: true, mode: 'live' }
  }

  return { valid: false, mode: null }
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100)
}

export function formatSubscriptionStatus(status: SubscriptionData['status']): {
  label: string
  color: 'success' | 'warning' | 'error' | 'info'
} {
  const statusMap: Record<SubscriptionData['status'], { label: string; color: 'success' | 'warning' | 'error' | 'info' }> = {
    active: { label: 'Active', color: 'success' },
    trialing: { label: 'Trial', color: 'info' },
    past_due: { label: 'Past Due', color: 'warning' },
    canceled: { label: 'Canceled', color: 'error' },
    incomplete: { label: 'Incomplete', color: 'warning' },
    incomplete_expired: { label: 'Expired', color: 'error' },
    unpaid: { label: 'Unpaid', color: 'error' },
  }

  return statusMap[status] || { label: status, color: 'info' }
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}
