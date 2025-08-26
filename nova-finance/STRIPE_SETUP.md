# Stripe Setup Guide for Nova Finance

## Current Status
The system is currently running in **TEST MODE** with Stripe disabled for testing purposes.

## Testing Mode (Current)
- `STRIPE_ENABLED=False` in `.env`
- All payments are mocked and automatically marked as successful
- No real money is processed
- You can test the complete loan application flow

## Switching to Real Stripe (When Ready)

### Step 1: Get Your Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account or log into your existing account
3. Get your API keys from the Developers > API Keys section

### Step 2: Update Environment Variables
Edit the `.env` file in the backend directory:

```bash
# Change this to enable Stripe
STRIPE_ENABLED=True

# Replace with your real Stripe keys
STRIPE_PUBLISHABLE_KEY=pk_live_your_real_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_real_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Step 3: Restart the Backend
```bash
cd nova-finance/backend
python manage.py runserver
```

### Step 4: Test with Real Payments
- Use real credit card numbers (or Stripe test cards in test mode)
- Payments will be processed through Stripe
- Webhook events will be handled for payment confirmations

## Security Notes
- **Never commit real Stripe keys to version control**
- Use environment variables for production deployments
- Test thoroughly in Stripe test mode before going live
- Set up webhook endpoints for production

## Current Test Features
✅ Loan applications work without Stripe
✅ PRN tokens are issued automatically  
✅ Certificates are generated
✅ Tripartite contracts are created
✅ Dashboard shows all information
✅ Capimax integration is ready

## When You're Ready
Just update the `.env` file with your real Stripe keys and set `STRIPE_ENABLED=True`. The system will automatically switch to real payment processing!