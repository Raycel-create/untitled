# Stripe Server-Side Integration Guide

## Overview

This document provides a complete guide for implementing real Stripe payment processing with server-side API integration for AI Creator Studio.

## Architecture

```
Frontend (Spark App)
    ↓
Server API (Node.js/Express)
    ↓
Stripe API
    ↓
Webhooks → Server → Update Database
```

## Prerequisites

1. **Stripe Account**: Sign up at [stripe.com](https://stripe.com)
2. **API Keys**: Get from Stripe Dashboard > Developers > API keys
3. **Node.js Server**: Express.js or similar backend
4. **Database**: PostgreSQL, MongoDB, or similar
5. **HTTPS**: Required for production webhooks

## Backend Server Implementation

### 1. Server Setup (`server.js`)

```javascript
// server.js
const express = require('express')
const cors = require('cors')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const bodyParser = require('body-parser')

const app = express()

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

// Stripe webhook endpoint needs raw body
app.post('/api/webhooks/stripe',
  bodyParser.raw({ type: 'application/json' }),
  handleStripeWebhook
)

// JSON middleware for other routes
app.use(express.json())

// Routes
app.post('/api/create-checkout-session', createCheckoutSession)
app.post('/api/retrieve-checkout-session', retrieveCheckoutSession)
app.post('/api/cancel-subscription', cancelSubscription)
app.post('/api/create-portal-session', createPortalSession)
app.get('/api/subscription/:userId', getSubscription)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

### 2. Create Checkout Session

```javascript
// routes/checkout.js
async function createCheckoutSession(req, res) {
  try {
    const { priceId, userId, userEmail, successUrl, cancelUrl, mode, metadata } = req.body

    // Validate inputs
    if (!priceId || !userId || !userEmail) {
      return res.status(400).json({
        error: 'Missing required fields'
      })
    }

    // Create or retrieve customer
    let customer
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    })

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId: userId
        }
      })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      client_reference_id: userId,
      mode: mode || 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
        ...metadata
      },
      subscription_data: mode === 'subscription' ? {
        metadata: {
          userId: userId
        }
      } : undefined,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    })

    res.json({
      session: {
        id: session.id,
        url: session.url,
        status: session.status
      }
    })
  } catch (error) {
    console.error('Checkout session error:', error)
    res.status(500).json({
      error: error.message
    })
  }
}
```

### 3. Retrieve Checkout Session

```javascript
async function retrieveCheckoutSession(req, res) {
  try {
    const { sessionId } = req.body

    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID required'
      })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    })

    res.json({
      session: {
        id: session.id,
        status: session.status,
        customerId: session.customer?.id,
        subscriptionId: session.subscription?.id
      }
    })
  } catch (error) {
    console.error('Retrieve session error:', error)
    res.status(500).json({
      error: error.message
    })
  }
}
```

### 4. Webhook Handler

```javascript
// routes/webhooks.js
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature']
  let event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    res.status(500).json({ error: error.message })
  }
}

async function handleCheckoutCompleted(session) {
  const userId = session.client_reference_id || session.metadata?.userId
  const customerId = session.customer
  const subscriptionId = session.subscription

  // Update database
  await db.updateUser(userId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    subscriptionStatus: 'active',
    subscriptionTier: 'pro',
    currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000
  })

  console.log(`✅ Checkout completed for user ${userId}`)
}

async function handleSubscriptionUpdate(subscription) {
  const userId = subscription.metadata?.userId
  
  if (!userId) {
    console.error('No userId in subscription metadata')
    return
  }

  await db.updateUser(userId, {
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    subscriptionTier: subscription.status === 'active' ? 'pro' : 'free',
    currentPeriodStart: subscription.current_period_start * 1000,
    currentPeriodEnd: subscription.current_period_end * 1000,
    cancelAtPeriodEnd: subscription.cancel_at_period_end
  })

  console.log(`✅ Subscription updated for user ${userId}: ${subscription.status}`)
}

async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata?.userId
  
  if (!userId) {
    console.error('No userId in subscription metadata')
    return
  }

  await db.updateUser(userId, {
    subscriptionStatus: 'canceled',
    subscriptionTier: 'free',
    cancelAtPeriodEnd: true
  })

  console.log(`✅ Subscription deleted for user ${userId}`)
}

async function handlePaymentSucceeded(invoice) {
  console.log(`✅ Payment succeeded: ${invoice.id}`)
}

async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer
  
  // Notify user of failed payment
  console.log(`❌ Payment failed for customer: ${customerId}`)
}
```

### 5. Cancel Subscription

```javascript
async function cancelSubscription(req, res) {
  try {
    const { subscriptionId, immediately } = req.body

    if (!subscriptionId) {
      return res.status(400).json({
        error: 'Subscription ID required'
      })
    }

    let subscription
    if (immediately) {
      // Cancel immediately
      subscription = await stripe.subscriptions.cancel(subscriptionId)
    } else {
      // Cancel at period end
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      })
    }

    res.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end * 1000
      }
    })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    res.status(500).json({
      error: error.message
    })
  }
}
```

### 6. Customer Portal

```javascript
async function createPortalSession(req, res) {
  try {
    const { customerId, returnUrl } = req.body

    if (!customerId) {
      return res.status(400).json({
        error: 'Customer ID required'
      })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    res.json({
      url: session.url
    })
  } catch (error) {
    console.error('Portal session error:', error)
    res.status(500).json({
      error: error.message
    })
  }
}
```

### 7. Get Subscription

```javascript
async function getSubscription(req, res) {
  try {
    const { userId } = req.params

    // Get from database
    const user = await db.getUser(userId)
    
    if (!user || !user.stripeSubscriptionId) {
      return res.json({ subscription: null })
    }

    // Optionally fetch fresh data from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId
    )

    res.json({
      subscription: {
        id: subscription.id,
        customerId: subscription.customer,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start * 1000,
        currentPeriodEnd: subscription.current_period_end * 1000,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        priceId: subscription.items.data[0].price.id
      }
    })
  } catch (error) {
    console.error('Get subscription error:', error)
    res.status(500).json({
      error: error.message
    })
  }
}
```

## Database Schema

```sql
-- PostgreSQL Example
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  
  -- Stripe fields
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'free',
  subscription_tier VARCHAR(50) DEFAULT 'free',
  current_period_start BIGINT,
  current_period_end BIGINT,
  cancel_at_period_end BOOLEAN DEFAULT false,
  
  -- Usage tracking
  generations_used INTEGER DEFAULT 0,
  generations_limit INTEGER DEFAULT 10,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE webhook_events (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  processed BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_users_subscription ON users(stripe_subscription_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed, created_at);
```

## Environment Variables

```bash
# .env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-app.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Pricing
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...

# Database
DATABASE_URL=postgresql://user:pass@localhost/dbname
```

## Stripe Dashboard Setup

### 1. Create Products

1. Go to Stripe Dashboard > Products
2. Click "Add product"
3. Create "Pro Monthly":
   - Name: "AI Creator Studio Pro"
   - Description: "Unlimited generations and premium features"
   - Pricing: $19/month recurring
   - Copy the Price ID (starts with `price_`)

4. Add another price for yearly:
   - Click "Add another price"
   - Amount: $180/year ($15/month)
   - Copy the Price ID

### 2. Configure Webhooks

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. URL: `https://your-api.com/api/webhooks/stripe`
4. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the Webhook Signing Secret (starts with `whsec_`)

### 3. Test Mode

- Use test API keys (prefix `pk_test_` and `sk_test_`)
- Use test webhook endpoint
- Test cards: 4242 4242 4242 4242

### 4. Production

- Switch to live API keys
- Update webhook endpoint to production URL
- Stripe will review your integration

## Frontend Integration

Update the frontend to use your API endpoint:

```typescript
// In your Spark app
await window.spark.kv.set('stripe-api-endpoint', 'https://your-api.com/api')
```

The existing Stripe components will automatically use the server API when configured.

## Security Best Practices

1. **Never expose secret keys** - Keep them server-side only
2. **Verify webhook signatures** - Always verify with the webhook secret
3. **Use HTTPS** - Required for production
4. **Validate user IDs** - Ensure authenticated users can only access their data
5. **Rate limiting** - Implement on API endpoints
6. **Error handling** - Never expose internal errors to clients
7. **Audit logs** - Log all payment-related activities
8. **PCI compliance** - Never store card details

## Testing

### Test Cards

```
Success: 4242 4242 4242 4242
Declined: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

### Testing Webhooks Locally

Use Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# Trigger test webhook
stripe trigger checkout.session.completed
```

## Deployment

### Option 1: Vercel/Netlify Functions

Deploy serverless functions for each endpoint.

### Option 2: Railway/Render

Deploy full Express server.

### Option 3: AWS Lambda

Use AWS Lambda with API Gateway.

### Option 4: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

## Monitoring

1. **Stripe Dashboard** - Monitor payments and subscriptions
2. **Server Logs** - Track API calls and errors
3. **Error Tracking** - Use Sentry or similar
4. **Uptime Monitoring** - Use Pingdom or similar

## Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Webhooks Guide](https://stripe.com/docs/webhooks)

## Troubleshooting

### Webhook not firing

- Check webhook URL is accessible
- Verify HTTPS is enabled
- Check webhook secret is correct
- View webhook logs in Stripe Dashboard

### Payment not completing

- Check API keys are correct
- Verify price IDs match products
- Check for JavaScript errors
- Test with test cards first

### Subscription not updating

- Verify webhook handler is processing events
- Check database is updating correctly
- Review webhook logs for errors
- Ensure user ID is in metadata

## Next Steps

1. Set up server with endpoints above
2. Configure Stripe products and prices
3. Set up webhooks
4. Test with Stripe test mode
5. Configure production environment
6. Go live!
