import type { ViteMiniCompilerContext } from '@spcsn/taro/types/compile/viteCompilerContext';
import type { Rolldown } from 'vite';
import { VITE_COMPILER_LABEL } from './constant';

export function getViteMiniCompilerContext(
  rollupPluginContext: Rolldown.PluginContext,
): ViteMiniCompilerContext | undefined {
  const info = rollupPluginContext.getModuleInfo(VITE_COMPILER_LABEL);
  const compiler = info?.meta.viteCompilerContext;
  return compiler;
}
