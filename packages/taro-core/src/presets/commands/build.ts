import * as hooks from '../constant/hooks.js';
import { validateConfig, MessageKind } from '../../doctor/validators.js';
import { extractCompileEntry } from '../../util/app-config.js';
import type { IPluginContext } from '@spcsn/taro-service';

export default (ctx: IPluginContext) => {
  ctx.registerCommand({
    name: 'build',
    optionsMap: {
      '--watch': 'Watch mode',
      '--env [env]': 'Value for process.env.NODE_ENV',
      '--pages': 'Specify the pages to be compiled, separate multiple by comma',
      '--components': 'Specify the components to be compiled, separate multiple by comma',
      '--mode [mode]': 'Value of dotenv extname',
      '-p, --port [port]': 'Specified port',
      '--no-build': 'Do not build project',
      '--blended': 'Blended Taro project in an original MiniApp project',
      '--env-prefix [envPrefix]': "Provide the dotEnv variables's prefix",
      '--no-check': 'Do not check config is valid or not',
    },
    synopsisList: ['taro build', 'taro build --watch', 'taro build --env production'],
    async fn(opts) {
      const { options, config, _ } = opts;
      const { isWatch, blended, withoutBuild, noInjectGlobalStyle, noCheck } = options;
      const { fs, chalk, PROJECT_CONFIG } = ctx.helper;
      const { outputPath, configPath } = ctx.paths;
      const args = (options.args as Record<string, unknown>) || {};

      if (!configPath || !fs.existsSync(configPath)) {
        console.log(chalk.red(`找不到项目配置文件${PROJECT_CONFIG}，请确定当前目录是 Taro 项目根目录!`));
        process.exit(1);
      }

      if (!noCheck) {
        const result = await validateConfig(ctx.initialConfig);
        if (!result.isValid) {
          console.log(chalk.red(`Taro 配置有误，请检查！ (${configPath})`));
          for (const message of result.messages) {
            const prefix = message.kind === MessageKind.Error ? chalk.red('[✗] ') : chalk.green('[✓] ');
            console.log(`  ${prefix}${message.content}`);
          }
          process.exit(1);
        }
      }

      fs.ensureDirSync(outputPath);
      const isBuildNativeComp = _[1] === 'native-components';
      const isProduction = process.env.NODE_ENV === 'production' || !isWatch;

      await ctx.applyPlugins(hooks.ON_BUILD_START);
      await ctx.applyPlugins({
        name: 'weapp',
        opts: {
          config: {
            ...config,
            isWatch,
            mode: isProduction ? 'production' : 'development',
            blended,
            isBuildNativeComp,
            withoutBuild,
            noInjectGlobalStyle,
            async modifyAppConfig(appConfig: Record<string, unknown>) {
              extractCompileEntry(appConfig, args, ctx);
              await ctx.applyPlugins({ name: hooks.MODIFY_APP_CONFIG, opts: { appConfig } });
            },
            async modifyViteConfig(viteConfig: unknown, data: unknown, viteCompilerContext: unknown) {
              await ctx.applyPlugins({
                name: hooks.MODIFY_VITE_CONFIG,
                initialVal: viteConfig,
                opts: { viteConfig, data, viteCompilerContext },
              });
            },
            async modifyBuildAssets(assets: unknown, miniPlugin: unknown) {
              await ctx.applyPlugins({
                name: hooks.MODIFY_BUILD_ASSETS,
                initialVal: assets,
                opts: { assets, miniPlugin },
              });
            },
            async modifyMiniConfigs(configMap: unknown) {
              await ctx.applyPlugins({
                name: hooks.MODIFY_MINI_CONFIGS,
                initialVal: configMap,
                opts: { configMap },
              });
            },
            async onBuildFinish({ error, stats, isWatch }: { error: unknown; stats: unknown; isWatch: boolean }) {
              await ctx.applyPlugins({ name: hooks.ON_BUILD_FINISH, opts: { error, stats, isWatch } });
            },
          },
        },
      });
      await ctx.applyPlugins(hooks.ON_BUILD_COMPLETE);
    },
  });
};
