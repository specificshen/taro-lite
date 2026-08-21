import type { ViteMiniBuildConfig } from '@spcsn/taro/types/compile/vite-compiler-context';
import type { Logger, UserConfig } from 'vite';
import { build, createLogger } from 'vite';
import miniPreset from '../mini-program';
import { convertCopyOptions } from '../shared';
import { TaroCompilerContext } from '../shared/compiler/mini';
import { componentConfig } from '../shared/component';
import { buildProfiler } from '../shared/profile.js';
import { viteStaticCopy } from '../shared/static-copy';

const VITE_BUILDING_ENVIRONMENT_MESSAGE = /^vite v\S+ building \S+ environment for \S+\.\.\.$/;

type LoggerInfoOptions = Parameters<Logger['info']>[1];

function createTaroBuildLogger(): Logger {
  const logger = createLogger('warn', {
    allowClearScreen: false,
  });

  logger.info = (message: string, _options?: LoggerInfoOptions) => {
    if (VITE_BUILDING_ENVIRONMENT_MESSAGE.test(message.trim())) return;
  };

  return logger;
}

export default async function (appPath: string, rawTaroConfig: ViteMiniBuildConfig) {
  const totalStartMs = buildProfiler.start();
  const contextStartMs = buildProfiler.start();
  const viteCompilerContext = new TaroCompilerContext(appPath, rawTaroConfig);
  await viteCompilerContext.init();
  buildProfiler.end('runner context', contextStartMs);

  const { taroConfig } = viteCompilerContext;
  const pluginsStartMs = buildProfiler.start();
  const plugins: UserConfig['plugins'] = [miniPreset(viteCompilerContext)];

  // copy-plugin
  if (taroConfig.copy?.patterns?.length) {
    plugins.push(viteStaticCopy(convertCopyOptions(taroConfig)));
  }

  // custom vite plugins
  if (typeof taroConfig.compiler === 'object' && taroConfig.compiler?.vitePlugins?.length) {
    plugins.push(...taroConfig.compiler.vitePlugins);
  }
  buildProfiler.end('prepare plugins', pluginsStartMs);

  const commonConfig: UserConfig = {
    customLogger: createTaroBuildLogger(),
    logLevel: 'silent',
    plugins,
  };

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
