import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, transactions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, generateId } from '@/lib/auth';
import { getAsaasConfig, createOrGetCustomer, createCreditCardCharge } from '@/lib/asaas';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, card, holderInfo } = body;

    const value = parseFloat(amount);
    if (!value || value <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }
    if (!card?.number || !card?.holderName || !card?.expiryMonth || !card?.expiryYear || !card?.ccv) {
      return NextResponse.json({ error: 'Dados do cartão incompletos' }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, authUser.id));
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const { apiKey } = await getAsaasConfig();
    if (!apiKey) return NextResponse.json({ error: 'Pagamentos não configurados' }, { status: 503 });

    // Get or create Asaas customer
    let customerId = user.asaasCustomerId;
    if (!customerId) {
      const customer = await createOrGetCustomer({ name: user.name, email: user.email, cpf: user.cpf });
      customerId = customer.id;
      await db.update(users).set({ asaasCustomerId: customerId, updatedAt: new Date() }).where(eq(users.id, user.id));
    }

    // Get remote IP
    const remoteIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? '127.0.0.1';

    // Charge card
    const payment = await createCreditCardCharge({
      customerId: customerId!,
      amount: value,
      description: 'Depósito Roleta da Sorte',
      card,
      holderInfo: {
        name: holderInfo?.name ?? user.name,
        email: holderInfo?.email ?? user.email,
        cpfCnpj: holderInfo?.cpf ?? user.cpf,
        postalCode: holderInfo?.postalCode ?? '00000000',
        addressNumber: holderInfo?.addressNumber ?? '0',
        phone: holderInfo?.phone ?? '00000000000',
      },
      remoteIp,
    });

    if (payment.errors?.length) {
      return NextResponse.json({ error: payment.errors[0].description }, { status: 400 });
    }

    // If confirmed immediately, credit balance
    const txId = generateId();
    const confirmed = payment.status === 'CONFIRMED' || payment.status === 'RECEIVED';

    if (confirmed) {
      const newBalance = parseFloat((user.balance + value).toFixed(2));
      await db.update(users).set({
        balance: newBalance,
        totalDeposited: user.totalDeposited + value,
        updatedAt: new Date(),
      }).where(eq(users.id, user.id));

      await db.insert(transactions).values({
        id: txId,
        userId: user.id,
        type: 'deposit',
        status: 'completed',
        amount: value,
        asaasPaymentId: payment.id,
        description: `Depósito cartão R$ ${value.toFixed(2)}`,
      });

      return NextResponse.json({ success: true, newBalance, status: payment.status });
    }

    // Pending — save and wait webhook
    await db.insert(transactions).values({
      id: txId,
      userId: user.id,
      type: 'deposit',
      status: 'pending',
      amount: value,
      asaasPaymentId: payment.id,
      description: `Depósito cartão R$ ${value.toFixed(2)}`,
    });

    return NextResponse.json({ success: true, pending: true, status: payment.status });
  } catch (err) {
    console.error('Card payment error:', err);
    const msg = err instanceof Error ? err.message : 'Erro ao processar cartão';
    // Extract Asaas error description if present
    const match = msg.match(/"description":"([^"]+)"/);
    return NextResponse.json({ error: match ? match[1] : 'Erro ao processar cartão. Verifique os dados.' }, { status: 500 });
  }
}
