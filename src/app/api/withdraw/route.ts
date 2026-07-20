import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, transactions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/adminAuth';
import { getAsaasConfig, createPixTransfer } from '@/lib/asaas';
import { createPaypalPayout } from '@/lib/paypal';

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const rows = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        amount: transactions.amount,
        status: transactions.status,
        pixKey: transactions.pixKey,
        pixName: transactions.pixName,
        pixCpf: transactions.pixCpf,
        description: transactions.description,
        createdAt: transactions.createdAt,
        userName: users.name,
        userEmail: users.email,
        userBalance: users.balance,
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.type, 'withdrawal'))
      .orderBy(desc(transactions.createdAt))
      .limit(200);

    return NextResponse.json({ withdrawals: rows });
  } catch (err) {
    console.error('Admin withdrawals error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { transactionId, action } = await req.json();
    if (!transactionId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const [tx] = await db.select().from(transactions).where(eq(transactions.id, transactionId));
    if (!tx) return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
    if (tx.status !== 'pending') return NextResponse.json({ error: 'Transação já processada' }, { status: 400 });

    const [user] = await db.select().from(users).where(eq(users.id, tx.userId));
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    if (action === 'reject') {
      // Estorna o saldo
      await db.update(users).set({
        balance: user.balance + tx.amount,
        totalWithdrawn: Math.max(0, user.totalWithdrawn - tx.amount),
        updatedAt: new Date(),
      }).where(eq(users.id, user.id));

      await db.update(transactions).set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(transactions.id, tx.id));

      return NextResponse.json({ success: true, action: 'rejected' });
    }

    // Approve — send the payout through the rail the withdrawal was requested with:
    // a PIX key means Asaas/PIX, otherwise it's a PayPal e-mail withdrawal.
    if (tx.pixKey) {
      const { apiKey } = await getAsaasConfig();
      if (!apiKey) {
        return NextResponse.json({ error: 'Chave Asaas não configurada' }, { status: 503 });
      }
      try {
        await createPixTransfer({
          name: tx.pixName ?? user.name,
          cpf: tx.pixCpf ?? user.cpf,
          pixKey: tx.pixKey,
          amount: tx.amount,
          description: 'Saque Roleta da Sorte',
        });
      } catch (e) {
        console.error('PIX transfer error:', e);
        return NextResponse.json({ error: 'Falha ao enviar PIX: ' + String(e) }, { status: 500 });
      }
    } else if (tx.pixName) {
      try {
        await createPaypalPayout({ email: tx.pixName, amount: tx.amount });
      } catch (e) {
        console.error('PayPal payout error:', e);
        return NextResponse.json({ error: 'Falha ao enviar payout PayPal: ' + String(e) }, { status: 500 });
      }
    }

    await db.update(transactions).set({ status: 'completed', updatedAt: new Date() })
      .where(eq(transactions.id, tx.id));

    return NextResponse.json({ success: true, action: 'approved' });
  } catch (err) {
    console.error('Admin withdrawal action error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
