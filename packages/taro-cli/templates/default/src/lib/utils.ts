/**
 * Lightweight clsx alternative for Taro Mini Program (avoid extra deps).
 */
export function cn(...inputs: Array<string | Record<string, boolean> | undefined | null>): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'object' && !Array.isArray(input)) {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.join(' ');
}

/**
 * Format a Date object into HH:mm:ss.SSS string.
 */
export function formatTime(date = new Date()): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

/**
 * Simple delay promise.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a short random id.
 */
export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}
