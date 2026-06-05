import { VITE_COMPILER_LABEL } from './constant';

import type { ViteMiniCompilerContext } from '@spcsn/taro/types/compile/viteCompilerContext';
import type { PluginContext } from 'rollup';

export function getViteMiniCompilerContext(rollupPluginContext: PluginContext): ViteMiniCompilerContext | void {
  const info = rollupPluginContext.getModuleInfo(VITE_COMPILER_LABEL);
  const compiler = info?.meta.viteCompilerContext;
  return compiler;
}
