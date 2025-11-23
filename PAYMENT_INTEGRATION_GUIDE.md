# Real Stripe Payment Integration - Quick Start

## Overview

AI Creator Studio now supports **real Stripe payment processing** with server-side API integration. This guide will help you go from demo mode to production-ready payments.

## Current State: Demo Mode

By default, the app runs in **demo mode** which simulates payments without real Stripe processing. This is perfect for development and testing.

### Demo Mode Features:
- ✅ Full UI/UX flow
- ✅ Subscription management interface
- ✅ Usage tracking and limits
- ✅ All Pro features accessible after "payment"
- ❌ No actual charges
- ❌ No real Stripe checkout
- ❌ No webhook processing

## Upgrade to Production: Step-by-Step

### Step 1: Configure Stripe Keys

1. **Get your Stripe API keys**:
   - Sign up at [stripe.com](https://stripe.com)
   - Go to Dashboard > Developers > API keys
   - Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)

2. **Add keys to the app**:
   - Click the credit card icon (💳) in the header
   - Paste your Publishable key
   - Click "Save Configuration"

### Step 2: Set Up Backend Server

You need a server to handle payments securely. We provide a complete implementation guide.

**Choose your deployment**:

#### Option A: Quick Deploy (Recommended)

Use our provided server template:

```bash
# Clone the server template
git clone https://github.com/your-org/ai-creator-studio-server
cd ai-creator-studio-server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Stripe keys

# Run locally
npm run dev

# Deploy to Railway/Render/Vercel
# (See deployment section in STRIPE_SERVER_SETUP.md)
```

#### Option B: Manual Setup

Follow the complete guide in `STRIPE_SERVER_SETUP.md` to:
- Set up Express.js server
- Implement Stripe checkout endpoints
- Configure webhook handlers
- Set up database
- Deploy to production

### Step 3: Create Stripe Products

1. Go to Stripe Dashboard > Products
2. Click "Add product"
3. Create two products:

**Monthly Plan**:
- Name: "AI Creator Studio Pro - Monthly"
- Price: $19/month
- Recurring
- Copy the Price ID

**Yearly Plan**:
- Name: "AI Creator Studio Pro - Yearly"
- Price: $180/year ($15/month)
- Recurring
- Copy the Price ID

4. Update price IDs in `src/components/StripeCheckout.tsx`:

```typescript
const STRIPE_PRICE_IDS = {
  pro_monthly: 'price_YOUR_MONTHLY_ID_HERE',
  pro_yearly: 'price_YOUR_YEARLY_ID_HERE',
}
```

### Step 4: Configure Webhooks

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Enter your server URL: `https://your-api.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the Webhook Signing Secret

### Step 5: Connect App to Server

1. **In the app**, click the gear icon (⚙️) in the header
2. Go to "Stripe API" tab
3. Enter your API endpoint URL: `https://your-api.com/api`
4. Click "Test Connection" to verify
5. Click "Save Endpoint"

🎉 **You're now live!** The app will use real Stripe checkout for payments.

## Testing Before Going Live

### Test Mode

1. Use test API keys (prefix `pk_test_` and `sk_test_`)
2. Test with these cards:
   - **Success**: 4242 4242 4242 4242
   - **Declined**: 4000 0000 0000 0002
   - **3D Secure**: 4000 0025 0000 3155
3. Use any future expiry date and any 3-digit CVC

### Test Webhooks Locally

Use Stripe CLI:

```bash
# Install
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# In another terminal, trigger events
stripe trigger checkout.session.completed
```

## Architecture

```
┌─────────────────────────┐
│   Spark Frontend App    │
│   (React + TypeScript)  │
└────────────┬────────────┘
             │
             │ HTTPS
             ▼
┌─────────────────────────┐
│   Your Backend Server   │
│   (Node.js + Express)   │
└────────────┬────────────┘
             │
             │ Stripe SDK
             ▼
┌─────────────────────────┐
│     Stripe API          │
│   (Payment Processing)  │
└────────────┬────────────┘
             │
             │ Webhooks
             ▼
┌─────────────────────────┐
│   Your Backend Server   │
│   (Webhook Handlers)    │
└─────────────────────────┘
```

## What Happens in Production

### User Flow

1. User clicks "Upgrade to Pro"
2. Selects Monthly or Yearly plan
3. Clicks "Secure Checkout with Stripe"
4. Frontend calls your server: `POST /api/create-checkout-session`
5. Server creates Stripe Checkout Session
6. User redirected to Stripe's secure checkout page
7. User enters payment details on Stripe
8. Stripe processes payment
9. Stripe sends webhook to your server
10. Server updates database
11. User returned to app with Pro access

### Behind the Scenes

**Your Server Handles**:
- Creating checkout sessions
- Validating user permissions
- Processing webhook events
- Updating subscription status
- Managing customer records

**Stripe Handles**:
- Secure payment form
- PCI compliance
- Card processing
- Fraud detection
- 3D Secure authentication
- Recurring billing

**Your App Handles**:
- User interface
- Feature access control
- Usage tracking
- Subscription display

## Security Considerations

✅ **What's Secure**:
- Payments processed entirely by Stripe
- No card details touch your servers
- Webhook signatures verified
- User authentication required
- HTTPS enforced

⚠️ **What You Must Do**:
- Never commit secret keys to git
- Use environment variables
- Validate webhook signatures
- Implement rate limiting
- Log security events

## Troubleshooting

### "Stripe not configured"
- Add your Stripe publishable key in the credit card icon (💳) menu

### "Demo Mode Active"
- Configure your API endpoint in Admin Settings (⚙️) > Stripe API tab

### "Failed to create checkout session"
- Check that your server is running and accessible
- Verify the API endpoint URL is correct
- Check server logs for errors

### Webhook not firing
- Verify webhook URL in Stripe Dashboard
- Check webhook signing secret is correct
- Ensure server is publicly accessible
- Review webhook logs in Stripe Dashboard

### Payment not completing
- Check Stripe Dashboard for payment status
- Verify webhook handler is processing events
- Check server logs for errors
- Ensure database is updating correctly

## Going Live Checklist

- [ ] Stripe account verified
- [ ] Products created in Stripe Dashboard
- [ ] Backend server deployed and accessible
- [ ] Environment variables configured
- [ ] Webhooks configured and tested
- [ ] Test mode end-to-end tested
- [ ] Switch to live API keys
- [ ] Final production test
- [ ] Monitor first real transactions

## Pricing

### Current Pricing:
- **Free Tier**: 10 generations/month, images only
- **Pro Monthly**: $19/month, unlimited everything
- **Pro Yearly**: $180/year ($15/month, save $48)

### To Change Pricing:
1. Update products in Stripe Dashboard
2. Update `STRIPE_PRICE_IDS` in code
3. Update pricing display in `StripeCheckout.tsx`

## Support

### Documentation:
- `STRIPE_SERVER_SETUP.md` - Complete server implementation
- `STRIPE_INTEGRATION.md` - Integration overview
- [Stripe Docs](https://stripe.com/docs) - Official Stripe documentation

### Need Help?
- Check server logs
- Review Stripe Dashboard logs
- Test webhook events with Stripe CLI
- Check browser console for frontend errors

## What's Next?

Once you have real payments working:

1. **Monitor**: Check Stripe Dashboard regularly
2. **Analytics**: Track conversion rates
3. **Support**: Set up customer support for payment issues
4. **Compliance**: Ensure GDPR/privacy compliance
5. **Optimization**: A/B test pricing and plans

---

**Remember**: Start with test mode, verify everything works, then switch to live keys. Test thoroughly before going live!
