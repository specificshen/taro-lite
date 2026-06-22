// Note: @spcsn/taro/runtime 不依赖 @spcsn/taro, 所以不能改为从 @spcsn/taro 引入 (可能导致循环依赖)
export type TFunc = (...args: unknown[]) => unknown;
export type PageConfig = Record<string, unknown>;
