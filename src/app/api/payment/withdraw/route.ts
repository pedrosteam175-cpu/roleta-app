import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, transactions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, generateId } from '@/lib/auth';
import { getAsaasConfig, createPixTransfer } from '@/lib/asaas';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { amount, pixKey, pixName, pixCpf } = await req.json();
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }
    if (!pixKey) {
      return NextResponse.json({ error: 'Chave PIX obrigatória' }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, authUser.id));
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    if (user.balance < value) {
      return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 });
    }

    const { apiKey } = await getAsaasConfig();
    if (!apiKey) {
      return NextResponse.json({ error: 'Pagamentos não configurados. Contate o suporte.' }, { status: 503 });
    }

    // Execute real PIX transfer via Asaas
    await createPixTransfer({
      name: pixName ?? user.name,
      cpf: pixCpf ?? user.cpf,
      pixKey,
      amount: value,
      description: 'Saque Roleta da Sorte',
    });

    const newBalance = parseFloat((user.balance - value).toFixed(2));
    const txId = generateId();

    await db.update(users).set({
      balance: newBalance,
      totalWithdrawn: user.totalWithdrawn + value,
      updatedAt: new Date(),
    }).where(eq(users.id, user.id));

    await db.insert(transactions).values({
      id: txId,
      userId: user.id,
      type: 'withdrawal',
      status: 'completed',
      amount: value,
      pixKey,
      pixName: pixName ?? user.name,
      pixCpf: pixCpf ?? user.cpf,
      description: `Saque de R$ ${value.toFixed(2)}`,
    });

    return NextResponse.json({ success: true, newBalance });
  } catch (err) {
    console.error('Withdraw error:', err);
    return NextResponse.json({ error: 'Erro ao processar saque' }, { status: 500 });
  }
}
