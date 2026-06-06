import * as validatorsModule from '../../doctor/validators.js';
import * as appConfigModule from '../../util/app-config.js';
import * as hooks from '../constant/hooks.js';

import type { IPluginContext } from '@spcsn/taro-service';

const validators = (validatorsModule as any).default || validatorsModule;
const appConfig = (appConfigModule as any).default || appConfigModule;
const { MessageKind, validateConfig } = validators;
const { extractCompileEntry } = appConfig;

export default (ctx: IPluginContext) => {
  ctx.registerCommand({
    name: 'build',
    optionsMap: {
      '--type [typeName]': 'Build type, weapp（默认 weapp）',
      '--watch': 'Watch mode',
      '--env [env]': 'Value for process.env.NODE_ENV',
      '--pages': 'Specify the pages to be compiled, separate multiple by comma',
      '--components': 'Specify the components to be compiled, separate multiple by comma',
      '--mode [mode]': 'Value of dotenv extname',
      '-p, --port [port]': 'Specified port',
      '--no-build': 'Do not build project',
      '--blended': 'Blended Taro project in an original MiniApp project',
      '--new-blended':
        'Blended Taro project in an original MiniApp project while supporting building components independently',
      '--env-prefix [envPrefix]': "Provide the dotEnv varables's prefix",
      '--no-check': 'Do not check config is valid or not',
    },
    synopsisList: [
      'taro build',
      'taro build --watch',
      'taro build --watch --pages pages/index/index',
      'taro build --env production',
      'taro build --blended',
      'taro build --no-build',
      'taro build native-components',
      'taro build --new-blended',
      'taro build --mode prepare --env-prefix TARO_APP_',
    ],
    async fn(opts) {
      const { options, config, _ } = opts;
      const { platform, isWatch, blended, newBlended, withoutBuild, noInjectGlobalStyle, noCheck } = options;
      const { fs, chalk, PROJECT_CONFIG } = ctx.helper;
      const { outputPath, configPath } = ctx.paths;
      const args = options.args || {};

      if (!configPath || !fs.existsSync(configPath)) {
        console.log(chalk.red(`找不到项目配置文件${PROJECT_CONFIG}，请确定当前目录是 Taro 项目根目录!`));
        process.exit(1);
      }

      if (typeof platform !== 'string') {
        console.log(chalk.red('请传入正确的编译类型！'));
        process.exit(1);
      }

      // 校验 Taro 项目配置
      if (!noCheck) {
        const checkResult = await checkConfig({
          projectConfig: ctx.initialConfig,
          helper: ctx.helper,
        });
        if (!checkResult.isValid) {
          const ERROR = chalk.red('[✗] ');
          const WARNING = chalk.yellow('[!] ');
          const SUCCESS = chalk.green('[✓] ');

          const lineChalk = chalk.hex('#fff');
          const errorChalk = chalk.hex('#f00');
          console.log(errorChalk(`Taro 配置有误，请检查！ (${configPath})`));
          checkResult.messages.forEach((message) => {
            switch (message.kind) {
              case MessageKind.Error:
                console.log('  ' + ERROR + lineChalk(message.content));
                break;
              case MessageKind.Success:
                console.log('  ' + SUCCESS + lineChalk(message.content));
                break;
              case MessageKind.Warning:
                console.log('  ' + WARNING + lineChalk(message.content));
                break;
              case MessageKind.Manual:
                console.log('  ' + lineChalk(message.content));
                break;
              default:
                break;
            }
          });
          console.log('');
          process.exit(1);
        }
      }

      const isProduction = process.env.NODE_ENV === 'production' || !isWatch;

      // dist folder
      fs.ensureDirSync(outputPath);

      // is build native components mode?
      const isBuildNativeComp = _[1] === 'native-components';

      await ctx.applyPlugins(hooks.ON_BUILD_START);
      await ctx.applyPlugins({
        name: platform,
        opts: {
          config: {
            ...config,
            isWatch,
            mode: isProduction ? 'production' : 'development',
            blended,
            isBuildNativeComp,
            withoutBuild,
            newBlended,
            noInjectGlobalStyle,
              async modifyAppConfig(appConfig) {
                extractCompileEntry(appConfig, args, ctx);

                await ctx.applyPlugins({
                  name: hooks.MODIFY_APP_CONFIG,
                  opts: {
                    appConfig,
                  },
                });
              },
              async modifyViteConfig(viteConfig, data, viteCompilerContext) {
                await ctx.applyPlugins({
                  name: hooks.MODIFY_VITE_CONFIG,
                  initialVal: viteConfig,
                  opts: {
                    viteConfig,
                    data,
                    viteCompilerContext,
                  },
                });
              },
              async modifyBuildAssets(assets, miniPlugin) {
                await ctx.applyPlugins({
                  name: hooks.MODIFY_BUILD_ASSETS,
                  initialVal: assets,
                  opts: {
                    assets,
                    miniPlugin,
                  },
                });
              },
              async modifyMiniConfigs(configMap) {
                await ctx.applyPlugins({
                  name: hooks.MODIFY_MINI_CONFIGS,
                  initialVal: configMap,
                  opts: {
                    configMap,
                  },
                });
              },
              async modifyComponentConfig(componentConfig, config) {
                await ctx.applyPlugins({
                  name: hooks.MODIFY_COMPONENT_CONFIG,
                  opts: {
                    componentConfig,
                    config,
                  },
                });
              },
              async onParseCreateElement(nodeName, componentConfig) {
                await ctx.applyPlugins({
                  name: hooks.ON_PARSE_CREATE_ELEMENT,
                  opts: {
                    nodeName,
                    componentConfig,
                  },
                });
              },
              async onBuildFinish({ error, stats, isWatch }) {
                await ctx.applyPlugins({
                  name: hooks.ON_BUILD_FINISH,
                  opts: {
                    error,
                    stats,
                    isWatch,
                  },
                });
              },
            },
          },
        });
      await ctx.applyPlugins(hooks.ON_BUILD_COMPLETE);
    },
  });
};

async function checkConfig({ projectConfig, helper }) {
  const result = await validateConfig(projectConfig, helper);
  return result;
}
