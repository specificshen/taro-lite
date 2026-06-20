export function isString(o: unknown): o is string {
  return typeof o === 'string';
}

export function isFunction(o: unknown): o is (...args: any[]) => any {
  return typeof o === 'function';
}

export function isNumber(o: unknown): o is number {
  if (Number.isFinite) return Number.isFinite(o);
  return typeof o === 'number';
}

export function isBooleanStringLiteral(o: unknown): o is string {
  return o === 'true' || o === 'false' || o === '!0' || o === '!1';
}

export function isObjectStringLiteral(o: unknown): o is string {
  return o === '{}';
}
