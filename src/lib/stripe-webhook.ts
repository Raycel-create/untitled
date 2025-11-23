import { useKV } from '@github/spark/hooks'

export type WebhookEventType = 
  | 'checkout.session.completed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'

export interface WebhookEvent {
  id: string
  type: WebhookEventType
  data: any
  created: number
  processed: boolean
}

export interface WebhookLog {
  id: string
  eventType: WebhookEventType
  status: 'success' | 'error'
  timestamp: number
  data: any
  error?: string
}

export interface StripeWebhookPayload {
  id: string
  object: string
  type: WebhookEventType
  created: number
  data: {
    object: any
  }
}

export async function processWebhookEvent(
  payload: StripeWebhookPayload,
  onSubscriptionUpdate: (userId: string, subscriptionData: any) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Processing webhook event: ${payload.type}`, payload.id)

    switch (payload.type) {
      case 'checkout.session.completed':
        return await handleCheckoutCompleted(payload.data.object, onSubscriptionUpdate)

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        return await handleSubscriptionUpdate(payload.data.object, onSubscriptionUpdate)

      case 'customer.subscription.deleted':
        return await handleSubscriptionDeleted(payload.data.object, onSubscriptionUpdate)

      case 'invoice.payment_succeeded':
        return await handlePaymentSucceeded(payload.data.object, onSubscriptionUpdate)

      case 'invoice.payment_failed':
        return await handlePaymentFailed(payload.data.object, onSubscriptionUpdate)

      default:
        console.log(`Unhandled webhook event type: ${payload.type}`)
        return { success: true }
    }
  } catch (error) {
    console.error('Webhook processing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function handleCheckoutCompleted(
  session: any,
  onSubscriptionUpdate: (userId: string, subscriptionData: any) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = session.client_reference_id || session.metadata?.userId
    const customerId = session.customer
    const subscriptionId = session.subscription

    if (!userId) {
      return { success: false, error: 'No user ID in session' }
    }

    const subscriptionData = {
      id: subscriptionId,
      customerId: customerId,
      status: 'active',
      currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
      cancelAtPeriodEnd: false,
      priceId: session.metadata?.priceId || 'price_pro_monthly'
    }

    onSubscriptionUpdate(userId, subscriptionData)

    console.log(`Checkout completed for user ${userId}`)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to handle checkout'
    }
  }
}

async function handleSubscriptionUpdate(
  subscription: any,
  onSubscriptionUpdate: (userId: string, subscriptionData: any) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = subscription.metadata?.userId
    const customerId = subscription.customer

    if (!userId) {
      return { success: false, error: 'No user ID in subscription metadata' }
    }

    const subscriptionData = {
      id: subscription.id,
      customerId: customerId,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end * 1000,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      priceId: subscription.items?.data?.[0]?.price?.id || 'price_pro_monthly'
    }

    onSubscriptionUpdate(userId, subscriptionData)

    console.log(`Subscription updated for user ${userId}: ${subscription.status}`)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update subscription'
    }
  }
}

async function handleSubscriptionDeleted(
  subscription: any,
  onSubscriptionUpdate: (userId: string, subscriptionData: any) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = subscription.metadata?.userId

    if (!userId) {
      return { success: false, error: 'No user ID in subscription metadata' }
    }

    const subscriptionData = {
      id: subscription.id,
      customerId: subscription.customer,
      status: 'canceled',
      currentPeriodEnd: subscription.current_period_end * 1000,
      cancelAtPeriodEnd: true,
      priceId: subscription.items?.data?.[0]?.price?.id || 'price_pro_monthly'
    }

    onSubscriptionUpdate(userId, subscriptionData)

    console.log(`Subscription deleted for user ${userId}`)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete subscription'
    }
  }
}

async function handlePaymentSucceeded(
  invoice: any,
  onSubscriptionUpdate: (userId: string, subscriptionData: any) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    const subscriptionId = invoice.subscription
    const customerId = invoice.customer

    console.log(`Payment succeeded for subscription ${subscriptionId}`)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to handle payment success'
    }
  }
}

async function handlePaymentFailed(
  invoice: any,
  onSubscriptionUpdate: (userId: string, subscriptionData: any) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    const subscriptionId = invoice.subscription
    const customerId = invoice.customer

    console.log(`Payment failed for subscription ${subscriptionId}`)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to handle payment failure'
    }
  }
}

export function logWebhookEvent(event: WebhookLog) {
  const logs = getWebhookLogs()
  logs.unshift(event)
  
  const maxLogs = 100
  const trimmedLogs = logs.slice(0, maxLogs)
  
  localStorage.setItem('stripe-webhook-logs', JSON.stringify(trimmedLogs))
}

export function getWebhookLogs(): WebhookLog[] {
  try {
    const logs = localStorage.getItem('stripe-webhook-logs')
    return logs ? JSON.parse(logs) : []
  } catch {
    return []
  }
}

export function clearWebhookLogs() {
  localStorage.removeItem('stripe-webhook-logs')
}

export function simulateWebhook(
  eventType: WebhookEventType,
  userId: string,
  metadata: any = {}
): StripeWebhookPayload {
  const baseEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    object: 'event',
    type: eventType,
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {}
    }
  }

  switch (eventType) {
    case 'checkout.session.completed':
      baseEvent.data.object = {
        id: `cs_${Date.now()}`,
        object: 'checkout.session',
        client_reference_id: userId,
        customer: `cus_${Date.now()}`,
        subscription: `sub_${Date.now()}`,
        payment_status: 'paid',
        metadata: {
          userId,
          priceId: metadata.priceId || 'price_pro_monthly'
        }
      }
      break

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      baseEvent.data.object = {
        id: `sub_${Date.now()}`,
        object: 'subscription',
        customer: `cus_${Date.now()}`,
        status: metadata.status || 'active',
        current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
        cancel_at_period_end: metadata.cancelAtPeriodEnd || false,
        items: {
          data: [{
            price: {
              id: metadata.priceId || 'price_pro_monthly'
            }
          }]
        },
        metadata: {
          userId
        }
      }
      break

    case 'customer.subscription.deleted':
      baseEvent.data.object = {
        id: metadata.subscriptionId || `sub_${Date.now()}`,
        object: 'subscription',
        customer: metadata.customerId || `cus_${Date.now()}`,
        status: 'canceled',
        current_period_end: Math.floor(Date.now() / 1000),
        cancel_at_period_end: true,
        items: {
          data: [{
            price: {
              id: metadata.priceId || 'price_pro_monthly'
            }
          }]
        },
        metadata: {
          userId
        }
      }
      break

    case 'invoice.payment_succeeded':
      baseEvent.data.object = {
        id: `in_${Date.now()}`,
        object: 'invoice',
        customer: metadata.customerId || `cus_${Date.now()}`,
        subscription: metadata.subscriptionId || `sub_${Date.now()}`,
        amount_paid: metadata.amount || 1900,
        status: 'paid'
      }
      break

    case 'invoice.payment_failed':
      baseEvent.data.object = {
        id: `in_${Date.now()}`,
        object: 'invoice',
        customer: metadata.customerId || `cus_${Date.now()}`,
        subscription: metadata.subscriptionId || `sub_${Date.now()}`,
        amount_due: metadata.amount || 1900,
        status: 'open'
      }
      break
  }

  return baseEvent as StripeWebhookPayload
}
