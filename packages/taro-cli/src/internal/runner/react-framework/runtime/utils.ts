import type { Router } from '@spcsn/taro/runtime';
import { Current, isArray, isFunction } from '@spcsn/taro/runtime';
import type * as React from 'react';

export const HOOKS_APP_ID = 'taro-app';

export function isClassComponent(R: typeof React, component: unknown): boolean {
  const comp = component as Record<string, unknown>;
  const prototype = comp.prototype as Record<string, unknown> | undefined;

  // For React Redux
  if ((comp.displayName as string | undefined)?.includes('Connect')) return false;

  return (
    isFunction(comp.render) || !!prototype?.isReactComponent || prototype instanceof R.Component // compat for some others react-like library
  );
}

export function ensureIsArray<T>(item: T | T[]): T[] {
  if (isArray(item)) {
    return item;
  } else {
    return item ? [item] : [];
  }
}

/**
 * set writable, enumerable to true
 */
export function setDefaultDescriptor(obj: Record<string, unknown> & PropertyDescriptor) {
  obj.writable = true;
  obj.enumerable = true;
  return obj;
}

/**
 * 设置入口的路由参数
 * @param options 小程序传入的参数
 */
export function setRouterParams(options: Record<string, unknown>) {
  Current.router = {
    params: options.query as Record<string, unknown>,
    ...options,
  } as Router;
}
