import type { IProjectConfig } from '@spcsn/taro/types/compile';
import type { CompilerTypes, CompilerViteTypes } from '@spcsn/taro/types/compile/compiler';

type ConfigMerge = (...configs: Array<object | null | undefined>) => object;

export interface ConfigEnv {
  command: string;
  mode: string;
}

export type UserConfigFn<T extends CompilerTypes = CompilerViteTypes> = (
  merge: ConfigMerge,
  env: ConfigEnv,
) => IProjectConfig<T> | Promise<IProjectConfig<T>>;

export type UserConfigExport<T extends CompilerTypes = CompilerViteTypes> =
  | IProjectConfig<T>
  | Promise<IProjectConfig<T>>
  | UserConfigFn<T>;

export function defineConfig<T extends CompilerTypes = CompilerViteTypes>(config: UserConfigExport<T>) {
  return config;
}
