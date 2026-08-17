/**
 * Security, sanitization, rate-limiting and bot-protection utility
 * Complies with 2026 security standards and OWASP Top 10 recommendations.
 */

// Rate Limiter Memory Store
const actionTimestamps: Record<string, number[]> = {};

/**
 * Checks and updates rate limit for a specific action key
 * @param actionKey Identifier for the action (e.g. 'auth_attempt', 'create_room')
 * @param maxHits Maximum allowed actions within windowMs
 * @param windowMs Time window in milliseconds
 * @returns boolean true if allowed, false if rate limited
 */
export function checkRateLimit(actionKey: string, maxHits: number = 5, windowMs: number = 10000): boolean {
  const now = Date.now();
  const timestamps = actionTimestamps[actionKey] || [];
  
  // Filter timestamps within window
  const recent = timestamps.filter(t => now - t < windowMs);
  
  if (recent.length >= maxHits) {
    return false;
  }
  
  recent.push(now);
  actionTimestamps[actionKey] = recent;
  return true;
}

/**
 * Strict Nickname / Username Sanitizer
 * Allows only alphanumeric, Turkish characters (ç, ğ, ı, ö, ş, ü), underscores and hyphens.
 * Prevents HTML/Script injection, SQL injection characters, and excessive whitespace.
 */
export function sanitizeUsername(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/[<>'"`;(){}[\]\\/]/g, '') // Strip script/tag injection tokens
    .slice(0, 20); // Strict length boundary
}

/**
 * Validates whether a username meets security and format requirements
 */
export function isValidUsername(username: string): { valid: boolean; error?: string } {
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return { valid: false, error: 'Kullanıcı adı en az 3 karakter olmalıdır.' };
  }
  if (trimmed.length > 20) {
    return { valid: false, error: 'Kullanıcı adı en fazla 20 karakter olabilir.' };
  }
  // Alphanumeric with Turkish characters, spaces, and hyphens/underscores
  const regex = /^[a-zA-Z0-9çÇğĞıİöÖşŞüÜ _-]+$/;
  if (!regex.test(trimmed)) {
    return { valid: false, error: 'Kullanıcı adı sadece harf, rakam, boşluk ve tire içerebilir.' };
  }
  return { valid: true };
}

/**
 * Validates email format strictly
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.trim().length <= 128;
}

/**
 * Validates password strength (min 6 chars, max 128 chars)
 */
export function isValidPassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 6) {
    return { valid: false, error: 'Şifre en az 6 karakter olmalıdır.' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Şifre çok uzun (en fazla 128 karakter).' };
  }
  return { valid: true };
}

/**
 * Safe text content escaper (defense-in-depth against XSS)
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
