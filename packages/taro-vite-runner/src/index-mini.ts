import { isFunction } from '@spcsn/taro-shared';
import { build } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

import miniPreset from './mini';
import { convertCopyOptions } from './utils';
import { TaroCompilerContext } from './utils/compiler/mini';
import { componentConfig } from './utils/component';

import type { ViteMiniBuildConfig } from '@spcsn/taro/types/compile/viteCompilerContext';
import type { UserConfig } from 'vite';

export default async function (appPath: string, rawTaroConfig: ViteMiniBuildConfig) {
  const viteCompilerContext = new TaroCompilerContext(appPath, rawTaroConfig);
  const { taroConfig } = viteCompilerContext;
  const plugins: UserConfig['plugins'] = [miniPreset(viteCompilerContext)];

  // copy-plugin
  if (taroConfig.copy?.patterns?.length) {
    plugins.push(
      viteStaticCopy({
        targets: convertCopyOptions(taroConfig),
      }),
    );
  }

  // custom vite plugins
  if (typeof taroConfig.compiler === 'object' && taroConfig.compiler?.vitePlugins?.length) {
    plugins.push(...taroConfig.compiler.vitePlugins);
  }

  const commonConfig: UserConfig = {
    logLevel: 'warn',
    plugins,
  };

  const modifyComponentConfig = taroConfig.modifyComponentConfig;
  if (isFunction(modifyComponentConfig)) {
    modifyComponentConfig(componentConfig, taroConfig);
  }

  taroConfig.modifyViteConfig?.(
    commonConfig,
    {
      componentConfig,
    },
    viteCompilerContext,
  );

  await build(commonConfig);
}
