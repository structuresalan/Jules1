import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { tier, uid, email, origin } = req.body as { tier: 'private' | 'pro' | 'business'; uid: string; email: string; origin: string };

    if (!tier || !uid || !email) return res.status(400).json({ error: 'Missing required fields' });

    const priceId =
      tier === 'private'  ? process.env.STRIPE_PRICE_ID_PRIVATE :
      tier === 'pro'      ? process.env.STRIPE_PRICE_ID_PRO :
      tier === 'business' ? process.env.STRIPE_PRICE_ID_BUSINESS :
      undefined;
    if (!priceId) return res.status(500).json({ error: `Price ID not configured for tier "${tier}"` });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      client_reference_id: uid,
      metadata: { uid, tier },
      subscription_data: {
        metadata: { uid, tier },
        // 30-day free trial on the Private tier. Card required, $0 today, auto-renews at $9/mo.
        ...(tier === 'private' ? { trial_period_days: 30 } : {}),
      },
      success_url: `${origin}/settings?tab=billing&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/settings?tab=billing&cancelled=1`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
