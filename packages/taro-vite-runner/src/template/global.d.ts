import type { createRecursiveComponentConfig } from '@spcsn/taro-runtime';

declare global {
  const Component: (options: ReturnType<typeof createRecursiveComponentConfig>) => void;
}

export {};
