import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, generateId, generateAffiliateCode, signJwt } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, email, cpf, password, referralCode } = await req.json();

    if (!name || !email || !cpf || !password) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 });
    }

    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }

    const [existingEmail] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (existingEmail) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 });
    }

    const [existingCpf] = await db.select().from(users).where(eq(users.cpf, cleanCpf));
    if (existingCpf) {
      return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 409 });
    }

    let referrerId: string | undefined;
    if (referralCode) {
      const [referrer] = await db.select().from(users).where(eq(users.affiliateCode, referralCode.toUpperCase()));
      if (referrer) referrerId = referrer.id;
    }

    const passwordHash = await hashPassword(password);
    const affiliateCode = generateAffiliateCode();
    const id = generateId();

    await db.insert(users).values({
      id,
      name,
      email: email.toLowerCase(),
      cpf: cleanCpf,
      passwordHash,
      affiliateCode,
      balance: 1000,
      bonusBalance: 1000,
      referredBy: referrerId,
    });

    const token = await signJwt({ id, email: email.toLowerCase(), name });

    const response = NextResponse.json({
      success: true,
      user: { id, name, email: email.toLowerCase(), balance: 1000, affiliateCode },
    });
    response.cookies.set('auth_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 3600, path: '/' });
    return response;
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
