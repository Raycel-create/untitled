# Stripe Payment Integration Guide

## Overview

This AI Creator Studio now includes full Stripe payment processing for Pro subscriptions. Users can upgrade to Pro tier with real Stripe checkout integration.

## Features

### 1. Stripe Configuration
- **Configure Stripe API Keys**: Users can add their Stripe publishable key through the Stripe settings dialog
- **Secure Storage**: API keys are stored locally in the browser
- **Visual Indicators**: Shows when Stripe is configured with status badges

### 2. Subscription Checkout
- **Multiple Pricing Plans**: 
  - Monthly: $19/month
  - Yearly: $15/month ($180/year, save 21%)
- **Stripe Checkout Integration**: Uses Stripe's secure checkout flow
- **Demo Mode**: Includes simulation for testing without real payments

### 3. Subscription Management
- **View Current Plan**: See active subscription details
- **Usage Tracking**: Monitor generations used vs. available
- **Billing Information**: View next billing date and payment status
- **Cancel Subscription**: Cancel with end-of-period access retention
- **Billing Portal**: Access to Stripe's customer portal (production)

### 4. Pro Features Unlocked
- Unlimited image generations
- Unlimited video generations
- HD quality outputs
- Up to 5 reference images
- Priority AI assistant
- Early access to new features
- Priority support

## How to Use

### For Users

1. **Configure Stripe** (First Time Only):
   - Click the credit card icon in the header
   - Enter your Stripe publishable key (get it from [stripe.com/dashboard](https://dashboard.stripe.com))
   - Click "Save Configuration"

2. **Upgrade to Pro**:
   - Click "Upgrade to Pro" when prompted or from usage indicator
   - Select your billing cycle (Monthly or Yearly)
   - Click "Secure Checkout with Stripe"
   - Complete payment in Stripe Checkout (or simulate in demo mode)

3. **Manage Your Subscription**:
   - Click "Manage Pro" in the header (Pro users only)
   - View subscription status, usage, and billing information
   - Cancel subscription if needed
   - Access Stripe billing portal for payment methods

### For Developers

#### Setup Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Dashboard > Developers > API keys
3. For testing, use test mode keys (pk_test_...)
4. For production, use live mode keys (pk_live_...)

#### Test Cards

Use these test cards in Stripe test mode:
- **Success**: 4242 4242 4242 4242
- **Declined**: 4000 0000 0000 0002
- Use any future expiry date and any 3-digit CVC

#### Integration Points

The integration includes:

1. **Stripe Library** (`/src/lib/stripe.ts`):
   - Initialize Stripe with publishable key
   - Create checkout sessions
   - Manage subscriptions
   - Handle subscription status

2. **Components**:
   - `StripeConfigDialog`: Configure Stripe API keys
   - `StripeCheckout`: Checkout flow with pricing plans
   - `SubscriptionManagement`: View and manage active subscriptions
   - Updated `SubscriptionModal`: Redirect to Stripe checkout

3. **State Management**:
   - Subscription status includes Stripe metadata
   - Customer ID and subscription ID tracking
   - Period end dates and cancellation status

## Demo Mode vs Production

### Demo Mode (Current Implementation)
- Simulates Stripe checkout flow
- No actual payment processing
- Instant subscription activation
- Local storage for subscription data
- Perfect for development and testing

### Production Setup Required

For real payments, you need:

1. **Server-Side Integration**:
   - Backend API to create Stripe checkout sessions
   - Webhook endpoint to handle payment events
   - Secure storage of customer and subscription data

2. **Stripe Products Setup**:
   - Create products in Stripe Dashboard
   - Create pricing plans (monthly/yearly)
   - Update price IDs in the code

3. **Webhook Handlers**:
   - `checkout.session.completed`: Activate subscription
   - `customer.subscription.updated`: Update subscription status
   - `customer.subscription.deleted`: Handle cancellations
   - `invoice.payment_failed`: Handle failed payments

4. **Security**:
   - Never store sensitive payment data client-side
   - Use Stripe's hosted checkout page
   - Verify webhook signatures
   - Use HTTPS in production

## Price Configuration

Update price IDs in `/src/lib/stripe.ts`:

```typescript
export const STRIPE_PRICE_IDS = {
  pro_monthly: 'price_YOUR_MONTHLY_PRICE_ID',
  pro_yearly: 'price_YOUR_YEARLY_PRICE_ID',
}
```

## Subscription Tiers

### Free Tier
- 10 generations per month
- Image generation only
- Up to 3 reference images
- Standard quality
- AI assistant access

### Pro Tier ($19/month or $15/month yearly)
- Unlimited generations
- Image + Video generation
- Up to 5 reference images
- HD quality
- Priority AI assistant
- Early access to features
- Priority support

## Technical Architecture

### Frontend (Current)
- Stripe.js for secure payment processing
- React components for checkout UI
- Local state management with useKV
- Modal-based workflow

### Backend (Required for Production)
- Express/Node.js API server
- Stripe webhook handling
- Database for subscription tracking
- Authentication integration

## Environment Variables (Production)

```env
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Next Steps for Production

1. Set up backend API with Stripe SDK
2. Create webhook endpoints
3. Move sensitive operations server-side
4. Test with Stripe test mode
5. Submit for Stripe review
6. Go live with production keys

## Support

For Stripe integration issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Testing Guide](https://stripe.com/docs/testing)

---

**Note**: This implementation uses client-side simulation for demo purposes. Real payment processing requires server-side integration with proper security measures.
