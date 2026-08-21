export const EMPTY_OBJ: Record<string, never> = {};

export const noop = (..._: unknown[]) => {};

export function isString(o: unknown): o is string {
  return typeof o === 'string';
}

export function isUndefined(o: unknown): o is undefined {
  return typeof o === 'undefined';
}

export function isNull(o: unknown): o is null {
  return o === null;
}

export function isObject<T>(o: unknown): o is T {
  return o !== null && typeof o === 'object';
}

export function isFunction(o: unknown): o is (...args: unknown[]) => unknown {
  return typeof o === 'function';
}

export function isNumber(o: unknown): o is number {
  if (Number.isFinite) return Number.isFinite(o);
  return typeof o === 'number';
}

export const isArray = Array.isArray;

// 入参全是有限的属性名/事件名，key 空间有界，模块级缓存常驻即可
const toDashedCache = new Map<string, string>();
const toCamelCaseCache = new Map<string, string>();

export function toDashed(s: string) {
  let result = toDashedCache.get(s);
  if (result === undefined) {
    result = s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    toDashedCache.set(s, result);
  }
  return result;
}

export function toCamelCase(s: string) {
  let result = toCamelCaseCache.get(s);
  if (result === undefined) {
    result = '';
    let nextCap = false;
    for (let i = 0; i < s.length; i++) {
      if (s[i] !== '-') {
        result += nextCap ? s[i].toUpperCase() : s[i];
        nextCap = false;
      } else {
        nextCap = true;
      }
    }
    toCamelCaseCache.set(s, result);
  }
  return result;
}

export function ensure(condition: boolean, msg: string): asserts condition {
  if (!condition) {
    throw new Error(msg);
  }
}

export function warn(condition: boolean, msg: string) {
  if (process.env.NODE_ENV !== 'production') {
    if (condition) {
      console.warn(`[taro warn] ${msg}`);
    }
  }
}

/**
 * globalThis 单例兜底（AGENTS.md §4.4）：runtime 被打进多个产物时复用已有状态对象，避免状态分裂。
 */
export function getGlobalSingleton<T>(key: string, create: () => T): T {
  if (typeof globalThis === 'undefined') return create();
  const globalScope = globalThis as Record<string, unknown>;
  const existing = globalScope[key] as T | undefined;
  if (existing !== undefined) return existing;
  const instance = create();
  globalScope[key] = instance;
  return instance;
}
