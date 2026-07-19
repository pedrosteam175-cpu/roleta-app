import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appConfig } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAsaasConfig } from '@/lib/asaas';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'pedrosteam175@gmail.com';

function checkAuth(req: NextRequest) {
  return req.headers.get('x-admin-password') === ADMIN_PASSWORD &&
         req.headers.get('x-admin-email') === ADMIN_EMAIL;
}

async function saveConfig(key: string, value: string) {
  await db.insert(appConfig)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appConfig.key, set: { value, updatedAt: new Date() } });
}

/** GET — retorna status atual do webhook no Asaas */
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { apiKey, apiUrl } = await getAsaasConfig();
    if (!apiKey) return NextResponse.json({ error: 'Chave Asaas não configurada' }, { status: 400 });

    const res = await fetch(`${apiUrl}/webhooks`, {
      headers: { 'Content-Type': 'application/json', 'access_token': apiKey },
    });
    if (!res.ok) return NextResponse.json({ error: `Asaas ${res.status}` }, { status: 400 });

    const data = await res.json();
    const webhooks = data.data ?? [];

    // Busca token salvo localmente
    const [tokenRow] = await db.select().from(appConfig).where(eq(appConfig.key, 'webhook_token'));
    const [urlRow] = await db.select().from(appConfig).where(eq(appConfig.key, 'webhook_url'));

    return NextResponse.json({
      webhooks,
      savedToken: tokenRow?.value ? '••••••••' + tokenRow.value.slice(-4) : '',
      savedUrl: urlRow?.value ?? '',
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/** POST — registra ou atualiza webhook no Asaas */
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { appUrl } = await req.json();
    const webhookUrl = `${appUrl}/api/payment/webhook`;

    const { apiKey, apiUrl } = await getAsaasConfig();
    if (!apiKey) return NextResponse.json({ error: 'Chave Asaas não configurada' }, { status: 400 });

    // Gera token de segurança
    const token = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    // Lista webhooks existentes
    const listRes = await fetch(`${apiUrl}/webhooks`, {
      headers: { 'Content-Type': 'application/json', 'access_token': apiKey },
    });
    const listData = await listRes.json();
    const existing = (listData.data ?? []).find((w: { url: string }) =>
      w.url.includes('/api/payment/webhook')
    );

    let result;
    if (existing) {
      // Atualiza webhook existente
      const updateRes = await fetch(`${apiUrl}/webhooks/${existing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'access_token': apiKey },
        body: JSON.stringify({
          url: webhookUrl,
          email: ADMIN_EMAIL,
          enabled: true,
          interrupted: false,
          authToken: token,
          events: ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_OVERDUE'],
        }),
      });
      result = await updateRes.json();
    } else {
      // Cria novo webhook
      const createRes = await fetch(`${apiUrl}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'access_token': apiKey },
        body: JSON.stringify({
          url: webhookUrl,
          email: ADMIN_EMAIL,
          enabled: true,
          interrupted: false,
          authToken: token,
          events: ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_OVERDUE'],
        }),
      });
      result = await createRes.json();
    }

    if (result.errors) {
      return NextResponse.json({ error: result.errors[0]?.description ?? 'Erro Asaas' }, { status: 400 });
    }

    // Salva token e URL no banco
    await saveConfig('webhook_token', token);
    await saveConfig('webhook_url', webhookUrl);

    return NextResponse.json({ success: true, webhookUrl, webhookId: result.id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
