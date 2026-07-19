import { db } from '@/db';
import { appConfig } from '@/db/schema';
import { eq } from 'drizzle-orm';

/** Read Asaas credentials — DB config takes priority over env vars */
export async function getAsaasConfig(): Promise<{ apiKey: string; apiUrl: string }> {
  let apiKey = process.env.ASAAS_API_KEY ?? '';
  let apiUrl = process.env.ASAAS_API_URL ?? 'https://www.asaas.com/api/v3';

  try {
    const rows = await db
      .select()
      .from(appConfig)
      .where(eq(appConfig.key, 'asaas_api_key'));
    if (rows.length && rows[0].value) apiKey = rows[0].value;

    const urlRows = await db
      .select()
      .from(appConfig)
      .where(eq(appConfig.key, 'asaas_api_url'));
    if (urlRows.length && urlRows[0].value) apiUrl = urlRows[0].value;
  } catch {
    // Fall back to env vars if DB read fails
  }

  return { apiKey, apiUrl };
}

async function asaasRequest(path: string, method: string, body?: unknown) {
  const { apiKey, apiUrl } = await getAsaasConfig();
  const res = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Asaas error ${res.status}: ${err}`);
  }
  return res.json();
}

export async function createOrGetCustomer(params: { name: string; email: string; cpf: string }) {
  try {
    const existing = await asaasRequest(`/customers?cpfCnpj=${params.cpf.replace(/\D/g, '')}`, 'GET');
    if (existing.data && existing.data.length > 0) return existing.data[0];
  } catch {}
  return asaasRequest('/customers', 'POST', {
    name: params.name,
    email: params.email,
    cpfCnpj: params.cpf.replace(/\D/g, ''),
  });
}

export async function createPixCharge(params: { customerId: string; amount: number; description: string }) {
  return asaasRequest('/payments', 'POST', {
    customer: params.customerId,
    billingType: 'PIX',
    value: params.amount,
    dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
    description: params.description,
  });
}

export async function getPixQrCode(paymentId: string) {
  return asaasRequest(`/payments/${paymentId}/pixQrCode`, 'GET');
}

export async function createPixTransfer(params: {
  name: string; cpf: string; pixKey: string; amount: number; description: string;
}) {
  return asaasRequest('/transfers', 'POST', {
    value: params.amount,
    operationType: 'PIX',
    pixAddressKey: params.pixKey,
    pixAddressKeyType: 'CPF',
    description: params.description,
  });
}

export async function getPayment(paymentId: string) {
  return asaasRequest(`/payments/${paymentId}`, 'GET');
}

export interface CardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface CardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone: string;
}

export async function createCreditCardCharge(params: {
  customerId: string;
  amount: number;
  description: string;
  card: CardData;
  holderInfo: CardHolderInfo;
  remoteIp: string;
}) {
  return asaasRequest('/payments', 'POST', {
    customer: params.customerId,
    billingType: 'CREDIT_CARD',
    value: params.amount,
    dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
    description: params.description,
    creditCard: {
      holderName: params.card.holderName,
      number: params.card.number.replace(/\s/g, ''),
      expiryMonth: params.card.expiryMonth,
      expiryYear: params.card.expiryYear,
      ccv: params.card.ccv,
    },
    creditCardHolderInfo: {
      name: params.holderInfo.name,
      email: params.holderInfo.email,
      cpfCnpj: params.holderInfo.cpfCnpj.replace(/\D/g, ''),
      postalCode: params.holderInfo.postalCode.replace(/\D/g, ''),
      addressNumber: params.holderInfo.addressNumber,
      phone: params.holderInfo.phone.replace(/\D/g, ''),
    },
    remoteIp: params.remoteIp,
  });
}
