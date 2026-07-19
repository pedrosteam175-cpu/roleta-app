import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, transactions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { constructWebhookEvent } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('stripe-signature') ?? '';

    let event;
    try {
      event = await constructWebhookEvent(payload, signature);
    } catch (err) {
      console.error('Webhook signature error:', err);
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 });
    }

    console.log(`Webhook Stripe: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as { metadata?: { transactionId?: string; userId?: string; amountBrl?: string }; payment_status?: string };

      if (session.payment_status !== 'paid') {
        return NextResponse.json({ ok: true });
      }

      const transactionId = session.metadata?.transactionId;
      if (!transactionId) return NextResponse.json({ ok: true });

      const [tx] = await db.select().from(transactions).where(eq(transactions.id, transactionId));
      if (!tx || tx.status === 'completed') return NextResponse.json({ ok: true });

      const [user] = await db.select().from(users).where(eq(users.id, tx.userId));
      if (!user) return NextResponse.json({ ok: true });

      const newBalance = parseFloat((user.balance + tx.amount).toFixed(2));
      await db.update(users).set({
        balance: newBalance,
        totalDeposited: user.totalDeposited + tx.amount,
        updatedAt: new Date(),
      }).where(eq(users.id, user.id));

      await db.update(transactions)
        .set({ status: 'completed', updatedAt: new Date() })
        .where(eq(transactions.id, tx.id));

      console.log(`Depósito R$${tx.amount} creditado para ${user.email}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'Roleta da Sorte Webhook' });
}
