# Stripe Custom Pricing Plans Setup Guide

This guide will walk you through creating custom pricing plans in your Stripe Dashboard for the AI Creator Studio.

## 📋 Prerequisites

- Stripe account created
- Live API keys configured:
  - Secret Key: `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`
  - Publishable Key: (You need to add this in the app)

## 🎯 Step-by-Step: Create Products & Prices

### Step 1: Access Stripe Dashboard

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Log in with your Stripe account
3. Make sure you're in **LIVE MODE** (toggle in the top right should NOT say "Test mode")

### Step 2: Create the Pro Plan Product

1. Click **"Products"** in the left sidebar
2. Click **"+ Add product"** button
3. Fill in the product details:

**Product Information:**
```
Name: AI Creator Studio Pro
Description: Unlimited AI image & video generation with Pro features
```

**Statement descriptor:** `AI_CREATOR_PRO`

**Product image:** (Optional - upload your logo/product image)

**Metadata** (Click "Add metadata"):
```
tier: pro
features: unlimited_generation,video,hd_quality,priority_support
app: ai-creator-studio
```

### Step 3: Create Monthly Price

After creating the product, or in the pricing section:

1. Click **"Add another price"** or create a new price
2. Fill in the pricing details:

**Monthly Plan:**
```
Price model: Standard pricing
Price: $19.00 USD
Billing period: Monthly
```

**Price display name:** `Pro Monthly`

**Price description:** `Unlimited generations, billed monthly`

**Payment method:** `Card`

**Usage type:** `Licensed` (not metered)

**Metadata** (Add these key-value pairs):
```
plan: monthly
display_name: Monthly Plan
billing_interval: month
features: unlimited,video,hd,support
```

3. Click **"Add price"**
4. **Copy the Price ID** - it will look like: `price_1234567890abcdef` or `price_xxxxxxxxxxxxx`
5. Save this as your **Pro Monthly Price ID**

### Step 4: Create Yearly Price

1. On the same product page, click **"Add another price"**
2. Fill in the yearly pricing details:

**Yearly Plan:**
```
Price model: Standard pricing
Price: $180.00 USD (or $15/month × 12 = $180)
Billing period: Yearly
```

**Price display name:** `Pro Yearly`

**Price description:** `Unlimited generations, billed annually (Save 21%)`

**Metadata:**
```
plan: yearly
display_name: Yearly Plan - Save 21%
billing_interval: year
features: unlimited,video,hd,support
savings: 21%
```

3. Click **"Add price"**
4. **Copy the Price ID**
5. Save this as your **Pro Yearly Price ID**

## 🔧 Configure Price IDs in Your App

After creating the prices, you need to update the app with the real Price IDs:

### Update the Price IDs

You'll need to update these Price IDs in the app configuration:

```typescript
// Current placeholder IDs (in StripeCheckout.tsx):
const STRIPE_PRICE_IDS = {
  pro_monthly: 'price_pro_monthly_v2',  // ← Replace with real ID
  pro_yearly: 'price_pro_yearly_v2',     // ← Replace with real ID
}
```

**Replace with your actual Price IDs from Stripe Dashboard:**

```typescript
const STRIPE_PRICE_IDS = {
  pro_monthly: 'price_YOUR_MONTHLY_ID_HERE',
  pro_yearly: 'price_YOUR_YEARLY_ID_HERE',
}
```

## 📊 Pricing Structure Reference

### Current Pricing Plan:

| Plan | Price | Billing | Features |
|------|-------|---------|----------|
| Free | $0 | - | 10 generations/month, Images only, 3 reference images |
| Pro Monthly | $19/month | Monthly | Unlimited generations, Video + Images, HD quality, 5 reference images |
| Pro Yearly | $180/year ($15/month) | Yearly | Same as monthly + Save 21% |

### Feature Comparison:

| Feature | Free | Pro |
|---------|------|-----|
| Image Generation | ✓ | ✓ Unlimited |
| Video Generation | ✗ | ✓ Unlimited |
| Generations/Month | 10 | ∞ Unlimited |
| Reference Images | 3 | 5 |
| Batch Generation | 2 max | 5 max |
| Image-to-Image | ✓ | ✓ |
| Video-to-Video | ✗ | ✓ |
| HD Quality | ✗ | ✓ |
| Upscaling (4x) | ✗ | ✓ |
| Priority Support | ✗ | ✓ |
| AI Assistant | ✓ | ✓ Priority |

## 🎨 Optional: Customize Your Plans

### Add More Tiers

Want to add a "Basic" or "Enterprise" tier?

1. Create a new product in Stripe
2. Add prices for different billing periods
3. Update the app's subscription logic in `src/lib/subscription.ts`
4. Add new tier limits and features

### Adjust Pricing

To change prices:

1. Go to your product in Stripe Dashboard
2. Create a new price (you can't edit existing ones)
3. Archive the old price
4. Update the Price ID in your app

### Add Trial Periods

To add a free trial:

1. Edit your price in Stripe
2. Under "Trial period", select the duration (e.g., 7 days, 14 days, 30 days)
3. Customers will be charged after the trial ends

## 🔐 Security Best Practices

### Price ID Management

- **Never hardcode Price IDs in client code** for production
- Consider storing Price IDs in environment variables or a secure config
- Use Stripe webhooks to verify actual prices paid

### Webhook Configuration

Make sure webhooks are set up to handle:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

See `STRIPE_INTEGRATION.md` for webhook setup details.

## 📝 Update Checklist

After creating your pricing plans:

- [ ] Created "AI Creator Studio Pro" product in Stripe
- [ ] Created Monthly price ($19/month)
- [ ] Created Yearly price ($180/year)
- [ ] Copied both Price IDs
- [ ] Updated Price IDs in the app configuration
- [ ] Tested checkout flow in test mode first
- [ ] Switched to live mode
- [ ] Tested live checkout
- [ ] Configured webhooks for subscription events
- [ ] Set up customer email receipts in Stripe settings

## 🎉 Testing Your Setup

### Test Mode First

1. Switch Stripe to **Test Mode**
2. Create test products and prices
3. Use test Price IDs in your app
4. Use test card: `4242 4242 4242 4242`
5. Complete a test checkout
6. Verify subscription activates correctly

### Go Live

1. Switch Stripe to **Live Mode**
2. Create live products and prices
3. Update app with live Price IDs
4. Update API keys to live keys
5. Test with real payment method
6. Monitor the first few transactions

## 🆘 Troubleshooting

### "No such price" error
- Verify you're using the correct Price ID from Stripe
- Make sure you're in the right mode (test vs live)
- Check that the price is active, not archived

### Price ID not working
- Ensure Price ID starts with `price_`
- Verify it matches exactly (case-sensitive)
- Check if you're using test Price ID with live keys (or vice versa)

### Subscription not activating
- Verify webhook endpoint is configured
- Check webhook signing secret is correct
- Look for webhook errors in Stripe Dashboard > Developers > Webhooks

## 📞 Support Resources

- **Stripe Documentation:** [https://stripe.com/docs/billing/subscriptions/products-and-prices](https://stripe.com/docs/billing/subscriptions/products-and-prices)
- **Stripe Support:** Available in your Dashboard
- **Test Cards:** [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

## 🔄 Next Steps

After setting up pricing:

1. Configure webhooks (see `STRIPE_INTEGRATION.md`)
2. Set up customer portal for subscription management
3. Configure email receipts and invoices
4. Set up tax collection (if required)
5. Configure subscription billing emails
6. Test the complete user flow

---

**Remember:** Always test in Test Mode before going live with real payments!
