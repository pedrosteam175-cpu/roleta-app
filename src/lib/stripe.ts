import Stripe from 'stripe';
import { db } from '@/db';
import { appConfig } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getStripeKey(): Promise<string> {
  // DB has priority over env
  try {
    const [row] = await db.select().from(appConfig).where(eq(appConfig.key, 'stripe_secret_key'));
    if (row?.value) return row.value;
  } catch {}
  return process.env.STRIPE_SECRET_KEY ?? '';
}

export async function getStripeWebhookSecret(): Promise<string> {
  try {
    const [row] = await db.select().from(appConfig).where(eq(appConfig.key, 'stripe_webhook_secret'));
    if (row?.value) return row.value;
  } catch {}
  return process.env.STRIPE_WEBHOOK_SECRET ?? '';
}

export async function getStripePublishableKey(): Promise<string> {
  // DB has priority over env
  try {
    const [row] = await db.select().from(appConfig).where(eq(appConfig.key, 'stripe_publishable_key'));
    if (row?.value) return row.value;
  } catch {}
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
}

async function getStripe(): Promise<Stripe> {
  const key = await getStripeKey();
  if (!key) throw new Error('STRIPE_SECRET_KEY não configurada');
  return new Stripe(key, {
    apiVersion: '2026-02-25.clover',
    maxNetworkRetries: 2,
    timeout: 20000,
  });
}

export interface CreateDepositSessionDTO {
  userId: string;
  userEmail: string;
  amountBrl: number;   // em reais
  transactionId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface DepositSessionResult {
  sessionId: string;
  checkoutUrl: string;
}

/** Cria uma Checkout Session para depósito via cartão/PIX (Stripe) */
export async function createDepositSession(dto: CreateDepositSessionDTO): Promise<DepositSessionResult> {
  const stripe = await getStripe();
  const amountCents = Math.round(dto.amountBrl * 100);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: dto.userEmail,
    line_items: [{
      price_data: {
        currency: 'brl',
        product_data: { name: 'Depósito — Roleta da Sorte' },
        unit_amount: amountCents,
      },
      quantity: 1,
    }],
    metadata: {
      userId: dto.userId,
      transactionId: dto.transactionId,
      amountBrl: String(dto.amountBrl),
    },
    success_url: dto.successUrl,
    cancel_url: dto.cancelUrl,
  }, {
    idempotencyKey: `deposit-${dto.transactionId}`,
  });

  return { sessionId: session.id, checkoutUrl: session.url! };
}

/** Verifica assinatura e retorna evento Stripe do webhook */
export async function constructWebhookEvent(payload: string, signature: string): Promise<Stripe.Event> {
  const secret = await getStripeWebhookSecret();
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET não configurada');
  const stripe = await getStripe();
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
