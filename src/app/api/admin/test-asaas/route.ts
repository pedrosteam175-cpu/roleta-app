import { NextRequest, NextResponse } from 'next/server';
import { getAsaasConfig } from '@/lib/asaas';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'pedrosteam175@gmail.com';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-admin-password');
  const email = req.headers.get('x-admin-email');
  if (auth !== ADMIN_PASSWORD || email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { apiKey, apiUrl } = await getAsaasConfig();
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave API não configurada' }, { status: 400 });
    }

    const res = await fetch(`${apiUrl}/myAccount`, {
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json({
        error: `Asaas retornou erro ${res.status}`,
        detail: body.slice(0, 200),
      }, { status: 400 });
    }

    const account = await res.json();
    return NextResponse.json({
      success: true,
      name: account.name ?? account.tradingName ?? '—',
      email: account.email ?? '—',
      environment: apiUrl.includes('sandbox') ? 'Sandbox' : 'Produção',
    });
  } catch (err: unknown) {
    return NextResponse.json({
      error: 'Falha na conexão com Asaas',
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
