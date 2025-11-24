# Stripe Pricing Setup & Testing Guide

This guide walks you through setting up and testing custom pricing with real Stripe products.

## 🎯 Overview

You'll learn how to:
1. Create products and prices in Stripe Dashboard
2. Configure price IDs in your application
3. Test the complete checkout flow
4. Verify real payment integration

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Stripe account (sign up at [stripe.com](https://stripe.com))
- ✅ Stripe Secret Key configured (sk_live_51SKFp5...)
- ✅ Access to Stripe Dashboard

## 🛠️ Step 1: Create Stripe Products

### 1.1 Access Products Page

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Toggle to LIVE mode** (top-right corner)
3. Navigate to: **Products** → **Product Catalog**
4. Click **"+ Add product"**

### 1.2 Create Your Product

Fill in the product details:

```
Name: AI Creator Studio Pro
Description: Unlimited AI image & video generation with Pro features
```

**Image (optional):** Upload a product image

### 1.3 Add Monthly Price

Under **Pricing**, click **"Add price"**:

- **Price**: `$19.00 USD`
- **Billing period**: `Monthly`
- **Payment type**: `Recurring`

Click **"Add price"** to save.

### 1.4 Add Yearly Price

Click **"Add another price"** on the same product:

- **Price**: `$180.00 USD`
- **Billing period**: `Yearly`
- **Payment type**: `Recurring`

Click **"Add price"** to save.

### 1.5 Save Product

Click **"Save product"** at the bottom of the page.

## 📝 Step 2: Get Price IDs

After creating your product:

1. You'll see your product in the catalog
2. Click on the product name to view details
3. You'll see two prices listed:

```
Monthly subscription
$19.00 USD per month
price_1XXXXXXXXXXXXXX    ← Copy this!

Yearly subscription  
$180.00 USD per year
price_1YYYYYYYYYYYYYY    ← Copy this!
```

**Important:** The price IDs start with `price_` followed by a unique identifier.

## ⚙️ Step 3: Configure Price IDs in Application

### 3.1 Open Admin Settings

1. In your AI Creator Studio app, click the **gear icon** (⚙️)
2. Go to the **"Pricing"** tab

### 3.2 Paste Price IDs

1. **Monthly Plan Price ID**: Paste `price_1XXXXXXXXXXXXXX`
2. **Yearly Plan Price ID**: Paste `price_1YYYYYYYYYYYYYY`
3. Click **"Save Price Configuration"**

You should see a green success message.

## 🧪 Step 4: Test Your Pricing

### 4.1 Access Testing Interface

1. In Admin Settings, go to the **"Test"** tab
2. You'll see the testing interface with your pricing

### 4.2 Run Full Integration Test

Click **"Run Full Integration Test"** button. This will:

✅ **Step 1:** Validate Stripe publishable key format  
✅ **Step 2:** Verify price ID formats are correct  
✅ **Step 3:** Create test checkout session for monthly plan  
✅ **Step 4:** Create test checkout session for yearly plan  
✅ **Step 5:** Confirm all components work together  

Watch the test results appear in real-time.

### 4.3 Test Individual Plans

For more detailed testing:

**Monthly Plan:**
1. Click **"Test Session"** under Monthly Plan
2. Verify successful session creation
3. Click **"Open Checkout"** to see actual Stripe checkout

**Yearly Plan:**
1. Click **"Test Session"** under Yearly Plan
2. Verify successful session creation
3. Click **"Open Checkout"** to see actual Stripe checkout

### 4.4 Test With Real Checkout

Click **"Open Checkout"** to open Stripe's hosted checkout page:

**Use Stripe Test Card:**
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

Complete the checkout to test the full flow.

## ✅ Validation Checklist

Your setup is complete when:

- [ ] **Green checkmarks** for all test steps
- [ ] Monthly plan creates checkout session successfully
- [ ] Yearly plan creates checkout session successfully
- [ ] Checkout page opens with correct pricing
- [ ] Test payment completes without errors
- [ ] User sees "Pro" badge after successful payment

## 🎨 Expected Pricing Display

### Monthly Plan
```
Monthly
$19/month
• Unlimited image generations
• Unlimited video generations
• Up to 5 reference images
• Priority support
```

### Yearly Plan (Best Value)
```
Yearly - SAVE 21%
$15/month
$180/year • Save $48
• Unlimited image generations
• Unlimited video generations
• Up to 5 reference images
• Priority support
```

## 🐛 Troubleshooting

### Test Fails: "Invalid Stripe publishable key"

**Solution:**
1. Go to Admin Settings → Stripe Config
2. Verify publishable key starts with `pk_live_51SKFp5...`
3. Ensure it matches your account ID

### Test Fails: "Invalid price ID format"

**Solution:**
1. Verify price IDs start with `price_`
2. Copy the FULL price ID from Stripe Dashboard
3. Don't include extra spaces or characters

### "Failed to create checkout session"

**Possible causes:**
1. Price ID doesn't exist in your Stripe account
2. Product is archived or inactive
3. Wrong Stripe mode (test vs live)

**Solution:**
1. Go to Stripe Dashboard → Products
2. Verify product is active
3. Ensure you're in LIVE mode (not test mode)
4. Double-check price IDs match exactly

### Checkout opens but shows wrong price

**Solution:**
1. Verify you copied the correct price ID
2. Check monthly vs yearly price IDs aren't swapped
3. Refresh the product page in Stripe Dashboard

## 🔒 Security Notes

- ✅ Price IDs are safe to store client-side
- ✅ Stripe validates all checkout sessions
- ✅ Secret key is stored securely (never exposed to client)
- ✅ All payments processed by Stripe (PCI compliant)

## 🚀 Going Live

Once testing is complete:

1. **Review pricing** in Stripe Dashboard
2. **Test with real card** (small amount)
3. **Verify webhook** is receiving events
4. **Monitor** first real transactions
5. **Enable** real payment processing

## 📊 Monitoring Payments

After going live, monitor in Stripe Dashboard:

- **Payments** → View all transactions
- **Subscriptions** → Track active subscriptions
- **Customers** → See customer details
- **Webhooks** → Verify events are received

## 💡 Pro Tips

1. **Test both plans** thoroughly before launch
2. **Use test mode** until you're confident
3. **Set up webhooks** for real-time updates
4. **Monitor first 10 payments** closely
5. **Have a support plan** ready

## 📚 Additional Resources

- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Webhook Events](https://stripe.com/docs/webhooks)

## 🆘 Need Help?

If you encounter issues:

1. Check the test results for specific errors
2. Review Stripe Dashboard logs
3. Verify all configuration steps
4. Test with Stripe's test cards first
5. Check webhook logs for event delivery

## 🎉 Success!

When all tests pass with green checkmarks, your pricing is ready for production!

---

**Last Updated:** 2024
**Stripe API Version:** Latest
**Testing Mode:** Live Mode Compatible
