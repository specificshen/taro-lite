import { createRequire } from 'node:module';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import spawn from 'cross-spawn';
import resolvePath from 'resolve';
import * as Util from './utils';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PEERS = /UNMET PEER DEPENDENCY ([a-z\-0-9.]+)@(.+)/gm;
const npmCache = new Map<string, string>();
const runtimeRequire = createRequire(import.meta.url);

const erroneous: string[] = [];

type pluginFunction = (
  pluginName: string,
  content: string | null,
  file: string,
  config: Record<string, unknown>,
  root: string,
) => unknown;
export interface IInstallOptions {
  dev: boolean;
  peerDependencies?: boolean;
}

const defaultInstallOptions: IInstallOptions = {
  dev: false,
  peerDependencies: true,
};

export const taroPluginPrefix = '@spcsn/taro-plugin-';

function resolveFromCliPackage(pluginName: string, root?: string): string | undefined {
  try {
    const cliPackageJsonPath = runtimeRequire.resolve('@spcsn/taro-cli/package.json', {
      paths: [__dirname, root].filter(Boolean) as string[],
    });
    return resolvePath.sync(pluginName, { basedir: path.dirname(cliPackageJsonPath) });
  } catch {
    return undefined;
  }
}

function getNpmCacheKey(pluginName: string, root?: string): string {
  return `${root || ''}\u0000${pluginName}`;
}

export function resolveNpm(pluginName: string, root?: string): Promise<string> {
  const cacheKey = getNpmCacheKey(pluginName, root);
  const cachedPath = npmCache.get(cacheKey);
  if (cachedPath) {
    return Promise.resolve(cachedPath);
  }

  return new Promise((resolve, reject) => {
    resolvePath(`${pluginName}`, { basedir: root }, (err, res) => {
      if (err && (err as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
        const resolvedFromCliPackage = resolveFromCliPackage(pluginName, root);
        if (resolvedFromCliPackage) {
          npmCache.set(cacheKey, resolvedFromCliPackage);
          resolve(resolvedFromCliPackage);
          return;
        }

        resolvePath(`${pluginName}`, { basedir: __dirname }, (err2, res2) => {
          if (err2) return reject(err2);
          npmCache.set(cacheKey, res2 || '');
          resolve(res2 || '');
        });
        return;
      }
      if (err) {
        return reject(err);
      }
      npmCache.set(cacheKey, res || '');
      resolve(res || '');
    });
  });
}

export function resolveNpmSync(pluginName: string, root?: string): string {
  try {
    const cacheKey = getNpmCacheKey(pluginName, root);
    const cachedPath = npmCache.get(cacheKey);
    if (cachedPath) {
      return cachedPath;
    }

    let resolvedPath: string;
    try {
      resolvedPath = resolvePath.sync(pluginName, { basedir: root });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
        resolvedPath = resolveFromCliPackage(pluginName, root) ?? resolvePath.sync(pluginName, { basedir: __dirname });
      } else {
        throw error;
      }
    }
    npmCache.set(cacheKey, resolvedPath);
    return resolvedPath;
  } catch (err) {
    if ((err as { code?: string }).code === 'MODULE_NOT_FOUND') {
      const installOptions: IInstallOptions = {
        dev: false,
      };
      if (pluginName.indexOf(taroPluginPrefix) >= 0) {
        installOptions.dev = true;
      }
      installNpmPkg(pluginName, installOptions);
      return resolveNpmSync(pluginName, root);
    }
    return '';
  }
}

export function installNpmPkg(pkgList: string[] | string, options: IInstallOptions) {
  if (!pkgList) {
    return;
  }
  if (!Array.isArray(pkgList)) {
    pkgList = [pkgList];
  }
  pkgList = pkgList.filter((dep) => {
    return erroneous.indexOf(dep) === -1;
  });

  if (!pkgList.length) {
    return;
  }
  options = Object.assign({}, defaultInstallOptions, options);
  let installer = '';
  let args: string[] = [];

  if (Util.shouldUseYarn()) {
    installer = 'yarn';
  } else if (Util.shouldUseCnpm()) {
    installer = 'cnpm';
  } else {
    installer = 'npm';
  }

  if (Util.shouldUseYarn()) {
    args = ['add'].concat(pkgList).filter(Boolean);
    args.push('--silent', '--no-progress');
    if (options.dev) {
      args.push('-D');
    }
  } else {
    args = ['install'].concat(pkgList).filter(Boolean);
    args.push('--silent', '--no-progress');
    if (options.dev) {
      args.push('--save-dev');
    } else {
      args.push('--save');
    }
  }
  const output = spawn.sync(installer, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  if (output.status) {
    pkgList.forEach((dep) => {
      erroneous.push(dep);
    });
  }
  let matches: RegExpExecArray | null = null;
  const peers: string[] = [];

  matches = PEERS.exec(output.stdout);
  while (matches) {
    const pkg = matches[1];
    const version = matches[2];
    if (version.match(' ')) {
      peers.push(pkg);
    } else {
      peers.push(`${pkg}@${version}`);
    }
    matches = PEERS.exec(output.stdout);
  }
  if (options.peerDependencies && peers.length) {
    console.info('正在安装 peerDependencies...');
    installNpmPkg(peers, options);
  }
  return output;
}

export const callPlugin: pluginFunction = async (pluginName, content, file, config, root) => {
  const pluginFn = await getNpmPkg(`${taroPluginPrefix}${pluginName}`, root);
  return pluginFn(content, file, config);
};

export const callPluginSync: pluginFunction = (pluginName, content, file, config, root) => {
  const pluginFn = getNpmPkgSync(`${taroPluginPrefix}${pluginName}`, root);
  return pluginFn(content, file, config);
};

export function getNpmPkgSync(npmName: string, root: string) {
  const npmPath = resolveNpmSync(npmName, root);
  const npmFn = runtimeRequire(npmPath);
  return npmFn;
}

export async function getNpmPkg(npmName: string, root: string) {
  let npmPath: string | undefined;
  try {
    npmPath = resolveNpmSync(npmName, root);
  } catch (err) {
    if ((err as { code?: string }).code === 'MODULE_NOT_FOUND') {
      const installOptions: IInstallOptions = {
        dev: false,
      };
      if (npmName.indexOf(taroPluginPrefix) >= 0) {
        installOptions.dev = true;
      }
      installNpmPkg(npmName, installOptions);
      npmPath = await resolveNpm(npmName, root);
    }
  }
  if (!npmPath) {
    throw new Error(`无法解析 npm 包 "${npmName}"`);
  }
  const npmFn = runtimeRequire(npmPath);
  return npmFn;
}
