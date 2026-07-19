import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, transactions, spins } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    const [spinCount] = await db.select({ count: sql<number>`count(*)::int` }).from(spins);

    const [depositStats] = await db.select({
      total: sql<number>`coalesce(sum(amount),0)::float`,
      count: sql<number>`count(*)::int`,
    }).from(transactions).where(eq(transactions.type, 'deposit'));

    const [withdrawStats] = await db.select({
      total: sql<number>`coalesce(sum(amount),0)::float`,
      count: sql<number>`count(*)::int`,
    }).from(transactions).where(eq(transactions.type, 'withdrawal'));

    const [pendingWithdraw] = await db.select({
      total: sql<number>`coalesce(sum(amount),0)::float`,
      count: sql<number>`count(*)::int`,
    }).from(transactions).where(
      sql`type = 'withdrawal' AND status = 'pending'`
    );

    const [balanceSum] = await db.select({
      total: sql<number>`coalesce(sum(balance),0)::float`,
    }).from(users);

    return NextResponse.json({
      totalUsers: userCount.count,
      totalSpins: spinCount.count,
      totalDeposited: depositStats.total,
      totalDepositCount: depositStats.count,
      totalWithdrawn: withdrawStats.total,
      totalWithdrawCount: withdrawStats.count,
      pendingWithdrawAmount: pendingWithdraw.total,
      pendingWithdrawCount: pendingWithdraw.count,
      totalBalances: balanceSum.total,
    });
  } catch (err) {
    console.error('Stats error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
