export type AuthUser = {
  id: string;
  email: string;
  name: string;
  plan: 'pro' | 'team' | 'enterprise';
  isVerified: boolean;
};

const KEY_USER = 'mercorama_auth_user';
const KEY_OTP = 'mercorama_pending_otp';
const KEY_PENDING_USER = 'mercorama_pending_user';

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEY_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_USER, JSON.stringify(user));
}

export function clearAuthUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY_USER);
  localStorage.removeItem(KEY_OTP);
  localStorage.removeItem(KEY_PENDING_USER);
}

export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function storeOTP(otp: string): void {
  if (typeof window === 'undefined') return;
  const entry = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };
  localStorage.setItem(KEY_OTP, JSON.stringify(entry));
}

export function verifyOTP(input: string): boolean {
  if (typeof window === 'undefined') return false;
  const raw = localStorage.getItem(KEY_OTP);
  if (!raw) return false;
  try {
    const { otp, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) return false;
    return input === otp;
  } catch {
    return false;
  }
}

export function getPendingUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEY_PENDING_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setPendingUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_PENDING_USER, JSON.stringify(user));
}

export function clearPendingUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY_PENDING_USER);
  localStorage.removeItem(KEY_OTP);
}
