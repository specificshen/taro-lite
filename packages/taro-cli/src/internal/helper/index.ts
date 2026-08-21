const DEBUG_ALL = '*';

/** debug 包的无依赖替代：仅按 DEBUG 环境变量做命名空间过滤输出 */
export const createDebug = (id: string) => {
  return (...args: unknown[]) => {
    const pattern = process.env.DEBUG;
    if (!pattern) return;
    const enabled = pattern
      .split(',')
      .map((item) => item.trim())
      .some(
        (item) => item === DEBUG_ALL || id === item || (item.endsWith(DEBUG_ALL) && id.startsWith(item.slice(0, -1))),
      );
    if (enabled) {
      console.error(id, ...args);
    }
  };
};

export * from './constants';
export * from './dotenv';
export * as npm from './npm';
export * from './terminal';
export * from './utils';
