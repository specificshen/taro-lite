import path from 'node:path';
import { fs, isEmptyObject, readConfig, resolveMainFilePath, SCRIPT_EXT } from '@spcsn/taro-helper';
import { stripMultiPlatformExt } from '..';
import { logger } from '../logger';
import { VITE_COMPILER_LABEL } from '../runner';
import type { AppConfig } from '@spcsn/taro';
import type { IMiniFilesConfig } from '@spcsn/taro/types/compile';
import type {
  ViteAppMeta,
  ViteCompilerContext,
  ViteMiniBuildConfig,
  VitePageMeta,
} from '@spcsn/taro/types/compile/viteCompilerContext';
import type { Rolldown } from 'vite';

export class CompilerContext<T extends ViteMiniBuildConfig> implements ViteCompilerContext<T> {
  static label = VITE_COMPILER_LABEL;
  cwd: string;
  sourceDir!: string;
  taroConfig!: T;
  rawTaroConfig: T;
  frameworkExts!: string[];
  app!: ViteAppMeta;
  pages!: VitePageMeta[];
  components?: VitePageMeta[];
  loaderMeta: any = {
    importFrameworkStatement: `
import * as React from 'react'
import ReactDOM from 'react-dom'
`,
    mockAppStatement: `
class App extends React.Component {
  render () {
    return this.props.children
  }
}
`,
    frameworkArgs: 'React, ReactDOM, config',
    creator: 'createReactApp',
    creatorLocation: path.resolve(__dirname, '../../react-framework/runtime'),
    importFrameworkName: 'React',
  };

  logger = logger;
  filesConfig: IMiniFilesConfig = {};
  configFileList: string[] = [];
  compilePage!: (pageName: string) => Promise<VitePageMeta>;

  constructor(appPath: string, rawTaroConfig: T) {
    this.cwd = appPath;
    this.rawTaroConfig = rawTaroConfig;
    this.process();
  }

  protected process() {
    this.processConfig();
    this.sourceDir = path.resolve(this.cwd, this.taroConfig.sourceRoot as string);
    this.frameworkExts = this.taroConfig.frameworkExts || SCRIPT_EXT;
  }

  protected processConfig() {}

  async init(): Promise<void> {
    this.app = await this.getApp();
  }

  async collectedDeps(
    rollupCtx: Rolldown.PluginContext,
    id: string,
    filter: (id: string) => boolean,
    cache = new Set<string>(),
  ): Promise<Set<string>> {
    if (!/\.m?[jt]sx?$/.test(id) || !filter(id) || cache.has(id)) return cache;

    cache.add(id);
    const moduleInfo = await rollupCtx.load({
      id,
      resolveDependencies: true,
    });

    await Promise.all(
      moduleInfo.importedIds.map(async (importedId) => {
        return this.collectedDeps(rollupCtx, importedId, filter, cache);
      }),
    );

    return cache;
  }

  watchConfigFile(rollupCtx: Rolldown.PluginContext) {
    this.configFileList.forEach((configFile) => rollupCtx.addWatchFile(configFile));
  }

  getAppScriptPath(): string {
    return this.taroConfig.entry.app[0];
  }

  async getApp(): Promise<ViteAppMeta> {
    const scriptPath = this.getAppScriptPath();
    const configPath = this.getConfigFilePath(scriptPath);
    const config: AppConfig = await readConfig(configPath, this.taroConfig);

    if (isEmptyObject(config)) {
      this.logger.error('缺少 app 全局配置文件，请检查！');
      process.exit(1);
    }

    const { modifyAppConfig } = this.taroConfig;
    if (typeof modifyAppConfig === 'function') {
      modifyAppConfig(config);
    }

    const appMeta: ViteAppMeta = {
      name: path.basename(scriptPath).replace(path.extname(scriptPath), ''),
      scriptPath,
      configPath,
      config,
      isNative: false,
    };

    this.filesConfig[this.getConfigFilePath(appMeta.name)] = {
      path: configPath,
      content: config,
    };
    return appMeta;
  }

  async getPages(): Promise<VitePageMeta[]> {
    const appConfig = this.app.config;

    if (this.taroConfig.isBuildNativeComp) return [];

    if (!appConfig.pages?.length) {
      this.logger.error('全局配置缺少 pages 字段，请检查！');
      process.exit(1);
    }

    const pagesList: VitePageMeta[] = [];
    for (const pageName of appConfig.pages) {
      pagesList.push(await this.compilePage(pageName));
    }

    const subPackages = appConfig.subPackages || appConfig.subpackages || [];
    for (const item of subPackages) {
      // 兼容 pages: [''] 等非法情况
      const pages = (item.pages || []).filter((item) => !!item);

      if (pages.length > 0) {
        const root = item.root;
        for (const page of pages) {
          const subPageName = `${root}/${page}`.replace(/\/{2,}/g, '/');

          if (pagesList.some((mainPage) => mainPage.name === subPageName)) continue;

          const pageMeta = await this.compilePage(subPageName);
          pagesList.push(pageMeta);
        }
      }
    }

    return pagesList;
  }

  async getComponents(): Promise<VitePageMeta[]> {
    const appConfig = this.app.config;

    if (!appConfig.components?.length) {
      this.logger.error('全局配置缺少 components 字段，请检查！');
      process.exit(1);
    }

    const components: VitePageMeta[] = [];
    for (const pageName of appConfig.components) {
      components.push(await this.compilePage(pageName));
    }
    return components;
  }

  /** 工具函数 */

  isApp(id: string): boolean {
    return this.app.scriptPath === id;
  }

  isPage(id: string): boolean {
    return this.pages.findIndex((page) => page.scriptPath === id) > -1;
  }

  isComponent(id: string): boolean {
    if (this.components && this.components.length) {
      return this.components.findIndex((component) => component.scriptPath === id) > -1;
    }

    return false;
  }

  isNativePageORComponent(templatePath: string): boolean {
    return fs.existsSync(templatePath);
  }

  getPageById(id: string) {
    return this.pages.find((page) => page.scriptPath === id);
  }

  getComponentById(id: string) {
    if (this.components && this.components.length) {
      return this.components.find((component) => component.scriptPath === id);
    }
  }

  getConfigFilePath(filePath: string) {
    const cleanedPath = stripMultiPlatformExt(filePath.replace(path.extname(filePath), ''));
    return resolveMainFilePath(`${cleanedPath}.config`);
  }

  getTargetFilePath(filePath: string, targetExtName: string) {
    const extname = path.extname(filePath);
    return extname ? filePath.replace(extname, targetExtName) : filePath + targetExtName;
  }
}
