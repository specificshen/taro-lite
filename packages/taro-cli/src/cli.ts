import * as path from 'node:path';
import { dotenvParse, patchEnv } from '@spcsn/taro-helper';
import { Config, Kernel } from '@spcsn/taro-service';
import customCommand from './commands/custom-command';
import { cliProfiler, getPkgVersion } from './util/index.js';

const DEFAULT_FRAMEWORK = 'react';
const SUPPORTED_COMMANDS = new Set(['build', 'init']);

interface CliArgs {
  _: string[];
  [key: string]: boolean | number | string | string[] | undefined;
}

const ARG_ALIASES: Record<string, string[]> = {
  envPrefix: ['env-prefix'],
  help: ['h'],
  port: ['p'],
  version: ['v'],
};

const BOOLEAN_ARGS = new Set(['disable-global-config', 'h', 'help', 'v', 'version']);

function parseArgValue(value: string): number | string {
  if (value.trim() !== '' && /^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  return value;
}

function setArgValue(args: CliArgs, key: string, value: boolean | number | string) {
  args[key] = value;

  for (const [canonicalKey, aliases] of Object.entries(ARG_ALIASES)) {
    if (key === canonicalKey || aliases.includes(key)) {
      args[canonicalKey] = value;
      aliases.forEach((alias) => {
        args[alias] = value;
      });
      return;
    }
  }
}

function getStringArg(args: CliArgs, key: string): string | undefined {
  const value = args[key];
  return typeof value === 'string' ? value : undefined;
}

function getNumberArg(args: CliArgs, key: string): number | undefined {
  const value = args[key];
  return typeof value === 'number' ? value : undefined;
}

function parseCliArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    _: [],
    build: true,
    check: true,
    h: false,
    help: false,
    'inject-global-style': true,
    v: false,
    version: false,
  };

  for (let index = 0; index < argv.length; index++) {
    const item = argv[index];
    if (!item.startsWith('-') || item === '-') {
      args._.push(item);
      continue;
    }

    if (item === '--') {
      args._.push(...argv.slice(index + 1));
      break;
    }

    const normalizedItem = item.replace(/^--?/, '');
    const equalIndex = normalizedItem.indexOf('=');
    const rawKey = equalIndex >= 0 ? normalizedItem.slice(0, equalIndex) : normalizedItem;
    const inlineValue = equalIndex >= 0 ? normalizedItem.slice(equalIndex + 1) : undefined;
    const isNegativeBoolean = rawKey.startsWith('no-');
    const key = isNegativeBoolean ? rawKey.slice(3) : rawKey;

    if (isNegativeBoolean) {
      setArgValue(args, key, false);
      continue;
    }

    if (inlineValue !== undefined) {
      setArgValue(args, key, parseArgValue(inlineValue));
      continue;
    }

    if (BOOLEAN_ARGS.has(key)) {
      setArgValue(args, key, true);
      continue;
    }

    const nextItem = argv[index + 1];
    if (nextItem && !nextItem.startsWith('-')) {
      setArgValue(args, key, parseArgValue(nextItem));
      index++;
    } else {
      setArgValue(args, key, true);
    }
  }

  return args;
}

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
    const totalStartMs = cliProfiler.start();
    const parseArgsStartMs = cliProfiler.start();
    const args = parseCliArgs(process.argv.slice(2));
    cliProfiler.end('parse args', parseArgsStartMs);
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
      const env = getStringArg(args, 'env');
      const envPrefix = getStringArg(args, 'envPrefix');
      process.env.NODE_ENV ||= env;
      if (process.env.NODE_ENV === 'undefined' && command === 'build') {
        process.env.NODE_ENV = args.watch ? 'development' : 'production';
      }
      args.type ||= getStringArg(args, 't');
      if (!args.type && command === 'build') {
        args.type = 'weapp';
      }
      const type = getStringArg(args, 'type');
      if (type) {
        process.env.TARO_ENV = type;
      }
      const mode = getStringArg(args, 'mode') || process.env.NODE_ENV || 'production';
      // 这里解析 dotenv 以便于 config 解析时能获取 dotenv 配置信息
      const dotenvStartMs = cliProfiler.start();
      const expandEnv = dotenvParse(appPath, envPrefix, mode);
      cliProfiler.end('dotenv parse', dotenvStartMs);

      const disableGlobalConfig = !!args['disable-global-config'];

      const configEnv = {
        mode,
        command,
      };
      const config = new Config({
        appPath: this.appPath,
        disableGlobalConfig: disableGlobalConfig,
      });
      await cliProfiler.measure('config init', () => config.init(configEnv));

      const kernelStartMs = cliProfiler.start();
      const kernel = new Kernel({
        appPath,
        presets: [path.resolve(__dirname, '.', 'presets', 'index.js')],
        config,
        plugins: [],
      });
      cliProfiler.end('kernel init', kernelStartMs);
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
          let platform = getStringArg(args, 'type');

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
          kernel.optsPlugins.push(require.resolve('@spcsn/taro-mini-runner/framework-react'));
          await cliProfiler.measure('build command', () =>
            customCommand(command, kernel, {
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
              port: getNumberArg(args, 'port'),
              env,
              deviceType: getStringArg(args, 'platform'),
              qr: !!args.qr,
              blended: Boolean(args.blended),
              h: args.h,
            }),
          );
          cliProfiler.end('total', totalStartMs);
          cliProfiler.print();
          break;
        }
        case 'init': {
          await cliProfiler.measure('init command', () =>
            customCommand(command, kernel, {
              _,
              appPath,
              projectName: _[1] || getStringArg(args, 'name'),
              description: getStringArg(args, 'description'),
              typescript: args.typescript,
              framework: getStringArg(args, 'framework'),
              compiler: getStringArg(args, 'compiler'),
              npm: getStringArg(args, 'npm'),
              templateSource: getStringArg(args, 'template-source'),
              clone: !!args.clone,
              template: getStringArg(args, 'template'),
              css: getStringArg(args, 'css'),
              autoInstall: args.autoInstall,
              h: args.h,
            }),
          );
          cliProfiler.end('total', totalStartMs);
          cliProfiler.print();
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
