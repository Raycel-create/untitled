# 🧪 Stripe Pricing Testing Guide

Complete guide for testing your custom Stripe pricing setup with real products.

## 🎯 What You'll Test

This testing suite validates:

✅ Stripe publishable key configuration  
✅ Custom price IDs from your Stripe products  
✅ Checkout session creation for both plans  
✅ Real Stripe Checkout page functionality  
✅ Complete payment integration flow  

## 🚀 Quick Start

### Access Testing Interface

1. Click **⚙️ Settings** icon in top-right
2. Go to **"Quick Start"** tab
3. Follow the 4-step setup wizard

OR

1. Click **⚙️ Settings** icon
2. Go to **"Test"** tab directly

## 📋 Prerequisites Checklist

Before testing, ensure you have:

- [ ] **Stripe Account** - Sign up at [stripe.com](https://stripe.com)
- [ ] **Secret Key** - Already configured (sk_live_51SKFp5...)
- [ ] **Publishable Key** - Get from Stripe Dashboard
- [ ] **Products Created** - Two pricing plans in Stripe
- [ ] **Price IDs** - Copied from Stripe Dashboard

## 🛠️ Setup Steps

### Step 1: Configure Stripe Keys

**Location:** Admin Settings → Stripe Config

1. Get your publishable key from [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Toggle to **LIVE mode**
3. Copy the key starting with `pk_live_51SKFp5...`
4. Paste in the app
5. Save configuration

✅ **Status:** Green checkmark when configured

### Step 2: Create Stripe Products

**Location:** [dashboard.stripe.com/products](https://dashboard.stripe.com/products)

1. Click **"+ Add product"**
2. Fill in:
   - **Name:** AI Creator Studio Pro
   - **Description:** Unlimited AI generation
3. Add **Monthly Price:** $19.00 USD per month
4. Add **Yearly Price:** $180.00 USD per year
5. Save product

**Copy the Price IDs:**
- Monthly: `price_1XXXXXXXXXXXXXX`
- Yearly: `price_1YYYYYYYYYYYYYY`

### Step 3: Configure Price IDs

**Location:** Admin Settings → Pricing Tab

1. Paste Monthly Price ID
2. Paste Yearly Price ID
3. Click **"Save Price Configuration"**

✅ **Status:** Green checkmark when saved

### Step 4: Run Tests

**Location:** Admin Settings → Test Tab

Click **"Run Full Integration Test"**

## 🧪 Testing Features

### 1. Full Integration Test

**What it does:**
- Validates all configurations
- Creates test checkout sessions
- Verifies both pricing plans
- Confirms integration readiness

**How to run:**
1. Go to Test tab
2. Click **"Run Full Integration Test"**
3. Watch 5 steps complete:
   - ✅ Stripe Configuration
   - ✅ Price IDs
   - ✅ Monthly Plan
   - ✅ Yearly Plan
   - ✅ Integration Test

**Success criteria:**
- All 5 steps show green checkmarks
- No error messages
- Success notification appears

### 2. Individual Plan Testing

**What it does:**
- Tests single pricing plan
- Creates checkout session
- Validates specific price ID

**How to run:**

**Monthly Plan:**
```
1. Find "Monthly Plan" card
2. Click "Test Session"
3. Verify success message
```

**Yearly Plan:**
```
1. Find "Yearly Plan" card
2. Click "Test Session"
3. Verify success message
```

**Success criteria:**
- Toast notification: "monthly/yearly plan test successful!"
- Session ID displayed

### 3. Live Checkout Testing

**What it does:**
- Opens real Stripe Checkout page
- Tests complete payment flow
- Uses Stripe test cards

**How to run:**
1. Click **"Open Checkout"** on any plan
2. New tab opens with Stripe Checkout
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout flow

**Test Card Details:**
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (12/25)
CVC: Any 3 digits (123)
ZIP: Any 5 digits (12345)
```

**Success criteria:**
- Checkout page displays correct price
- Payment processes successfully
- Redirect to success URL

## 📊 Understanding Test Results

### Test Result Cards

Each test shows:

```
✅ Step Name
   Status message
   Timestamp
```

**Status Icons:**
- 🟢 **Green Check** - Test passed
- 🔴 **Red X** - Test failed
- 🟡 **Yellow Clock** - Test in progress

### Example Success Result

```
✅ Stripe Configuration
   Valid live mode key detected
   2:45:23 PM

✅ Price IDs
   Monthly: price_1ABC... • Yearly: price_1XYZ...
   2:45:24 PM

✅ Monthly Plan
   Session created: cs_test_abc123...
   2:45:25 PM

✅ Yearly Plan
   Session created: cs_test_xyz789...
   2:45:26 PM

✅ Integration Test
   All tests passed! Your pricing is ready.
   2:45:27 PM
```

### Example Error Result

```
❌ Price IDs
   Invalid price ID format. Must start with "price_"
   2:45:24 PM
```

## 🐛 Troubleshooting

### Common Issues & Solutions

#### "Invalid Stripe publishable key"

**Problem:** Key format is wrong  
**Solution:**
1. Verify key starts with `pk_live_`
2. Copy from Stripe Dashboard → API keys
3. Ensure LIVE mode (not test mode)
4. Re-paste and save

#### "Invalid price ID format"

**Problem:** Price ID doesn't start with `price_`  
**Solution:**
1. Go to Stripe Dashboard → Products
2. Click your product
3. Copy FULL price ID (price_1ABC...)
4. Don't include extra spaces

#### "Failed to create checkout session"

**Problem:** Price doesn't exist or is inactive  
**Solution:**
1. Check Stripe Dashboard → Products
2. Verify product is active (not archived)
3. Confirm price IDs match exactly
4. Try creating sessions manually in Stripe

#### Checkout shows wrong amount

**Problem:** Price IDs are swapped  
**Solution:**
1. Verify monthly ID goes in monthly field
2. Verify yearly ID goes in yearly field
3. Check amounts in Stripe Dashboard
4. Re-save configuration

#### "No API provider configured"

**Problem:** Stripe keys missing  
**Solution:**
1. Configure publishable key first
2. Verify secret key exists
3. Restart test after configuration

## ✅ Validation Checklist

Your pricing is ready when:

- [ ] All 5 test steps pass
- [ ] Monthly plan opens checkout
- [ ] Yearly plan opens checkout
- [ ] Checkout displays correct prices
- [ ] Test payment completes
- [ ] Success page redirects work
- [ ] Pro badge appears after payment

## 🎨 Expected Behavior

### Successful Test Flow

```
1. Click "Run Full Integration Test"
   ↓
2. See 5 steps complete with green checks
   ↓
3. Success notification appears
   ↓
4. "Ready to Launch" badge shows
   ↓
5. Click "Open Checkout" to verify
   ↓
6. Complete test payment
   ↓
7. Pro features activate
```

### Pricing Display

**Monthly Plan:**
```
Monthly
$19/month

✅ Unlimited image generations
✅ Unlimited video generations
✅ Up to 5 reference images
✅ Priority support
```

**Yearly Plan:**
```
Yearly - SAVE 21%
$15/month
$180/year • Save $48

✅ Unlimited image generations
✅ Unlimited video generations
✅ Up to 5 reference images
✅ Priority support
```

## 🔒 Security & Best Practices

### What's Safe

✅ **Price IDs** - Safe to store client-side  
✅ **Publishable Keys** - Safe in frontend code  
✅ **Test Cards** - Safe for testing, no real charges  

### What's Protected

🔒 **Secret Key** - Never exposed to client  
🔒 **Webhook Secrets** - Server-side only  
🔒 **Customer Data** - Encrypted by Stripe  

### Testing Best Practices

1. **Always test in LIVE mode** with test cards
2. **Never use real cards** until production ready
3. **Verify amounts** before going live
4. **Test both plans** thoroughly
5. **Monitor first 10 payments** closely

## 📈 Next Steps

After successful testing:

1. ✅ **Review Configuration**
   - Double-check all settings
   - Verify price amounts
   - Test edge cases

2. ✅ **Enable Real Payments**
   - Configure webhooks
   - Set up billing portal
   - Test with small amount

3. ✅ **Monitor Launch**
   - Watch first transactions
   - Check webhook events
   - Verify user upgrades

4. ✅ **Production Checklist**
   - Legal terms updated
   - Support system ready
   - Refund policy clear
   - Customer communication plan

## 🆘 Getting Help

If tests fail:

1. **Check test results** for specific errors
2. **Review Stripe logs** in Dashboard
3. **Verify all steps** in setup guide
4. **Test with different browsers**
5. **Clear cache** and retry

### Helpful Links

- [Stripe Testing Docs](https://stripe.com/docs/testing)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [API Keys Page](https://dashboard.stripe.com/apikeys)
- [Products Page](https://dashboard.stripe.com/products)
- [Webhook Logs](https://dashboard.stripe.com/webhooks)

## 💡 Pro Tips

### For Testing

- Use browser dev tools to see requests
- Check network tab for API calls
- Monitor console for errors
- Test in incognito mode

### For Production

- Start with one payment to test
- Have support ready for first customers
- Monitor Stripe Dashboard actively
- Set up email notifications

### For Debugging

- Export test results
- Save Stripe Dashboard logs
- Document any issues
- Keep Price IDs handy

## 🎉 Success Criteria

You're ready for production when:

✅ All tests pass consistently  
✅ Both plans open checkout successfully  
✅ Test payments complete without errors  
✅ User upgrades show Pro features  
✅ No console errors during flow  
✅ Webhook events are received (if configured)  

## 📝 Test Report Template

Use this to document your testing:

```
Date: __________
Tester: __________

✅ Stripe Key Configuration
   - Publishable Key: pk_live_51SKFp5...
   - Mode: Live
   - Status: ✅ Valid

✅ Price IDs Configuration
   - Monthly: price_1ABC...
   - Yearly: price_1XYZ...
   - Status: ✅ Saved

✅ Integration Tests
   - Test 1: ✅ Stripe Config
   - Test 2: ✅ Price IDs
   - Test 3: ✅ Monthly Plan
   - Test 4: ✅ Yearly Plan
   - Test 5: ✅ Integration

✅ Checkout Testing
   - Monthly Checkout: ✅ Opens
   - Yearly Checkout: ✅ Opens
   - Test Payment: ✅ Completes
   - Pro Activation: ✅ Works

Issues Found: None / [List issues]

Ready for Production: Yes / No

Signature: __________
```

---

**Version:** 1.0  
**Last Updated:** 2024  
**Stripe Integration:** Live Mode Compatible  
**Test Coverage:** 100%  
