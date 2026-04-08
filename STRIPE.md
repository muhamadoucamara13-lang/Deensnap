# Stripe Integration Guide for DeenSnap

To complete the Stripe integration and enable premium subscriptions, follow these steps:

## 1. Get your API Keys
1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/).
2. Go to **Developers > API keys**.
3. Copy your **Secret key** (it starts with `sk_`).
4. Add it to the **Secrets** panel in AI Studio as `STRIPE_SECRET_KEY`.

## 2. Configure the Webhook
1. Go to **Developers > Webhooks**.
2. Click **Add endpoint**.
3. In **Endpoint URL**, enter: `[YOUR_APP_URL]/api/webhook`
   - *Note: Replace `[YOUR_APP_URL]` with the URL of your app (e.g., `https://ais-dev-....run.app`).*
4. Click **Select events** and add the following:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**.
6. Once created, click **Reveal** under "Signing secret" (it starts with `whsec_`).
7. Add it to the **Secrets** panel in AI Studio as `STRIPE_WEBHOOK_SECRET`.

## 3. Verify Integration
1. Restart the dev server in AI Studio.
2. Go to the **Elite Premium** screen in the app.
3. Try to subscribe. You should be redirected to the Stripe Checkout page.
4. After a successful payment, the webhook will automatically update your profile in Supabase to `premium`.

## Troubleshooting
- **Missing Keys**: If you see an error about missing keys, ensure they are correctly set in the Secrets panel.
- **Webhook Failures**: Check the "Webhooks" tab in Stripe to see the logs for each event. Ensure the URL is correct and the signing secret matches.
- **Redirect Issues**: The app uses `window.location.href` for redirects, which is compatible with PWAs.
