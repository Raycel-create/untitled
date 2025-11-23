# 🎯 Quick Start: Custom Pricing Plans

This guide will help you set up custom pricing plans in Stripe in under 10 minutes.

## 📱 In-App Setup (Easiest Way)

1. **Open Admin Settings**
   - Click the gear icon ⚙️ in the top navigation
   - Select the "Pricing" tab

2. **Follow the Step-by-Step Guide**
   - The interface will walk you through creating products in Stripe
   - Copy your Price IDs and paste them in the app
   - Save the configuration

That's it! Your custom pricing is ready.

## 🚀 Manual Stripe Setup

### Step 1: Go to Stripe Dashboard
👉 [https://dashboard.stripe.com/products](https://dashboard.stripe.com/products)

Make sure you're in **LIVE MODE** (top right toggle).

### Step 2: Create Product

Click **"+ Add product"**

**Product Details:**
- **Name:** AI Creator Studio Pro
- **Description:** Unlimited AI image & video generation with Pro features
- **Statement descriptor:** AI_CREATOR_PRO

### Step 3: Add Monthly Price

**Pricing:**
- **Price:** $19.00 USD
- **Billing period:** Monthly

Click "Add price" and **copy the Price ID** (starts with `price_`)

Example: `price_1AbCdEfGhIjKlMnO`

### Step 4: Add Yearly Price

Click "Add another price"

**Pricing:**
- **Price:** $180.00 USD (or $15/month × 12)
- **Billing period:** Yearly

Click "Add price" and **copy the Price ID**

### Step 5: Configure in App

1. Go to Admin Settings → Pricing tab
2. Paste your Price IDs:
   - Monthly Plan Price ID: `price_YOUR_MONTHLY_ID`
   - Yearly Plan Price ID: `price_YOUR_YEARLY_ID`
3. Click "Save Price Configuration"

## ✅ Verify Setup

1. Click "Upgrade to Pro" in the app
2. You should see both Monthly and Yearly options
3. The prices should match what you set in Stripe

## 📊 Recommended Pricing Structure

Based on your market and features:

### Current Setup:
- **Free Tier:** $0 - 10 generations/month (images only)
- **Pro Monthly:** $19/month - Unlimited everything
- **Pro Yearly:** $180/year - Save 21% ($15/month effective)

### Alternative Pricing Ideas:

**Budget-Friendly:**
- Monthly: $9.99
- Yearly: $99 (17% savings)

**Premium:**
- Monthly: $29
- Yearly: $290 (17% savings)

**Three-Tier System:**
| Plan | Monthly | Yearly | Features |
|------|---------|--------|----------|
| Basic | $9 | $90 | 100 generations/month, images only |
| Pro | $19 | $180 | Unlimited images & videos |
| Business | $49 | $490 | Everything + priority support + API access |

## 🔧 Advanced: Add More Plans

To add additional tiers:

1. **Create new product in Stripe**
2. **Add prices for different billing cycles**
3. **Update subscription limits** in `src/lib/subscription.ts`:

```typescript
export const SUBSCRIPTION_LIMITS = {
  free: { generationsPerMonth: 10, ... },
  basic: { generationsPerMonth: 100, ... },  // Add new tier
  pro: { generationsPerMonth: null, ... },
  business: { generationsPerMonth: null, ... } // Add new tier
}
```

4. **Update UI** in `src/components/StripeCheckout.tsx` to show new plans

## 💡 Pro Tips

### Optimize Conversions:
1. **Highlight the yearly plan** - Shows best value
2. **Add social proof** - "1000+ creators subscribed"
3. **Limited-time offers** - "Launch special: 30% off first month"
4. **Trial periods** - Add 7-day free trial in Stripe

### Pricing Psychology:
- **$19 vs $20** - Psychological pricing works
- **"Save 21%"** - Show specific savings amount
- **"Most Popular"** - Badge on recommended plan
- **"2 months free"** - Phrase yearly savings this way

### A/B Testing Ideas:
- Test different price points: $15, $19, $25, $29
- Test yearly discount amounts: 15%, 20%, 25%, 30%
- Test trial periods: 7 days vs 14 days
- Test bundle options: Add credits/features at discounts

## 🎨 Customize Pricing Display

Edit pricing display in `src/components/StripeCheckout.tsx`:

```typescript
const PRICING_PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 19,  // Change this
    period: 'month',
    priceId: priceConfig?.monthlyPriceId || DEFAULT_STRIPE_PRICE_IDS.pro_monthly,
    badge: null,  // Add 'POPULAR' badge
    savings: null,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 15,  // Effective monthly price
    period: 'month',
    totalPrice: 180,  // Total yearly price
    priceId: priceConfig?.yearlyPriceId || DEFAULT_STRIPE_PRICE_IDS.pro_yearly,
    badge: 'SAVE 21%',  // Customize savings badge
    savings: 48,  // Annual savings amount
  },
]
```

## 📈 Monitor Your Pricing

After launching, track these metrics:

1. **Conversion rate** - Free to paid %
2. **Plan preference** - Monthly vs Yearly split
3. **Churn rate** - Cancellations per month
4. **LTV** - Lifetime value per customer
5. **MRR** - Monthly recurring revenue

Adjust pricing based on data!

## 🔐 Security Checklist

Before going live:

- [ ] Using LIVE Stripe keys (not test)
- [ ] Webhook secret is configured
- [ ] Price IDs are correct
- [ ] Test checkout flow end-to-end
- [ ] Subscription activation works
- [ ] Cancellation flow works
- [ ] Email receipts are enabled
- [ ] Tax collection configured (if needed)

## 🆘 Troubleshooting

**"No such price" error:**
- Verify you copied the correct Price ID
- Check you're using live Price ID with live keys
- Ensure price is active (not archived) in Stripe

**Prices not updating in app:**
- Clear browser cache
- Check Admin Settings → Pricing tab
- Verify Price IDs are saved correctly

**Checkout not working:**
- Ensure Stripe publishable key is set
- Check browser console for errors
- Verify Price IDs match exactly (case-sensitive)

## 📞 Need Help?

- **Detailed Setup:** See `STRIPE_PRICING_SETUP.md`
- **Server Setup:** See `STRIPE_SERVER_SETUP.md`
- **Integration Guide:** See `STRIPE_INTEGRATION.md`
- **Stripe Docs:** [stripe.com/docs/billing/subscriptions](https://stripe.com/docs/billing/subscriptions)

---

**Ready to launch?** Start with the in-app pricing setup in Admin Settings! 🚀
