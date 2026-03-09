/**
 * Safe API response helpers — prevent crashes from unexpected response shapes.
 */

export function safeArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

export function safeObject<T extends Record<string, any>>(value: unknown, fallback: T): T {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as T)
    : fallback;
}

export function safeNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function safeString(value: unknown, fallback: string = ''): string {
  return typeof value === 'string' ? value : fallback;
}
