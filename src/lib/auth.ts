import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET ?? 'roleta-sorte-secret';

function base64url(data: string): string {
  return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlDecode(data: string): string {
  const pad = data.length % 4;
  const padded = pad ? data + '='.repeat(4 - pad) : data;
  return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return base64url(String.fromCharCode(...new Uint8Array(sig)));
}

export async function signJwt(payload: Record<string, unknown>): Promise<string> {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 }));
  const sig = await hmacSign(`${header}.${body}`, JWT_SECRET);
  return `${header}.${body}.${sig}`;
}

export async function verifyJwt(token: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expected = await hmacSign(`${header}.${body}`, JWT_SECRET);
    if (sig !== expected) return null;
    const payload = JSON.parse(base64urlDecode(body));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const [saltHex, hashHex] = hash.split(':');
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const derived = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    const derivedHex = Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, '0')).join('');
    return derivedHex === hashHex;
  } catch {
    return false;
  }
}

export async function getCurrentUser(): Promise<{ id: string; email: string; name: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    const payload = await verifyJwt(token);
    if (!payload) return null;
    return payload as { id: string; email: string; name: string };
  } catch {
    return null;
  }
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateAffiliateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
