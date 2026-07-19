import { NextRequest } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'pedrosteam175@gmail.com';

export function checkAdminAuth(req: NextRequest): boolean {
  return (
    req.headers.get('x-admin-password') === ADMIN_PASSWORD &&
    req.headers.get('x-admin-email') === ADMIN_EMAIL
  );
}
