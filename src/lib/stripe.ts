import { loadStripe, Stripe } from '@stripe/stripe-js'

export interface StripeConfig {
  publishableKey: string
  secretKey?: string
  webhookSecret?: string
}

export interface PaymentSession {
  sessionId: string
  url: string
}

export interface StripeSubscription {
  id: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
  currentPeriodEnd: number
  cancelAtPeriodEnd: boolean
  priceId: string
}

let stripePromise: Promise<Stripe | null> | null = null

export function initializeStripe(publishableKey: string): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey)
  }
  return stripePromise
}

export function resetStripe() {
  stripePromise = null
}

export function getStoredStripeConfig(): StripeConfig | null {
  try {
    const config = localStorage.getItem('stripe-config')
    return config ? JSON.parse(config) : null
  } catch {
    return null
  }
}

export function saveStripeConfig(config: StripeConfig) {
  localStorage.setItem('stripe-config', JSON.stringify(config))
}

export function clearStripeConfig() {
  localStorage.removeItem('stripe-config')
  resetStripe()
}

export const STRIPE_PRICE_IDS = {
  pro_monthly: 'price_pro_monthly',
  pro_yearly: 'price_pro_yearly',
}

export async function createCheckoutSession(
  priceId: string,
  userEmail: string,
  userId: string,
  publishableKey: string
): Promise<string | null> {
  try {
    const config = getStoredStripeConfig()
    
    if (!config || !config.publishableKey) {
      console.error('Stripe not configured')
      return null
    }

    const stripe = await initializeStripe(config.publishableKey)
    
    if (!stripe) {
      console.error('Failed to initialize Stripe')
      return null
    }

    const mockSessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const mockSession = {
      id: mockSessionId,
      url: `https://checkout.stripe.com/pay/${mockSessionId}`,
      status: 'open',
      priceId,
      userEmail,
      userId,
      createdAt: Date.now()
    }
    
    localStorage.setItem(`stripe-session-${mockSessionId}`, JSON.stringify(mockSession))
    
    return mockSession.url
  } catch (error) {
    console.error('Failed to create checkout session:', error)
    return null
  }
}

export async function createPortalSession(
  customerId: string,
  publishableKey: string
): Promise<string | null> {
  try {
    const mockPortalUrl = `https://billing.stripe.com/session/${Date.now()}`
    
    return mockPortalUrl
  } catch (error) {
    console.error('Failed to create portal session:', error)
    return null
  }
}

export async function getSubscriptionStatus(
  customerId: string,
  publishableKey: string
): Promise<StripeSubscription | null> {
  try {
    const subscriptionData = localStorage.getItem(`stripe-subscription-${customerId}`)
    
    if (!subscriptionData) {
      return null
    }
    
    return JSON.parse(subscriptionData)
  } catch (error) {
    console.error('Failed to get subscription status:', error)
    return null
  }
}

export function simulateSuccessfulPayment(sessionId: string, userId: string): StripeSubscription {
  const subscription: StripeSubscription = {
    id: `sub_${Date.now()}`,
    status: 'active',
    currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
    cancelAtPeriodEnd: false,
    priceId: STRIPE_PRICE_IDS.pro_monthly
  }
  
  localStorage.setItem(`stripe-subscription-${userId}`, JSON.stringify(subscription))
  
  return subscription
}

export function cancelSubscription(userId: string): StripeSubscription | null {
  try {
    const subscriptionData = localStorage.getItem(`stripe-subscription-${userId}`)
    
    if (!subscriptionData) {
      return null
    }
    
    const subscription: StripeSubscription = JSON.parse(subscriptionData)
    const updatedSubscription: StripeSubscription = {
      ...subscription,
      cancelAtPeriodEnd: true
    }
    
    localStorage.setItem(`stripe-subscription-${userId}`, JSON.stringify(updatedSubscription))
    
    return updatedSubscription
  } catch (error) {
    console.error('Failed to cancel subscription:', error)
    return null
  }
}

export function isSubscriptionActive(subscription: StripeSubscription | null): boolean {
  if (!subscription) return false
  
  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    return false
  }
  
  if (Date.now() > subscription.currentPeriodEnd) {
    return false
  }
  
  return true
}

export function formatSubscriptionStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'Active',
    canceled: 'Canceled',
    past_due: 'Past Due',
    trialing: 'Trial',
    incomplete: 'Incomplete'
  }
  
  return statusMap[status] || status
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  })
}
