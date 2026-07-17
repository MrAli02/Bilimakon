const loginAttempts = new Map<string, { count: number; firstAttempt: number; blocked: boolean }>();
const ADMIN_MAX = 3;
const USER_MAX = 5;
const BLOCK_MS = 15 * 60 * 1000;
const WINDOW_MS = 5 * 60 * 1000;

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  blockedUntil?: Date;
  message?: string;
}

export function checkRateLimit(identifier: string, isAdmin = false): RateLimitResult {
  const max = isAdmin ? ADMIN_MAX : USER_MAX;
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record) return { allowed: true, remainingAttempts: max - 1 };

  if (record.blocked) {
    const unblockAt = record.firstAttempt + BLOCK_MS;
    if (now < unblockAt) {
      const mins = Math.ceil((unblockAt - now) / 60000);
      return { allowed: false, remainingAttempts: 0, blockedUntil: new Date(unblockAt), message: `${mins} daqiqadan so'ng urinib ko'ring` };
    }
    loginAttempts.delete(identifier);
    return { allowed: true, remainingAttempts: max - 1 };
  }

  if (now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.delete(identifier);
    return { allowed: true, remainingAttempts: max - 1 };
  }

  if (record.count >= max) {
    loginAttempts.set(identifier, { count: record.count, firstAttempt: Date.now(), blocked: true });
    return { allowed: false, remainingAttempts: 0, blockedUntil: new Date(Date.now() + BLOCK_MS), message: `${max} marta noto'g'ri urinish. 15 daqiqa kuting.` };
  }

  return { allowed: true, remainingAttempts: max - record.count - 1 };
}

export function recordFailedAttempt(identifier: string, isAdmin = false): void {
  const max = isAdmin ? ADMIN_MAX : USER_MAX;
  const now = Date.now();
  const record = loginAttempts.get(identifier);
  if (!record || (now - record.firstAttempt > WINDOW_MS && !record.blocked)) {
    loginAttempts.set(identifier, { count: 1, firstAttempt: now, blocked: false });
  } else {
    const newCount = record.count + 1;
    loginAttempts.set(identifier, { count: newCount, firstAttempt: record.firstAttempt, blocked: newCount >= max });
  }
}

export function clearAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}
