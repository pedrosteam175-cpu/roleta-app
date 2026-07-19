import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, spins, transactions } from '@/db/schema';
import { eq, desc, count, sum } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        cpf: users.cpf,
        balance: users.balance,
        bonusBalance: users.bonusBalance,
        totalDeposited: users.totalDeposited,
        totalWithdrawn: users.totalWithdrawn,
        affiliateCode: users.affiliateCode,
        affiliateLevel: users.affiliateLevel,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(200);

    return NextResponse.json({ users: allUsers });
  } catch (err) {
    console.error('Admin users error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
