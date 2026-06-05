import * as path from 'node:path';

import { dotenvParse, patchEnv } from '@spcsn/taro-helper';
import { Config, Kernel } from '@spcsn/taro-service';
import minimist from 'minimist';

import customCommand from './commands/customCommand';
import { getPkgVersion } from './util';

const DEFAULT_FRAMEWORK = 'react';
const SUPPORTED_COMMANDS = new Set(['build', 'init']);

export default class CLI {
  appPath: string;
  constructor(appPath?: string) {
    this.appPath = appPath || process.cwd();
    const majorVersion = parseInt(process.version.substring(1).split('.')[0], 10);
    if (majorVersion < 20) {
      console.warn('Taro 将不再支持 Node.js 小于 20 的版本。请升级 Node.js 至 20 或更高版本。');
    }
  }

  run() {
    return this.parseArgs();
  }

  async parseArgs() {
    const args = minimist(process.argv.slice(2), {
      alias: {
        version: ['v'],
        help: ['h'],
        port: ['p'],
        resetCache: ['reset-cache'], // specially for rn, Removes cached files.
        publicPath: ['public-path'], // specially for rn, assets public path.
        bundleOutput: ['bundle-output'], // specially for rn, File name where to store the resulting bundle.
        sourcemapOutput: ['sourcemap-output'], // specially for rn, File name where to store the sourcemap file for resulting bundle.
        sourceMapUrl: ['sourcemap-use-absolute-path'], // specially for rn, Report SourceMapURL using its full path.
        sourcemapSourcesRoot: ['sourcemap-sources-root'], // specially for rn, Path to make sourcemaps sources entries relative to.
        assetsDest: ['assets-dest'], // specially for rn, Directory name where to store assets referenced in the bundle.
        envPrefix: ['env-prefix'],
      },
      boolean: ['version', 'help', 'disable-global-config'],
      default: {
        build: true,
        check: true,
        'inject-global-style': true,
      },
    });
    const _ = args._;
    const command = _[0];
    if (command) {
      const appPath = this.appPath;
      const presetsPath = path.resolve(__dirname, 'presets');
      const commandsPath = path.resolve(presetsPath, 'commands');
      const targetPlugin = `${command}.js`;

      if (!SUPPORTED_COMMANDS.has(command)) {
        console.log('当前 CLI 仅支持 build 和 init 命令。');
        return;
      }

      // 设置环境变量
      process.env.NODE_ENV ||= args.env;
      if (process.env.NODE_ENV === 'undefined' && command === 'build') {
        process.env.NODE_ENV = args.watch ? 'development' : 'production';
      }
      args.type ||= args.t;
      if (!args.type && command === 'build') {
        args.type = 'weapp';
      }
      if (args.type) {
        process.env.TARO_ENV = args.type;
      }
      const mode = args.mode || process.env.NODE_ENV;
      // 这里解析 dotenv 以便于 config 解析时能获取 dotenv 配置信息
      const expandEnv = dotenvParse(appPath, args.envPrefix, mode);

      const disableGlobalConfig = !!args['disable-global-config'];

      const configEnv = {
        mode,
        command,
      };
      const config = new Config({
        appPath: this.appPath,
        disableGlobalConfig: disableGlobalConfig,
      });
      await config.init(configEnv);

      const kernel = new Kernel({
        appPath,
        presets: [path.resolve(__dirname, '.', 'presets', 'index.js')],
        config,
        plugins: [],
      });
      kernel.optsPlugins ||= [];

      // 将自定义的 变量 添加到 config.env 中，实现 definePlugin 字段定义
      const initialConfig = kernel.config?.initialConfig;
      if (initialConfig) {
        initialConfig.env = patchEnv(initialConfig, expandEnv);
      }
      kernel.optsPlugins.push(path.resolve(commandsPath, targetPlugin));
      kernel.cliCommandsPath = commandsPath;
      kernel.cliCommands = Array.from(SUPPORTED_COMMANDS);

      switch (command) {
        case 'build': {
          let platform = args.type;
          const { publicPath, bundleOutput, sourcemapOutput, sourceMapUrl, sourcemapSourcesRoot, assetsDest } = args;

          // 针对不同的内置平台注册对应的端平台插件
          switch (platform) {
            case 'weapp':
              kernel.optsPlugins.push(path.resolve(__dirname, 'platform-weapp'));
              break;
            default: {
              if (platform) {
                console.log('当前 Fork 仅支持微信小程序（weapp）构建。');
                return;
              }
              break;
            }
          }

          // 根据 framework 启用插件
          const framework = kernel.config?.initialConfig.framework || DEFAULT_FRAMEWORK;
          if (framework !== 'react') {
            console.log('当前 Fork 仅支持 React 框架。');
            return;
          }
          kernel.optsPlugins.push(require.resolve('@spcsn/taro-vite-runner/framework-react'));
          await customCommand(command, kernel, {
            args,
            _,
            platform,
            isWatch: Boolean(args.watch),
            // Note: 是否把 Taro 组件编译为原生自定义组件
            isBuildNativeComp: _[1] === 'native-components',
            // Note: 新的混合编译模式，支持把组件单独编译为原生组件
            newBlended: Boolean(args['new-blended']),
            // Note: 是否禁用编译
            withoutBuild: !args.build,
            noInjectGlobalStyle: !args['inject-global-style'],
            noCheck: !args.check,
            port: args.port,
            env: args.env,
            deviceType: args.platform,
            resetCache: !!args.resetCache,
            publicPath,
            bundleOutput,
            sourcemapOutput,
            sourceMapUrl,
            sourcemapSourcesRoot,
            assetsDest,
            qr: !!args.qr,
            blended: Boolean(args.blended),
            h: args.h,
          });
          break;
        }
        case 'init': {
          await customCommand(command, kernel, {
            _,
            appPath,
            projectName: _[1] || args.name,
            description: args.description,
            typescript: args.typescript,
            framework: args.framework,
            compiler: args.compiler,
            npm: args.npm,
            templateSource: args['template-source'],
            clone: !!args.clone,
            template: args.template,
            css: args.css,
            autoInstall: args.autoInstall,
            h: args.h,
          });
          break;
        }
      }
    } else {
      if (args.h) {
        console.log('Usage: taro <command> [options]');
        console.log();
        console.log('Options:');
        console.log('  -v, --version       output the version number');
        console.log('  -h, --help          output usage information');
        console.log();
        console.log('Commands:');
        console.log('  init [projectName]  Init a project with default template');
        console.log('  build               Build a WeApp project');
      } else if (args.v) {
        console.log(getPkgVersion());
      }
    }
  }
}
