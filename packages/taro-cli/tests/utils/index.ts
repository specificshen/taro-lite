import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Config, Kernel } from '../../src/internal/taro-service';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface IRunOptions {
  options?: Record<string, string | boolean>;
  args?: string[];
}

interface IRun {
  (appPath: string, options?: IRunOptions): Promise<Kernel>;
}

export function run(name: string, presets: string[] = []): IRun {
  return async function (appPath, opts = {}) {
    const { options = {}, args = [] } = opts;

    const config = new Config({
      appPath: appPath,
      disableGlobalConfig: !!options.disableGlobalConfig,
    });
    await config.init({
      mode: (options.mode || process.env.NODE_ENV) as string,
      command: name,
    });

    const kernel = new Kernel({
      appPath: appPath,
      presets: [
        path.resolve(__dirname, '../fixtures/test-preset/index.ts'),
        ...presets.map((e) => (path.isAbsolute(e) ? e : path.resolve(__dirname, '../../dist/presets', `${e}.js`))),
      ],
      plugins: [],
      config,
    });
    kernel.optsPlugins ||= [];

    const type = options.type;
    if (typeof type === 'string' && !presets.some((e) => e.includes(type))) {
      if (type === 'weapp') {
        kernel.optsPlugins.push(path.resolve(__dirname, '../../dist/platform-weapp'));
      } else {
        throw new Error(`当前 Fork 仅支持微信小程序（weapp），不支持 ${type} 平台。`);
      }
    }

    await kernel.run({
      name,
      opts: {
        _: [name, ...args],
        options,
        isHelp: false,
      },
    });

    return kernel;
  };
}
