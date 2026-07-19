import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, spins } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, generateId } from '@/lib/auth';

// Main wheel segments (weights for always-win design)
const MAIN_SEGMENTS = [
  { value: 1, weight: 30 },
  { value: 2, weight: 25 },
  { value: 3, weight: 20 },
  { value: 5, weight: 10 },
  { value: 10, weight: 7 },
  { value: 20, weight: 4 },
  { value: 50, weight: 2 },
  { value: 100, weight: 1 },
  { value: 0.5, weight: 1 }, // minimum non-zero to always win
];

// Bonus multiplier wheel
const BONUS_SEGMENTS = [
  { value: 1, weight: 50 },
  { value: 2, weight: 30 },
  { value: 3, weight: 15 },
  { value: 4, weight: 5 },
];

function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { betAmount } = await req.json();
    const bet = parseFloat(betAmount);
    if (!bet || bet <= 0) {
      return NextResponse.json({ error: 'Valor de aposta inválido' }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, authUser.id));
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    if (user.balance < bet) {
      return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 });
    }

    // Always win — pick positive multipliers
    const mainSpin = weightedRandom(MAIN_SEGMENTS);
    const bonusSpin = weightedRandom(BONUS_SEGMENTS);

    const totalMultiplier = mainSpin.value * bonusSpin.value;
    const winAmount = parseFloat((bet * totalMultiplier).toFixed(2));
    const netGain = parseFloat((winAmount - bet).toFixed(2));
    const newBalance = parseFloat((user.balance + netGain).toFixed(2));

    await db.update(users).set({ balance: newBalance, updatedAt: new Date() }).where(eq(users.id, user.id));

    const spinId = generateId();
    await db.insert(spins).values({
      id: spinId,
      userId: user.id,
      betAmount: bet,
      mainResult: mainSpin.value,
      bonusResult: bonusSpin.value,
      totalMultiplier,
      winAmount,
    });

    return NextResponse.json({
      success: true,
      mainResult: mainSpin.value,
      bonusResult: bonusSpin.value,
      totalMultiplier,
      winAmount,
      newBalance,
    });
  } catch (err) {
    console.error('Spin error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
