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

export function isFunction(o: unknown): o is (...args: any[]) => any {
  return typeof o === 'function';
}

export function isNumber(o: unknown): o is number {
  if (Number.isFinite) return Number.isFinite(o);
  return typeof o === 'number';
}

export const isArray = Array.isArray;

export function toDashed(s: string) {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function toCamelCase(s: string) {
  let camel = '';
  let nextCap = false;
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== '-') {
      camel += nextCap ? s[i].toUpperCase() : s[i];
      nextCap = false;
    } else {
      nextCap = true;
    }
  }
  return camel;
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
