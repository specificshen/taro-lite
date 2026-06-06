import assetsPlugin from '../plugins/vite-plugin-assets';
import multiPlatformPlugin from '../plugins/vite-plugin-multi-platform';
import configPlugin from './config';
import emitPlugin from './emit';
import entryPlugin from './entry';
import nativeSupportPlugin from './native-support';
import pagePlugin from './page';
import pipelinePlugin from './pipeline';
import stylePlugin from './style';

import type { ViteMiniCompilerContext } from '@spcsn/taro/types/compile/viteCompilerContext';
import type { PluginOption } from 'vite';

export default function (viteCompilerContext: ViteMiniCompilerContext): PluginOption[] {
  return [
    pipelinePlugin(viteCompilerContext),
    configPlugin(viteCompilerContext),
    entryPlugin(viteCompilerContext),
    pagePlugin(viteCompilerContext),
    multiPlatformPlugin(viteCompilerContext),
    nativeSupportPlugin(viteCompilerContext),
    assetsPlugin(viteCompilerContext),
    stylePlugin(viteCompilerContext),
    emitPlugin(viteCompilerContext),
  ];
}
