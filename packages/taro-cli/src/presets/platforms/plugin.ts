import * as path from 'node:path';

import { fs } from '@spcsn/taro-helper';
import { getPlatformType } from '@spcsn/taro-shared';

import type { IPluginContext } from '@spcsn/taro-service';

const configName = 'mini';
export default (ctx: IPluginContext) => {
  ctx.registerPlatform({
    name: 'plugin',
    useConfigName: configName,
    async fn({ config }) {
      const { options, _ } = ctx.runOpts;
      const { chalk, PLATFORMS } = ctx.helper;
      const { WEAPP } = PLATFORMS;
      const typeMap = {
        [WEAPP]: '微信',
      };
      const { plugin, isWatch } = options;
      if (plugin !== WEAPP) {
        console.log(chalk.red('当前 Fork 仅支持微信小程序插件编译！'));
        return;
      }
      console.log(chalk.green(`开始编译${typeMap[plugin]}小程序插件`));
      async function buildPlugin(platform) {
        process.env.TARO_ENV = platform;
        process.env.TARO_PLATFORM = getPlatformType(platform, configName);
        await ctx.applyPlugins({
          name: 'build',
          opts: {
            config: {
              ...config,
              isBuildPlugin: true,
              isWatch,
              outputRoot: `${config.outputRoot}/plugin`,
              platform,
            },
            options: Object.assign({}, options, {
              platform,
            }),
            _,
          },
        });
        await ctx.applyPlugins({
          name: 'build',
          opts: {
            config: {
              ...config,
              isBuildPlugin: false,
              isWatch,
              outputRoot: `${config.outputRoot}/miniprogram`,
              platform,
              output: { ...(config.output || {}), clean: false },
            },
            options: Object.assign({}, options, {
              platform,
            }),
            _,
          },
        });
      }

      await buildPlugin(plugin);

      try {
        const docSrcPath = path.join(process.cwd(), 'src/plugin/doc');
        const docDestPath = path.join(process.cwd(), 'miniprogram/doc');
        fs.copy(docSrcPath, docDestPath);
      } catch (err) {
        console.error('[@spcsn/taro-cli] build plugin doc failed: ', err);
      }
    },
  });
};
