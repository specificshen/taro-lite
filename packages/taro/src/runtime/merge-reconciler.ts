import type { TFunc } from './interface';
import { hooks, TaroHooks } from './runtime-hooks';

type AnyHook = (...args: never[]) => unknown;

export function mergeReconciler(hostConfig: Record<string, AnyHook>, hooksForTest?: TaroHooks) {
  const targetHooks = (hooksForTest || hooks) as TaroHooks;
  const keys = Object.keys(hostConfig);
  keys.forEach((key) => {
    targetHooks.tap(key, hostConfig[key] as TFunc);
  });
}
