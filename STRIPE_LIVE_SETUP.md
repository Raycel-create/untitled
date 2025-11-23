# Stripe Live Mode Setup Guide

## Current Configuration

Your Stripe account is partially configured with the following:

**Secret Key (Backend)**: `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`

⚠️ **Security Notice**: This secret key is for server-side use only and should NEVER be exposed in client code.

## Required: Get Your Publishable Key

To complete the setup, you need your **Publishable Key**:

1. Go to [Stripe Dashboard - API Keys](https://dashboard.stripe.com/apikeys)
2. Make sure you're viewing **Live mode** keys (toggle in top-right)
3. Find "Publishable key" (starts with `pk_live_51SKFp5AMnqPgToIM...`)
4. Click "Reveal live key token"
5. Copy the full key

## Setup Instructions

### Option 1: Quick Setup (In-App Banner)

1. Launch the app and look for the purple Stripe setup banner
2. Click "Complete Setup"
3. Paste your publishable key (from step above)
4. Click "Save"

### Option 2: Manual Configuration

1. Click the credit card icon (💳) in the top-right toolbar
2. Click "Complete Setup" in the banner
3. Enter your publishable key
4. Click "Save Configuration"

## Creating Products & Prices

Before accepting payments, create your subscription products:

1. Go to [Stripe Dashboard - Products](https://dashboard.stripe.com/products)
2. Click "+ Add product"
3. Configure your Pro subscription:
   - **Name**: "AI Creator Studio Pro"
   - **Description**: "Unlimited AI generation, video creation, advanced features"
   - **Pricing**: 
     - Monthly: $29/month (or your preferred price)
     - Yearly: $290/year (or your preferred price)
   - **Billing period**: Recurring
4. After creating, copy the **Price ID** (starts with `price_`)

## Update Price IDs

After creating products, update the price IDs in the app:

In `src/lib/stripe.ts`, update line 53-56:

```typescript
export const STRIPE_PRICE_IDS = {
  pro_monthly: 'price_YOUR_MONTHLY_PRICE_ID',  // Replace with actual price ID
  pro_yearly: 'price_YOUR_YEARLY_PRICE_ID',    // Replace with actual price ID
}
```

## Testing Payments (Live Mode)

⚠️ **Important**: You're in LIVE mode. Real cards will be charged!

For testing, use Stripe's test mode:
1. Switch to test mode in dashboard (toggle top-right)
2. Get your test publishable key (`pk_test_...`)
3. Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

## Webhook Setup (Recommended)

For production-ready payment processing:

1. Go to [Stripe Dashboard - Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "+ Add endpoint"
3. Enter your endpoint URL: `https://your-domain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret (starts with `whsec_`)
6. Add it to your Stripe configuration in the app

## Current Features

✅ **Working Now:**
- Stripe SDK initialized with your secret key
- Client-side checkout integration ready
- Subscription management UI built
- Local simulation mode (for development)

⏳ **Needs Publishable Key:**
- Actual payment processing
- Real checkout sessions
- Live customer portal
- Production subscriptions

## Security Best Practices

1. **Never commit secret keys** to version control
2. **Use environment variables** for production deployments
3. **Enable webhook signature verification** for production
4. **Use HTTPS** for all payment pages
5. **Store keys in secure backend** (not localStorage for production)

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Test Card Numbers](https://stripe.com/docs/testing)

## Next Steps

1. ✅ Get publishable key from dashboard
2. ✅ Complete setup using in-app banner
3. ⏳ Create products and prices
4. ⏳ Update price IDs in code
5. ⏳ Test checkout flow
6. ⏳ Set up webhooks (optional but recommended)
7. ⏳ Deploy to production with HTTPS
