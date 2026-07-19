import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    const [user] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      cpf: users.cpf,
      balance: users.balance,
      bonusBalance: users.bonusBalance,
      affiliateCode: users.affiliateCode,
      affiliateLevel: users.affiliateLevel,
      affiliateEarnings: users.affiliateEarnings,
      totalDeposited: users.totalDeposited,
      totalWithdrawn: users.totalWithdrawn,
    }).from(users).where(eq(users.id, authUser.id));

    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (err) {
    console.error('Me error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
  return response;
}
