import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const config = {
  api: { bodyParser: false }, // Stripe needs the raw body for signature verification
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
});

let adminApp: App | null = null;
const getAdmin = (): App => {
  if (adminApp) return adminApp;
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var not set');
  adminApp = initializeApp({ credential: cert(JSON.parse(raw)) });
  return adminApp;
};

const readRawBody = (req: VercelRequest): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

const tierFromPriceId = (priceId: string | undefined): 'private' | 'pro' | 'business' | null => {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_ID_PRIVATE)  return 'private';
  if (priceId === process.env.STRIPE_PRICE_ID_PRO)      return 'pro';
  if (priceId === process.env.STRIPE_PRICE_ID_BUSINESS) return 'business';
  return null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'] as string;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return res.status(400).json({ error: 'Missing signature or webhook secret' });

  let event: Stripe.Event;
  try {
    const raw = await readRawBody(req);
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature failed: ${err instanceof Error ? err.message : 'unknown'}` });
  }

  try {
    getAdmin();
    const dbAdmin = getFirestore();

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const uid = sub.metadata?.uid;
        if (!uid) break;
        const priceId = sub.items.data[0]?.price?.id;
        const tier = tierFromPriceId(priceId);
        // Active (or in trial) → set tier; canceled/unpaid → drop to lite.
        const activeStatuses: Stripe.Subscription.Status[] = ['active', 'trialing', 'past_due'];
        const newTier = activeStatuses.includes(sub.status) && tier ? tier : 'lite';
        await dbAdmin.doc(`users/${uid}/profile/main`).set(
          {
            tier: newTier,
            stripeCustomerId: sub.customer,
            stripeSubscriptionId: sub.id,
            stripeStatus: sub.status,
            currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          },
          { merge: true },
        );
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const uid = sub.metadata?.uid;
        if (!uid) break;
        await dbAdmin.doc(`users/${uid}/profile/main`).set(
          { tier: 'lite', stripeStatus: 'canceled' },
          { merge: true },
        );
        break;
      }
      default:
        // Ignore other event types
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
