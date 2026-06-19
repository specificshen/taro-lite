import type { ViteMiniCompilerContext } from '@spcsn/taro/types/compile/vite-compiler-context';
import { VITE_COMPILER_LABEL } from './constant';

interface ViteRollupPluginContextLike {
  getModuleInfo: (moduleId: string) => { meta?: { viteCompilerContext?: ViteMiniCompilerContext } } | null;
}

export function getViteMiniCompilerContext(
  rollupPluginContext: ViteRollupPluginContextLike,
): ViteMiniCompilerContext | undefined {
  const info = rollupPluginContext.getModuleInfo(VITE_COMPILER_LABEL);
  const compiler = info?.meta?.viteCompilerContext;
  return compiler;
}
