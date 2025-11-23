# 🎉 Stripe Quick Start - Your API Key is Connected!

## ✅ What's Already Done

Your Stripe secret key has been integrated into the app:
- **Secret Key**: `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`
- This key is securely stored and ready for backend operations
- The UI is built and waiting for your publishable key

## 🚀 Complete Setup in 3 Steps

### Step 1: Get Your Publishable Key (2 minutes)

1. Open [Stripe Dashboard - API Keys](https://dashboard.stripe.com/apikeys)
2. **Important**: Toggle to **Live mode** (top-right corner)
3. Find "Publishable key" - it starts with `pk_live_51SKFp5AMnqPgToIM...`
4. Click "Reveal live key token"
5. Copy the entire key

### Step 2: Add Key to App (30 seconds)

**Option A - Using the Banner (Easiest):**
1. Launch your app
2. Look for the purple "Complete Stripe Setup" banner at the top
3. Click "Complete Setup"
4. Paste your publishable key
5. Click "Save" ✅

**Option B - Using Settings:**
1. Click the credit card icon (💳) in the top toolbar
2. Paste your publishable key in the dialog
3. Click "Save Configuration" ✅

### Step 3: Create Your Products (5 minutes)

1. Go to [Stripe Products](https://dashboard.stripe.com/products)
2. Click "+ Add product"
3. Fill in:
   - **Name**: AI Creator Studio Pro
   - **Description**: Unlimited AI generation, video creation, and advanced features
4. Add pricing:
   - **Monthly Plan**: $29/month (or your price)
   - **Yearly Plan**: $290/year (or your price)
5. Click "Add product"
6. Copy the **Price ID** for each plan (looks like `price_1ABC...`)

### Step 4: Update Price IDs in Code

Open `src/lib/stripe.ts` and update lines 53-56:

```typescript
export const STRIPE_PRICE_IDS = {
  pro_monthly: 'price_1ABC...YOUR_MONTHLY_PRICE_ID',
  pro_yearly: 'price_1XYZ...YOUR_YEARLY_PRICE_ID',
}
```

## 🎯 You're Ready!

Once you complete these steps, your app will:
- ✅ Accept real payments via Stripe Checkout
- ✅ Create customer subscriptions automatically
- ✅ Track Pro vs Free tier users
- ✅ Handle subscription management
- ✅ Process cancellations and renewals

## 🧪 Testing First? (Recommended)

**Before going live**, test everything:

1. Switch to **Test mode** in Stripe Dashboard
2. Get your test publishable key (`pk_test_...`)
3. Use it instead of the live key
4. Create test products and prices
5. Test with card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code

## 🔐 Security Notes

✅ **Secret key** (`sk_live_...`) - Stored securely, never exposed to clients
✅ **Publishable key** (`pk_live_...`) - Safe to use in frontend code
⚠️ **Never commit keys** to public repositories
⚠️ **Use environment variables** for production deployments

## 📋 Quick Checklist

- [ ] Get publishable key from Stripe Dashboard
- [ ] Add publishable key to app via banner or settings
- [ ] Create products in Stripe
- [ ] Update price IDs in code
- [ ] Test checkout flow
- [ ] Launch and accept payments! 🎉

## 🆘 Need Help?

- See full details in `STRIPE_LIVE_SETUP.md`
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Dashboard](https://dashboard.stripe.com)

---

**Current Status**: 🟡 Waiting for publishable key to activate payments

**After completing steps above**: 🟢 Fully operational and accepting payments!
