import * as path from 'node:path';
import spawn from 'cross-spawn';
import resolvePath from 'resolve';
import * as Util from './utils';
const PEERS = /UNMET PEER DEPENDENCY ([a-z\-0-9.]+)@(.+)/gm;
const npmCached = {};

const erroneous: string[] = [];

type pluginFunction = (
  pluginName: string,
  content: string | null,
  file: string,
  config: Record<string, any>,
  root: string,
) => any;
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
    const cliPackageJsonPath = require.resolve('@spcsn/taro-cli/package.json', {
      paths: [__dirname, root].filter(Boolean) as string[],
    });
    return resolvePath.sync(pluginName, { basedir: path.dirname(cliPackageJsonPath) });
  } catch {
    return undefined;
  }
}

export function resolveNpm(pluginName: string, root?: string): Promise<string> {
  if (!npmCached[pluginName]) {
    return new Promise((resolve, reject) => {
      resolvePath(`${pluginName}`, { basedir: root }, (err, res) => {
        if (err && (err as any).code === 'MODULE_NOT_FOUND') {
          const resolvedFromCliPackage = resolveFromCliPackage(pluginName, root);
          if (resolvedFromCliPackage) {
            npmCached[pluginName] = resolvedFromCliPackage;
            resolve(resolvedFromCliPackage);
            return;
          }

          resolvePath(`${pluginName}`, { basedir: __dirname }, (err2, res2) => {
            if (err2) return reject(err2);
            npmCached[pluginName] = res2;
            resolve(res2 || '');
          });
          return;
        }
        if (err) {
          return reject(err);
        }
        npmCached[pluginName] = res;
        resolve(res || '');
      });
    });
  }
  return Promise.resolve(npmCached[pluginName]);
}

export function resolveNpmSync(pluginName: string, root?: string): string {
  try {
    if (!npmCached[pluginName]) {
      let res;
      try {
        res = resolvePath.sync(pluginName, { basedir: root });
      } catch (e) {
        if ((e as any).code === 'MODULE_NOT_FOUND') {
          res = resolveFromCliPackage(pluginName, root) ?? resolvePath.sync(pluginName, { basedir: __dirname });
        } else {
          throw e;
        }
      }
      return res;
    }
    return npmCached[pluginName];
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
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  if (output.status) {
    pkgList.forEach((dep) => {
      erroneous.push(dep);
    });
  }
  let matches: RegExpExecArray | null = null;
  const peers: string[] = [];

  while ((matches = PEERS.exec(output.stdout))) {
    const pkg = matches[1];
    const version = matches[2];
    if (version.match(' ')) {
      peers.push(pkg);
    } else {
      peers.push(`${pkg}@${version}`);
    }
  }
  if (options.peerDependencies && peers.length) {
    console.info('正在安装 peerDependencies...');
    installNpmPkg(peers, options);
  }
  return output;
}

export const callPlugin: pluginFunction = async (
  pluginName: string,
  content: string | null,
  file: string,
  config: Record<string, any>,
  root: string,
) => {
  const pluginFn = await getNpmPkg(`${taroPluginPrefix}${pluginName}`, root);
  return pluginFn(content, file, config);
};

export const callPluginSync: pluginFunction = (
  pluginName: string,
  content: string | null,
  file: string,
  config: Record<string, any>,
  root: string,
) => {
  const pluginFn = getNpmPkgSync(`${taroPluginPrefix}${pluginName}`, root);
  return pluginFn(content, file, config);
};

export function getNpmPkgSync(npmName: string, root: string) {
  const npmPath = resolveNpmSync(npmName, root);
  const npmFn = require(npmPath);
  return npmFn;
}

export async function getNpmPkg(npmName: string, root: string) {
  let npmPath;
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
  const npmFn = require(npmPath);
  return npmFn;
}
