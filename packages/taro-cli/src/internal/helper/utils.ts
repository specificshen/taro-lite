import * as nativeFs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { PLATFORMS, processTypeEnum, processTypeMap, REG_JSON, SCRIPT_EXT } from './constants';
import { chalk } from './terminal';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

interface NativeFsCompat {
  access: typeof nativeFs.access;
  constants: typeof nativeFs.constants;
  existsSync: typeof nativeFs.existsSync;
  lstatSync: typeof nativeFs.lstatSync;
  mkdirSync: typeof nativeFs.mkdirSync;
  rmdirSync: typeof nativeFs.rmdirSync;
  readFile: typeof nativeFs.promises.readFile;
  readFileSync: typeof nativeFs.readFileSync;
  readdir: typeof nativeFs.promises.readdir;
  readdirSync: typeof nativeFs.readdirSync;
  realpathSync: typeof nativeFs.realpathSync;
  remove: (targetPath: nativeFs.PathLike) => Promise<void>;
  renameSync: typeof nativeFs.renameSync;
  rmSync: typeof nativeFs.rmSync;
  stat: typeof nativeFs.promises.stat;
  statSync: typeof nativeFs.statSync;
  unlinkSync: typeof nativeFs.unlinkSync;
  writeFile: typeof nativeFs.promises.writeFile;
  writeFileSync: typeof nativeFs.writeFileSync;
  ensureDirSync: (directoryPath: nativeFs.PathLike) => void;
  mkdir: typeof nativeFs.promises.mkdir;
  mkdirp: (directoryPath: nativeFs.PathLike) => Promise<string | undefined>;
  move: (sourcePath: string, targetPath: string, options?: { overwrite?: boolean }) => Promise<void>;
  pathExists: (targetPath: nativeFs.PathLike) => Promise<boolean>;
  createFile: (filePath: nativeFs.PathLike) => Promise<void>;
  readJSON: <T = unknown>(filePath: nativeFs.PathLike) => Promise<T>;
  readJSONSync: <T = unknown>(filePath: nativeFs.PathOrFileDescriptor) => T;
  writeJSON: (filePath: nativeFs.PathLike, data: unknown) => Promise<void>;
}

const fs: NativeFsCompat = {
  access: nativeFs.access,
  constants: nativeFs.constants,
  existsSync: nativeFs.existsSync,
  lstatSync: nativeFs.lstatSync,
  mkdirSync: nativeFs.mkdirSync,
  rmdirSync: nativeFs.rmdirSync,
  readFile: nativeFs.promises.readFile,
  readFileSync: nativeFs.readFileSync,
  readdir: nativeFs.promises.readdir,
  readdirSync: nativeFs.readdirSync,
  realpathSync: nativeFs.realpathSync,
  renameSync: nativeFs.renameSync,
  rmSync: nativeFs.rmSync,
  stat: nativeFs.promises.stat,
  statSync: nativeFs.statSync,
  unlinkSync: nativeFs.unlinkSync,
  writeFile: nativeFs.promises.writeFile,
  writeFileSync: nativeFs.writeFileSync,
  async createFile(filePath) {
    const targetFilePath = filePath.toString();
    await nativeFs.promises.mkdir(path.dirname(targetFilePath), { recursive: true });
    const fileHandle = await nativeFs.promises.open(targetFilePath, 'a');
    await fileHandle.close();
  },
  ensureDirSync(directoryPath) {
    nativeFs.mkdirSync(directoryPath, { recursive: true });
  },
  async readJSON(filePath) {
    return JSON.parse(await nativeFs.promises.readFile(filePath, 'utf8'));
  },
  readJSONSync(filePath) {
    return JSON.parse(nativeFs.readFileSync(filePath, 'utf8'));
  },
  async writeJSON(filePath, data) {
    const targetFilePath = filePath.toString();
    await nativeFs.promises.mkdir(path.dirname(targetFilePath), { recursive: true });
    await nativeFs.promises.writeFile(targetFilePath, JSON.stringify(data, null, 2));
  },
  async remove(targetPath) {
    await nativeFs.promises.rm(targetPath, { recursive: true, force: true });
  },
  mkdir: nativeFs.promises.mkdir,
  async mkdirp(directoryPath) {
    return nativeFs.promises.mkdir(directoryPath, { recursive: true });
  },
  async move(sourcePath, targetPath, options = {}) {
    if (options.overwrite) {
      await nativeFs.promises.rm(targetPath, { recursive: true, force: true });
    }
    await nativeFs.promises.mkdir(path.dirname(targetPath), { recursive: true });
    await nativeFs.promises.rename(sourcePath, targetPath).catch(async (error: NodeJS.ErrnoException) => {
      if (error.code !== 'EXDEV') throw error;
      await nativeFs.promises.cp(sourcePath, targetPath, { recursive: true });
      await nativeFs.promises.rm(sourcePath, { recursive: true, force: true });
    });
  },
  async pathExists(targetPath) {
    return nativeFs.promises
      .access(targetPath)
      .then(() => true)
      .catch(() => false);
  },
};

export function normalizePath(path: string) {
  return path.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
}

export function isNpmPkg(name: string): boolean {
  if (/^(\.|\/)/.test(name)) {
    return false;
  }
  return true;
}

export function isAliasPath(name: string, pathAlias: Record<string, string> = {}): boolean {
  const prefixes = Object.keys(pathAlias);
  if (prefixes.length === 0) {
    return false;
  }
  return prefixes.includes(name) || new RegExp(`^(${prefixes.join('|')})/`).test(name);
}

export function replaceAliasPath(filePath: string, name: string, pathAlias: Record<string, string> = {}) {
  // 后续的 path.join 在遇到符号链接时将会解析为真实路径，如果
  // 这里的 filePath 没有做同样的处理，可能会导致 import 指向
  // 源代码文件，导致文件被意外修改
  filePath = fs.realpathSync(filePath);

  const prefixes = Object.keys(pathAlias);
  if (prefixes.includes(name)) {
    return promoteRelativePath(path.relative(filePath, fs.realpathSync(resolveScriptPath(pathAlias[name]))));
  }
  const reg = new RegExp(`^(${prefixes.join('|')})/(.*)`);
  name = name.replace(reg, function (_m, $1, $2) {
    return promoteRelativePath(path.relative(filePath, path.join(pathAlias[$1], $2)));
  });
  return name;
}

export function promoteRelativePath(fPath: string): string {
  const fPathArr = fPath.split(path.sep);
  let dotCount = 0;
  fPathArr.forEach((item) => {
    if (item.indexOf('..') >= 0) {
      dotCount++;
    }
  });
  if (dotCount === 1) {
    fPathArr.splice(0, 1, '.');
    return fPathArr.join('/');
  }
  if (dotCount > 1) {
    fPathArr.splice(0, 1);
    return fPathArr.join('/');
  }
  return normalizePath(fPath);
}

export function printLog(type: processTypeEnum, tag: string, filePath?: string) {
  const typeShow = processTypeMap[type];
  const tagLen = tag.replace(/[\u0391-\uFFE5]/g, 'aa').length;
  const tagFormatLen = 8;
  if (tagLen < tagFormatLen) {
    const rightPadding = new Array(tagFormatLen - tagLen + 1).join(' ');
    tag += rightPadding;
  }
  const padding = '';
  filePath = filePath || '';
  if (typeof typeShow.color === 'string') {
    console.log(
      (chalk as unknown as Record<string, (s: string) => string>)[typeShow.color](typeShow.name),
      padding,
      tag,
      padding,
      filePath,
    );
  } else {
    console.log(typeShow.color(typeShow.name), padding, tag, padding, filePath);
  }
}

interface WorkspacePackageJson {
  workspaces?: string[] | { packages?: string[] };
}

function hasWorkspaces(packageJson: WorkspacePackageJson): boolean {
  if (Array.isArray(packageJson.workspaces)) {
    return packageJson.workspaces.length > 0;
  }
  return Array.isArray(packageJson.workspaces?.packages) && packageJson.workspaces.packages.length > 0;
}

function findWorkspaceRoot(startPath: string): string | null {
  let currentPath = startPath;

  while (true) {
    const packageJsonPath = path.join(currentPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        if (hasWorkspaces(fs.readJSONSync<WorkspacePackageJson>(packageJsonPath))) {
          return currentPath;
        }
      } catch {
        // Ignore invalid package.json files while walking upward.
      }
    }

    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) {
      return null;
    }
    currentPath = parentPath;
  }
}

export function recursiveFindNodeModules(filePath: string, lastFindPath?: string): string {
  if (lastFindPath && normalizePath(filePath) === normalizePath(lastFindPath)) {
    return filePath;
  }
  const dirname = path.dirname(filePath);
  const workspaceRoot = findWorkspaceRoot(dirname);
  const nodeModules = path.join(workspaceRoot || dirname, 'node_modules');
  if (fs.existsSync(nodeModules)) {
    return nodeModules;
  }
  if (dirname.split(path.sep).length <= 1) {
    printLog(processTypeEnum.ERROR, `在${dirname}目录下`, '未找到node_modules文件夹，请先安装相关依赖库！');
    return nodeModules;
  }
  return recursiveFindNodeModules(dirname, filePath);
}

export function getUserHomeDir(): string {
  function homedir(): string {
    const env = process.env;
    const home = env.HOME;
    const user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME;

    if (process.platform === 'win32') {
      return env.USERPROFILE || '' + env.HOMEDRIVE + env.HOMEPATH || home || '';
    }

    if (process.platform === 'darwin') {
      return home || (user ? '/Users/' + user : '');
    }

    if (process.platform === 'linux') {
      return home || (process.getuid?.() === 0 ? '/root' : user ? '/home/' + user : '');
    }

    return home || '';
  }
  return typeof (os.homedir as (() => string) | undefined) === 'function' ? os.homedir() : homedir();
}

export function isEmptyObject(obj: object | null | undefined): boolean {
  if (obj == null) {
    return true;
  }
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      return false;
    }
  }
  return true;
}

export function resolveSync(id: string, opts: { basedir?: string } = {}): string | null {
  try {
    return Bun.resolveSync(id, opts.basedir || process.cwd());
  } catch (_error) {
    return null;
  }
}

export function resolveMainFilePath(p: string, extArrs = SCRIPT_EXT): string {
  if (p.startsWith('pages/') || p === 'app.config') {
    return p;
  }
  const realPath = p;
  const taroEnv = process.env.TARO_ENV;
  for (let i = 0; i < extArrs.length; i++) {
    const item = extArrs[i];
    if (taroEnv) {
      if (fs.existsSync(`${p}.${taroEnv}${item}`)) {
        return `${p}.${taroEnv}${item}`;
      }
      if (fs.existsSync(`${p}${path.sep}index.${taroEnv}${item}`)) {
        return `${p}${path.sep}index.${taroEnv}${item}`;
      }
      if (fs.existsSync(`${p.replace(/\/index$/, `.${taroEnv}/index`)}${item}`)) {
        return `${p.replace(/\/index$/, `.${taroEnv}/index`)}${item}`;
      }
    }
    if (fs.existsSync(`${p}${item}`)) {
      return `${p}${item}`;
    }
    if (fs.existsSync(`${p}${path.sep}index${item}`)) {
      return `${p}${path.sep}index${item}`;
    }
  }
  // 存在多端页面但是对应的多端页面配置不存在时，使用该页面默认配置
  if (taroEnv && path.parse(p).base.endsWith(`.${taroEnv}.config`)) {
    const idx = p.lastIndexOf(`.${taroEnv}.config`);
    return resolveMainFilePath(p.slice(0, idx) + '.config');
  }
  return realPath;
}

export function resolveScriptPath(p: string): string {
  return resolveMainFilePath(p);
}

const retries = process.platform === 'win32' ? 100 : 1;
export function emptyDirectory(
  dirPath: string,
  opts: { excludes: Array<string | RegExp> | string | RegExp } = { excludes: [] },
) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        let removed = false;
        let i = 0; // retry counter
        while (!removed && i < retries) {
          try {
            const excludes = Array.isArray(opts.excludes) ? opts.excludes : [opts.excludes];
            const canRemove =
              !excludes.length ||
              !excludes.some((item) => (typeof item === 'string' ? curPath.indexOf(item) >= 0 : item.test(curPath)));
            if (canRemove) {
              emptyDirectory(curPath);
              fs.rmdirSync(curPath);
            }
            removed = true;
          } catch {
            // Retry because Windows can hold directory handles briefly.
          } finally {
            i++;
          }
        }
      } else {
        const excludes = Array.isArray(opts.excludes) ? opts.excludes : [opts.excludes];
        const canRemove =
          !excludes.length ||
          !excludes.some((item) => (typeof item === 'string' ? curPath.indexOf(item) >= 0 : item.test(curPath)));
        if (canRemove) {
          fs.unlinkSync(curPath);
        }
      }
    });
  }
}

export function getInstalledNpmPkgPath(pkgName: string, basedir: string): string | null {
  try {
    return Bun.resolveSync(`${pkgName}/package.json`, basedir);
  } catch (_err) {
    return null;
  }
}

export function getInstalledNpmPkgVersion(pkgName: string, basedir: string): string | null {
  const pkgPath = getInstalledNpmPkgPath(pkgName, basedir);
  if (!pkgPath) {
    return null;
  }
  return (fs.readJSONSync(pkgPath) as { version?: string }).version ?? null;
}

export const recursiveMerge = <T = unknown>(src: Partial<T>, ...args: (Partial<T> | undefined)[]): T => {
  for (const arg of args) {
    if (!arg) continue;

    for (const key of Object.keys(arg) as Array<keyof T>) {
      const value = src[key];
      const sourceValue = arg[key];
      const valueType = typeof value;
      const sourceValueType = typeof sourceValue;

      if (valueType !== sourceValueType) {
        src[key] = sourceValue;
      } else if (Array.isArray(value) && Array.isArray(sourceValue)) {
        src[key] = value.concat(sourceValue) as T[keyof T];
      } else if (isPlainObject(value) && isPlainObject(sourceValue)) {
        src[key] = recursiveMerge(value, sourceValue) as T[keyof T];
      } else {
        src[key] = sourceValue;
      }
    }
  }

  return src as T;
};

function mergeValue(target: unknown, source: unknown): unknown {
  // 与 lodash merge 一致：source 为 undefined 时保留 target
  if (source === undefined) return target;
  if (isPlainObject(target) && isPlainObject(source)) {
    const result: Record<string, unknown> = { ...target };
    for (const key of Object.keys(source)) {
      result[key] = mergeValue(result[key], source[key]);
    }
    return result;
  }
  if (Array.isArray(target) && Array.isArray(source)) {
    // lodash merge 对数组按下标合并，而非拼接
    const result = target.slice();
    for (let i = 0; i < source.length; i++) {
      result[i] = i in result ? mergeValue(result[i], source[i]) : source[i];
    }
    return result;
  }
  return source;
}

/** lodash _.merge 语义的无依赖实现（纯函数，不改入参） */
export function merge<T = unknown>(target: T, ...sources: unknown[]): T {
  let result: unknown = target;
  for (const source of sources) {
    result = mergeValue(result, source);
  }
  return result as T;
}

/** lodash _.isEqual 语义的无依赖深比较（覆盖 JSON 可用类型） */
export function isEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => isEqual(item, b[index]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    return keysA.length === keysB.length && keysA.every((key) => Object.hasOwn(b, key) && isEqual(a[key], b[key]));
  }
  return false;
}

export function addPlatforms(platform: string) {
  const upperPlatform = platform.toLocaleUpperCase();
  if (PLATFORMS[upperPlatform]) return;
  PLATFORMS[upperPlatform] = platform;
}

// 兼容 CJS（__esModule 标记）与原生 ESM 模块命名空间（有 default 导出）两种形态
export const getModuleDefaultExport = (exports: Record<string, unknown>) =>
  exports?.__esModule || (exports != null && typeof exports === 'object' && 'default' in exports)
    ? exports.default
    : exports;

// read page config from a sfc file instead of the regular config file
function readSFCPageConfig(configPath: string) {
  if (!fs.existsSync(configPath)) return {};

  const sfcSource = fs.readFileSync(configPath, 'utf8');
  const dpcReg = /definePageConfig\(\{[\w\W]+?\}\)/g;
  const matches = sfcSource.match(dpcReg);

  let result: Record<string, unknown> = {};

  if (matches && matches.length === 1) {
    try {
      // Bun 原生转译剥离类型标注后直接求值；配置是构建机的可信用户代码（.config.ts 本就原生 import 执行）
      const js = new Bun.Transpiler({ loader: 'tsx' }).transformSync(matches[0]);
      const definePageConfig = (config: Record<string, unknown>) => config;
      result = (new Function('definePageConfig', `return (${js.replace(/;?\s*$/, '')})`) as Function)(
        definePageConfig,
      ) as Record<string, unknown>;
    } catch (_error) {
      result = {};
    }
  }

  return result;
}

export function readPageConfig(configPath: string) {
  let result: Record<string, unknown> = {};
  const extNames = ['.js', '.jsx', '.ts', '.tsx'];

  // check source file extension
  for (const ext of extNames) {
    const tempPath = configPath.replace('.config', ext);
    if (fs.existsSync(tempPath)) {
      try {
        result = readSFCPageConfig(tempPath);
      } catch (_error) {
        result = {};
      }
      break;
    }
  }
  return result;
}

interface IReadConfigOptions {
  alias?: Record<string, string>;
  defineConstants?: Record<string, string>;
}

/**
 * 配置文件源码中允许直接使用 defineAppConfig/definePageConfig/importNativeComponent 宏。
 * 原生 import() 无法像旧 swc+vm 链路那样改写源码，这里改为向 globalThis 注册同名函数。
 */
export function installConfigMacros() {
  const g = globalThis as Record<string, unknown>;
  g.defineAppConfig ||= (config: unknown) => config;
  g.definePageConfig ||= (config: unknown) => config;
  g.importNativeComponent ||= (_path = '', name = '', _exportName = 'default') => name;
}

export async function readConfig<T extends IReadConfigOptions>(configPath: string, _options: T = {} as T) {
  let result: Record<string, unknown> = {};
  if (fs.existsSync(configPath)) {
    if (REG_JSON.test(configPath)) {
      result = fs.readJSONSync(configPath) as Record<string, unknown>;
    } else {
      // Bun 原生加载 TS/JS 配置文件，query 参数避免模块缓存导致 watch 模式读到旧配置
      installConfigMacros();
      const mod = await import(`${configPath}?t=${Date.now()}`);
      result = (getModuleDefaultExport(mod) || {}) as Record<string, unknown>;
    }
  } else {
    result = readPageConfig(configPath);
  }
  return result;
}

// 去除路径前缀，比如 /, ./
export function removePathPrefix(filePath = '') {
  const normalizedPath = path.normalize(filePath);
  const parsedPath = path.parse(normalizedPath);
  const { root, dir, base } = parsedPath;

  let result = path.join(dir, base);

  if (result.startsWith(root)) {
    result = result.slice(root.length);
  }

  return result;
}

export { fs };
