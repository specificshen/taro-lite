import type { IProjectConfig } from '@spcsn/taro/types/compile';
import type { CompilerTypes, CompilerViteTypes } from '@spcsn/taro/types/compile/compiler';

type WebpackMerge = (...configs: Array<object | null | undefined>) => object;

export interface ConfigEnv {
  /** taro 当前执行的命令 */
  command: string;
  /** 当前模式 (mode) */
  mode: string;
}

export type UserConfigFn<T extends CompilerTypes = CompilerViteTypes> = (
  merge: WebpackMerge,
  env: ConfigEnv,
) => IProjectConfig<T> | Promise<IProjectConfig<T>>;
export type UserConfigExport<T extends CompilerTypes = CompilerViteTypes> =
  | IProjectConfig<T>
  | Promise<IProjectConfig<T>>
  | UserConfigFn;

/**
 * @since v3.6.9
 * @warning 暂不支持 react native
 */
export function defineConfig<T extends CompilerTypes = CompilerViteTypes>(config: UserConfigExport<T>) {
  return config;
}
