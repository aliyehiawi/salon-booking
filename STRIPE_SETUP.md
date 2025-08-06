# Stripe Setup Instructions

## 1. Create a Stripe Account (Free)

1. Go to https://stripe.com
2. Click "Start now" and create an account
3. Verify your email address
4. You'll be taken to the Stripe Dashboard

## 2. Get Your Test API Keys

1. In the Stripe Dashboard, make sure you're in "Test mode" (toggle at the top)
2. Go to "Developers" → "API keys"
3. Copy your keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

## 3. Update Your .env File

Replace the placeholder values in your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_test_webhook_secret_here
```

## 4. Test Credit Card Numbers

Stripe provides test card numbers for testing:

- **Visa**: `4242 4242 4242 4242`
- **Visa (debit)**: `4000 0566 5566 5556`
- **Mastercard**: `5555 5555 5555 4444`
- **American Express**: `3782 822463 10005`
- **Declined card**: `4000 0000 0000 0002`

For any test card:
- Use any future expiry date (e.g., `12/25`)
- Use any 3-digit CVC (e.g., `123`)
- Use any ZIP code (e.g., `12345`)

## 5. Webhook Setup (Optional for now)

1. In Stripe Dashboard, go to "Developers" → "Webhooks"
2. Click "Add endpoint"
3. Use URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy the webhook secret and add to your `.env` file

## 6. Testing the Payment Flow

1. Restart your Next.js development server after updating `.env`
2. Create a booking
3. Use test card numbers above
4. Check Stripe Dashboard → "Payments" to see test transactions

## 7. Important Notes

- ⚠️ **Never use real card numbers in test mode**
- ⚠️ **Test keys are safe to use - no real money is processed**
- ⚠️ **Switch to live keys only when ready for production**
- ✅ **All test transactions appear in your Stripe Dashboard**
- ✅ **You can refund test payments to test the full flow**

## Need Help?

- Stripe Documentation: https://stripe.com/docs
- Test Cards: https://stripe.com/docs/testing#cards
- Discord/Support: Available in Stripe Dashboard