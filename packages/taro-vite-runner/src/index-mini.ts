import { isFunction } from '@spcsn/taro-shared';
import { build } from 'vite';

import miniPreset from './mini';
import { convertCopyOptions } from './utils';
import { TaroCompilerContext } from './utils/compiler/mini';
import { buildProfiler } from './utils/profile';
import { componentConfig } from './utils/component';

import type { ViteMiniBuildConfig } from '@spcsn/taro/types/compile/viteCompilerContext';
import type { UserConfig } from 'vite';

export default async function (appPath: string, rawTaroConfig: ViteMiniBuildConfig) {
  const totalStartMs = buildProfiler.start();
  const contextStartMs = buildProfiler.start();
  const viteCompilerContext = new TaroCompilerContext(appPath, rawTaroConfig);
  buildProfiler.end('runner context', contextStartMs);

  const { taroConfig } = viteCompilerContext;
  const pluginsStartMs = buildProfiler.start();
  const plugins: UserConfig['plugins'] = [miniPreset(viteCompilerContext)];

  // copy-plugin
  if (taroConfig.copy?.patterns?.length) {
    const { viteStaticCopy } = await import('vite-plugin-static-copy');
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
  buildProfiler.end('prepare plugins', pluginsStartMs);

  const commonConfig: UserConfig = {
    logLevel: 'silent',
    plugins,
  };

  const modifyComponentConfig = taroConfig.modifyComponentConfig;
  if (isFunction(modifyComponentConfig)) {
    modifyComponentConfig(componentConfig, taroConfig);
  }

  const modifyViteConfigStartMs = buildProfiler.start();
  taroConfig.modifyViteConfig?.(
    commonConfig,
    {
      componentConfig,
    },
    viteCompilerContext,
  );
  buildProfiler.end('modify vite config', modifyViteConfigStartMs);

  await buildProfiler.measure('vite build', () => build(commonConfig));
  buildProfiler.end('total', totalStartMs);
  buildProfiler.print();
}
