import { NextResponse } from 'next/server';
import { db } from '@/db';
import { spins, transactions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const spinHistory = await db.select().from(spins)
      .where(eq(spins.userId, authUser.id))
      .orderBy(desc(spins.createdAt))
      .limit(50);

    const txHistory = await db.select().from(transactions)
      .where(eq(transactions.userId, authUser.id))
      .orderBy(desc(transactions.createdAt))
      .limit(50);

    return NextResponse.json({ spins: spinHistory, transactions: txHistory });
  } catch (err) {
    console.error('History error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
