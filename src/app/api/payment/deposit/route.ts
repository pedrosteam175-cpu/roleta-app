import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, transactions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, generateId } from '@/lib/auth';
import { createDepositSession } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { amount } = await req.json();
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, authUser.id));
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Pagamentos não configurados. Insira a chave Stripe no painel admin.' }, { status: 503 });
    }

    const txId = generateId();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:13000';

    // Create Stripe Checkout Session
    const session = await createDepositSession({
      userId: user.id,
      userEmail: user.email,
      amountBrl: value,
      transactionId: txId,
      successUrl: `${appUrl}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}`,
    });

    // Save pending transaction
    await db.insert(transactions).values({
      id: txId,
      userId: user.id,
      type: 'deposit',
      status: 'pending',
      amount: value,
      asaasPaymentId: session.sessionId,
      description: `Depósito de R$ ${value.toFixed(2)}`,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.checkoutUrl,
      sessionId: session.sessionId,
    });
  } catch (err) {
    console.error('Deposit error:', err);
    return NextResponse.json({ error: 'Erro ao gerar depósito. Tente novamente.' }, { status: 500 });
  }
}
