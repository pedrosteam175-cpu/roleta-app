import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appConfig } from '@/db/schema';
import { eq } from 'drizzle-orm';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'pedrosteam175@gmail.com';

function checkAuth(req: NextRequest): boolean {
  const password = req.headers.get('x-admin-password');
  const email = req.headers.get('x-admin-email');
  return password === ADMIN_PASSWORD && email === ADMIN_EMAIL;
}

const ALLOWED_KEYS = [
  'asaas_api_key',
  'asaas_api_url',
  'stripe_secret_key',
  'stripe_webhook_secret',
  'stripe_publishable_key',
  'bonus_inicial',
  'saque_minimo',
];

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  try {
    const rows = await db.select().from(appConfig);
    const config: Record<string, string> = {};
    for (const row of rows) {
      // Mask the API key — only show last 6 chars
      if (row.key === 'asaas_api_key' && row.value) {
        config[row.key] = '••••••••••••' + row.value.slice(-6);
      } else {
        config[row.key] = row.value;
      }
    }
    return NextResponse.json({ config });
  } catch (err) {
    console.error('Config GET error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  try {
    const body = await req.json();

    for (const [key, value] of Object.entries(body)) {
      if (!ALLOWED_KEYS.includes(key)) continue;
      if (typeof value !== 'string') continue;
      // Skip masked values — user didn't change them
      if (value.startsWith('••••')) continue;

      await db
        .insert(appConfig)
        .values({ key, value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: appConfig.key,
          set: { value, updatedAt: new Date() },
        });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Config POST error:', err);
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}
