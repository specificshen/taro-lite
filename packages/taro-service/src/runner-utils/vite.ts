import { VITE_COMPILER_LABEL } from './constant';

import type { ViteMiniCompilerContext } from '@spcsn/taro/types/compile/viteCompilerContext';

interface ViteRollupPluginContextLike {
  getModuleInfo: (moduleId: string) => { meta?: { viteCompilerContext?: ViteMiniCompilerContext } } | null;
}

export function getViteMiniCompilerContext(
  rollupPluginContext: ViteRollupPluginContextLike,
): ViteMiniCompilerContext | void {
  const info = rollupPluginContext.getModuleInfo(VITE_COMPILER_LABEL);
  const compiler = info?.meta?.viteCompilerContext;
  return compiler;
}
