import * as path from 'node:path';
import type { IProjectConfig } from '@spcsn/taro/types/compile';
import {
  createSwcRegister,
  ENTRY,
  fs,
  getModuleDefaultExport,
  getUserHomeDir,
  OUTPUT_DIR,
  resolveScriptPath,
  SOURCE_DIR,
  TARO_GLOBAL_CONFIG_DIR,
  TARO_GLOBAL_CONFIG_FILE,
} from '@spcsn/taro-helper';
import { merge } from 'lodash';
import ora from 'ora';
import { filterGlobalConfig } from './utils';
import { CONFIG_DIR_NAME, DEFAULT_CONFIG_FILE } from './utils/constants';
import { serviceProfiler } from './utils/profile.js';

interface IConfigOptions {
  appPath: string;
  disableGlobalConfig?: boolean;
}

export default class Config {
  appPath: string;
  configPath!: string;
  initialConfig!: IProjectConfig;
  initialGlobalConfig!: IProjectConfig;
  isInitSuccess!: boolean;
  disableGlobalConfig: boolean;

  constructor(opts: IConfigOptions) {
    this.appPath = opts.appPath;
    this.disableGlobalConfig = !!opts?.disableGlobalConfig;
  }

  async init(configEnv: { mode: string; command: string }) {
    this.initialConfig = {};
    this.initialGlobalConfig = {};
    this.isInitSuccess = false;
    const resolveConfigPathStartMs = serviceProfiler.start();
    this.configPath = resolveScriptPath(path.join(this.appPath, CONFIG_DIR_NAME, DEFAULT_CONFIG_FILE));
    serviceProfiler.end('resolve config path', resolveConfigPathStartMs);

    const existsConfigStartMs = serviceProfiler.start();
    const hasConfig = fs.existsSync(this.configPath);
    serviceProfiler.end('check config exists', existsConfigStartMs);

    if (!hasConfig) {
      if (this.disableGlobalConfig) return;
      this.initGlobalConfig();
    } else {
      const globalConfigStartMs = serviceProfiler.start();
      this.initGlobalConfig(configEnv.command);
      serviceProfiler.end('global config', globalConfigStartMs);

      const swcRegisterStartMs = serviceProfiler.start();
      createSwcRegister({
        only: [(filePath) => filePath.indexOf(path.join(this.appPath, CONFIG_DIR_NAME)) >= 0],
      });
      serviceProfiler.end('swc register', swcRegisterStartMs);

      try {
        const importConfigStartMs = serviceProfiler.start();
        const userExport = getModuleDefaultExport(await import(this.configPath));
        serviceProfiler.end('import config', importConfigStartMs);

        const evaluateConfigStartMs = serviceProfiler.start();
        this.initialConfig = typeof userExport === 'function' ? await userExport(merge, configEnv) : userExport;
        serviceProfiler.end('evaluate config', evaluateConfigStartMs);
        this.isInitSuccess = true;
      } catch (err) {
        console.log(err);
      } finally {
        serviceProfiler.print('config timings');
      }
    }
  }

  initGlobalConfig(command: string = '') {
    const homedir = getUserHomeDir();
    if (!homedir) return console.error('获取不到用户 home 路径');
    const globalPluginConfigPath = path.join(getUserHomeDir(), TARO_GLOBAL_CONFIG_DIR, TARO_GLOBAL_CONFIG_FILE);
    if (!fs.existsSync(globalPluginConfigPath)) return;
    const spinner = ora(`开始获取 taro 全局配置文件： ${globalPluginConfigPath}`).start();
    try {
      this.initialGlobalConfig = fs.readJSONSync(globalPluginConfigPath) || {};
      this.initialGlobalConfig = filterGlobalConfig(this.initialGlobalConfig, command);
      spinner.succeed('获取 taro 全局配置成功');
    } catch (_e) {
      spinner.stop();
      console.warn(`获取全局配置失败，如果需要启用全局插件请查看配置文件: ${globalPluginConfigPath} `);
    }
  }

  getConfigWithNamed(platform: string, configName: string) {
    const initialConfig = this.initialConfig;
    const sourceDirName = initialConfig.sourceRoot || SOURCE_DIR;
    const outputDirName = initialConfig.outputRoot || OUTPUT_DIR;
    const sourceDir = path.join(this.appPath, sourceDirName);
    const entryName = ENTRY;
    const entryFilePath = resolveScriptPath(path.join(sourceDir, entryName));

    const entry = {
      [entryName]: [entryFilePath],
    };

    return {
      entry,
      alias: initialConfig.alias || {},
      copy: initialConfig.copy,
      sourceRoot: sourceDirName,
      outputRoot: outputDirName,
      platform,
      framework: initialConfig.framework,
      compiler: initialConfig.compiler,
      cache: initialConfig.cache,
      logger: initialConfig.logger,
      baseLevel: initialConfig.baseLevel,
      csso: initialConfig.csso,
      uglify: initialConfig.uglify,
      plugins: initialConfig.plugins,
      projectName: initialConfig.projectName,
      env: initialConfig.env,
      defineConstants: initialConfig.defineConstants,
      designWidth: initialConfig.designWidth,
      deviceRatio: initialConfig.deviceRatio,
      projectConfigName: initialConfig.projectConfigName,
      jsMinimizer: initialConfig.jsMinimizer,
      cssMinimizer: initialConfig.cssMinimizer,
      terser: initialConfig.terser,
      esbuild: initialConfig.esbuild,
      ...initialConfig[configName],
      ...initialConfig[platform],
    };
  }
}
