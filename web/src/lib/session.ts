import crypto from 'crypto';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'loomo-jwt-secret-key-12345678';
const COOKIE_NAME = 'loomo_session';

export interface SessionPayload {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string;
}

function base64url(source: Buffer | string): string {
  const buf = typeof source === 'string' ? Buffer.from(source) : source;
  return buf.toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export function signJwt(payload: object): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerStr = base64url(JSON.stringify(header));
  const payloadStr = base64url(JSON.stringify(payload));
  
  const hmac = crypto.createHmac('sha256', JWT_SECRET);
  hmac.update(`${headerStr}.${payloadStr}`);
  const signature = base64url(hmac.digest());
  
  return `${headerStr}.${payloadStr}.${signature}`;
}

export function verifyJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerStr, payloadStr, signature] = parts;
    const hmac = crypto.createHmac('sha256', JWT_SECRET);
    hmac.update(`${headerStr}.${payloadStr}`);
    const expectedSignature = base64url(hmac.digest());
    
    if (signature !== expectedSignature) return null;
    
    return JSON.parse(base64urlDecode(payloadStr));
  } catch (e) {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJwt(token);
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = signJwt(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
