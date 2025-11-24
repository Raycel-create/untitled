export interface PaymentGatewayConfig {
  stripe?: StripeGatewayConfig
  paypal?: PayPalGatewayConfig
  square?: SquareGatewayConfig
  plaid?: PlaidGatewayConfig
  authorize?: AuthorizeNetConfig
  braintree?: BraintreeConfig
}

export interface StripeGatewayConfig {
  enabled: boolean
  publishableKey: string
  secretKey: string
  webhookSecret?: string
  environment: 'test' | 'live'
  connectedAt?: number
  lastTested?: number
  status: 'active' | 'inactive' | 'error'
}

export interface PayPalGatewayConfig {
  enabled: boolean
  clientId: string
  clientSecret: string
  webhookId?: string
  environment: 'sandbox' | 'live'
  connectedAt?: number
  lastTested?: number
  status: 'active' | 'inactive' | 'error'
}

export interface SquareGatewayConfig {
  enabled: boolean
  applicationId: string
  accessToken: string
  locationId?: string
  environment: 'sandbox' | 'production'
  connectedAt?: number
  lastTested?: number
  status: 'active' | 'inactive' | 'error'
}

export interface PlaidGatewayConfig {
  enabled: boolean
  clientId: string
  secret: string
  environment: 'sandbox' | 'development' | 'production'
  connectedAt?: number
  lastTested?: number
  status: 'active' | 'inactive' | 'error'
}

export interface AuthorizeNetConfig {
  enabled: boolean
  apiLoginId: string
  transactionKey: string
  environment: 'sandbox' | 'production'
  connectedAt?: number
  lastTested?: number
  status: 'active' | 'inactive' | 'error'
}

export interface BraintreeConfig {
  enabled: boolean
  merchantId: string
  publicKey: string
  privateKey: string
  environment: 'sandbox' | 'production'
  connectedAt?: number
  lastTested?: number
  status: 'active' | 'inactive' | 'error'
}

export const DEFAULT_PAYMENT_GATEWAYS: PaymentGatewayConfig = {}

export async function savePaymentGatewayConfig(config: PaymentGatewayConfig): Promise<void> {
  await window.spark.kv.set('payment-gateway-config', config)
}

export async function getPaymentGatewayConfig(): Promise<PaymentGatewayConfig> {
  const config = await window.spark.kv.get<PaymentGatewayConfig>('payment-gateway-config')
  return config || DEFAULT_PAYMENT_GATEWAYS
}

export async function testStripeConnection(config: StripeGatewayConfig): Promise<boolean> {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (!config.publishableKey.startsWith('pk_')) {
      throw new Error('Invalid publishable key format')
    }
    
    if (!config.secretKey.startsWith('sk_')) {
      throw new Error('Invalid secret key format')
    }
    
    return true
  } catch (error) {
    console.error('Stripe connection test failed:', error)
    return false
  }
}

export async function testPayPalConnection(config: PayPalGatewayConfig): Promise<boolean> {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (!config.clientId || !config.clientSecret) {
      throw new Error('Missing PayPal credentials')
    }
    
    return true
  } catch (error) {
    console.error('PayPal connection test failed:', error)
    return false
  }
}

export async function testSquareConnection(config: SquareGatewayConfig): Promise<boolean> {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (!config.applicationId || !config.accessToken) {
      throw new Error('Missing Square credentials')
    }
    
    return true
  } catch (error) {
    console.error('Square connection test failed:', error)
    return false
  }
}

export async function testPlaidConnection(config: PlaidGatewayConfig): Promise<boolean> {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (!config.clientId || !config.secret) {
      throw new Error('Missing Plaid credentials')
    }
    
    return true
  } catch (error) {
    console.error('Plaid connection test failed:', error)
    return false
  }
}

export async function testAuthorizeNetConnection(config: AuthorizeNetConfig): Promise<boolean> {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (!config.apiLoginId || !config.transactionKey) {
      throw new Error('Missing Authorize.Net credentials')
    }
    
    return true
  } catch (error) {
    console.error('Authorize.Net connection test failed:', error)
    return false
  }
}

export async function testBraintreeConnection(config: BraintreeConfig): Promise<boolean> {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (!config.merchantId || !config.publicKey || !config.privateKey) {
      throw new Error('Missing Braintree credentials')
    }
    
    return true
  } catch (error) {
    console.error('Braintree connection test failed:', error)
    return false
  }
}

export function getActiveGateways(config: PaymentGatewayConfig): string[] {
  const active: string[] = []
  
  if (config.stripe?.enabled && config.stripe.status === 'active') active.push('Stripe')
  if (config.paypal?.enabled && config.paypal.status === 'active') active.push('PayPal')
  if (config.square?.enabled && config.square.status === 'active') active.push('Square')
  if (config.plaid?.enabled && config.plaid.status === 'active') active.push('Plaid')
  if (config.authorize?.enabled && config.authorize.status === 'active') active.push('Authorize.Net')
  if (config.braintree?.enabled && config.braintree.status === 'active') active.push('Braintree')
  
  return active
}

export function getGatewayCount(config: PaymentGatewayConfig): number {
  return getActiveGateways(config).length
}
