import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dotenvParse, patchEnv } from '@spcsn/taro-helper';
import { Config, Kernel } from '@spcsn/taro-service';
import customCommand from './commands/custom-command.js';
import { cliProfiler, getPkgVersion, printPkgVersion } from './util/index.js';
import type { CliArgs } from './util/types.js';

const SUPPORTED_COMMANDS = ['build', 'init'] as const;

type Command = (typeof SUPPORTED_COMMANDS)[number];

const ARG_ALIASES = new Map<string, string>([
  ['env-prefix', 'envPrefix'],
  ['h', 'help'],
  ['p', 'port'],
  ['t', 'type'],
  ['v', 'version'],
]);

function normalizeKey(key: string): string {
  return ARG_ALIASES.get(key) ?? key;
}

function parseArgValue(value: string): number | string {
  return /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value;
}

function parseCliArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    _: [],
    build: true,
    check: true,
    help: false,
    'inject-global-style': true,
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
    const key = normalizeKey(isNegativeBoolean ? rawKey.slice(3) : rawKey);

    if (isNegativeBoolean) {
      args[key] = false;
      continue;
    }

    if (inlineValue !== undefined) {
      args[key] = parseArgValue(inlineValue);
      continue;
    }

    const nextItem = argv[index + 1];
    if (nextItem && !nextItem.startsWith('-')) {
      args[key] = parseArgValue(nextItem);
      index++;
    } else {
      args[key] = true;
    }
  }

  return args;
}

function getStringArg(args: CliArgs, key: string): string | undefined {
  const value = args[key];
  return typeof value === 'string' ? value : undefined;
}

function getNumberArg(args: CliArgs, key: string): number | undefined {
  const value = args[key];
  return typeof value === 'number' ? value : undefined;
}

export default class CLI {
  appPath: string;

  constructor(appPath?: string) {
    this.appPath = appPath || process.cwd();
  }

  run(): Promise<void> {
    return this.parseArgs();
  }

  async parseArgs(): Promise<void> {
    const totalStartMs = cliProfiler.start();
    const args = parseCliArgs(process.argv.slice(2));
    const [command, ...restArgs] = args._;

    if (!command) {
      if (args.help) this.printHelp();
      else if (args.version) console.log(getPkgVersion());
      return;
    }

    if (!SUPPORTED_COMMANDS.includes(command as Command)) {
      console.log('当前 CLI 仅支持 build 和 init 命令。');
      return;
    }

    printPkgVersion();

    const appPath = this.appPath;
    const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const commandsPath = path.join(packageRoot, 'dist', 'presets', 'commands');

    const env = getStringArg(args, 'env');
    const envPrefix = getStringArg(args, 'envPrefix');
    process.env.NODE_ENV ||= env;
    if (process.env.NODE_ENV === 'undefined') {
      process.env.NODE_ENV = args.watch ? 'development' : 'production';
    }

    args.type ||= getStringArg(args, 'type') ?? 'weapp';
    process.env.TARO_ENV = getStringArg(args, 'type');

    const mode = getStringArg(args, 'mode') || process.env.NODE_ENV || 'production';
    const expandEnv = dotenvParse(appPath, envPrefix, mode);

    const config = new Config({ appPath: this.appPath, disableGlobalConfig: !!args['disable-global-config'] });
    await cliProfiler.measure('config init', () => config.init({ mode, command }));

    const kernel = new Kernel({
      appPath,
      presets: [path.join(packageRoot, 'dist', 'presets', 'index.js')],
      config,
      plugins: [],
    });

    kernel.optsPlugins ||= [];
    if (kernel.config?.initialConfig) {
      kernel.config.initialConfig.env = patchEnv(kernel.config.initialConfig, expandEnv);
    }

    kernel.optsPlugins.push(path.join(commandsPath, `${command}.js`));
    kernel.cliCommandsPath = commandsPath;
    kernel.cliCommands = [...SUPPORTED_COMMANDS];

    if (command === 'build') {
      kernel.optsPlugins.push(path.join(packageRoot, 'dist', 'platform-weapp'));
      kernel.optsPlugins.push(fileURLToPath(await import.meta.resolve('@spcsn/taro-mini-runner/framework-react')));

      await cliProfiler.measure('build command', () =>
        customCommand(command, kernel, {
          args,
          _: args._,
          platform: 'weapp',
          isWatch: Boolean(args.watch),
          isBuildNativeComp: restArgs[0] === 'native-components',
          newBlended: Boolean(args['new-blended']),
          withoutBuild: !args.build,
          noInjectGlobalStyle: !args['inject-global-style'],
          noCheck: !args.check,
          port: getNumberArg(args, 'port'),
          env,
          deviceType: getStringArg(args, 'platform'),
          qr: !!args.qr,
          blended: Boolean(args.blended),
          h: args.help,
        }),
      );
    } else {
      await cliProfiler.measure('init command', () =>
        customCommand(command, kernel, {
          _: args._,
          appPath,
          projectName: restArgs[0] || getStringArg(args, 'name'),
          description: getStringArg(args, 'description'),
          npm: getStringArg(args, 'npm'),
          templateSource: getStringArg(args, 'template-source'),
          clone: !!args.clone,
          template: getStringArg(args, 'template'),
          autoInstall: args.autoInstall,
          h: args.help,
        }),
      );
    }

    cliProfiler.end('total', totalStartMs);
    cliProfiler.print();
  }

  private printHelp(): void {
    console.log('Usage: taro <command> [options]');
    console.log();
    console.log('Options:');
    console.log('  -v, --version       output the version number');
    console.log('  -h, --help          output usage information');
    console.log();
    console.log('Commands:');
    console.log('  init [projectName]  Init a project with default template');
    console.log('  build               Build a WeApp project');
  }
}
