import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, affiliateReferrals } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const authUser = await getCurrentUser();

    if (!authUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id));

    if (!user) {
      return NextResponse.json(
        { error: 'Não encontrado' },
        { status: 404 }
      );
    }

    const referrals = await db
      .select()
      .from(affiliateReferrals)
      .where(eq(affiliateReferrals.userId, user.id));

    const levels: Record<string, number> = {
      bronze: 3,
      silver: 5,
      gold: 7,
      master: 10,
    };

    const commission = levels[user.affiliateLevel] ?? 3;

    return NextResponse.json({
      affiliateCode: user.affiliateCode,
      affiliateLevel: user.affiliateLevel,
      commission,
      totalReferrals: referrals.length,
      earnings: user.affiliateEarnings,
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? '',
    });
  } catch (err) {
    console.error('Affiliate error:', err);

    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    );
  }
}
