import { hooks } from './runtime-hooks';

export function mergeReconciler(hostConfig: Record<string, any>, hooksForTest?: any) {
  const targetHooks = hooksForTest || hooks;
  const keys = Object.keys(hostConfig);
  keys.forEach((key) => {
    targetHooks.tap(key, hostConfig[key]);
  });
}
